// =====================================================================
// FILE: apps/client/src/games/preferans/engine/table.ts
// PURPOSE: the table around a deal. A deal always has three seats (deal.ts); the table has three players, or four:
//   then the dealer gets no cards and «sits on the talon» (Wikipedia, rulespal; the sports preferans of the FSPR is
//   played by four). This module seats the players of every deal and moves the deal's score onto the table sheet,
//   adding what only the dealer writes: consolation on a failed game, the talon's tricks on all-pass.
//   Table players are numbered 0 (you), 1, 2, 3 clockwise; deal seats keep you at 0 whenever you play.
// SECTIONS: 1 seating; 2 the table sheet.
// =====================================================================
import type { DealResult } from './deal.ts';
import { otherSeats, type Seat } from './play.ts';
import type { RuleSet } from './rules.ts';
import { raspasyPrice, type DealScore } from './scoring.ts';

// BEGIN 1. Seating
/** Two (you, one opponent and the dummy), three, or four (the dealer sits on the talon). */
export type TableSize = 2 | 3 | 4;
/** Columns of the table sheet: two at the table the dummy keeps an (empty) column, so the sheet for three draws it. */
export const sheetWidth = (size: TableSize): number => (size === 2 ? 3 : size);

export interface DealSeating {
  /** The table player in each deal seat (deal seat 0, 1, 2). */
  readonly players: readonly [number, number, number];
  /** The table player who deals and sits on the talon (four at the table); null when the dealer also plays. */
  readonly sittingOut: number | null;
  /** The deal seat that deals (deal.ts): the one before the first hand. */
  readonly dealSeat: Seat;
}

/**
 * Who plays a deal and where. Three at the table: everyone plays, the table dealer deals. Four: the dealer sits out,
 * the other three play in their clockwise order from the dealer's left; you keep deal seat 0 when you play.
 */
export function seatingFor(size: TableSize, dealer: number): DealSeating {
  // [EN] Two: you, the opponent and the dummy in deal seat 2; the deal passes between the two of you.
  // [RU] Вдвоём: вы, соперник и болван на месте раздачи 2; сдача переходит между вами двумя.
  if (size === 2) return { players: [0, 1, 2], sittingOut: null, dealSeat: (dealer % 2) as Seat };
  if (size === 3) return { players: [0, 1, 2], sittingOut: null, dealSeat: (dealer % 3) as Seat };
  const active = [1, 2, 3].map(step => (dealer + step) % 4); // first hand, second, third — clockwise
  const shift = active.includes(0) ? active.indexOf(0) : 0;
  const players = [0, 1, 2].map(seat => active[(seat + shift) % 3]) as [number, number, number];
  // The deal seat of the third hand deals, so the deal's first hand is the dealer's left neighbour.
  return { players, sittingOut: dealer % 4, dealSeat: players.indexOf(active[2]) as Seat };
}

/** The deal seat of a table player; null when that player sits out. */
export const dealSeatOf = (seating: DealSeating, player: number): Seat | null => {
  const seat = seating.players.indexOf(player);
  return seat === -1 ? null : (seat as Seat);
};
// END 1

// BEGIN 2. The table sheet
const emptySheet = (size: number): DealScore => ({
  pool: Array.from({ length: size }, () => 0),
  mountain: Array.from({ length: size }, () => 0),
  whists: Array.from({ length: size }, () => Array.from({ length: size }, () => 0)),
});

/**
 * One finished deal on the table sheet: the deal's own score moved to the table players, plus what the dealer
 * sitting on the talon writes (Кодекс, footnote 28; rulespal; gambler.ru):
 *   - a failed game: consolation on the declarer, like each defender;
 *   - all-pass with the talon as his hand: its tricks into his mountain at the all-pass price, none — that price
 *     into his pool (Rostov keeps the talon closed: the dealer simply writes the price into his pool).
 */
export function tableScore(result: DealResult, seating: DealSeating, size: TableSize, rules: RuleSet, raspasyRound: number): DealScore {
  const sheet = emptySheet(sheetWidth(size)) as { pool: number[]; mountain: number[]; whists: number[][] };
  const { score } = result;
  seating.players.forEach((player, seat) => {
    sheet.pool[player] += score.pool[seat];
    sheet.mountain[player] += score.mountain[seat];
    seating.players.forEach((target, other) => { sheet.whists[player][target] += score.whists[seat][other]; });
  });
  // [EN] Two at the table: the defender writes the consolation for himself and for the dummy (rulespal, yellowclub).
  // [RU] Вдвоём защитник пишет консоляцию за себя и за болвана (rulespal, yellowclub).
  if (size === 2 && result.declarer !== null && result.declarer !== 2) {
    const defender = result.declarer === 0 ? 1 : 0;
    for (const target of [0, 1]) {
      sheet.whists[defender][target] += sheet.whists[2][target];
      sheet.whists[2][target] = 0;
    }
  }
  const dealer = seating.sittingOut;
  if (dealer === null) return sheet;
  // [EN] Paid talon at four: the dealer writes the whole premium instead of the two defenders (ФСПР section 6).
  // [RU] Платный прикуп вчетвером: всю премию пишет сдающий вместо двух защитников (ФСПР, раздел 6).
  if (result.talonPremium && result.declarer !== null) {
    const declarer = seating.players[result.declarer];
    for (const defender of otherSeats(result.declarer)) sheet.whists[seating.players[defender]][declarer] -= result.talonPremium / 2;
    sheet.whists[dealer][declarer] += result.talonPremium;
  }
  // [EN] The misère was shared with the dealer: half of its pool or mountain is his. [RU] Мизер разделён со сдающим: половина пули или горы — его.
  if (result.misereShared && result.declarer !== null) {
    const declarer = seating.players[result.declarer];
    for (const band of [sheet.pool, sheet.mountain]) {
      const half = band[declarer] / 2;
      band[declarer] -= half;
      band[dealer] += half;
    }
    return sheet;
  }
  // [EN] The dealer whisted with a passer's cards: everything that defender wrote is the dealer's (no extra consolation).
  // [RU] Сдающий вистовал картами спасовавшего: всё, что записал этот защитник, — его (отдельной консоляции нет).
  if (result.dealerSeat !== undefined) {
    const from = seating.players[result.dealerSeat];
    sheet.whists[from].forEach((value, target) => { sheet.whists[dealer][target] += value; sheet.whists[from][target] = 0; });
    sheet.mountain[dealer] += sheet.mountain[from];
    sheet.mountain[from] = 0;
    return sheet;
  }
  if (result.mode === 'raspasy') {
    const price = raspasyPrice(raspasyRound, rules);
    const taken = result.talonTricks ?? 0;
    if (taken > 0) sheet.mountain[dealer] += price * taken;
    else sheet.pool[dealer] += price;
    return sheet;
  }
  const contract = result.contract;
  if (result.mode === 'game' && result.played && result.declarer !== null && contract?.kind === 'game') {
    const undertricks = Math.max(0, contract.level - result.tricksWon[result.declarer]);
    if (undertricks > 0) {
      const consolation = (rules.consolationWhists ?? rules.gameValue[contract.level] * rules.whistScale) * undertricks;
      sheet.whists[dealer][seating.players[result.declarer]] += consolation;
    }
  }
  return sheet;
}

/**
 * The settlement of two (гусарик): the mountain is not divided — the smaller mountain is taken from the larger and
 * the difference × 10 (Leningrad 20) goes in whists (rulespal, yellowclub); the dummy's column stays zero.
 */
export function settleDuel(sheet: DealScore, rules: RuleSet, poolTarget?: number): number[] {
  const averagePool = (sheet.pool[0] + sheet.pool[1]) / 2;
  const closing = (seat: number): number => {
    if (poolTarget === undefined) return 0;
    return rules.poolEnd === 'common' ? 2 * (averagePool - sheet.pool[seat]) : Math.max(0, poolTarget - sheet.pool[seat]);
  };
  const mountain = [0, 1].map(seat => sheet.mountain[seat] + closing(seat));
  const net = (seat: number): number => sheet.whists[seat][1 - seat] - sheet.whists[1 - seat][seat];
  return [
    net(0) + rules.whistsPerPoint * (mountain[1] - mountain[0]),
    net(1) + rules.whistsPerPoint * (mountain[0] - mountain[1]),
    0,
  ];
}

/**
 * American help («американская помощь», Кодекс 4.2.3) after a deal: whoever has more than the target in the pool gives
 * the surplus to the opponent with the biggest pool still short of it (a tie: the nearest on the left, clockwise),
 * and writes `whistsPerPoint` whists on him for every point given. Only the `players` real players take part (two at
 * the table the dummy's column stays empty). Returns what to add to the sheet.
 */
export function americanHelp(sheet: DealScore, players: number, target: number, rules: RuleSet): DealScore {
  const help = emptySheet(sheet.pool.length) as { pool: number[]; mountain: number[]; whists: number[][] };
  const pool = sheet.pool.slice(0, players);
  for (let helper = 0; helper < players; helper += 1) {
    let surplus = pool[helper] - target;
    while (surplus > 1e-9) {
      const short = Array.from({ length: players - 1 }, (_, step) => (helper + step + 1) % players).filter(player => pool[player] < target - 1e-9);
      if (short.length === 0) break;
      const helped = short.reduce((best, player) => (pool[player] > pool[best] + 1e-9 ? player : best));
      const given = Math.min(surplus, target - pool[helped]);
      pool[helper] -= given;
      pool[helped] += given;
      surplus -= given;
      help.pool[helper] -= given;
      help.pool[helped] += given;
      help.whists[helper][helped] += given * rules.whistsPerPoint;
    }
  }
  return help;
}

/**
 * Bombs of the table players after a deal (Classic, rules.bombs): every player who passed in the dark at an all-pass
 * gets one more (at most three); a declarer who made his game or misère loses all of his; a failed one keeps them.
 */
export function bombsAfter(bombs: readonly number[], result: DealResult, seating: DealSeating): number[] {
  const next = bombs.slice();
  if (result.redeal) return next;
  if (result.mode === 'raspasy') {
    for (const seat of result.darkPassers ?? []) {
      const player = seating.players[seat];
      next[player] = Math.min(3, (next[player] ?? 0) + 1);
    }
    return next;
  }
  if (result.declarer === null) return next;
  const contract = result.contract;
  const taken = result.tricksWon[result.declarer];
  const made = result.mode === 'misere' ? taken === 0
    : result.conceded ? false
      : !result.played ? true
        : contract?.kind === 'game' && taken >= contract.level;
  if (made) next[seating.players[result.declarer]] = 0;
  return next;
}

/** The defenders of a game as table players (for texts and tests). */
export const defendersAtTable = (seating: DealSeating, declarer: Seat): number[] => otherSeats(declarer).map(seat => seating.players[seat]);
// END 2

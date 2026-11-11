// =====================================================================
// FILE: apps/client/src/games/rent/engine/game.ts
// PURPOSE: a whole game of «Blood Rent»: the players with their three resources (credits, plasma capsules,
//   bio-integrity), the dice, the moves round the ring, buying, auctions, rent in credits or — on an infected sector
//   — in flesh, raids, the two decks, the Quarantine Ward, the Black Market, the Abandoned Cruiser, the Abyss
//   Spaceport, the Inquisition Court, bio-labs and bio-alimony, modules and citadels, pawning, debts, the
//   Debtor-Corpse, bankruptcy, the station's infection and its collapse. The state is plain JSON and never changes:
//   `act` returns a new one, so saving, the bots and the tests cost nothing. `act` takes every decision of every
//   player; `actor` says whose decision is awaited.
// [RU] Целая партия «Кровной ренты»: игроки с тремя ресурсами (кредиты, капсулы плазмы, биоцелостность), кубики,
//   ходы по кругу, покупка, аукционы, рента в кредитах или — на заражённом секторе — плотью, рейды, две колоды,
//   Карантинный изолятор, Чёрный рынок, Заброшенный крейсер, Космопорт Бездны, Суд инквизиции, биолаборатории и
//   био-алименты, модули и цитадели, заклад, долги, Труп-должник, банкротство, заражение станции и её крах.
//   Состояние — обычный JSON и никогда не меняется: `act` возвращает новое. `act` принимает любое решение любого
//   игрока; `actor` говорит, чьё решение ждут.
// SECTIONS: 1 state; 2 reading the state; 3 money and flesh; 4 moving and landing; 5 actions; 6 the end.
// =====================================================================
import {
  AIRLOCK, ALIMONY_BUYOUT, ALIMONY_SHARE, BOARD, BOARD_SIZE, CITADEL, COLLAPSE, COURT_FLESH, COURT_SHARE, CRUISER_FIND,
  CRUISER_WOUND, DECKS, DEFAULT_OPTIONS, FLESH_PRICE, FLESH_STEP, GATE_RENT, GATE_SQUARES, HEAL, INFECTION_CURE,
  INFECTION_PER_CARD, INFECTION_PER_ROUND, INFECTION_PER_SECTOR, INFECTION_START, MODULE_PRICE, OWN_LAB_FEE, QUARANTINE,
  QUARANTINE_BAIL, QUARANTINE_FLESH, RADIATION, RANSOM, REVIVED_BIO, SECTOR_SQUARES, SPACEPORT, START_BIO, START_PLASMA,
  TAKEOVER_FACTOR, TELEPORT_PRICE, buyPlasmaPrice, infectedRent, plasmaRate, rentTable, sellPlasmaPrice,
  type CardEffect, type DeckId, type RentOptions,
} from './rules.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests. [RU] Относительный путь нарочно: Node запускает движок прямо в тестах.
// noinspection ES6PreferShortImport
import { shuffled, type Random } from '../../../shared/engine/random.ts';

// BEGIN 1. State
export interface PlayerState {
  readonly cash: number;
  readonly plasma: number;
  /** Bio-integrity, 0–100 %. */
  readonly bio: number;
  readonly position: number;
  /** How many times the player has tried to roll out of the Quarantine Ward; null — free. */
  readonly quarantine: number | null;
  /** Quarantine passes kept from the cards. */
  readonly passes: number;
  /** A Debtor-Corpse: the master who takes every income; null — free. */
  readonly corpse: number | null;
  /** The owners of the bio-labs this player was healed at: each takes a tenth of every income (bio-alimony). */
  readonly liens: readonly number[];
  readonly bankrupt: boolean;
}

/** Who receives a payment: a player or the bank. */
export type Payee = number | 'bank';
export interface Debt { readonly to: Payee; readonly amount: number }

export type Phase =
  | { readonly kind: 'roll' }
  | { readonly kind: 'quarantine' }
  | { readonly kind: 'buy'; readonly square: number }
  | { readonly kind: 'auction'; readonly square: number; readonly bid: number; readonly leader: number | null; readonly bidders: readonly number[]; readonly at: number }
  | { readonly kind: 'takeover'; readonly square: number }
  | { readonly kind: 'lab'; readonly square: number }
  | { readonly kind: 'market' }
  | { readonly kind: 'cruiser' }
  | { readonly kind: 'spaceport' }
  | { readonly kind: 'court' }
  /** `land`: the debt was made before the landing (the third miss in quarantine), so the landing follows the payment. */
  | { readonly kind: 'debt'; readonly debts: readonly Debt[]; readonly land?: boolean }
  | { readonly kind: 'end' }
  | { readonly kind: 'over' };

export type LogEntry =
  | { readonly kind: 'roll'; readonly player: number; readonly dice: readonly [number, number] }
  | { readonly kind: 'move'; readonly player: number; readonly to: number; readonly salary: boolean }
  | { readonly kind: 'buy'; readonly player: number; readonly square: number; readonly price: number }
  | { readonly kind: 'auction'; readonly player: number | null; readonly square: number; readonly price: number }
  | { readonly kind: 'takeover'; readonly player: number; readonly owner: number; readonly square: number; readonly price: number }
  | { readonly kind: 'rent'; readonly player: number; readonly owner: number; readonly square: number; readonly amount: number; readonly flesh: boolean }
  | { readonly kind: 'due'; readonly player: number; readonly square: number; readonly amount: number }
  | { readonly kind: 'card'; readonly player: number; readonly deck: DeckId; readonly id: string }
  | { readonly kind: 'quarantine'; readonly player: number; readonly why: 'doubles' | 'card' }
  | { readonly kind: 'free'; readonly player: number; readonly how: 'double' | 'credits' | 'capsule' | 'flesh' | 'card' | 'served' }
  | { readonly kind: 'heal'; readonly player: number; readonly square: number; readonly owner: number }
  | { readonly kind: 'market'; readonly player: number; readonly deal: 'flesh' | 'buyPlasma' | 'sellPlasma'; readonly credits: number }
  | { readonly kind: 'cruiser'; readonly player: number; readonly die: number; readonly lucky: boolean }
  | { readonly kind: 'teleport'; readonly player: number; readonly to: number }
  | { readonly kind: 'court'; readonly player: number; readonly credits: number; readonly flesh: number }
  | { readonly kind: 'infect'; readonly player: number; readonly square: number }
  | { readonly kind: 'build'; readonly player: number; readonly square: number; readonly level: number }
  | { readonly kind: 'sell'; readonly player: number; readonly square: number; readonly level: number }
  | { readonly kind: 'pawn'; readonly player: number; readonly square: number; readonly redeem: boolean }
  | { readonly kind: 'corpse'; readonly player: number; readonly master: number }
  | { readonly kind: 'ransom'; readonly player: number; readonly master: number }
  | { readonly kind: 'buyout'; readonly player: number; readonly owner: number }
  | { readonly kind: 'bankrupt'; readonly player: number; readonly to: Payee }
  | { readonly kind: 'collapse'; readonly round: number };

export interface RentState {
  readonly options: RentOptions;
  readonly players: readonly PlayerState[];
  /** The owner of each square (estates and gates); null — the bank's. */
  readonly owner: readonly (number | null)[];
  /** Modules on each estate: 0–4, 5 — a citadel. */
  readonly level: readonly number[];
  readonly pawned: readonly boolean[];
  /** The estates of the infected sectors: their rent is taken in flesh. */
  readonly infected: readonly boolean[];
  /** The station's infection, 0–100: the price of plasma follows it, at 100 the station collapses. */
  readonly infection: number;
  readonly turn: number;
  readonly phase: Phase;
  readonly dice: readonly [number, number] | null;
  /** Doubles in a row in this turn. */
  readonly doubles: number;
  /** The player rolls again after this move (a double). */
  readonly again: boolean;
  /** The order of each deck (indices into DECKS) and how many cards of it were drawn. */
  readonly decks: Readonly<Record<DeckId, readonly number[]>>;
  readonly drawn: Readonly<Record<DeckId, number>>;
  readonly round: number;
  /** The last card drawn, for the screen. */
  readonly lastCard: { readonly deck: DeckId; readonly id: string } | null;
  readonly log: readonly LogEntry[];
  readonly winner: number | null;
}

export function newRentGame(players: number, random: Random, options: RentOptions = DEFAULT_OPTIONS): RentState {
  if (players < 2 || players > 6) throw new Error('two to six players');
  return {
    options,
    players: Array.from({ length: players }, () => ({
      cash: options.startCash, plasma: START_PLASMA, bio: START_BIO, position: AIRLOCK, quarantine: null, passes: 0, corpse: null, liens: [], bankrupt: false,
    })),
    owner: BOARD.map(() => null),
    level: BOARD.map(() => 0),
    pawned: BOARD.map(() => false),
    infected: BOARD.map(() => false),
    infection: INFECTION_START,
    turn: 0,
    phase: { kind: 'roll' },
    dice: null,
    doubles: 0,
    again: false,
    decks: { chance: shuffled(DECKS.chance.map((_, index) => index), random), infection: shuffled(DECKS.infection.map((_, index) => index), random) },
    drawn: { chance: 0, infection: 0 },
    round: 1,
    lastCard: null,
    log: [],
    winner: null,
  };
}
// END 1

// BEGIN 2. Reading the state
export const priceOf = (square: number): number => {
  const cell = BOARD[square];
  return cell.kind === 'estate' || cell.kind === 'gate' ? cell.price : 0;
};
export const isOwnable = (square: number): boolean => BOARD[square].kind === 'estate' || BOARD[square].kind === 'gate';
export const isLab = (square: number): boolean => { const cell = BOARD[square]; return cell.kind === 'estate' && cell.sector === 'biolab'; };
export const alive = (state: RentState): number[] => state.players.flatMap((player, index) => (player.bankrupt ? [] : [index]));
/** The players still their own masters: not bankrupt, not a Debtor-Corpse. */
export const free = (state: RentState): number[] => state.players.flatMap((player, index) => (player.bankrupt || player.corpse !== null ? [] : [index]));

/** The squares of the sector of an estate. */
export function sectorOf(square: number): readonly number[] {
  const cell = BOARD[square];
  return cell.kind === 'estate' ? SECTOR_SQUARES[cell.sector] : [];
}
/** One player owns the whole sector of this estate. */
export function ownsSector(state: RentState, square: number): boolean {
  const owner = state.owner[square];
  return owner !== null && sectorOf(square).every(other => state.owner[other] === owner);
}
export const modulePrice = (square: number): number => {
  const cell = BOARD[square];
  return cell.kind === 'estate' ? MODULE_PRICE[cell.sector] : 0;
};

/** The rent in credits a visitor would owe on this square now (0 for a free, pawned or own square). */
export function rentOf(state: RentState, square: number, gateDouble = false): number {
  const owner = state.owner[square];
  if (owner === null || state.pawned[square]) return 0;
  const cell = BOARD[square];
  if (cell.kind === 'gate') {
    const count = GATE_SQUARES.filter(other => state.owner[other] === owner).length;
    return GATE_RENT[count] * (gateDouble ? 2 : 1);
  }
  if (cell.kind !== 'estate') return 0;
  const table = rentTable(cell.price);
  const level = state.level[square];
  if (level > 0) return table[level];
  return table[0] * (ownsSector(state, square) ? 2 : 1);
}

/** How many credits a player could still raise in flesh (never down to 0 %). */
export const fleshLeft = (player: PlayerState): number => (player.corpse === null ? Math.max(0, Math.floor((player.bio - 1) / FLESH_STEP)) * FLESH_PRICE : 0);

/** What a player could raise for a debt: cash, pawns, half the modules, plasma at the market and flesh. */
export function liquidValue(state: RentState, player: number): number {
  const me = state.players[player];
  let total = me.cash + me.plasma * sellPlasmaPrice(state.infection) + fleshLeft(me);
  state.owner.forEach((owner, square) => {
    if (owner !== player) return;
    total += Math.floor((modulePrice(square) * state.level[square]) / 2);
    if (!state.pawned[square]) total += Math.floor(priceOf(square) / 2);
  });
  return total;
}

/** The worth of a player when the game ends by the clock or by the collapse: cash, plasma, estates, buildings. */
export function netWorth(state: RentState, player: number): number {
  let total = state.players[player].cash + state.players[player].plasma * plasmaRate(state.infection);
  state.owner.forEach((owner, square) => {
    if (owner !== player) return;
    total += state.pawned[square] ? Math.floor(priceOf(square) / 2) : priceOf(square);
    total += modulePrice(square) * state.level[square];
  });
  return total;
}

/** Whose decision the game waits for. */
export const actor = (state: RentState): number => (state.phase.kind === 'auction' ? state.phase.bidders[state.phase.at] : state.turn);

const isFree = (state: RentState, player: number): boolean => state.players[player].corpse === null && !state.players[player].bankrupt;

/** A module may go up here now: the whole sector, nothing in pawn, evenly; a citadel also takes a capsule. */
export function canBuild(state: RentState, square: number, player = state.turn): boolean {
  if (BOARD[square].kind !== 'estate' || state.owner[square] !== player || !isFree(state, player) || state.level[square] >= CITADEL) return false;
  const sector = sectorOf(square);
  if (!ownsSector(state, square) || sector.some(other => state.pawned[other])) return false;
  if (state.level[square] > Math.min(...sector.map(other => state.level[other]))) return false;
  if (state.level[square] === CITADEL - 1 && state.players[player].plasma < 1) return false;
  return state.players[player].cash >= modulePrice(square);
}
/** A module may be sold back from this estate (evenly, from the highest). */
export function canSell(state: RentState, square: number, player = state.turn): boolean {
  if (state.owner[square] !== player || state.level[square] === 0) return false;
  return state.level[square] >= Math.max(...sectorOf(square).map(other => state.level[other]));
}
/** An estate may be pawned when no module stands in its sector. */
export function canPawn(state: RentState, square: number, player = state.turn): boolean {
  if (state.owner[square] !== player || state.pawned[square] || !isOwnable(square)) return false;
  return sectorOf(square).every(other => state.level[other] === 0);
}
/** Redeeming costs the pawn money and a tenth more. */
export const redeemPrice = (square: number): number => Math.ceil((priceOf(square) / 2) * 1.1);
export function canRedeem(state: RentState, square: number, player = state.turn): boolean {
  return state.owner[square] === player && isFree(state, player) && state.pawned[square] && state.players[player].cash >= redeemPrice(square);
}
/** A whole sector may be infected for a capsule: its rent is then taken in flesh. */
export function canInfect(state: RentState, square: number, player = state.turn): boolean {
  return BOARD[square].kind === 'estate' && state.owner[square] === player && isFree(state, player) && ownsSector(state, square)
    && !state.infected[square] && state.players[player].plasma >= 1;
}
/** A raid: every other estate of the sector is the player's, this one has no module and no pawn. */
export function canTakeOver(state: RentState, square: number, player = state.turn): boolean {
  const owner = state.owner[square];
  if (!state.options.takeover || BOARD[square].kind !== 'estate' || owner === null || owner === player || !isFree(state, player)) return false;
  if (state.pawned[square] || state.level[square] > 0) return false;
  return sectorOf(square).every(other => other === square || state.owner[other] === player) && state.players[player].cash >= takeoverPrice(square);
}
export const takeoverPrice = (square: number): number => priceOf(square) * TAKEOVER_FACTOR;
export const totalOf = (debts: readonly Debt[]): number => debts.reduce((sum, debt) => sum + debt.amount, 0);
/** The Inquisition Court's toll in credits for this player. */
export const courtToll = (state: RentState, player: number): number => Math.ceil(netWorth(state, player) * COURT_SHARE);
// END 2

// BEGIN 3. Money and flesh
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
interface Draft {
  players: Mutable<PlayerState>[];
  owner: (number | null)[];
  level: number[];
  pawned: boolean[];
  infected: boolean[];
  infection: number;
  log: LogEntry[];
}
const draft = (state: RentState): Draft => ({
  players: state.players.map(player => ({ ...player })),
  owner: [...state.owner],
  level: [...state.level],
  pawned: [...state.pawned],
  infected: [...state.infected],
  infection: state.infection,
  log: [...state.log],
});
const settle = (state: RentState, work: Draft, change: Partial<RentState>): RentState => ({
  ...state, players: work.players, owner: work.owner, level: work.level, pawned: work.pawned, infected: work.infected,
  infection: Math.max(0, Math.min(COLLAPSE, work.infection)), log: work.log, ...change,
});

/**
 * An income of a player (a salary, a rent, a card): a Debtor-Corpse hands it all to the master; a patient of
 * somebody else's bio-lab hands a tenth to each lab owner.
 */
function earn(work: Draft, player: number, amount: number): void {
  const me = work.players[player];
  if (me.corpse !== null) { work.players[me.corpse].cash += amount; return; }
  let left = amount;
  for (const owner of me.liens) {
    if (work.players[owner].bankrupt) continue;
    const share = Math.floor(amount * ALIMONY_SHARE);
    work.players[owner].cash += share;
    left -= share;
  }
  me.cash += left;
}
const receive = (work: Draft, to: Payee, amount: number): void => { if (to !== 'bank') earn(work, to, amount); };

/**
 * The current player pays these debts. If the cash covers them they are paid at once (null comes back); if not,
 * they come back unpaid and the game waits in the 'debt' phase until the player raises money and pays — or falls.
 */
function charge(work: Draft, player: number, debts: readonly Debt[]): Debt[] | null {
  const total = totalOf(debts);
  if (total === 0) return null;
  if (work.players[player].cash >= total) {
    work.players[player].cash -= total;
    for (const debt of debts) receive(work, debt.to, debt.amount);
    return null;
  }
  return debts.filter(debt => debt.amount > 0);
}

/**
 * A wound: bio-integrity lost. A wound dealt by a player (an infected rent) may drain the victim to 0 % — then the
 * victim becomes that player's Debtor-Corpse. Radiation, the court, the cruiser and the cards never kill: they stop
 * at 1 %.
 */
function wound(work: Draft, player: number, percent: number, by: number | null): void {
  const me = work.players[player];
  if (me.corpse !== null) return;
  if (by === null) { me.bio = Math.max(1, me.bio - percent); return; }
  me.bio -= percent;
  if (me.bio <= 0) {
    me.bio = 0;
    me.corpse = by;
    work.log.push({ kind: 'corpse', player, master: by });
  }
}
// END 3

// BEGIN 4. Moving and landing
/** After the landing is over: roll again after a double, else the turn ends. */
const afterLanding = (state: RentState): Phase => (state.again ? { kind: 'roll' } : { kind: 'end' });

function sendToQuarantine(state: RentState, work: Draft, player: number, why: 'doubles' | 'card'): RentState {
  work.players[player].position = QUARANTINE;
  work.players[player].quarantine = 0;
  work.log.push({ kind: 'quarantine', player, why });
  return settle(state, work, { phase: { kind: 'end' }, again: false, doubles: 0 });
}

/** Passing the Airlock: the salary and the radiation of the open space. */
function passAirlock(state: RentState, work: Draft): void {
  earn(work, state.turn, state.options.salary);
  wound(work, state.turn, RADIATION, null);
}
/** Moves the current player `steps` squares (negative — back). */
function walk(state: RentState, work: Draft, steps: number): void {
  const player = work.players[state.turn];
  const to = (((player.position + steps) % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
  const salary = steps > 0 && player.position + steps >= BOARD_SIZE;
  if (salary) passAirlock(state, work);
  player.position = to;
  work.log.push({ kind: 'move', player: state.turn, to, salary });
}
/** Flies the current player forward to a square; a smaller number means the Airlock was passed. A teleport passes nothing. */
function fly(state: RentState, work: Draft, to: number, teleport = false): void {
  const player = work.players[state.turn];
  const salary = !teleport && to < player.position;
  if (salary) passAirlock(state, work);
  player.position = to;
  work.log.push({ kind: 'move', player: state.turn, to, salary });
}

/** After a rent is settled on an estate: a raid may follow, then a bio-lab may heal. */
function afterRent(state: RentState, work: Draft, square: number): RentState {
  const current = settle(state, work, {});
  if (canTakeOver(current, square)) return settle(state, work, { phase: { kind: 'takeover', square } });
  return labOrNext(state, work, square);
}
function labOrNext(state: RentState, work: Draft, square: number): RentState {
  const me = work.players[state.turn];
  const owner = work.owner[square];
  if (isLab(square) && owner !== null && me.corpse === null && me.bio < START_BIO) return settle(state, work, { phase: { kind: 'lab', square } });
  return settle(state, work, { phase: afterLanding(state) });
}

/** What happens on the square the current player stands on. */
function land(state: RentState, work: Draft, gateDouble = false): RentState {
  const me = state.turn;
  const square = work.players[me].position;
  const cell = BOARD[square];
  const next = (debts: Debt[] | null): RentState => settle(state, work, { phase: debts ? { kind: 'debt', debts } : afterLanding(state) });
  if (cell.kind === 'estate' || cell.kind === 'gate') {
    const owner = work.owner[square];
    if (owner === null) return settle(state, work, { phase: { kind: 'buy', square } });
    if (owner === me) return labOrNext(state, work, square);
    const amount = rentOf(settle(state, work, {}), square, gateDouble);
    if (amount === 0) return labOrNext(state, work, square);
    // [EN] An infected sector takes flesh, not credits — from anybody who still has flesh to give.
    // [RU] Заражённый сектор берёт плоть, а не кредиты, — с любого, у кого ещё есть плоть.
    if (work.infected[square] && work.players[me].corpse === null) {
      const percent = infectedRent(amount);
      work.log.push({ kind: 'rent', player: me, owner, square, amount: percent, flesh: true });
      wound(work, me, percent, owner);
      return afterRent(state, work, square);
    }
    work.log.push({ kind: 'rent', player: me, owner, square, amount, flesh: false });
    const debts = charge(work, me, [{ to: owner, amount }]);
    if (debts) return next(debts);
    return afterRent(state, work, square);
  }
  if (cell.kind === 'due') {
    work.log.push({ kind: 'due', player: me, square, amount: cell.amount });
    return next(charge(work, me, [{ to: 'bank', amount: cell.amount }]));
  }
  if (cell.kind === 'card') return drawCard(state, work, cell.deck);
  if (cell.kind === 'cruiser') return settle(state, work, { phase: { kind: 'cruiser' } });
  if (cell.kind === 'spaceport') return settle(state, work, { phase: { kind: 'spaceport' } });
  if (cell.id === 'market') return settle(state, work, { phase: { kind: 'market' } });
  if (cell.id === 'court') return settle(state, work, { phase: { kind: 'court' } });
  return next(null);
}

function drawCard(state: RentState, work: Draft, deck: DeckId): RentState {
  const order = state.decks[deck];
  const card = DECKS[deck][order[state.drawn[deck] % order.length]];
  work.log.push({ kind: 'card', player: state.turn, deck, id: card.id });
  if (deck === 'infection') work.infection += INFECTION_PER_CARD;
  const after: RentState = { ...state, drawn: { ...state.drawn, [deck]: state.drawn[deck] + 1 }, lastCard: { deck, id: card.id } };
  return applyCard(after, work, card.effect);
}

function applyCard(state: RentState, work: Draft, effect: CardEffect): RentState {
  const me = state.turn;
  const next = (debts: Debt[] | null): RentState => settle(state, work, { phase: debts ? { kind: 'debt', debts } : afterLanding(state) });
  switch (effect.kind) {
    case 'moveTo':
      fly(state, work, effect.square);
      return land(state, work);
    case 'moveBy':
      walk(state, work, effect.steps);
      return land(state, work);
    case 'nearestGate': {
      const from = work.players[me].position;
      fly(state, work, GATE_SQUARES.find(square => square > from) ?? GATE_SQUARES[0]);
      return land(state, work, true);
    }
    case 'quarantine':
      return sendToQuarantine(state, work, me, 'card');
    case 'pass':
      work.players[me].passes += 1;
      return next(null);
    case 'gain':
      earn(work, me, effect.amount);
      return next(null);
    case 'plasma':
      work.players[me].plasma += effect.amount;
      return next(null);
    case 'wound':
      wound(work, me, effect.percent, null);
      return next(null);
    case 'cure':
      earn(work, me, effect.amount);
      work.infection -= INFECTION_CURE;
      return next(null);
    case 'pay':
      return next(charge(work, me, [{ to: 'bank', amount: effect.amount }]));
    case 'fromEach': {
      // [EN] A player without money gives what there is: a debt never falls on a player out of turn.
      // [RU] Игрок без денег дарит сколько есть: долг никогда не ложится на игрока не в его ход.
      let gathered = 0;
      work.players.forEach((player, index) => {
        if (index === me || player.bankrupt) return;
        const given = Math.min(player.cash, effect.amount);
        player.cash -= given;
        gathered += given;
      });
      earn(work, me, gathered);
      return next(null);
    }
    case 'toEach':
      return next(charge(work, me, work.players.flatMap((player, index) => (index === me || player.bankrupt ? [] : [{ to: index, amount: effect.amount }]))));
    case 'repairs': {
      let amount = 0;
      work.owner.forEach((owner, square) => {
        if (owner !== me) return;
        amount += work.level[square] === CITADEL ? effect.perCitadel : work.level[square] * effect.perModule;
      });
      return next(charge(work, me, [{ to: 'bank', amount }]));
    }
  }
}
// END 4

// BEGIN 5. Actions
export type RentAction =
  | { readonly type: 'roll'; readonly dice?: readonly [number, number] }
  | { readonly type: 'buy' }
  | { readonly type: 'decline' }
  | { readonly type: 'bid'; readonly amount: number }
  | { readonly type: 'pass' }
  | { readonly type: 'takeover' }
  | { readonly type: 'heal' }
  | { readonly type: 'skip' }
  | { readonly type: 'leave'; readonly how: 'credits' | 'capsule' | 'flesh' | 'card' }
  | { readonly type: 'flesh' }
  | { readonly type: 'buyPlasma' }
  | { readonly type: 'sellPlasma' }
  | { readonly type: 'risk'; readonly die?: number }
  | { readonly type: 'teleport'; readonly square: number }
  | { readonly type: 'court'; readonly choice: 'credits' | 'flesh' }
  | { readonly type: 'build'; readonly square: number }
  | { readonly type: 'sell'; readonly square: number }
  | { readonly type: 'pawn'; readonly square: number }
  | { readonly type: 'redeem'; readonly square: number }
  | { readonly type: 'infect'; readonly square: number }
  | { readonly type: 'buyout'; readonly owner: number }
  | { readonly type: 'ransom' }
  | { readonly type: 'pay' }
  | { readonly type: 'bankrupt' }
  | { readonly type: 'end' };

/** The smallest step of a bid above the current one. */
export const BID_STEP = 10;

const rollDice = (random: Random): [number, number] => [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)];

/** The phases in which the player on turn may manage the estates and buy freedom. */
const MANAGING: ReadonlySet<Phase['kind']> = new Set<Phase['kind']>(['roll', 'quarantine', 'buy', 'takeover', 'lab', 'market', 'cruiser', 'spaceport', 'court', 'debt', 'end']);

/**
 * Takes one decision of the player whose decision is awaited (`actor`). Throws on a decision that is not allowed
 * now, so a bug never passes silently. `random` throws the dice when the action does not bring them.
 */
export function act(state: RentState, action: RentAction, random: Random): RentState {
  const phase = state.phase;
  const fail: (why: string) => never = why => { throw new Error(`${action.type}: ${why}`); };
  if (phase.kind === 'over') fail('the game is over');
  const me = state.turn;
  const work = draft(state);
  const self = work.players[me];
  const corpse = state.players[me].corpse !== null;

  switch (action.type) {
    // ----- managing: any moment of one's own turn -----
    case 'build':
    case 'sell':
    case 'pawn':
    case 'redeem':
    case 'infect': {
      if (!MANAGING.has(phase.kind)) fail('not now');
      const square = action.square;
      if (action.type === 'build') {
        if (phase.kind === 'debt' || !canBuild(state, square)) fail('cannot build here');
        self.cash -= modulePrice(square);
        if (work.level[square] === CITADEL - 1) self.plasma -= 1;
        work.level[square] += 1;
        work.log.push({ kind: 'build', player: me, square, level: work.level[square] });
      } else if (action.type === 'sell') {
        if (!canSell(state, square)) fail('cannot sell here');
        self.cash += Math.floor(modulePrice(square) / 2);
        work.level[square] -= 1;
        work.log.push({ kind: 'sell', player: me, square, level: work.level[square] });
      } else if (action.type === 'pawn') {
        if (!canPawn(state, square)) fail('cannot pawn this');
        self.cash += Math.floor(priceOf(square) / 2);
        work.pawned[square] = true;
        work.log.push({ kind: 'pawn', player: me, square, redeem: false });
      } else if (action.type === 'redeem') {
        if (phase.kind === 'debt' || !canRedeem(state, square)) fail('cannot redeem this');
        self.cash -= redeemPrice(square);
        work.pawned[square] = false;
        work.log.push({ kind: 'pawn', player: me, square, redeem: true });
      } else {
        if (phase.kind === 'debt' || !canInfect(state, square)) fail('cannot infect this');
        self.plasma -= 1;
        for (const other of sectorOf(square)) work.infected[other] = true;
        work.infection += INFECTION_PER_SECTOR;
        work.log.push({ kind: 'infect', player: me, square });
      }
      return settle(state, work, {});
    }
    case 'buyout': {
      if (!MANAGING.has(phase.kind) || phase.kind === 'debt') fail('not now');
      if (!self.liens.includes(action.owner) || self.cash < ALIMONY_BUYOUT) fail('no such lien, or not enough credits');
      self.cash -= ALIMONY_BUYOUT;
      work.players[action.owner].cash += ALIMONY_BUYOUT;
      self.liens = self.liens.filter(owner => owner !== action.owner);
      work.log.push({ kind: 'buyout', player: me, owner: action.owner });
      return settle(state, work, {});
    }
    case 'ransom': {
      if (!MANAGING.has(phase.kind) || phase.kind === 'debt') fail('not now');
      const master = self.corpse;
      if (master === null || self.cash < RANSOM) fail('not a corpse, or not enough credits');
      self.cash -= RANSOM;
      work.players[master as number].cash += RANSOM;
      self.corpse = null;
      self.bio = REVIVED_BIO;
      work.log.push({ kind: 'ransom', player: me, master: master as number });
      return settle(state, work, {});
    }
    // ----- the dice -----
    case 'roll': {
      if (phase.kind !== 'roll' && phase.kind !== 'quarantine') return fail('not the time to roll');
      const dice = action.dice ?? rollDice(random);
      if (dice.some(die => !Number.isInteger(die) || die < 1 || die > 6)) fail('bad dice');
      const double = dice[0] === dice[1];
      work.log.push({ kind: 'roll', player: me, dice });
      const rolled: RentState = { ...state, dice, again: false };
      if (phase.kind === 'quarantine') {
        const tries = (state.players[me].quarantine ?? 0) + 1;
        if (!double && tries < 3) {
          self.quarantine = tries;
          return settle(rolled, work, { phase: { kind: 'end' }, doubles: 0 });
        }
        // [EN] A double lets the player out; the third miss costs the bail. Either way the player walks out by the
        //      dice, without a second roll. [RU] Дубль выпускает игрока; третий промах стоит залога. Так или иначе игрок
        //      выходит по кубикам, без второго броска.
        self.quarantine = null;
        work.log.push({ kind: 'free', player: me, how: double ? 'double' : 'served' });
        const debts = double ? null : charge(work, me, [{ to: 'bank', amount: QUARANTINE_BAIL }]);
        walk(rolled, work, dice[0] + dice[1]);
        if (debts) return settle(rolled, work, { phase: { kind: 'debt', debts, land: true }, doubles: 0 });
        return land({ ...rolled, doubles: 0 }, work);
      }
      const doubles = double ? state.doubles + 1 : 0;
      if (doubles === 3) return sendToQuarantine({ ...rolled, doubles: 0 }, work, me, 'doubles');
      walk(rolled, work, dice[0] + dice[1]);
      return land({ ...rolled, doubles, again: double }, work);
    }
    // ----- buying -----
    case 'buy': {
      if (phase.kind !== 'buy') return fail('nothing to buy');
      if (corpse) fail('a corpse buys nothing');
      const price = priceOf(phase.square);
      if (self.cash < price) fail('not enough credits');
      self.cash -= price;
      work.owner[phase.square] = me;
      work.log.push({ kind: 'buy', player: me, square: phase.square, price });
      return labOrNext(state, work, phase.square);
    }
    case 'decline': {
      if (phase.kind !== 'buy') return fail('nothing to decline');
      // [EN] Everybody free bids, starting with the one who declined. [RU] Торгуются все свободные, начиная с того, кто отказался.
      const players = free(state);
      const start = Math.max(0, players.indexOf(me));
      const bidders = [...players.slice(start), ...players.slice(0, start)];
      if (!state.options.auction || bidders.length === 0) return settle(state, work, { phase: afterLanding(state) });
      return settle(state, work, { phase: { kind: 'auction', square: phase.square, bid: 0, leader: null, bidders, at: 0 } });
    }
    case 'bid':
    case 'pass': {
      if (phase.kind !== 'auction') return fail('no auction');
      const bidder = phase.bidders[phase.at];
      const bidders = [...phase.bidders];
      let { at, bid, leader } = phase;
      if (action.type === 'bid') {
        if (!Number.isInteger(action.amount) || action.amount < bid + BID_STEP || action.amount > work.players[bidder].cash) fail('a bad bid');
        bid = action.amount;
        leader = bidder;
        at = (at + 1) % bidders.length;
      } else {
        bidders.splice(at, 1);
        if (at >= bidders.length) at = 0;
      }
      // [EN] The auction ends when only the leader is left, or when everybody passed. [RU] Аукцион кончается, когда остался один лидер или когда все спасовали.
      const finished = bidders.length === 0 || (bidders.length === 1 && leader === bidders[0]);
      if (!finished) return settle(state, work, { phase: { ...phase, bid, leader, bidders, at } });
      if (leader !== null) {
        work.players[leader].cash -= bid;
        work.owner[phase.square] = leader;
      }
      work.log.push({ kind: 'auction', player: leader, square: phase.square, price: leader === null ? 0 : bid });
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'takeover': {
      if (phase.kind !== 'takeover') return fail('nothing to take over');
      if (!canTakeOver(state, phase.square)) fail('cannot take this over');
      const owner = state.owner[phase.square] as number;
      const price = takeoverPrice(phase.square);
      self.cash -= price;
      work.players[owner].cash += price;
      work.owner[phase.square] = me;
      work.log.push({ kind: 'takeover', player: me, owner, square: phase.square, price });
      return labOrNext(state, work, phase.square);
    }
    // ----- the special squares -----
    case 'heal': {
      if (phase.kind !== 'lab') return fail('no lab here');
      const owner = state.owner[phase.square] as number;
      if (owner === me) {
        if (self.cash < OWN_LAB_FEE) fail('not enough credits');
        self.cash -= OWN_LAB_FEE;
      } else if (!self.liens.includes(owner)) {
        self.liens = [...self.liens, owner];
      }
      self.bio = Math.min(START_BIO, self.bio + HEAL);
      work.log.push({ kind: 'heal', player: me, square: phase.square, owner });
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'skip': {
      if (phase.kind === 'takeover') return labOrNext(state, work, phase.square);
      if (!['lab', 'market', 'cruiser', 'spaceport'].includes(phase.kind)) fail('nothing to skip');
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'leave': {
      if (phase.kind !== 'quarantine') return fail('not in quarantine');
      if (action.how === 'credits') {
        if (self.cash < QUARANTINE_BAIL) fail('not enough credits');
        self.cash -= QUARANTINE_BAIL;
      } else if (action.how === 'capsule') {
        if (self.plasma < 1) fail('no capsule');
        self.plasma -= 1;
      } else if (action.how === 'flesh') {
        if (corpse || self.bio <= QUARANTINE_FLESH) fail('not enough flesh');
        self.bio -= QUARANTINE_FLESH;
      } else {
        if (self.passes === 0) fail('no pass');
        self.passes -= 1;
      }
      self.quarantine = null;
      work.log.push({ kind: 'free', player: me, how: action.how });
      return settle(state, work, { phase: { kind: 'roll' } });
    }
    case 'flesh': {
      if (phase.kind !== 'market' && phase.kind !== 'debt') return fail('nobody buys flesh here');
      if (corpse || self.bio <= FLESH_STEP) fail('not enough flesh');
      self.bio -= FLESH_STEP;
      self.cash += FLESH_PRICE;
      work.log.push({ kind: 'market', player: me, deal: 'flesh', credits: FLESH_PRICE });
      return settle(state, work, {});
    }
    case 'sellPlasma': {
      if (phase.kind !== 'market' && phase.kind !== 'debt') return fail('nobody buys plasma here');
      if (self.plasma < 1) fail('no capsule');
      const credits = sellPlasmaPrice(state.infection);
      self.plasma -= 1;
      self.cash += credits;
      work.log.push({ kind: 'market', player: me, deal: 'sellPlasma', credits });
      return settle(state, work, {});
    }
    case 'buyPlasma': {
      if (phase.kind !== 'market') return fail('nobody sells plasma here');
      const credits = buyPlasmaPrice(state.infection);
      if (corpse || self.cash < credits) fail('cannot buy');
      self.cash -= credits;
      self.plasma += 1;
      work.log.push({ kind: 'market', player: me, deal: 'buyPlasma', credits });
      return settle(state, work, {});
    }
    case 'risk': {
      if (phase.kind !== 'cruiser') return fail('no anomaly here');
      const die = action.die ?? 1 + Math.floor(random() * 6);
      const lucky = die >= 4;
      if (lucky) self.plasma += CRUISER_FIND;
      else wound(work, me, CRUISER_WOUND, null);
      work.log.push({ kind: 'cruiser', player: me, die, lucky });
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'teleport': {
      if (phase.kind !== 'spaceport') return fail('no spaceport here');
      if (corpse || self.cash < TELEPORT_PRICE || action.square === SPACEPORT || action.square < 0 || action.square >= BOARD_SIZE) fail('cannot teleport there');
      self.cash -= TELEPORT_PRICE;
      fly(state, work, action.square, true);
      work.log.push({ kind: 'teleport', player: me, to: action.square });
      return land(state, work);
    }
    case 'court': {
      if (phase.kind !== 'court') return fail('no court here');
      if (action.choice === 'flesh') {
        if (corpse || self.bio <= COURT_FLESH) fail('not enough flesh');
        wound(work, me, COURT_FLESH, null);
        work.log.push({ kind: 'court', player: me, credits: 0, flesh: COURT_FLESH });
        return settle(state, work, { phase: afterLanding(state) });
      }
      const toll = courtToll(state, me);
      work.log.push({ kind: 'court', player: me, credits: toll, flesh: 0 });
      const debts = charge(work, me, [{ to: 'bank', amount: toll }]);
      return settle(state, work, { phase: debts ? { kind: 'debt', debts } : afterLanding(state) });
    }
    // ----- debts -----
    case 'pay': {
      if (phase.kind !== 'debt') return fail('no debt');
      if (charge(work, me, phase.debts)) fail('not enough credits yet');
      const paid = settle(state, work, {});
      // [EN] A debt from the third miss in quarantine is paid before the landing. [RU] Долг третьего промаха в карантине платится до приземления.
      if (phase.land) return land(paid, draft(paid));
      const square = paid.players[me].position;
      const rentDebt = phase.debts.some(debt => typeof debt.to === 'number') && isOwnable(square) && paid.owner[square] !== me;
      return rentDebt ? afterRent(paid, draft(paid), square) : { ...paid, phase: afterLanding(state) };
    }
    case 'bankrupt': {
      if (phase.kind !== 'debt') return fail('no debt');
      if (liquidValue(state, me) >= totalOf(phase.debts)) fail('the debt can still be paid');
      const creditor = phase.debts.find(debt => typeof debt.to === 'number')?.to;
      if (typeof creditor === 'number' && !corpse) {
        // [EN] The first fall to a player: everything in the purse goes to the creditor, the rest of the debt is
        //      forgiven — and the debtor becomes the creditor's Debtor-Corpse. [RU] Первое падение перед игроком: всё
        //      из кошелька уходит кредитору, остаток долга прощён — а должник становится его Трупом-должником.
        work.players[creditor].cash += self.cash;
        self.cash = 0;
        self.bio = 0;
        self.corpse = creditor;
        work.log.push({ kind: 'corpse', player: me, master: creditor });
        return finishTurn(settle(state, work, { phase: { kind: 'end' } }));
      }
      goBankrupt(work, me, creditor ?? self.corpse ?? 'bank');
      return finishTurn(settle(state, work, { phase: { kind: 'end' } }));
    }
    case 'end': {
      if (phase.kind !== 'end') return fail('the turn is not over');
      return finishTurn(state);
    }
  }
}

/** Everything of a bankrupt goes to the heir (the modules sold for half first), or back to the bank. */
function goBankrupt(work: Draft, player: number, heir: Payee): void {
  const me = work.players[player];
  work.owner.forEach((owner, square) => {
    if (owner !== player) return;
    me.cash += Math.floor((modulePrice(square) * work.level[square]) / 2);
    work.level[square] = 0;
    work.owner[square] = typeof heir === 'number' ? heir : null;
    if (typeof heir !== 'number') { work.pawned[square] = false; work.infected[square] = false; }
  });
  if (typeof heir === 'number') {
    work.players[heir].cash += me.cash;
    work.players[heir].plasma += me.plasma;
    work.players[heir].passes += me.passes;
  }
  Object.assign(me, { cash: 0, plasma: 0, passes: 0, bankrupt: true, liens: [] });
  work.log.push({ kind: 'bankrupt', player, to: heir });
  // [EN] The corpses of a fallen master wake up free. [RU] Трупы павшего хозяина просыпаются свободными.
  work.players.forEach(other => { if (other.corpse === player) { other.corpse = null; other.bio = REVIVED_BIO; } });
}
// END 5

// BEGIN 6. The end
/** The richest of these players by worth. */
const richest = (state: RentState, players: readonly number[]): number =>
  players.reduce((best, player) => (netWorth(state, player) > netWorth(state, best) ? player : best), players[0]);

/** The turn passes to the next player still in the game; the station sickens every round; the game may end here. */
function finishTurn(state: RentState): RentState {
  const standing = free(state);
  if (standing.length <= 1) {
    return { ...state, phase: { kind: 'over' }, winner: standing[0] ?? richest(state, alive(state)) };
  }
  let next = state.turn;
  do next = (next + 1) % state.players.length; while (state.players[next].bankrupt);
  const newRound = next <= state.turn;
  const round = newRound ? state.round + 1 : state.round;
  const infection = Math.min(COLLAPSE, state.infection + (newRound ? INFECTION_PER_ROUND : 0));
  const ended = infection >= COLLAPSE || (state.options.roundLimit > 0 && round > state.options.roundLimit);
  if (ended) {
    const log = infection >= COLLAPSE ? [...state.log, { kind: 'collapse' as const, round }] : state.log;
    return { ...state, infection, round, log, phase: { kind: 'over' }, winner: richest(state, standing) };
  }
  const phase: Phase = state.players[next].quarantine !== null ? { kind: 'quarantine' } : { kind: 'roll' };
  return { ...state, turn: next, round, infection, phase, dice: null, doubles: 0, again: false };
}
// END 6

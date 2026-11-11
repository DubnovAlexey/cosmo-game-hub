// =====================================================================
// FILE: apps/client/src/games/rent/engine/game.ts
// PURPOSE: a whole game of «Blood Rent»: the players and their credits, the dice, the moves around the ring, buying,
//   auctions, rent, the two decks, Cryo, the Solar Flare and the Drift's cup, modules and citadels, pawning at the
//   moneylender's, debts and bankruptcy, the end of the game. The state is plain JSON and never changes: `act`
//   returns a new one, so saving, the bots and the tests cost nothing. One function, `act`, takes every decision of
//   every player; `actor` says whose decision is awaited.
// [RU] Целая партия «Кровной ренты»: игроки и их кредиты, кубики, ходы по кругу, покупка, аукционы, рента, две
//   колоды, Криокамера, Вспышка звезды и кубок Дрейфа, модули и цитадели, заклад у ростовщика, долги и банкротство,
//   конец партии. Состояние — обычный JSON и никогда не меняется: `act` возвращает новое, поэтому сохранение, боты и
//   тесты ничего не стоят. Одна функция `act` принимает любое решение любого игрока; `actor` говорит, чьё решение ждут.
// SECTIONS: 1 state; 2 reading the state; 3 money; 4 moving and landing; 5 actions; 6 the end.
// =====================================================================
import {
  BEACON, BOARD, BOARD_SIZE, CITADEL, CRYO, DECKS, DEFAULT_OPTIONS, GATE_RENT, GATE_SQUARES, MODULE_PRICE, SECTOR_SQUARES,
  TAKEOVER_FACTOR, rentTable, type CardEffect, type DeckId, type RentOptions,
} from './rules.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests. [RU] Относительный путь нарочно: Node запускает движок прямо в тестах.
// noinspection ES6PreferShortImport
import { shuffled, type Random } from '../../../shared/engine/random.ts';

// BEGIN 1. State
export interface PlayerState {
  readonly cash: number;
  readonly position: number;
  /** How many times the player has tried to roll out of Cryo; null — free. */
  readonly cryo: number | null;
  /** Thaw codes kept from the cards: each lets one out of Cryo. */
  readonly codes: number;
  readonly bankrupt: boolean;
}

/** Who receives a payment: a player, the bank, or the Drift's cup. */
export type Payee = number | 'bank' | 'cup';
export interface Debt { readonly to: Payee; readonly amount: number }

export type Phase =
  | { readonly kind: 'roll' }
  | { readonly kind: 'cryo' }
  | { readonly kind: 'buy'; readonly square: number }
  | { readonly kind: 'auction'; readonly square: number; readonly bid: number; readonly leader: number | null; readonly bidders: readonly number[]; readonly at: number }
  | { readonly kind: 'flare' }
  /** The rent is paid and this estate may be taken over (see RentOptions.takeover). */
  | { readonly kind: 'takeover'; readonly square: number }
  /** `land`: the debt was made before the landing (the third miss in Cryo), so the landing follows the payment. */
  | { readonly kind: 'debt'; readonly debts: readonly Debt[]; readonly land?: boolean }
  | { readonly kind: 'end' }
  | { readonly kind: 'over' };

export type LogEntry =
  | { readonly kind: 'roll'; readonly player: number; readonly dice: readonly [number, number] }
  | { readonly kind: 'move'; readonly player: number; readonly to: number; readonly salary: boolean }
  | { readonly kind: 'buy'; readonly player: number; readonly square: number; readonly price: number }
  | { readonly kind: 'auction'; readonly player: number | null; readonly square: number; readonly price: number }
  | { readonly kind: 'takeover'; readonly player: number; readonly owner: number; readonly square: number; readonly price: number }
  | { readonly kind: 'rent'; readonly player: number; readonly owner: number; readonly square: number; readonly amount: number }
  | { readonly kind: 'due'; readonly player: number; readonly square: number; readonly amount: number }
  | { readonly kind: 'card'; readonly player: number; readonly deck: DeckId; readonly id: string }
  | { readonly kind: 'cryo'; readonly player: number; readonly why: 'doubles' | 'card' | 'flare' }
  | { readonly kind: 'free'; readonly player: number; readonly how: 'double' | 'bail' | 'code' | 'served' }
  | { readonly kind: 'cup'; readonly player: number; readonly amount: number }
  | { readonly kind: 'flare'; readonly player: number; readonly paid: boolean }
  | { readonly kind: 'build'; readonly player: number; readonly square: number; readonly level: number }
  | { readonly kind: 'sell'; readonly player: number; readonly square: number; readonly level: number }
  | { readonly kind: 'pawn'; readonly player: number; readonly square: number; readonly redeem: boolean }
  | { readonly kind: 'bankrupt'; readonly player: number; readonly to: Payee };

export interface RentState {
  readonly options: RentOptions;
  readonly players: readonly PlayerState[];
  /** The owner of each square (estates and gates); null — the bank's. */
  readonly owner: readonly (number | null)[];
  /** Modules on each estate: 0–4, 5 — a citadel. */
  readonly level: readonly number[];
  readonly pawned: readonly boolean[];
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
  readonly cup: number;
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
    players: Array.from({ length: players }, () => ({ cash: options.startCash, position: BEACON, cryo: null, codes: 0, bankrupt: false })),
    owner: BOARD.map(() => null),
    level: BOARD.map(() => 0),
    pawned: BOARD.map(() => false),
    turn: 0,
    phase: { kind: 'roll' },
    dice: null,
    doubles: 0,
    again: false,
    decks: { chance: shuffled(DECKS.chance.map((_, index) => index), random), infection: shuffled(DECKS.infection.map((_, index) => index), random) },
    drawn: { chance: 0, infection: 0 },
    cup: 0,
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
export const alive = (state: RentState): number[] => state.players.flatMap((player, index) => (player.bankrupt ? [] : [index]));

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

/** The rent a visitor pays on this square now (0 for a free, pawned or own square). */
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

/** What a player could raise: cash, half the price of every unpawned estate, half the cost of the buildings. */
export function liquidValue(state: RentState, player: number): number {
  let total = state.players[player].cash;
  state.owner.forEach((owner, square) => {
    if (owner !== player) return;
    total += Math.floor((modulePrice(square) * state.level[square]) / 2);
    if (!state.pawned[square]) total += Math.floor(priceOf(square) / 2);
  });
  return total;
}

/** The worth of a player at the end by rounds: cash, estates at price (half if pawned), buildings at cost. */
export function netWorth(state: RentState, player: number): number {
  let total = state.players[player].cash;
  state.owner.forEach((owner, square) => {
    if (owner !== player) return;
    total += state.pawned[square] ? Math.floor(priceOf(square) / 2) : priceOf(square);
    total += modulePrice(square) * state.level[square];
  });
  return total;
}

/** Whose decision the game waits for. */
export const actor = (state: RentState): number => (state.phase.kind === 'auction' ? state.phase.bidders[state.phase.at] : state.turn);

/** A module may go up on this estate now: the whole sector, nothing in pawn, evenly (never two levels apart). */
export function canBuild(state: RentState, square: number, player = state.turn): boolean {
  if (BOARD[square].kind !== 'estate' || state.owner[square] !== player || state.level[square] >= CITADEL) return false;
  const sector = sectorOf(square);
  if (!ownsSector(state, square) || sector.some(other => state.pawned[other])) return false;
  if (state.level[square] > Math.min(...sector.map(other => state.level[other]))) return false;
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
  return state.owner[square] === player && state.pawned[square] && state.players[player].cash >= redeemPrice(square);
}
export const totalOf = (debts: readonly Debt[]): number => debts.reduce((sum, debt) => sum + debt.amount, 0);

/** What a takeover of this estate costs. */
export const takeoverPrice = (square: number): number => priceOf(square) * TAKEOVER_FACTOR;
/** The player on turn may take this estate over: every other estate of its sector is theirs, it has no module, no pawn. */
export function canTakeOver(state: RentState, square: number, player = state.turn): boolean {
  const owner = state.owner[square];
  if (!state.options.takeover || BOARD[square].kind !== 'estate' || owner === null || owner === player) return false;
  if (state.pawned[square] || state.level[square] > 0) return false;
  return sectorOf(square).every(other => other === square || state.owner[other] === player) && state.players[player].cash >= takeoverPrice(square);
}
// END 2

// BEGIN 3. Money
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
interface Draft {
  players: Mutable<PlayerState>[];
  owner: (number | null)[];
  level: number[];
  pawned: boolean[];
  cup: number;
  log: LogEntry[];
}
const draft = (state: RentState): Draft => ({
  players: state.players.map(player => ({ ...player })),
  owner: [...state.owner],
  level: [...state.level],
  pawned: [...state.pawned],
  cup: state.cup,
  log: [...state.log],
});
const settle = (state: RentState, work: Draft, change: Partial<RentState>): RentState => ({
  ...state, players: work.players, owner: work.owner, level: work.level, pawned: work.pawned, cup: work.cup, log: work.log, ...change,
});

/** Where a fee or a fine goes: the cup when the table keeps it, else the bank. */
const fineTo = (options: RentOptions): Payee => (options.cup ? 'cup' : 'bank');

function receive(work: Draft, to: Payee, amount: number): void {
  if (to === 'cup') work.cup += amount;
  else if (to !== 'bank') work.players[to].cash += amount;
}

/**
 * The current player pays these debts. If the cash covers them they are paid at once (null comes back); if not,
 * they come back unpaid and the game waits in the 'debt' phase until the player raises money and pays — or goes
 * bankrupt.
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
// END 3

// BEGIN 4. Moving and landing
/** After the landing is over: roll again after a double, else the turn ends. */
const afterLanding = (state: RentState): Phase => (state.again ? { kind: 'roll' } : { kind: 'end' });

function sendToCryo(state: RentState, work: Draft, player: number, why: 'doubles' | 'card' | 'flare'): RentState {
  work.players[player].position = CRYO;
  work.players[player].cryo = 0;
  work.log.push({ kind: 'cryo', player, why });
  return settle(state, work, { phase: { kind: 'end' }, again: false, doubles: 0 });
}

/** Moves the current player `steps` squares (negative — back); passing or landing on the Beacon pays the salary. */
function walk(state: RentState, work: Draft, steps: number): void {
  const player = work.players[state.turn];
  const to = (((player.position + steps) % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
  const salary = steps > 0 && player.position + steps >= BOARD_SIZE;
  if (salary) player.cash += state.options.salary;
  player.position = to;
  work.log.push({ kind: 'move', player: state.turn, to, salary });
}
/** Flies the current player forward to a square; a smaller number means the Beacon was passed. */
function fly(state: RentState, work: Draft, to: number): void {
  const player = work.players[state.turn];
  const salary = to < player.position;
  if (salary) player.cash += state.options.salary;
  player.position = to;
  work.log.push({ kind: 'move', player: state.turn, to, salary });
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
    if (owner === me) return next(null);
    const amount = rentOf(settle(state, work, {}), square, gateDouble);
    if (amount === 0) return next(null);
    work.log.push({ kind: 'rent', player: me, owner, square, amount });
    const debts = charge(work, me, [{ to: owner, amount }]);
    if (!debts && canTakeOver(settle(state, work, {}), square)) return settle(state, work, { phase: { kind: 'takeover', square } });
    return next(debts);
  }
  if (cell.kind === 'due') {
    work.log.push({ kind: 'due', player: me, square, amount: cell.amount });
    return next(charge(work, me, [{ to: fineTo(state.options), amount: cell.amount }]));
  }
  if (cell.kind === 'card') return drawCard(state, work, cell.deck);
  if (cell.id === 'drift' && work.cup > 0) {
    work.log.push({ kind: 'cup', player: me, amount: work.cup });
    work.players[me].cash += work.cup;
    work.cup = 0;
  }
  if (cell.id === 'flare') return settle(state, work, { phase: { kind: 'flare' } });
  return next(null);
}

function drawCard(state: RentState, work: Draft, deck: DeckId): RentState {
  const order = state.decks[deck];
  const card = DECKS[deck][order[state.drawn[deck] % order.length]];
  work.log.push({ kind: 'card', player: state.turn, deck, id: card.id });
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
    case 'cryo':
      return sendToCryo(state, work, me, 'card');
    case 'key':
      work.players[me].codes += 1;
      return next(null);
    case 'gain':
      work.players[me].cash += effect.amount;
      return next(null);
    case 'pay':
      return next(charge(work, me, [{ to: fineTo(state.options), amount: effect.amount }]));
    case 'fromEach':
      // [EN] A player without money gives what there is: a debt never falls on a player out of turn.
      // [RU] Игрок без денег дарит сколько есть: долг никогда не ложится на игрока не в его ход.
      work.players.forEach((player, index) => {
        if (index === me || player.bankrupt) return;
        const given = Math.min(player.cash, effect.amount);
        player.cash -= given;
        work.players[me].cash += given;
      });
      return next(null);
    case 'toEach':
      return next(charge(work, me, work.players.flatMap((player, index) => (index === me || player.bankrupt ? [] : [{ to: index, amount: effect.amount }]))));
    case 'repairs': {
      let amount = 0;
      work.owner.forEach((owner, square) => {
        if (owner !== me) return;
        amount += work.level[square] === CITADEL ? effect.perCitadel : work.level[square] * effect.perModule;
      });
      return next(charge(work, me, [{ to: fineTo(state.options), amount }]));
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
  | { readonly type: 'bail' }
  | { readonly type: 'code' }
  | { readonly type: 'flare'; readonly choice: 'pay' | 'cryo' }
  | { readonly type: 'build'; readonly square: number }
  | { readonly type: 'sell'; readonly square: number }
  | { readonly type: 'pawn'; readonly square: number }
  | { readonly type: 'redeem'; readonly square: number }
  | { readonly type: 'takeover' }
  | { readonly type: 'skip' }
  | { readonly type: 'pay' }
  | { readonly type: 'bankrupt' }
  | { readonly type: 'end' };

/** The smallest step of a bid above the current one. */
export const BID_STEP = 10;

const rollDice = (random: Random): [number, number] => [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)];

/** The phases in which the player on turn may build, sell, pawn and redeem. */
const MANAGING: ReadonlySet<Phase['kind']> = new Set<Phase['kind']>(['roll', 'cryo', 'buy', 'takeover', 'debt', 'end']);

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

  switch (action.type) {
    case 'build':
    case 'sell':
    case 'pawn':
    case 'redeem': {
      if (!MANAGING.has(phase.kind)) fail('not now');
      const square = action.square;
      if (action.type === 'build') {
        if (phase.kind === 'debt' || !canBuild(state, square)) fail('cannot build here');
        work.players[me].cash -= modulePrice(square);
        work.level[square] += 1;
        work.log.push({ kind: 'build', player: me, square, level: work.level[square] });
      } else if (action.type === 'sell') {
        if (!canSell(state, square)) fail('cannot sell here');
        work.players[me].cash += Math.floor(modulePrice(square) / 2);
        work.level[square] -= 1;
        work.log.push({ kind: 'sell', player: me, square, level: work.level[square] });
      } else if (action.type === 'pawn') {
        if (!canPawn(state, square)) fail('cannot pawn this');
        work.players[me].cash += Math.floor(priceOf(square) / 2);
        work.pawned[square] = true;
        work.log.push({ kind: 'pawn', player: me, square, redeem: false });
      } else {
        if (phase.kind === 'debt' || !canRedeem(state, square)) fail('cannot redeem this');
        work.players[me].cash -= redeemPrice(square);
        work.pawned[square] = false;
        work.log.push({ kind: 'pawn', player: me, square, redeem: true });
      }
      return settle(state, work, {});
    }
    case 'roll': {
      if (phase.kind !== 'roll' && phase.kind !== 'cryo') return fail('not the time to roll');
      const dice = action.dice ?? rollDice(random);
      if (dice.some(die => !Number.isInteger(die) || die < 1 || die > 6)) fail('bad dice');
      const double = dice[0] === dice[1];
      work.log.push({ kind: 'roll', player: me, dice });
      const rolled: RentState = { ...state, dice, again: false };
      if (phase.kind === 'cryo') {
        const tries = (state.players[me].cryo ?? 0) + 1;
        if (!double && tries < 3) {
          work.players[me].cryo = tries;
          return settle(rolled, work, { phase: { kind: 'end' }, doubles: 0 });
        }
        // [EN] A double thaws the player; the third miss costs the bail. Either way the player walks out by the dice,
        //      without a second roll. [RU] Дубль размораживает игрока; третий промах стоит залога. Так или иначе игрок
        //      выходит по кубикам, без второго броска.
        work.players[me].cryo = null;
        work.log.push({ kind: 'free', player: me, how: double ? 'double' : 'served' });
        const debts = double ? null : charge(work, me, [{ to: fineTo(state.options), amount: state.options.bail }]);
        walk(rolled, work, dice[0] + dice[1]);
        if (debts) return settle(rolled, work, { phase: { kind: 'debt', debts, land: true }, doubles: 0 });
        return land({ ...rolled, doubles: 0 }, work);
      }
      const doubles = double ? state.doubles + 1 : 0;
      if (doubles === 3) return sendToCryo({ ...rolled, doubles: 0 }, work, me, 'doubles');
      walk(rolled, work, dice[0] + dice[1]);
      return land({ ...rolled, doubles, again: double }, work);
    }
    case 'buy': {
      if (phase.kind !== 'buy') return fail('nothing to buy');
      const price = priceOf(phase.square);
      if (work.players[me].cash < price) fail('not enough credits');
      work.players[me].cash -= price;
      work.owner[phase.square] = me;
      work.log.push({ kind: 'buy', player: me, square: phase.square, price });
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'decline': {
      if (phase.kind !== 'buy') return fail('nothing to decline');
      if (!state.options.auction) return settle(state, work, { phase: afterLanding(state) });
      // [EN] Everybody bids, starting with the one who declined. [RU] Торгуются все, начиная с того, кто отказался.
      const players = alive(state);
      const start = players.indexOf(me);
      const bidders = [...players.slice(start), ...players.slice(0, start)];
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
    case 'takeover':
    case 'skip': {
      if (phase.kind !== 'takeover') return fail('nothing to take over');
      if (action.type === 'takeover') {
        if (!canTakeOver(state, phase.square)) fail('cannot take this over');
        const owner = state.owner[phase.square] as number;
        const price = takeoverPrice(phase.square);
        work.players[me].cash -= price;
        work.players[owner].cash += price;
        work.owner[phase.square] = me;
        work.log.push({ kind: 'takeover', player: me, owner, square: phase.square, price });
      }
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'bail':
    case 'code': {
      if (phase.kind !== 'cryo') return fail('not in cryo');
      if (action.type === 'code') {
        if (work.players[me].codes === 0) fail('no thaw code');
        work.players[me].codes -= 1;
      } else {
        if (work.players[me].cash < state.options.bail) fail('not enough credits');
        work.players[me].cash -= state.options.bail;
        receive(work, fineTo(state.options), state.options.bail);
      }
      work.players[me].cryo = null;
      work.log.push({ kind: 'free', player: me, how: action.type });
      return settle(state, work, { phase: { kind: 'roll' } });
    }
    case 'flare': {
      if (phase.kind !== 'flare') return fail('no flare');
      if (action.choice === 'cryo') {
        work.log.push({ kind: 'flare', player: me, paid: false });
        return sendToCryo(state, work, me, 'flare');
      }
      if (work.players[me].cash < state.options.bail) fail('not enough credits');
      work.players[me].cash -= state.options.bail;
      receive(work, fineTo(state.options), state.options.bail);
      work.log.push({ kind: 'flare', player: me, paid: true });
      return settle(state, work, { phase: afterLanding(state) });
    }
    case 'pay': {
      if (phase.kind !== 'debt') return fail('no debt');
      if (charge(work, me, phase.debts)) fail('not enough credits yet');
      const paid = settle(state, work, {});
      // [EN] A debt from the third miss in Cryo is paid before the landing. [RU] Долг третьего промаха в Криокамере платится до приземления.
      if (phase.land) return land(paid, draft(paid));
      return { ...paid, phase: afterLanding(state) };
    }
    case 'bankrupt': {
      if (phase.kind !== 'debt') return fail('no debt');
      if (liquidValue(state, me) >= totalOf(phase.debts)) fail('the debt can still be paid');
      const heir = phase.debts.find(debt => typeof debt.to === 'number')?.to ?? 'bank';
      goBankrupt(work, me, heir);
      return finishTurn(settle(state, work, { phase: { kind: 'end' } }));
    }
    case 'end': {
      if (phase.kind !== 'end') return fail('the turn is not over');
      return finishTurn(state);
    }
  }
}

/** Everything of a bankrupt goes to the creditor (the modules sold for half first), or back to the bank. */
function goBankrupt(work: Draft, player: number, heir: Payee): void {
  const me = work.players[player];
  work.owner.forEach((owner, square) => {
    if (owner !== player) return;
    me.cash += Math.floor((modulePrice(square) * work.level[square]) / 2);
    work.level[square] = 0;
    work.owner[square] = typeof heir === 'number' ? heir : null;
    if (typeof heir !== 'number') work.pawned[square] = false;
  });
  if (typeof heir === 'number') {
    work.players[heir].cash += me.cash;
    work.players[heir].codes += me.codes;
  }
  me.cash = 0;
  me.codes = 0;
  me.bankrupt = true;
  work.log.push({ kind: 'bankrupt', player, to: heir });
}
// END 5

// BEGIN 6. The end
/** The turn passes to the next player still in the game; the game may end here. */
function finishTurn(state: RentState): RentState {
  const players = alive(state);
  if (players.length <= 1) return { ...state, phase: { kind: 'over' }, winner: players[0] ?? null };
  let next = state.turn;
  do next = (next + 1) % state.players.length; while (state.players[next].bankrupt);
  const round = next <= state.turn ? state.round + 1 : state.round;
  if (state.options.roundLimit > 0 && round > state.options.roundLimit) {
    const richest = players.reduce((best, player) => (netWorth(state, player) > netWorth(state, best) ? player : best), players[0]);
    return { ...state, phase: { kind: 'over' }, winner: richest };
  }
  const phase: Phase = state.players[next].cryo !== null ? { kind: 'cryo' } : { kind: 'roll' };
  return { ...state, turn: next, round, phase, dice: null, doubles: 0, again: false };
}
// END 6

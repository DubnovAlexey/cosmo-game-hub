// =====================================================================
// FILE: apps/client/src/games/poker/engine/holdem.ts
// PURPOSE: a no-limit Texas hold'em table as pure data and pure functions: a sit-and-go of 2–6 players with rising
//   blinds (and antes), every hand from the blinds to the showdown. The rules are the casino ones:
//   - heads-up the button posts the small blind, acts first before the flop and last after it;
//   - a raise is at least the last full raise; an all-in for less does not reopen the betting for those who have
//     already acted (they may only call or fold);
//   - side pots by contribution levels, an uncalled bet comes back, a split pot gives the odd chip to the first
//     winner left of the button;
//   - when nobody can bet any more, the board is dealt out to the river;
//   - the button moves to the next player with chips, busted players are skipped, the table ends with one player.
//   Every state is plain JSON (saved after every action) and the same seed deals the same cards.
// SECTIONS: 1 types; 2 seats; 3 a new table and a new hand; 4 legal actions; 5 applying an action;
//   6 streets and showdown; 7 pots.
// =====================================================================
import { shuffledDeck, type Card } from './cards.ts';
import { evaluate, type HandValue } from './evaluate.ts';
// noinspection ES6PreferShortImport
import type { Random } from '../../../shared/engine/random.ts';

// BEGIN 1. Types
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export interface BlindLevel { readonly small: number; readonly big: number; readonly ante: number }
export interface TableRules {
  readonly startingStack: number;
  readonly levels: readonly BlindLevel[];
  /** The blinds rise every this many hands (0 = never). */
  readonly handsPerLevel: number;
}

/** The classic sit-and-go ladder: 10/20 up to 300/600, antes from 100/200. */
export const SIT_AND_GO_LEVELS: readonly BlindLevel[] = Object.freeze([
  { small: 10, big: 20, ante: 0 }, { small: 15, big: 30, ante: 0 }, { small: 25, big: 50, ante: 0 }, { small: 50, big: 100, ante: 0 },
  { small: 75, big: 150, ante: 0 }, { small: 100, big: 200, ante: 25 }, { small: 150, big: 300, ante: 25 }, { small: 200, big: 400, ante: 50 },
  { small: 300, big: 600, ante: 75 }, { small: 500, big: 1000, ante: 100 },
].map(level => Object.freeze(level)));
export const DEFAULT_RULES: TableRules = Object.freeze({ startingStack: 1500, levels: SIT_AND_GO_LEVELS, handsPerLevel: 10 });

export interface SeatState {
  /** Chips behind. */
  readonly stack: number;
  readonly hole: readonly Card[];
  readonly folded: boolean;
  readonly allIn: boolean;
  /** Busted before this hand: not dealt in. */
  readonly out: boolean;
  /** Chips put in on this street (blinds included, antes not). */
  readonly bet: number;
  /** Chips put in during this hand (antes and blinds included). */
  readonly committed: number;
  /** Has acted on this street since it began or since the last raise asked for an answer. */
  readonly acted: boolean;
  /** The bet this seat matched when it last acted on this street (−1: not yet). A raise is open to it only when the
   *  bet has grown by at least a full raise since then. */
  readonly matched: number;
}

export type PokerAction =
  | { readonly type: 'fold'; readonly seat: number }
  | { readonly type: 'check'; readonly seat: number }
  | { readonly type: 'call'; readonly seat: number }
  /** A bet when nobody has bet on this street; `to` is the seat's total bet on the street after the action. */
  | { readonly type: 'raise'; readonly seat: number; readonly to: number }
  | { readonly type: 'allIn'; readonly seat: number };

export type LogEntry =
  | { readonly kind: 'blinds'; readonly small: number; readonly big: number; readonly ante: number; readonly smallSeat: number; readonly bigSeat: number }
  | { readonly kind: 'action'; readonly street: Street; readonly seat: number; readonly action: PokerAction['type'] | 'bet'; readonly to: number; readonly allIn: boolean }
  | { readonly kind: 'street'; readonly street: Street; readonly cards: readonly Card[] };

export interface PotResult {
  readonly amount: number;
  readonly eligible: readonly number[];
  readonly winners: readonly number[];
  readonly shares: readonly number[];
}
export interface HandResult {
  readonly pots: readonly PotResult[];
  /** False: everybody else folded and the last player took the pot without showing. */
  readonly showdown: boolean;
  /** The hand value of every seat that reached the showdown (null otherwise). */
  readonly values: readonly (HandValue | null)[];
  /** Chips won by every seat (gross; the uncalled part of a bet comes back here too). */
  readonly won: readonly number[];
}

export interface HandState {
  readonly rules: TableRules;
  readonly handNumber: number;
  readonly level: BlindLevel;
  readonly button: number;
  readonly smallBlindSeat: number;
  readonly bigBlindSeat: number;
  readonly seats: readonly SeatState[];
  /** The rest of the deck, the next card first. */
  readonly deck: readonly Card[];
  readonly board: readonly Card[];
  readonly street: Street;
  readonly phase: 'betting' | 'done';
  readonly turn: number | null;
  /** The highest bet on this street. */
  readonly currentBet: number;
  /** The size of the last full raise on this street (at least the big blind). */
  readonly minRaise: number;
  readonly lastAggressor: number | null;
  readonly raisesThisStreet: number;
  readonly log: readonly LogEntry[];
  readonly result: HandResult | null;
}
// END 1

// BEGIN 2. Seats
const inHand = (seat: SeatState): boolean => !seat.out && !seat.folded;
const canAct = (seat: SeatState): boolean => inHand(seat) && !seat.allIn;
/** The next seat after `from` (clockwise) that passes `test`, or null. */
function nextSeat(seats: readonly SeatState[], from: number, test: (seat: SeatState) => boolean): number | null {
  for (let step = 1; step <= seats.length; step += 1) {
    const index = (from + step) % seats.length;
    if (test(seats[index])) return index;
  }
  return null;
}
export const seatsWithChips = (state: Pick<HandState, 'seats'>): number[] => state.seats.flatMap((seat, index) => (seat.stack > 0 || (inHand(seat) && seat.allIn) ? [index] : []));
/** The pot as it stands: everything put in this hand. */
export const potSize = (state: Pick<HandState, 'seats'>): number => state.seats.reduce((sum, seat) => sum + seat.committed, 0);
// END 2

// BEGIN 3. A new table and a new hand
export function levelFor(rules: TableRules, handNumber: number): BlindLevel {
  if (rules.handsPerLevel <= 0) return rules.levels[0];
  return rules.levels[Math.min(rules.levels.length - 1, Math.floor((handNumber - 1) / rules.handsPerLevel))];
}

/** Fixed cards for a deal (tests, shared puzzles): hole cards per seat and the five board cards. */
export interface DealOptions {
  readonly holes?: readonly (readonly Card[] | undefined)[];
  readonly board?: readonly Card[];
}
export interface TableOptions extends DealOptions {
  readonly rules?: TableRules;
  /** The seat of the first button. */
  readonly button?: number;
  /** Starting stacks per seat instead of the rules' equal ones. */
  readonly stacks?: readonly number[];
}

/** A new sit-and-go: `players` seats (seat 0 is yours), equal stacks, the first hand dealt. */
export function newTable(players: number, random: Random, options: TableOptions = {}): HandState {
  if (players < 2 || players > 6) throw new Error('A table seats 2 to 6 players');
  const rules = options.rules ?? DEFAULT_RULES;
  const seats = Array.from({ length: players }, (_, index): SeatState => ({
    stack: options.stacks?.[index] ?? rules.startingStack, hole: [], folded: false, allIn: false, out: false, bet: 0, committed: 0, acted: false, matched: -1,
  }));
  // [EN] The first hand moves the button forward, so start one seat before it. [RU] Первая раздача сдвигает баттон вперёд, поэтому начинаем на место раньше.
  return dealHand({ rules, seats, button: ((options.button ?? 0) - 1 + players) % players, handNumber: 0 }, random, options);
}

/** The next hand: busted players leave, the button moves on, the blinds may rise. Null when the table is over. */
export function nextHand(state: HandState, random: Random, options: DealOptions = {}): HandState | null {
  const seats = state.seats.map(seat => ({ ...seat, out: seat.stack <= 0 }));
  if (seats.filter(seat => !seat.out).length < 2) return null;
  return dealHand({ rules: state.rules, seats, button: state.button, handNumber: state.handNumber }, random, options);
}

function dealHand(previous: { rules: TableRules; seats: readonly SeatState[]; button: number; handNumber: number }, random: Random, options: DealOptions): HandState {
  const { rules } = previous;
  const handNumber = previous.handNumber + 1;
  const level = levelFor(rules, handNumber);
  const alive = (seat: SeatState): boolean => !seat.out && seat.stack > 0;
  const fresh = previous.seats.map((seat): SeatState => ({ stack: seat.stack, hole: [], folded: false, allIn: false, out: !alive(seat), bet: 0, committed: 0, acted: false, matched: -1 }));
  const button = nextSeat(fresh, previous.button, alive) ?? 0;
  const players = fresh.filter(alive).length;
  // [EN] Heads-up the button is the small blind. [RU] Вдвоём баттон — малый блайнд.
  const smallBlindSeat = players === 2 ? button : (nextSeat(fresh, button, alive) ?? button);
  const bigBlindSeat = nextSeat(fresh, smallBlindSeat, alive) ?? smallBlindSeat;
  const fixed = new Set<Card>([...(options.holes ?? []).flatMap(hole => hole ?? []), ...(options.board ?? [])]);
  const rest = shuffledDeck(random).filter(card => !fixed.has(card));
  const seats = fresh.map(seat => ({ ...seat }));
  // Two cards each, one at a time, starting left of the button.
  let seat = smallBlindSeat;
  for (let round = 0; round < 2; round += 1) {
    for (let count = 0; count < players; count += 1) {
      const card = options.holes?.[seat]?.[round] ?? (rest.shift() as Card);
      seats[seat] = { ...seats[seat], hole: [...seats[seat].hole, card] };
      seat = nextSeat(seats, seat, alive) ?? seat;
    }
  }
  // A fixed board comes out after the burn cards exactly as given. [RU] Заданная доска выходит после сжигаемых карт ровно такой.
  const board = options.board;
  const deck = board && board.length === 5
    ? [rest.shift() as Card, board[0], board[1], board[2], rest.shift() as Card, board[3], rest.shift() as Card, board[4], ...rest]
    : rest;
  const post = (index: number, amount: number, asBet: boolean): void => {
    const paid = Math.min(seats[index].stack, amount);
    const stack = seats[index].stack - paid;
    seats[index] = { ...seats[index], stack, committed: seats[index].committed + paid, bet: seats[index].bet + (asBet ? paid : 0), allIn: stack === 0 };
  };
  if (level.ante > 0) seats.forEach((_, index) => { if (alive(seats[index])) post(index, level.ante, false); });
  post(smallBlindSeat, level.small, true);
  post(bigBlindSeat, level.big, true);
  const base: HandState = {
    rules, handNumber, level, button, smallBlindSeat, bigBlindSeat, seats, deck, board: [], street: 'preflop', phase: 'betting',
    turn: null, currentBet: level.big, minRaise: level.big, lastAggressor: null, raisesThisStreet: 0,
    log: [{ kind: 'blinds', small: level.small, big: level.big, ante: level.ante, smallSeat: smallBlindSeat, bigSeat: bigBlindSeat }],
    result: null,
  };
  // Before the flop the player after the big blind speaks first (heads-up: the button).
  return settle(base, bigBlindSeat);
}
// END 3

// BEGIN 4. Legal actions
export interface LegalActions {
  readonly fold: boolean;
  readonly check: boolean;
  /** Chips a call costs (0 when there is nothing to call). */
  readonly call: number;
  /** The smallest and the largest total bet a raise may reach; null when no raise is open. */
  readonly raise: { readonly min: number; readonly max: number } | null;
  /** The total bet after going all-in; null when all-in is not allowed now (a closed raise and more chips than the
   *  call needs). */
  readonly allIn: number | null;
}

export function legalActions(state: HandState): LegalActions | null {
  if (state.phase !== 'betting' || state.turn === null) return null;
  const seat = state.seats[state.turn];
  const toCall = Math.max(0, state.currentBet - seat.bet);
  const all = seat.bet + seat.stack;
  const reopened = seat.matched < 0 || state.currentBet - seat.matched >= state.minRaise;
  const minTo = state.currentBet === 0 ? Math.max(state.level.big, state.minRaise) : state.currentBet + state.minRaise;
  // [EN] Somebody else must still be able to answer a raise. [RU] Кто-то ещё должен суметь ответить на рейз.
  const opponentsCanAnswer = state.seats.some((other, index) => index !== state.turn && canAct(other));
  const raiseOpen = reopened && opponentsCanAnswer && all > state.currentBet;
  return {
    fold: toCall > 0,
    check: toCall === 0,
    call: Math.min(toCall, seat.stack),
    raise: raiseOpen && all >= minTo ? { min: minTo, max: all } : null,
    // [EN] All-in is a raise when it goes above the bet — open only when a raise is open; otherwise only as a call.
    // [RU] Олл-ин выше ставки — это рейз, он открыт, только когда открыт рейз; иначе — только как колл.
    allIn: raiseOpen ? all : toCall > 0 && all <= state.currentBet ? all : null,
  };
}
// END 4

// BEGIN 5. Applying an action
export function applyAction(state: HandState, action: PokerAction): HandState {
  const legal = legalActions(state);
  if (!legal || action.seat !== state.turn) throw new Error('Not this seat\'s turn');
  const index = action.seat;
  const seat = state.seats[index];
  const seats = state.seats.slice();
  let { currentBet, minRaise, lastAggressor, raisesThisStreet } = state;
  let logged: LogEntry;
  const put = (to: number): SeatState => {
    const paid = to - seat.bet;
    const stack = seat.stack - paid;
    return { ...seat, stack, bet: to, committed: seat.committed + paid, allIn: stack === 0, acted: true, matched: Math.max(to, currentBet) };
  };
  switch (action.type) {
    case 'fold':
      if (!legal.fold) throw new Error('Nothing to fold against: check');
      seats[index] = { ...seat, folded: true, acted: true };
      logged = { kind: 'action', street: state.street, seat: index, action: 'fold', to: seat.bet, allIn: false };
      break;
    case 'check':
      if (!legal.check) throw new Error('Cannot check: there is a bet to call');
      seats[index] = { ...seat, acted: true, matched: currentBet };
      logged = { kind: 'action', street: state.street, seat: index, action: 'check', to: seat.bet, allIn: false };
      break;
    case 'call': {
      if (legal.call <= 0) throw new Error('Nothing to call: check');
      seats[index] = put(seat.bet + legal.call);
      logged = { kind: 'action', street: state.street, seat: index, action: 'call', to: seats[index].bet, allIn: seats[index].allIn };
      break;
    }
    case 'raise':
    case 'allIn': {
      if (action.type === 'allIn' && legal.allIn === null) throw new Error('All-in is not open now: call or fold');
      const to = action.type === 'allIn' ? (legal.allIn as number) : action.to;
      if (action.type === 'raise') {
        if (!legal.raise) throw new Error('No raise is open now');
        if (!Number.isInteger(to) || to < legal.raise.min || to > legal.raise.max) throw new Error(`A raise must reach ${legal.raise.min}…${legal.raise.max}`);
      }
      if (to <= currentBet) {
        // An all-in that does not even match the bet is a call for less.
        seats[index] = put(to);
        logged = { kind: 'action', street: state.street, seat: index, action: 'call', to, allIn: true };
        break;
      }
      const increment = to - currentBet;
      const bet = currentBet === 0;
      seats[index] = put(to);
      if (increment >= minRaise) { minRaise = increment; }
      currentBet = to;
      lastAggressor = index;
      raisesThisStreet += 1;
      // Everybody else who can still act must answer.
      for (let other = 0; other < seats.length; other += 1) if (other !== index && canAct(seats[other])) seats[other] = { ...seats[other], acted: false };
      logged = { kind: 'action', street: state.street, seat: index, action: bet ? 'bet' : action.type === 'allIn' ? 'allIn' : 'raise', to, allIn: seats[index].allIn };
      break;
    }
    default: throw new Error('Unknown action');
  }
  return settle({ ...state, seats, currentBet, minRaise, lastAggressor, raisesThisStreet, log: [...state.log, logged], turn: null }, index);
}
// END 5

// BEGIN 6. Streets and showdown
/** After an action of `from` (or the big blind's post): find who speaks next, or close the street, or end the hand. */
function settle(state: HandState, from: number): HandState {
  const live = state.seats.filter(inHand);
  if (live.length === 1) return finish(state, false);
  const waiting = (seat: SeatState): boolean => canAct(seat) && (!seat.acted || seat.bet < state.currentBet);
  const next = nextSeat(state.seats, from, waiting);
  if (next !== null) {
    // One player alone with chips facing nothing to call: no betting is possible against all-ins.
    const able = state.seats.filter(canAct);
    const nobodyToBetAgainst = able.length === 1 && state.seats[next].bet >= state.currentBet;
    if (!nobodyToBetAgainst) return { ...state, turn: next };
  }
  return nextStreet(state);
}

const STREETS: readonly Street[] = ['preflop', 'flop', 'turn', 'river'];
function nextStreet(state: HandState): HandState {
  const deck = state.deck.slice();
  let board = state.board.slice();
  let street: Street = state.street;
  const log = state.log.slice();
  const seats = state.seats.map(seat => ({ ...seat, bet: 0, acted: false, matched: -1 }));
  /** Burns a card and deals the street after `from`; returns the new street. */
  const dealStreet = (from: Street): Street => {
    const next = STREETS[STREETS.indexOf(from) + 1];
    deck.shift(); // the burn card
    const cards = deck.splice(0, next === 'flop' ? 3 : 1);
    board = [...board, ...cards];
    log.push({ kind: 'street', street: next, cards });
    return next;
  };
  if (street === 'river') return finish({ ...state, seats }, true);
  street = dealStreet(street);
  // [EN] When at most one player can still bet, the board is dealt out to the river at once.
  // [RU] Когда ставить может не больше одного игрока, доска сразу сдаётся до ривера.
  if (seats.filter(canAct).length <= 1) {
    for (let guard = 0; street !== 'river' && guard < 3; guard += 1) street = dealStreet(street);
    return finish({ ...state, seats, deck, board, street, log }, true);
  }
  const fresh: HandState = { ...state, seats, deck, board, street, log, currentBet: 0, minRaise: state.level.big, lastAggressor: null, raisesThisStreet: 0, turn: null };
  // After the flop the first player left of the button speaks first.
  return { ...fresh, turn: nextSeat(seats, state.button, canAct) };
}

function finish(state: HandState, showdown: boolean): HandState {
  const live = state.seats.map((seat, index) => (inHand(seat) ? index : -1)).filter(index => index >= 0);
  const values = state.seats.map((seat, index) => (showdown && live.includes(index) ? evaluate([...seat.hole, ...state.board]) : null));
  const pots = buildPots(state.seats).map(pot => {
    const contenders = pot.eligible;
    const best = showdown ? Math.max(...contenders.map(index => values[index] ?? -1)) : null;
    const winners = showdown ? contenders.filter(index => values[index] === best) : contenders;
    return { ...pot, winners: orderFromButton(winners, state.button, state.seats.length) };
  });
  const won = state.seats.map(() => 0);
  const results: PotResult[] = pots.map(pot => {
    const share = Math.floor(pot.amount / pot.winners.length);
    let odd = pot.amount - share * pot.winners.length;
    const shares = pot.winners.map(() => { const extra = odd > 0 ? 1 : 0; odd -= extra; return share + extra; });
    pot.winners.forEach((winner, index) => { won[winner] += shares[index]; });
    return { amount: pot.amount, eligible: pot.eligible, winners: pot.winners, shares };
  });
  const seats = state.seats.map((seat, index) => ({ ...seat, stack: seat.stack + won[index], bet: 0 }));
  return { ...state, seats, phase: 'done', turn: null, result: { pots: results, showdown, values, won } };
}
/** Winners in the order of the odd chip: the first seat left of the button first. */
function orderFromButton(winners: readonly number[], button: number, size: number): number[] {
  return winners.slice().sort((a, b) => ((a - button - 1 + size) % size) - ((b - button - 1 + size) % size));
}
// END 6

// BEGIN 7. Pots
/**
 * Side pots by contribution levels: every level of the smallest live contribution makes a pot shared by the live
 * players who reached it; folded chips fill the pots but win nothing. A part that only one live player reached is
 * his uncalled bet coming back.
 */
export function buildPots(seats: readonly SeatState[]): { amount: number; eligible: number[] }[] {
  const left = seats.map(seat => seat.committed);
  const pots: { amount: number; eligible: number[] }[] = [];
  for (;;) {
    const live = seats.map((_, index) => index).filter(index => inHand(seats[index]) && left[index] > 0);
    if (live.length === 0) break;
    const level = Math.min(...live.map(index => left[index]));
    let amount = 0;
    for (let index = 0; index < left.length; index += 1) {
      const part = Math.min(left[index], level);
      amount += part;
      left[index] -= part;
    }
    const last = pots[pots.length - 1];
    // Pots with the same players merge (a bet everybody called needs no separate pot).
    if (last && last.eligible.length === live.length && last.eligible.every((index, i) => index === live[i])) last.amount += amount;
    else pots.push({ amount, eligible: live });
  }
  // Chips of folded players above every live level go to the last pot.
  const rest = left.reduce((sum, value) => sum + value, 0);
  if (rest > 0) {
    if (pots.length > 0) pots[pots.length - 1].amount += rest;
    else pots.push({ amount: rest, eligible: seats.map((_, index) => index).filter(index => inHand(seats[index])) });
  }
  return pots;
}
// END 7

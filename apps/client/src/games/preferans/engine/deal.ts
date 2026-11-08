// =====================================================================
// FILE: apps/client/src/games/preferans/engine/deal.ts
// PURPOSE: one deal (раздача) as a pure state machine: newDeal → legalActions / applyAction → … → result.
//   Phases: bidding → discard → declare → whist → (whistReturn) → (whistMode) → play → done.
//   All-pass goes from bidding straight to play; misère skips declare and whist.
//   The state is plain data (numbers and arrays): it can be stored, replayed and posted to a Web Worker.
// SECTIONS: 1 types; 2 new deal; 3 legal actions; 4 apply action; 5 play; 6 finishing; 7 views.
// =====================================================================
import { applyCall, biddingResult, legalBids, startBidding, type BiddingState } from './bidding.ts';
import { HIGHEST_BID, MISERE, contractOf, trumpOf, type Bid, type Contract } from './bids.ts';
import {
  EMPTY_SET, FULL_DECK, cardsOf, hasCard, removeCard, setOf, suitOf, unionOf, withoutSet,
  type Card, type CardSet, type Suit,
} from './cards.ts';
import { legalCards, nextSeat, otherSeats, trickWinnerIndex, type PlayedCard, type Seat } from './play.ts';
import { shuffled, type Random } from '../../../shared/engine/random.ts';
import { SOCHI, type RuleSet } from './rules.ts';
import { scoreConcession, scoreGame, scoreMisere, scoreRaspasy, type DealScore } from './scoring.ts';

// BEGIN 1. Types
export type Phase = 'bidding' | 'discard' | 'declare' | 'whist' | 'whistReturn' | 'whistMode' | 'play' | 'done';
export type Mode = 'game' | 'misere' | 'raspasy';
export type WhistCall = 'whist' | 'pass' | 'half';

export interface WhistState {
  /** Defenders in the order they decide: the declarer's left neighbour first. */
  readonly order: readonly [Seat, Seat];
  readonly calls: readonly (WhistCall | null)[];
  /** Final whisters in the order they said «вист» (both defenders on a checked ten). */
  readonly whisters: readonly Seat[];
  readonly halfWhister: Seat | null;
}

export interface CompletedTrick {
  readonly cards: readonly PlayedCard[];
  /** All-pass: the talon card that set the suit of this trick. */
  readonly lead: Card | null;
  readonly winner: Seat;
}

export interface DealResult {
  readonly mode: Mode;
  readonly declarer: Seat | null;
  readonly contract: Contract | null;
  /** False when the game counted without play: both defenders passed, or a half-whist was not returned. */
  readonly played: boolean;
  readonly tricksWon: readonly number[];
  readonly whisters: readonly Seat[];
  readonly halfWhister: Seat | null;
  /** Tricks the declarer conceded without play («уход без двух / без трёх»); absent or 0 otherwise. */
  readonly conceded?: number;
  readonly score: DealScore;
}

export interface DealState {
  readonly rules: RuleSet;
  readonly dealer: Seat;
  readonly firstHand: Seat;
  /** All-pass deals in a row before this one (price progression). */
  readonly raspasyRound: number;
  readonly dealt: readonly CardSet[];
  readonly talon: readonly Card[];
  readonly hands: readonly CardSet[];
  readonly phase: Phase;
  /** Whose decision it is; null when the deal is over. */
  readonly turn: Seat | null;
  readonly bidding: BiddingState;
  readonly mode: Mode | null;
  readonly declarer: Seat | null;
  readonly winningBid: Bid | null;
  readonly contract: Contract | null;
  readonly trump: Suit | null;
  readonly discards: readonly Card[];
  readonly whist: WhistState | null;
  /** The defenders' cards lie face up: open whist (всветлую), or misère after the first trick. */
  readonly openHands: boolean;
  readonly trick: readonly PlayedCard[];
  /** All-pass: the talon card leading the current trick. */
  readonly trickLead: Card | null;
  readonly tricks: readonly CompletedTrick[];
  readonly tricksWon: readonly number[];
  readonly result: DealResult | null;
}

export type Action =
  | { readonly type: 'bid'; readonly seat: Seat; readonly bid: Bid }
  | { readonly type: 'pass'; readonly seat: Seat }
  | { readonly type: 'discard'; readonly seat: Seat; readonly cards: readonly [Card, Card] }
  | { readonly type: 'declare'; readonly seat: Seat; readonly bid: Bid }
  /** Instead of naming a game: concede a hopeless one (only when the table allows it). */
  | { readonly type: 'concede'; readonly seat: Seat }
  | { readonly type: 'whist'; readonly seat: Seat; readonly call: WhistCall }
  | { readonly type: 'returnWhist'; readonly seat: Seat; readonly accept: boolean }
  | { readonly type: 'whistMode'; readonly seat: Seat; readonly open: boolean }
  | { readonly type: 'play'; readonly seat: Seat; readonly card: Card };
// END 1

// BEGIN 2. New deal
export interface NewDealOptions {
  readonly rules?: RuleSet;
  readonly dealer?: Seat;
  readonly raspasyRound?: number;
  readonly random?: Random;
  /** Exact deck order (tests, shared puzzles): 10 cards each from the first hand clockwise, the last two are the talon. */
  readonly deck?: readonly Card[];
}

export function newDeal(options: NewDealOptions = {}): DealState {
  const rules = options.rules ?? SOCHI;
  const dealer = options.dealer ?? 2;
  const firstHand = nextSeat(dealer);
  const deck = options.deck ?? shuffled(FULL_DECK, options.random ?? Math.random);
  if (deck.length !== 32 || setOf(deck) !== 0xffffffff) throw new Error('A deal needs all 32 cards exactly once');
  const hands: CardSet[] = [EMPTY_SET, EMPTY_SET, EMPTY_SET];
  let seat = firstHand;
  for (let part = 0; part < 3; part += 1) {
    hands[seat] = setOf(deck.slice(part * 10, part * 10 + 10));
    seat = nextSeat(seat);
  }
  return {
    rules, dealer, firstHand, raspasyRound: options.raspasyRound ?? 0,
    dealt: hands, talon: [deck[30], deck[31]], hands,
    phase: 'bidding', turn: firstHand, bidding: startBidding(firstHand),
    mode: null, declarer: null, winningBid: null, contract: null, trump: null, discards: [],
    whist: null, openHands: false, trick: [], trickLead: null, tricks: [], tricksWon: [0, 0, 0], result: null,
  };
}

/** The next deal at the table: the dealer moves clockwise, the all-pass progression continues or resets. */
export function nextDeal(previous: DealState, options: Omit<NewDealOptions, 'dealer' | 'raspasyRound' | 'rules'> = {}): DealState {
  return newDeal({
    ...options,
    rules: previous.rules,
    dealer: nextSeat(previous.dealer),
    raspasyRound: previous.mode === 'raspasy' ? previous.raspasyRound + 1 : 0,
  });
}
// END 2

// BEGIN 3. Legal actions
/**
 * The suit a card must follow now; null when the player leads. On all-pass a talon card leads the whole
 * trick: every player follows its suit, not the suit of the first card played after it.
 */
export function ledSuitOf(state: DealState): Suit | null {
  if (state.trickLead !== null) return suitOf(state.trickLead);
  return state.trick.length > 0 ? suitOf(state.trick[0].card) : null;
}

export function legalPlays(state: DealState): Card[] {
  if (state.phase !== 'play' || state.turn === null) return [];
  return cardsOf(legalCards(state.hands[state.turn], ledSuitOf(state), state.trump));
}

const whistLevel = (state: DealState): number => (state.contract?.kind === 'game' ? state.contract.level : 0);
/** Stalingrad applies to a six of spades only. */
const isStalingradGame = (state: DealState): boolean =>
  state.rules.stalingrad && state.contract?.kind === 'game' && state.contract.level === 6 && state.contract.strain === 0;

export function legalActions(state: DealState): Action[] {
  const seat = state.turn;
  if (seat === null) return [];
  switch (state.phase) {
    case 'bidding':
      return [{ type: 'pass', seat }, ...legalBids(state.bidding, state.rules).map(bid => ({ type: 'bid', seat, bid }) as const)];
    case 'discard': {
      const cards = cardsOf(state.hands[seat]);
      const actions: Action[] = [];
      for (let i = 0; i < cards.length; i += 1) {
        for (let j = i + 1; j < cards.length; j += 1) actions.push({ type: 'discard', seat, cards: [cards[i], cards[j]] });
      }
      return actions;
    }
    case 'declare': {
      const actions: Action[] = [];
      for (let bid = state.winningBid ?? 0; bid <= HIGHEST_BID; bid += 1) if (bid !== MISERE) actions.push({ type: 'declare', seat, bid });
      if (state.rules.concedeTricks > 0) actions.push({ type: 'concede', seat });
      return actions;
    }
    case 'whist': {
      const whist = state.whist;
      if (!whist) return [];
      // Stalingrad: no pass and no half-whist on a six of spades.
      if (isStalingradGame(state)) return [{ type: 'whist', seat, call: 'whist' }];
      const first = whist.order[0] === seat;
      const calls: WhistCall[] = ['whist', 'pass'];
      const level = whistLevel(state);
      if (!first && whist.calls[0] === 'pass' && state.rules.halfWhistLevels.includes(level as 6 | 7)) calls.push('half');
      return calls.map(call => ({ type: 'whist', seat, call }) as const);
    }
    case 'whistReturn':
      return [{ type: 'returnWhist', seat, accept: true }, { type: 'returnWhist', seat, accept: false }];
    case 'whistMode':
      return [{ type: 'whistMode', seat, open: true }, { type: 'whistMode', seat, open: false }];
    case 'play':
      return legalPlays(state).map(card => ({ type: 'play', seat, card }) as const);
    default:
      return [];
  }
}
// END 3

// BEGIN 4. Apply action
export function applyAction(state: DealState, action: Action): DealState {
  if (state.turn === null) throw new Error('The deal is over');
  if (action.seat !== state.turn) throw new Error(`It is seat ${state.turn}'s turn, not ${action.seat}'s`);
  switch (action.type) {
    case 'bid':
    case 'pass': {
      if (state.phase !== 'bidding') throw new Error('Not bidding now');
      const call = action.type === 'pass' ? { seat: action.seat, call: 'pass' } as const : { seat: action.seat, call: 'bid', bid: action.bid } as const;
      const bidding = applyCall(state.bidding, call, state.rules);
      const outcome = biddingResult(bidding);
      if (outcome === null) return { ...state, bidding, turn: bidding.turn };
      if (outcome.kind === 'raspasy') return startPlay({ ...state, bidding, mode: 'raspasy', trump: null });
      const hands = state.hands.slice();
      hands[outcome.seat] = unionOf(hands[outcome.seat], setOf(state.talon));
      return { ...state, bidding, hands, declarer: outcome.seat, winningBid: outcome.bid, phase: 'discard', turn: outcome.seat };
    }
    case 'discard': {
      if (state.phase !== 'discard') throw new Error('Not discarding now');
      const [a, b] = action.cards;
      const hand = state.hands[action.seat];
      if (a === b || !hasCard(hand, a) || !hasCard(hand, b)) throw new Error('Discard two different cards from the hand');
      const hands = state.hands.slice();
      hands[action.seat] = removeCard(removeCard(hand, a), b);
      const next = { ...state, hands, discards: [a, b] };
      if (state.winningBid === MISERE) return startPlay({ ...next, contract: { kind: 'misere' }, mode: 'misere', trump: null });
      return { ...next, phase: 'declare' };
    }
    case 'declare': {
      if (state.phase !== 'declare' || state.declarer === null || state.winningBid === null) throw new Error('Not declaring now');
      if (action.bid < state.winningBid || action.bid === MISERE || action.bid > HIGHEST_BID) throw new Error('The final game must be at least the winning bid and not misère');
      const contract = contractOf(action.bid);
      const order = otherSeats(state.declarer);
      const next = { ...state, contract, trump: trumpOf(contract), mode: 'game' as const };
      if (contract.kind === 'game' && contract.level === 10 && state.rules.tenIsChecked) {
        return startPlay({ ...next, whist: { order, calls: [null, null], whisters: [order[0], order[1]], halfWhister: null } });
      }
      return { ...next, phase: 'whist', turn: order[0], whist: { order, calls: [null, null], whisters: [], halfWhister: null } };
    }
    case 'concede': {
      if (state.phase !== 'declare' || state.declarer === null || state.winningBid === null) throw new Error('Not declaring now');
      if (state.rules.concedeTricks === 0) throw new Error('This table does not allow conceding');
      return concede(state, state.declarer, state.winningBid);
    }
    case 'whist':
      return applyWhist(state, action.seat, action.call);
    case 'returnWhist': {
      const whist = state.whist;
      if (state.phase !== 'whistReturn' || !whist) throw new Error('Not deciding on a returned whist now');
      if (action.accept) return { ...state, phase: 'whistMode', whist: { ...whist, whisters: [whist.order[0]] } };
      return finish({ ...state, whist: { ...whist, halfWhister: whist.order[1] } }, false);
    }
    case 'whistMode': {
      if (state.phase !== 'whistMode') throw new Error('Not choosing open or closed whist now');
      return startPlay({ ...state, openHands: action.open });
    }
    case 'play':
      return applyPlay(state, action.seat, action.card);
    default:
      throw new Error('Unknown action');
  }
}

function applyWhist(state: DealState, seat: Seat, call: WhistCall): DealState {
  const whist = state.whist;
  if (state.phase !== 'whist' || !whist) throw new Error('Not whisting now');
  if (!legalActions(state).some(action => action.type === 'whist' && action.call === call)) throw new Error(`Illegal whist call "${call}"`);
  const index = whist.order[0] === seat ? 0 : 1;
  const calls = whist.calls.slice();
  calls[index] = call;
  if (index === 0) return { ...state, turn: whist.order[1], whist: { ...whist, calls } };
  const [first, second] = whist.order;
  const [firstCall] = calls;
  if (firstCall === 'whist' && call === 'whist') return startPlay({ ...state, whist: { ...whist, calls, whisters: [first, second] } });
  if (firstCall === 'whist') return { ...state, phase: 'whistMode', turn: first, whist: { ...whist, calls, whisters: [first] } };
  if (call === 'whist') return { ...state, phase: 'whistMode', turn: second, whist: { ...whist, calls, whisters: [second] } };
  if (call === 'half') return { ...state, phase: 'whistReturn', turn: first, whist: { ...whist, calls } };
  return finish({ ...state, whist: { ...whist, calls } }, false);
}
// END 4

// BEGIN 5. Play
function startPlay(state: DealState): DealState {
  const talonLead = state.mode === 'raspasy' && state.rules.raspasyTalonLeads ? state.talon[0] : null;
  return { ...state, phase: 'play', turn: state.firstHand, trick: [], trickLead: talonLead, tricks: [], tricksWon: [0, 0, 0] };
}

function applyPlay(state: DealState, seat: Seat, card: Card): DealState {
  if (state.phase !== 'play') throw new Error('Not playing cards now');
  const legal = legalCards(state.hands[seat], ledSuitOf(state), state.trump);
  if (!hasCard(legal, card)) throw new Error(`Illegal card ${card} for seat ${seat}`);
  const hands = state.hands.slice();
  hands[seat] = removeCard(hands[seat], card);
  const trick = [...state.trick, { seat, card }];
  if (trick.length < 3) return { ...state, hands, trick, turn: nextSeat(seat) };

  const ledSuit = state.trickLead !== null ? suitOf(state.trickLead) : suitOf(trick[0].card);
  const index = trickWinnerIndex(trick.map(played => played.card), ledSuit, state.trump);
  // Nobody followed a talon-led all-pass trick: the first player to play takes it.
  const winner = trick[index === -1 ? 0 : index].seat;
  const tricksWon = state.tricksWon.slice();
  tricksWon[winner] += 1;
  const tricks = [...state.tricks, { cards: trick, lead: state.trickLead, winner }];
  const openHands = state.openHands || state.mode === 'misere';
  const next = { ...state, hands, trick: [], tricks, tricksWon, openHands };
  if (tricks.length === 10) return finish(next, true);
  if (state.mode === 'raspasy' && state.rules.raspasyTalonLeads && tricks.length < 3) {
    // The second talon card leads the second trick; the first hand leads the third.
    return { ...next, turn: state.firstHand, trickLead: tricks.length === 1 ? state.talon[1] : null };
  }
  return { ...next, turn: winner, trickLead: null };
}
// END 5

// BEGIN 6. Finishing
function finish(state: DealState, played: boolean): DealState {
  const mode = state.mode ?? 'game';
  let score: DealScore;
  if (mode === 'raspasy') score = scoreRaspasy(state.tricksWon, state.raspasyRound, state.rules);
  else if (mode === 'misere') score = scoreMisere(state.declarer as Seat, state.tricksWon, state.rules);
  else {
    const contract = state.contract;
    if (!contract || contract.kind !== 'game' || state.declarer === null) throw new Error('A game deal needs a declarer and a contract');
    score = scoreGame({
      declarer: state.declarer, level: contract.level, tricks: state.tricksWon, played,
      whisters: state.whist?.whisters ?? [], halfWhister: state.whist?.halfWhister ?? null,
    }, state.rules);
  }
  const result: DealResult = {
    mode, declarer: state.declarer, contract: state.contract, played, tricksWon: state.tricksWon,
    whisters: state.whist?.whisters ?? [], halfWhister: state.whist?.halfWhister ?? null, score,
  };
  return { ...state, phase: 'done', turn: null, result };
}

/** The declarer gives up a hopeless game before the whist: a fixed penalty, no play, nobody writes whists. */
function concede(state: DealState, declarer: Seat, winningBid: Bid): DealState {
  const contract = contractOf(winningBid);
  if (contract.kind !== 'game') throw new Error('A misère cannot be conceded');
  const tricks = state.rules.concedeTricks;
  const result: DealResult = {
    mode: 'game', declarer, contract, played: false, tricksWon: [0, 0, 0], whisters: [], halfWhister: null,
    conceded: tricks, score: scoreConcession(declarer, contract.level, tricks, state.rules),
  };
  return { ...state, mode: 'game', contract, trump: trumpOf(contract), phase: 'done', turn: null, result };
}
// END 6

// BEGIN 7. Views
/** Who decides for a seat: in open whist the single whister plays the passer's cards too. */
export function controllerOf(state: DealState, seat: Seat): Seat {
  const whist = state.whist;
  if (state.phase === 'play' && state.mode === 'game' && state.openHands && whist && whist.whisters.length === 1 && seat !== state.declarer) {
    return whist.whisters[0];
  }
  return seat;
}

/** May `viewer` see the cards of `owner`? Own hand; open defenders' hands; everything after the deal. */
export function isHandVisible(state: DealState, owner: Seat, viewer: Seat): boolean {
  if (owner === viewer || state.phase === 'done') return true;
  return state.openHands && owner !== state.declarer;
}

/** Cards that left every hand: played tricks, the current trick, the discard and an all-pass talon. */
export function cardsOutOfHands(state: DealState): CardSet {
  return withoutSet(0xffffffff, unionOf(unionOf(state.hands[0], state.hands[1]), state.hands[2]));
}
// END 7

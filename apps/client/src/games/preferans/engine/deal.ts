// =====================================================================
// FILE: apps/client/src/games/preferans/engine/deal.ts
// PURPOSE: one deal (раздача) as a pure state machine: newDeal → legalActions / applyAction → … → result.
//   Phases: bidding → (misereShare) → discard → declare → whist → (whistReturn) → (whistMode) → (dealerWhist) → play → done.
//   All-pass goes from bidding straight to play; misère skips declare and whist; misère without the talon also
//   skips the discard. The bracketed phases belong to table options (rules.ts).
//   The state is plain data (numbers and arrays): it can be stored, replayed and posted to a Web Worker.
// SECTIONS: 1 types; 2 new deal; 3 legal actions; 4 apply action; 5 play; 6 finishing; 7 views.
// =====================================================================
import { applyCall, biddingResult, canPassDark, legalBids, startBidding, type BidCall, type BiddingState } from './bidding.ts';
import {
  HIGHEST_BID, MISERE, MISERE_NO_TALON, NO_TRUMP, contractOf, darkLevel, gameBid, isDarkBid, isMisereBid, trumpOf,
  type Bid, type Contract,
} from './bids.ts';
import {
  EMPTY_SET, FULL_DECK, cardsOf, hasCard, rankOf, removeCard, setOf, suitOf, unionOf, withoutSet,
  type Card, type CardSet, type Suit,
} from './cards.ts';
import { legalCards, nextSeat, otherSeats, trickWinnerIndex, type PlayedCard, type Seat } from './play.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { shuffled, type Random } from '../../../shared/engine/random.ts';
import { SOCHI, type RuleSet } from './rules.ts';
import {
  scaleScore, scoreConcession, scoreGame, scoreMisere, scoreRaspasy, talonQuickTricks, withTalonPremium, type DealScore,
} from './scoring.ts';

// BEGIN 1. Types
export type Phase = 'bidding' | 'misereShare' | 'discard' | 'declare' | 'whist' | 'whistReturn' | 'whistMode' | 'dealerWhist' | 'play' | 'done';
export type Mode = 'game' | 'misere' | 'raspasy';
export type WhistCall = 'whist' | 'pass' | 'half';

export interface WhistState {
  /** Defenders in the order they decide: the declarer's left neighbour first. */
  readonly order: readonly [Seat, Seat];
  readonly calls: readonly (WhistCall | null)[];
  /** Final whisters in the order they said «вист» (both defenders on a checked ten). */
  readonly whisters: readonly Seat[];
  readonly halfWhister: Seat | null;
  /** Four at the table, both defenders passed: whose hand the dealer looked at (rules.dealerWhists). */
  readonly dealerLook?: Seat | null;
  /** The defender's seat whose cards the dealer plays as the whister. */
  readonly dealerSeat?: Seat | null;
}

export interface CompletedTrick {
  readonly cards: readonly PlayedCard[];
  /** All-pass: the talon card that set the suit of this trick. */
  readonly lead: Card | null;
  /** Who took it; null = the talon itself, the dealer's hand at a table of four (rules.talonTakesTricks). */
  readonly winner: Seat | null;
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
  /** Tricks the talon took for the dealer at a table of four (all-pass); absent or 0 otherwise. */
  readonly talonTricks?: number;
  /** Everybody passed at a table of two: no all-pass, the cards are dealt again (nothing is written). */
  readonly redeal?: boolean;
  /** The game was won with a dark bid (its score is doubled). */
  readonly dark?: boolean;
  /** Everything this deal wrote was multiplied by this (dark ×2, bombs ×2/×4/×8); absent = 1. */
  readonly multiplier?: number;
  /** All-pass: who passed in the dark (they get a bomb where the table plays bombs). */
  readonly darkPassers?: readonly Seat[];
  /** Misère without the talon. */
  readonly noTalon?: boolean;
  /** Four at the table: the misère declarer shared it with the dealer. */
  readonly misereShared?: boolean;
  /** Four at the table: the dealer whisted with the cards of this defender. */
  readonly dealerSeat?: Seat;
  /** Paid talon: the whists the declarer paid for quick tricks in the talon (already in the score). */
  readonly talonPremium?: number;
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
  /** Tricks the talon took for the dealer who sits out (four at the table, all-pass); 0 otherwise. */
  readonly talonTricks: number;
  readonly result: DealResult | null;
  /** Bombs of every seat at the start of the deal (rules.bombs); absent = none. */
  readonly bombs?: readonly number[];
  /** Four at the table: the misère declarer called the dealer to share it. */
  readonly misereShared?: boolean;
}

export type Action =
  | { readonly type: 'bid'; readonly seat: Seat; readonly bid: Bid }
  /** `dark`: a pass in the dark («пас втёмную»), only as the first word at a table with dark calls. */
  | { readonly type: 'pass'; readonly seat: Seat; readonly dark?: boolean }
  /** Four at the table: the misère declarer shares it with the dealer (or plays alone). */
  | { readonly type: 'shareMisere'; readonly seat: Seat; readonly share: boolean }
  | { readonly type: 'discard'; readonly seat: Seat; readonly cards: readonly [Card, Card] }
  | { readonly type: 'declare'; readonly seat: Seat; readonly bid: Bid }
  /** Instead of naming a game: concede a hopeless one (only when the table allows it). */
  | { readonly type: 'concede'; readonly seat: Seat }
  | { readonly type: 'whist'; readonly seat: Seat; readonly call: WhistCall }
  | { readonly type: 'returnWhist'; readonly seat: Seat; readonly accept: boolean }
  | { readonly type: 'whistMode'; readonly seat: Seat; readonly open: boolean }
  /** A lone whister on six or seven takes half-whist instead of playing (rules.whistPassHalf). */
  | { readonly type: 'takeHalf'; readonly seat: Seat }
  /** Four at the table, both defenders passed: the dealer looks at this defender's hand (`seat` is only the turn holder). */
  | { readonly type: 'dealerLook'; readonly seat: Seat; readonly defender: Seat }
  /** …and whists with it, or lets the game count. */
  | { readonly type: 'dealerWhist'; readonly seat: Seat; readonly whist: boolean }
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
  /** Bombs of every deal seat (rules.bombs). */
  readonly bombs?: readonly number[];
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
  return withDummy({
    rules, dealer, firstHand, raspasyRound: options.raspasyRound ?? 0,
    dealt: hands, talon: [deck[30], deck[31]], hands,
    phase: 'bidding', turn: firstHand, bidding: startBidding(firstHand),
    mode: null, declarer: null, winningBid: null, contract: null, trump: null, discards: [],
    whist: null, openHands: false, trick: [], trickLead: null, tricks: [], tricksWon: [0, 0, 0], talonTricks: 0, result: null,
    bombs: options.bombs ? [0, 1, 2].map(index => Math.max(0, Math.min(3, Math.floor(options.bombs?.[index] ?? 0)))) : [0, 0, 0],
  });
}

/**
 * Two at the table: the dummy («болван») never thinks — it passes in the auction and in the whist round and never
 * takes back a half-whist; its cards are played by the defender (controllerOf).
 */
function withDummy(state: DealState): DealState {
  const dummy = state.rules.dummySeat;
  let current = state;
  for (let guard = 0; dummy !== null && current.turn === dummy && guard < 4; guard += 1) {
    if (current.phase === 'bidding') current = applyActionRaw(current, { type: 'pass', seat: dummy });
    else if (current.phase === 'whist') {
      // [EN] A dummy passes; only where the table forbids passing (Stalingrad) it whists, and its keeper plays it.
      // [RU] Болван пасует; только там, где пас запрещён (сталинград), он вистует, и играет за него хранитель.
      const pass = legalActions(current).some(action => action.type === 'whist' && action.call === 'pass');
      current = applyActionRaw(current, { type: 'whist', seat: dummy, call: pass ? 'pass' : 'whist' });
    }
    else if (current.phase === 'whistReturn') current = applyActionRaw(current, { type: 'returnWhist', seat: dummy, accept: false });
    else break;
  }
  return current;
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
    case 'bidding': {
      const passes: Action[] = [{ type: 'pass', seat }];
      if (canPassDark(state.bidding, state.rules)) passes.push({ type: 'pass', seat, dark: true });
      return [...passes, ...legalBids(state.bidding, state.rules).map(bid => ({ type: 'bid', seat, bid }) as const)];
    }
    case 'misereShare':
      return [{ type: 'shareMisere', seat, share: true }, { type: 'shareMisere', seat, share: false }];
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
      // [EN] A dark level is named without a suit: any game of that level or higher. [RU] Тёмный уровень назван без масти: любая игра этого уровня и выше.
      const won = state.winningBid ?? 0;
      const from = isDarkBid(won) ? gameBid(darkLevel(won), 0) : won;
      for (let bid = from; bid <= HIGHEST_BID; bid += 1) if (bid !== MISERE) actions.push({ type: 'declare', seat, bid });
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
    case 'whistMode': {
      const actions: Action[] = [{ type: 'whistMode', seat, open: true }, { type: 'whistMode', seat, open: false }];
      if (state.rules.whistPassHalf && state.rules.halfWhistLevels.includes(whistLevel(state) as 6 | 7)) actions.push({ type: 'takeHalf', seat });
      return actions;
    }
    case 'dealerWhist': {
      const whist = state.whist;
      if (!whist) return [];
      if (whist.dealerLook === null || whist.dealerLook === undefined) {
        return [
          { type: 'dealerLook', seat, defender: whist.order[0] }, { type: 'dealerLook', seat, defender: whist.order[1] },
          { type: 'dealerWhist', seat, whist: false },
        ];
      }
      return [{ type: 'dealerWhist', seat, whist: true }, { type: 'dealerWhist', seat, whist: false }];
    }
    case 'play':
      return legalPlays(state).map(card => ({ type: 'play', seat, card }) as const);
    default:
      return [];
  }
}
// END 3

// BEGIN 4. Apply action
export function applyAction(state: DealState, action: Action): DealState {
  return withDummy(applyActionRaw(state, action));
}

function applyActionRaw(state: DealState, action: Action): DealState {
  if (state.turn === null) throw new Error('The deal is over');
  if (action.seat !== state.turn) throw new Error(`It is seat ${state.turn}'s turn, not ${action.seat}'s`);
  switch (action.type) {
    case 'bid':
    case 'pass': {
      if (state.phase !== 'bidding') throw new Error('Not bidding now');
      const call: BidCall = action.type === 'pass'
        ? { seat: action.seat, call: 'pass', ...(action.dark ? { dark: true } : {}) }
        : { seat: action.seat, call: 'bid', bid: action.bid };
      const bidding = applyCall(state.bidding, call, state.rules);
      const outcome = biddingResult(bidding);
      if (outcome === null) return { ...state, bidding, turn: bidding.turn };
      if (outcome.kind === 'raspasy' && state.rules.allPassRedeal) return redeal({ ...state, bidding });
      if (outcome.kind === 'raspasy') return startPlay({ ...state, bidding, mode: 'raspasy', trump: null });
      const won: DealState = { ...state, bidding, declarer: outcome.seat, winningBid: outcome.bid };
      // [EN] Four at the table the misère declarer may first call the dealer to share it. [RU] Вчетвером играющий мизер может сначала позвать сдающего пополам.
      if (isMisereBid(outcome.bid) && state.rules.misereHalves) return { ...won, phase: 'misereShare', turn: outcome.seat };
      return afterAuction(won);
    }
    case 'shareMisere': {
      if (state.phase !== 'misereShare') throw new Error('Not deciding on sharing the misère now');
      return afterAuction({ ...state, misereShared: action.share });
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
      if (!legalActions(state).some(legal => legal.type === 'declare' && legal.bid === action.bid)) {
        throw new Error('The final game must be at least the winning bid and not misère');
      }
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
    case 'takeHalf': {
      const whist = state.whist;
      if (state.phase !== 'whistMode' || !whist || !legalActions(state).some(legal => legal.type === 'takeHalf')) throw new Error('Half-whist is not possible now');
      return finish({ ...state, whist: { ...whist, whisters: [], halfWhister: action.seat } }, false);
    }
    case 'dealerLook': {
      const whist = state.whist;
      if (state.phase !== 'dealerWhist' || !whist || !whist.order.includes(action.defender) || (whist.dealerLook ?? null) !== null) {
        throw new Error('The dealer cannot look at that hand now');
      }
      return { ...state, whist: { ...whist, dealerLook: action.defender } };
    }
    case 'dealerWhist': {
      const whist = state.whist;
      if (state.phase !== 'dealerWhist' || !whist) throw new Error('The dealer has nothing to decide now');
      if (!action.whist) return finish({ ...state, whist: { ...whist, dealerLook: null } }, false);
      const seat = whist.dealerLook;
      if (seat === null || seat === undefined) throw new Error('The dealer whists only with a hand he looked at');
      return startPlay({ ...state, whist: { ...whist, whisters: [seat], dealerSeat: seat } });
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
  // [EN] Two at the table the whist is always open: the defender plays his hand and the dummy's.
  // [RU] Вдвоём вист всегда в светлую: защитник играет свою руку и руку болвана.
  const alone = (whister: Seat): DealState => (state.rules.dummySeat !== null
    ? startPlay({ ...state, openHands: true, whist: { ...whist, calls, whisters: [whister] } })
    : { ...state, phase: 'whistMode', turn: whister, whist: { ...whist, calls, whisters: [whister] } });
  if (firstCall === 'whist') return alone(first);
  if (call === 'whist') return alone(second);
  if (call === 'half') return { ...state, phase: 'whistReturn', turn: first, whist: { ...whist, calls } };
  // [EN] Both passed. Four at the table the dealer may now whist with one of their hands. [RU] Оба спасовали. Вчетвером сдающий может вистовать рукой одного из них.
  if (state.rules.dealerWhists) return { ...state, phase: 'dealerWhist', turn: first, whist: { ...whist, calls, dealerLook: null } };
  return finish({ ...state, whist: { ...whist, calls } }, false);
}

/** The auction is won: misère without the talon is played at once; otherwise the declarer takes the talon. */
function afterAuction(state: DealState): DealState {
  const declarer = state.declarer as Seat;
  if (state.winningBid === MISERE_NO_TALON) {
    return startPlay({ ...state, contract: { kind: 'misere', noTalon: true }, mode: 'misere', trump: null, turn: state.firstHand });
  }
  const hands = state.hands.slice();
  hands[declarer] = unionOf(hands[declarer], setOf(state.talon));
  return { ...state, hands, phase: 'discard', turn: declarer };
}
// END 4

// BEGIN 5. Play
function startPlay(state: DealState): DealState {
  const talonLead = state.mode === 'raspasy' && state.rules.raspasyTalonLeads ? state.talon[0] : null;
  return { ...state, phase: 'play', turn: state.firstHand, trick: [], trickLead: talonLead, tricks: [], tricksWon: [0, 0, 0], talonTricks: 0 };
}

/**
 * Who takes a finished trick. A talon card leading an all-pass trick only sets the suit (three at the table); at a
 * table of four it is the dealer's card, and if nobody plays a higher card of its suit the talon takes the trick
 * (null). Nobody followed a talon-led trick at a table of three: the first player to play takes it (our rule).
 */
function trickTaker(state: DealState, trick: readonly PlayedCard[]): Seat | null {
  const lead = state.trickLead;
  const ledSuit = lead !== null ? suitOf(lead) : suitOf(trick[0].card);
  const index = trickWinnerIndex(trick.map(played => played.card), ledSuit, state.trump);
  if (lead !== null && state.rules.talonTakesTricks) {
    const best = index === -1 ? null : trick[index].card;
    return best !== null && suitOf(best) === ledSuit && rankOf(best) > rankOf(lead) ? trick[index].seat : null;
  }
  return trick[index === -1 ? 0 : index].seat;
}

function applyPlay(state: DealState, seat: Seat, card: Card): DealState {
  if (state.phase !== 'play') throw new Error('Not playing cards now');
  const legal = legalCards(state.hands[seat], ledSuitOf(state), state.trump);
  if (!hasCard(legal, card)) throw new Error(`Illegal card ${card} for seat ${seat}`);
  const hands = state.hands.slice();
  hands[seat] = removeCard(hands[seat], card);
  const trick = [...state.trick, { seat, card }];
  if (trick.length < 3) return { ...state, hands, trick, turn: nextSeat(seat) };

  const winner = trickTaker(state, trick);
  const tricksWon = state.tricksWon.slice();
  if (winner !== null) tricksWon[winner] += 1;
  const talonTricks = state.talonTricks + (winner === null ? 1 : 0);
  const tricks = [...state.tricks, { cards: trick, lead: state.trickLead, winner }];
  const openHands = state.openHands || state.mode === 'misere';
  const next = { ...state, hands, trick: [], tricks, tricksWon, talonTricks, openHands };
  if (tricks.length === 10) return finish(next, true);
  if (state.mode === 'raspasy' && state.rules.raspasyTalonLeads && tricks.length < 3) {
    // The second talon card leads the second trick; the first hand leads the third.
    return { ...next, turn: state.firstHand, trickLead: tricks.length === 1 ? state.talon[1] : null };
  }
  return { ...next, turn: winner ?? state.firstHand, trickLead: null };
}
// END 5

// BEGIN 6. Finishing
/**
 * What multiplies everything a deal writes (Classic): a game won with a dark bid ×2; the declarer's bombs ×2 each
 * (at most three: ×8); an all-pass with a dark pass ×2.
 */
export function stakesOf(state: DealState, mode: Mode): number {
  if (mode === 'raspasy') return state.rules.darkBids && (state.bidding.darkPass ?? []).some(Boolean) ? 2 : 1;
  let factor = isDarkBid(state.winningBid) ? 2 : 1;
  if (state.rules.bombs && state.declarer !== null) factor *= 2 ** Math.min(3, state.bombs?.[state.declarer] ?? 0);
  return factor;
}

function finish(state: DealState, played: boolean): DealState {
  const mode = state.mode ?? 'game';
  let score: DealScore;
  let premium = 0;
  if (mode === 'raspasy') score = scoreRaspasy(state.tricksWon, state.raspasyRound, state.rules);
  else if (mode === 'misere') score = scoreMisere(state.declarer as Seat, state.tricksWon, state.rules);
  else {
    const contract = state.contract;
    if (!contract || contract.kind !== 'game' || state.declarer === null) throw new Error('A game deal needs a declarer and a contract');
    score = scoreGame({
      declarer: state.declarer, level: contract.level, tricks: state.tricksWon, played,
      whisters: state.whist?.whisters ?? [], halfWhister: state.whist?.halfWhister ?? null,
    }, state.rules);
    // [EN] Paid talon: the declarer pays for the quick tricks he found. [RU] Платный прикуп: играющий платит за найденные быстрые взятки.
    if (state.rules.paidTalon) {
      premium = talonQuickTricks(state.talon) * state.rules.gameValue[contract.level] * state.rules.whistScale;
      if (premium > 0) score = withTalonPremium(score, state.declarer, premium);
    }
  }
  const multiplier = stakesOf(state, mode);
  if (multiplier !== 1) score = scaleScore(score, multiplier);
  const darkPassers = ([0, 1, 2] as Seat[]).filter(seat => state.bidding.darkPass?.[seat]);
  const result: DealResult = {
    mode, declarer: state.declarer, contract: state.contract, played, tricksWon: state.tricksWon,
    whisters: state.whist?.whisters ?? [], halfWhister: state.whist?.halfWhister ?? null, score,
    ...(state.talonTricks > 0 ? { talonTricks: state.talonTricks } : {}),
    ...(mode !== 'raspasy' && isDarkBid(state.winningBid) ? { dark: true } : {}),
    ...(multiplier !== 1 ? { multiplier } : {}),
    ...(mode === 'raspasy' && darkPassers.length > 0 ? { darkPassers } : {}),
    ...(state.contract?.kind === 'misere' && state.contract.noTalon ? { noTalon: true } : {}),
    ...(state.misereShared ? { misereShared: true } : {}),
    ...(state.whist?.dealerSeat !== null && state.whist?.dealerSeat !== undefined ? { dealerSeat: state.whist.dealerSeat } : {}),
    ...(premium > 0 ? { talonPremium: premium * multiplier } : {}),
  };
  return { ...state, phase: 'done', turn: null, result };
}

/** Two at the table, everybody passed: nothing is played or written; the next deal comes. */
function redeal(state: DealState): DealState {
  const zero = { pool: [0, 0, 0], mountain: [0, 0, 0], whists: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] };
  const result: DealResult = {
    mode: 'raspasy', declarer: null, contract: null, played: false, tricksWon: [0, 0, 0], whisters: [], halfWhister: null,
    redeal: true, score: zero,
  };
  return { ...state, mode: 'raspasy', phase: 'done', turn: null, result };
}

/** The declarer gives up a hopeless game before the whist: a fixed penalty, no play, nobody writes whists. */
function concede(state: DealState, declarer: Seat, winningBid: Bid): DealState {
  // [EN] A dark level concedes as that level without trumps. [RU] Тёмный уровень уходит как этот уровень без козыря.
  const contract = isDarkBid(winningBid) ? { kind: 'game', level: darkLevel(winningBid), strain: NO_TRUMP } as const : contractOf(winningBid);
  if (contract.kind !== 'game') throw new Error('A misère cannot be conceded');
  const tricks = state.rules.concedeTricks;
  const multiplier = stakesOf(state, 'game');
  const result: DealResult = {
    mode: 'game', declarer, contract, played: false, tricksWon: [0, 0, 0], whisters: [], halfWhister: null,
    conceded: tricks, score: scaleScore(scoreConcession(declarer, contract.level, tricks, state.rules), multiplier),
    ...(isDarkBid(state.winningBid) ? { dark: true } : {}),
    ...(multiplier !== 1 ? { multiplier } : {}),
  };
  return { ...state, mode: 'game', contract, trump: trumpOf(contract), phase: 'done', turn: null, result };
}
// END 6

// BEGIN 7. Views
/**
 * Does the dealer sitting on the talon decide now (four at the table, rules.dealerWhists)? He answers the offer to
 * whist and then plays the cards of the defender whose hand he took. The UI and the bots route this turn to him.
 */
export function dealerDecides(state: DealState): boolean {
  if (state.phase === 'dealerWhist') return true;
  const seat = state.whist?.dealerSeat;
  return state.phase === 'play' && seat !== null && seat !== undefined && state.turn === seat;
}

/** The live defender who plays the dummy's cards (two at the table), or null. */
function dummyKeeper(state: DealState): Seat | null {
  const dummy = state.rules.dummySeat;
  if (dummy === null || state.declarer === null || state.declarer === dummy) return null;
  return otherSeats(state.declarer).find(seat => seat !== dummy) ?? null;
}

/** Who decides for a seat: in open whist the single whister plays the passer's cards too; two at the table the
 *  defender plays the dummy's cards in every game. */
export function controllerOf(state: DealState, seat: Seat): Seat {
  if (state.phase === 'play' && seat === state.rules.dummySeat) return dummyKeeper(state) ?? seat;
  const whist = state.whist;
  if (state.phase === 'play' && state.mode === 'game' && state.openHands && whist && whist.whisters.length === 1 && seat !== state.declarer) {
    return whist.whisters[0];
  }
  return seat;
}

/** May `viewer` see the cards of `owner`? Own hand; open defenders' hands; the dummy's hand to the defender who
 *  plays it; everything after the deal. */
export function isHandVisible(state: DealState, owner: Seat, viewer: Seat): boolean {
  if (owner === viewer || state.phase === 'done') return true;
  if (state.phase === 'play' && owner === state.rules.dummySeat && viewer === dummyKeeper(state)) return true;
  return state.openHands && owner !== state.declarer;
}

/** Cards that left every hand: played tricks, the current trick, the discard and an all-pass talon. */
export function cardsOutOfHands(state: DealState): CardSet {
  return withoutSet(0xffffffff, unionOf(unionOf(state.hands[0], state.hands[1]), state.hands[2]));
}
// END 7

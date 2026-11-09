// =====================================================================
// FILE: apps/client/src/games/preferans/engine/bidding.ts
// PURPOSE: the auction (торговля), Sochi rules:
//   - the first hand (left of the dealer) speaks first, then clockwise; a player who passed is out;
//   - every bid is higher than the current one, but a senior hand may hold an equal bid of a junior («здесь»);
//   - misère only as a player's first bid; a player who bid misère can only pass afterwards (or, where the table
//     allows it, raise to misère without the talon);
//   - dark calls (Classic, a table option): as the first call, before looking at the cards, a player may pass in the
//     dark («пас втёмную») or bid a level in the dark; a dark bidder can only raise in the dark afterwards;
//   - the auction ends when two players have passed: the third one wins it, or nobody did — all-pass (распасы).
// SECTIONS: 1 state; 2 seniority; 3 legal bids; 4 calls; 5 result.
// =====================================================================
import {
  DARK_BIDS, HIGHEST_BID, MISERE, MISERE_NO_TALON, bidRank, isDarkBid, isHigherBid, isMisereBid, type Bid,
} from './bids.ts';
import { nextSeat, type Seat } from './play.ts';
import type { RuleSet } from './rules.ts';

// BEGIN 1. State
export type BidCall =
  | { readonly seat: Seat; readonly call: 'pass'; readonly dark?: boolean }
  | { readonly seat: Seat; readonly call: 'bid'; readonly bid: Bid };
export interface BiddingState {
  /** Left of the dealer: speaks first and is the most senior hand. */
  readonly firstHand: Seat;
  /** Who speaks now; null when the auction is over. */
  readonly turn: Seat | null;
  readonly passed: readonly boolean[];
  /** Last bid of every player; null = has not bid yet. */
  readonly lastBid: readonly (Bid | null)[];
  readonly highest: Bid | null;
  readonly holder: Seat | null;
  readonly history: readonly BidCall[];
  /** Who passed in the dark («пас втёмную»); absent in games saved before dark calls existed. */
  readonly darkPass?: readonly boolean[];
}

export function startBidding(firstHand: Seat): BiddingState {
  return {
    firstHand, turn: firstHand, passed: [false, false, false], lastBid: [null, null, null], highest: null, holder: null, history: [],
    darkPass: [false, false, false],
  };
}

/** Has this seat said anything yet? Dark calls are only possible before the first word. */
export const isFirstCall = (state: BiddingState, seat: Seat): boolean => state.history.every(call => call.seat !== seat);
// END 1

// BEGIN 2. Seniority: 0 = first hand (most senior), 2 = dealer
export const seniority = (seat: Seat, firstHand: Seat): number => (seat - firstHand + 3) % 3;
// END 2

// BEGIN 3. Legal bids of the player to speak (passing is always allowed), lowest first
export function legalBids(state: BiddingState, rules: RuleSet): Bid[] {
  const seat = state.turn;
  if (seat === null) return [];
  const own = state.lastBid[seat];
  const above = (bid: Bid) => isHigherBid(bid, state.highest);
  // A misère bidder cannot switch to a game; the table may let him raise to misère without the talon.
  if (own === MISERE) return rules.misereNoTalon && above(MISERE_NO_TALON) ? [MISERE_NO_TALON] : [];
  if (own === MISERE_NO_TALON) return [];
  // A dark bidder still has not looked at the cards: he can only raise in the dark.
  if (own !== null && isDarkBid(own)) return rules.darkBids ? DARK_BIDS.filter(above) : [];
  const firstBid = own === null;
  const highest = state.highest;
  const canHold = rules.seniorHold && highest !== null && !isMisereBid(highest) && !isDarkBid(highest) && state.holder !== null &&
    state.holder !== seat && seniority(seat, state.firstHand) < seniority(state.holder, state.firstHand);
  const bids: Bid[] = [];
  for (let bid = 0; bid <= HIGHEST_BID; bid += 1) {
    if (bid === MISERE) {
      if (firstBid && above(MISERE)) bids.push(MISERE);
      continue;
    }
    if (above(bid) || (canHold && bid === highest)) bids.push(bid);
  }
  if (rules.misereNoTalon && firstBid && above(MISERE_NO_TALON)) bids.push(MISERE_NO_TALON);
  if (rules.darkBids && isFirstCall(state, seat)) bids.push(...DARK_BIDS.filter(above));
  return bids.sort((a, b) => bidRank(a) - bidRank(b));
}

/** May the player to speak pass in the dark? Only as the first word, at a table with dark calls. */
export const canPassDark = (state: BiddingState, rules: RuleSet): boolean =>
  rules.darkBids && state.turn !== null && isFirstCall(state, state.turn);
// END 3

// BEGIN 4. Calls
export function applyCall(state: BiddingState, call: BidCall, rules: RuleSet): BiddingState {
  if (state.turn === null) throw new Error('The auction is over');
  if (call.seat !== state.turn) throw new Error(`Not seat ${call.seat}'s turn to bid`);
  const passed = state.passed.slice();
  const lastBid = state.lastBid.slice();
  const darkPass = (state.darkPass ?? [false, false, false]).slice();
  let { highest, holder } = state;
  if (call.call === 'pass') {
    if (call.dark) {
      if (!canPassDark(state, rules)) throw new Error('A dark pass is only possible as the first word at a table with dark calls');
      darkPass[call.seat] = true;
    }
    passed[call.seat] = true;
  } else {
    if (!legalBids(state, rules).includes(call.bid)) throw new Error(`Illegal bid ${call.bid} for seat ${call.seat}`);
    lastBid[call.seat] = call.bid;
    highest = call.bid;
    holder = call.seat;
  }
  const history = [...state.history, call];
  const passes = passed.filter(Boolean).length;
  let turn: Seat | null = null;
  // Over when all three passed, or two passed and the third one holds a bid.
  const over = passes === 3 || (passes === 2 && holder !== null);
  if (!over) {
    let seat = nextSeat(call.seat);
    while (passed[seat]) seat = nextSeat(seat);
    turn = seat;
  }
  return { ...state, turn, passed, lastBid, highest, holder, history, darkPass };
}
// END 4

// BEGIN 5. Result
export type BiddingResult = { readonly kind: 'raspasy' } | { readonly kind: 'won'; readonly seat: Seat; readonly bid: Bid };
export function biddingResult(state: BiddingState): BiddingResult | null {
  if (state.turn !== null) return null;
  if (state.holder === null || state.highest === null) return { kind: 'raspasy' };
  return { kind: 'won', seat: state.holder, bid: state.highest };
}
// END 5

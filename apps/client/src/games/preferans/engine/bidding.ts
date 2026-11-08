// =====================================================================
// FILE: apps/client/src/games/preferans/engine/bidding.ts
// PURPOSE: the auction (торговля), Sochi rules:
//   - the first hand (left of the dealer) speaks first, then clockwise; a player who passed is out;
//   - every bid is higher than the current one, but a senior hand may hold an equal bid of a junior («здесь»);
//   - misère only as a player's first bid; a player who bid misère can only pass afterwards;
//   - the auction ends when two players have passed: the third one wins it, or nobody did — all-pass (распасы).
// SECTIONS: 1 state; 2 seniority; 3 legal bids; 4 calls; 5 result.
// =====================================================================
import { HIGHEST_BID, MISERE, type Bid } from './bids.ts';
import { nextSeat, type Seat } from './play.ts';
import type { RuleSet } from './rules.ts';

// BEGIN 1. State
export type BidCall = { readonly seat: Seat; readonly call: 'pass' } | { readonly seat: Seat; readonly call: 'bid'; readonly bid: Bid };
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
}

export function startBidding(firstHand: Seat): BiddingState {
  return { firstHand, turn: firstHand, passed: [false, false, false], lastBid: [null, null, null], highest: null, holder: null, history: [] };
}
// END 1

// BEGIN 2. Seniority: 0 = first hand (most senior), 2 = dealer
export const seniority = (seat: Seat, firstHand: Seat): number => (seat - firstHand + 3) % 3;
// END 2

// BEGIN 3. Legal bids of the player to speak (passing is always allowed)
export function legalBids(state: BiddingState, rules: RuleSet): Bid[] {
  const seat = state.turn;
  if (seat === null) return [];
  if (state.lastBid[seat] === MISERE) return []; // a misère bidder cannot switch to a game
  const bids: Bid[] = [];
  const firstBid = state.lastBid[seat] === null;
  const canHold = rules.seniorHold && state.highest !== null && state.highest !== MISERE && state.holder !== null &&
    state.holder !== seat && seniority(seat, state.firstHand) < seniority(state.holder, state.firstHand);
  const lowest = state.highest === null ? 0 : canHold ? state.highest : state.highest + 1;
  for (let bid = lowest; bid <= HIGHEST_BID; bid += 1) {
    if (bid === MISERE && !firstBid) continue;
    if (bid === MISERE && state.highest === MISERE) continue;
    bids.push(bid);
  }
  return bids;
}
// END 3

// BEGIN 4. Calls
export function applyCall(state: BiddingState, call: BidCall, rules: RuleSet): BiddingState {
  if (state.turn === null) throw new Error('The auction is over');
  if (call.seat !== state.turn) throw new Error(`Not seat ${call.seat}'s turn to bid`);
  const passed = state.passed.slice();
  const lastBid = state.lastBid.slice();
  let { highest, holder } = state;
  if (call.call === 'pass') {
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
  return { ...state, turn, passed, lastBid, highest, holder, history };
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

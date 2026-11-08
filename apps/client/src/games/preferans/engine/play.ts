// =====================================================================
// FILE: apps/client/src/games/preferans/engine/play.ts
// PURPOSE: trick-taking rules shared by the deal state machine, the bots and the solver.
// SECTIONS: 1 seats; 2 legal cards; 3 trick winner.
// =====================================================================
import { type Card, type CardSet, type Suit, rankOf, suitOf, suitSet } from './cards.ts';

// BEGIN 1. Seats
/** Three players around the table, clockwise. */
export type Seat = 0 | 1 | 2;
export const SEATS: readonly Seat[] = [0, 1, 2];
export const nextSeat = (seat: Seat): Seat => ((seat + 1) % 3) as Seat;
export const otherSeats = (seat: Seat): [Seat, Seat] => [nextSeat(seat), nextSeat(nextSeat(seat))];
export interface PlayedCard { readonly seat: Seat; readonly card: Card }
// END 1

// BEGIN 2. Legal cards
/**
 * Cards a player may play: follow the led suit; with none of it, play a trump; with neither, any card.
 * `ledSuit` null = this player leads. `trump` null = no trumps (no-trump game, misère, all-pass).
 */
export function legalCards(hand: CardSet, ledSuit: Suit | null, trump: Suit | null): CardSet {
  if (ledSuit === null) return hand;
  const follow = suitSet(hand, ledSuit);
  if (follow !== 0) return follow;
  if (trump !== null) {
    const trumps = suitSet(hand, trump);
    if (trumps !== 0) return trumps;
  }
  return hand;
}
// END 2

// BEGIN 3. Trick winner
/**
 * Index (in `cards`) of the winning card: the highest trump, otherwise the highest card of the led suit.
 * Returns -1 when no card follows the led suit and none is a trump — possible only when the led card is not
 * in `cards` (a talon card leading an all-pass trick).
 */
export function trickWinnerIndex(cards: readonly Card[], ledSuit: Suit, trump: Suit | null): number {
  let best = -1;
  let bestTrump = false;
  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    const isTrump = trump !== null && suitOf(card) === trump;
    if (isTrump) {
      if (!bestTrump || rankOf(card) > rankOf(cards[best])) { best = i; bestTrump = true; }
    } else if (!bestTrump && suitOf(card) === ledSuit) {
      if (best === -1 || rankOf(card) > rankOf(cards[best])) best = i;
    }
  }
  return best;
}
// END 3

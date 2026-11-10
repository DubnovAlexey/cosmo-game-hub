// =====================================================================
// FILE: apps/client/src/games/poker/engine/evaluate.ts
// PURPOSE: the best five-card hand out of five, six or seven cards, as one number that compares directly:
//   category << 20 | five ranks of 4 bits, highest first (pair of aces with K Q 9 kickers = 1|12|11|10|7|0).
//   No combinations are enumerated: rank counts, suit masks and a 13-bit rank mask give the category at once, so
//   the bots can evaluate millions of hands in their Monte Carlo runs. Our own code instead of a library: checked
//   against the exact counts of all 2 598 960 five-card hands (tests/evaluate.test.ts).
// SECTIONS: 1 categories; 2 helpers; 3 evaluate; 4 describe and best five.
// =====================================================================
import { rankOf, suitOf, type Card, type Rank } from './cards.ts';

// BEGIN 1. Categories
export const HIGH_CARD = 0;
export const PAIR = 1;
export const TWO_PAIR = 2;
export const TRIPS = 3;
export const STRAIGHT = 4;
export const FLUSH = 5;
export const FULL_HOUSE = 6;
export const QUADS = 7;
export const STRAIGHT_FLUSH = 8;
export type Category = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
/** Higher wins; equal values split the pot. */
export type HandValue = number;
// END 1

// BEGIN 2. Helpers
const pack = (category: Category, r0 = 0, r1 = 0, r2 = 0, r3 = 0, r4 = 0): HandValue =>
  (category << 20) | (r0 << 16) | (r1 << 12) | (r2 << 8) | (r3 << 4) | r4;
const WHEEL = (1 << 12) | 0b1111;
/** The top rank of the highest straight in a 13-bit mask, or −1; the wheel A-2-3-4-5 tops at the five (3). */
function straightTop(mask: number): number {
  for (let top = 12; top >= 4; top -= 1) {
    const run = 0b11111 << (top - 4);
    if ((mask & run) === run) return top;
  }
  return (mask & WHEEL) === WHEEL ? 3 : -1;
}
/** The highest `count` ranks of a mask, leaving out up to two ranks. */
function kickers(mask: number, count: number, skipA = -1, skipB = -1): number[] {
  const out: number[] = [];
  for (let rank = 12; rank >= 0 && out.length < count; rank -= 1) {
    if (rank !== skipA && rank !== skipB && (mask & (1 << rank)) !== 0) out.push(rank);
  }
  return out;
}
// [EN] Scratch space reused by every call (one thread per worker): no allocation in the hot loop.
// [RU] Черновик, общий для всех вызовов (в каждом воркере один поток): ни одного выделения памяти в горячем цикле.
const counts = new Uint8Array(13);
const suitMasks = new Uint16Array(4);
const suitCounts = new Uint8Array(4);
// END 2

// BEGIN 3. Evaluate
export function evaluate(cards: readonly Card[]): HandValue {
  counts.fill(0);
  suitMasks.fill(0);
  suitCounts.fill(0);
  let rankMask = 0;
  for (let i = 0; i < cards.length; i += 1) {
    const rank = rankOf(cards[i]);
    const suit = suitOf(cards[i]);
    counts[rank] += 1;
    suitMasks[suit] |= 1 << rank;
    suitCounts[suit] += 1;
    rankMask |= 1 << rank;
  }
  let flushSuit = -1;
  for (let suit = 0; suit < 4; suit += 1) {
    if (suitCounts[suit] < 5) continue;
    const top = straightTop(suitMasks[suit]);
    if (top >= 0) return pack(STRAIGHT_FLUSH, top);
    flushSuit = suit;
  }
  let quad = -1;
  let trips1 = -1;
  let trips2 = -1;
  let pair1 = -1;
  let pair2 = -1;
  for (let rank = 12; rank >= 0; rank -= 1) {
    const count = counts[rank];
    if (count === 4) quad = rank;
    else if (count === 3) { if (trips1 < 0) trips1 = rank; else if (trips2 < 0) trips2 = rank; }
    else if (count === 2) { if (pair1 < 0) pair1 = rank; else if (pair2 < 0) pair2 = rank; }
  }
  if (quad >= 0) return pack(QUADS, quad, kickers(rankMask, 1, quad)[0] ?? 0);
  if (trips1 >= 0 && (trips2 >= 0 || pair1 >= 0)) return pack(FULL_HOUSE, trips1, Math.max(trips2, pair1));
  if (flushSuit >= 0) {
    const [a, b, c, d, e] = kickers(suitMasks[flushSuit], 5);
    return pack(FLUSH, a, b, c, d, e);
  }
  const top = straightTop(rankMask);
  if (top >= 0) return pack(STRAIGHT, top);
  if (trips1 >= 0) {
    const [a, b] = kickers(rankMask, 2, trips1);
    return pack(TRIPS, trips1, a, b);
  }
  if (pair2 >= 0) return pack(TWO_PAIR, pair1, pair2, kickers(rankMask, 1, pair1, pair2)[0] ?? 0);
  if (pair1 >= 0) {
    const [a, b, c] = kickers(rankMask, 3, pair1);
    return pack(PAIR, pair1, a, b, c);
  }
  const [a, b, c, d, e] = kickers(rankMask, 5);
  return pack(HIGH_CARD, a, b, c, d, e);
}
// END 3

// BEGIN 4. Describe and best five
export const categoryOf = (value: HandValue): Category => (value >> 20) as Category;
/** The ranks that name the hand, highest first: [pair] [high, low] [trips] [top] [trips, pair] … */
export function describe(value: HandValue): { readonly category: Category; readonly ranks: readonly Rank[] } {
  const category = categoryOf(value);
  const ranks = [16, 12, 8, 4, 0].map(shift => (value >> shift) & 15);
  return { category, ranks };
}

/** The five cards that make the hand (to light them up at the showdown). */
export function bestFive(cards: readonly Card[]): Card[] {
  if (cards.length <= 5) return cards.slice();
  const target = evaluate(cards);
  const pick: Card[] = [];
  const choose = (start: number): Card[] | null => {
    if (pick.length === 5) return evaluate(pick) === target ? pick.slice() : null;
    for (let i = start; i <= cards.length - (5 - pick.length); i += 1) {
      pick.push(cards[i]);
      const found = choose(i + 1);
      pick.pop();
      if (found) return found;
    }
    return null;
  };
  return choose(0) ?? cards.slice(0, 5);
}
// END 4

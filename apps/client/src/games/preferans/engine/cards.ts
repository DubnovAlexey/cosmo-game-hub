// =====================================================================
// FILE: apps/client/src/games/preferans/engine/cards.ts
// PURPOSE: the 32-card preferans deck. A card is a number 0..31 (suit × 8 + rank) and a set of cards is a
//          32-bit mask: hands, tricks and "cards still in play" cost one number each — fast for the solver,
//          trivial to send to a Web Worker.
// SECTIONS: 1 suits and ranks; 2 cards; 3 card sets as bit masks.
// =====================================================================

// BEGIN 1. Suits and ranks
/** Suits in bidding order ♠ < ♣ < ♦ < ♥ (no-trump ranks above every suit, see bids.ts). */
export type Suit = 0 | 1 | 2 | 3;
export const SUITS: readonly Suit[] = [0, 1, 2, 3];
export const SUIT_SYMBOLS = ['♠', '♣', '♦', '♥'] as const;
export const SUIT_NAMES = ['spades', 'clubs', 'diamonds', 'hearts'] as const;
/** Ranks from low to high: 7 8 9 10 J Q K A. */
export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const RANK_LABELS = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export const DECK_SIZE = 32;
// END 1

// BEGIN 2. Cards
export type Card = number;
export const makeCard = (suit: Suit, rank: Rank): Card => suit * 8 + rank;
export const suitOf = (card: Card): Suit => (card >> 3) as Suit;
export const rankOf = (card: Card): Rank => (card & 7) as Rank;
export const cardLabel = (card: Card): string => RANK_LABELS[rankOf(card)] + SUIT_SYMBOLS[suitOf(card)];
export const FULL_DECK: readonly Card[] = Object.freeze(Array.from({ length: DECK_SIZE }, (_, card) => card));

const SUIT_TEXT: Readonly<Record<string, Suit>> = { '♠': 0, s: 0, '♣': 1, c: 1, '♦': 2, d: 2, '♥': 3, h: 3 };
const RANK_TEXT: Readonly<Record<string, Rank>> = { 7: 0, 8: 1, 9: 2, 10: 3, t: 3, j: 4, q: 5, k: 6, a: 7 };

/** Parses "A♠", "10h", "qd", "T♥" into a card; throws on anything else. */
export function parseCard(text: string): Card {
  const value = text.trim().toLowerCase();
  const suit = SUIT_TEXT[value.slice(-1)];
  const rank = RANK_TEXT[value.slice(0, -1)];
  if (suit === undefined || rank === undefined) throw new Error(`Not a preferans card: "${text}"`);
  return makeCard(suit, rank);
}

/** Parses a space-separated list of cards: "A♠ K♠ 7♥". */
export const parseCards = (text: string): Card[] => text.trim().split(/\s+/).filter(Boolean).map(parseCard);
// END 2

// BEGIN 3. Card sets as bit masks
/** A set of cards: bit `card` is set when the card is in the set. Always an unsigned 32-bit number. */
export type CardSet = number;
export const EMPTY_SET: CardSet = 0;
export const SUIT_MASKS: readonly CardSet[] = [0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000];
export const bitOf = (card: Card): CardSet => (1 << card) >>> 0;
export const hasCard = (set: CardSet, card: Card): boolean => ((set >>> card) & 1) === 1;
export const addCard = (set: CardSet, card: Card): CardSet => (set | (1 << card)) >>> 0;
export const removeCard = (set: CardSet, card: Card): CardSet => (set & ~(1 << card)) >>> 0;
export const suitSet = (set: CardSet, suit: Suit): CardSet => (set & SUIT_MASKS[suit]) >>> 0;
export const unionOf = (a: CardSet, b: CardSet): CardSet => (a | b) >>> 0;
export const withoutSet = (a: CardSet, b: CardSet): CardSet => (a & ~b) >>> 0;

export function setOf(cards: Iterable<Card>): CardSet {
  let set = 0;
  for (const card of cards) set |= 1 << card;
  return set >>> 0;
}

/** Number of cards in a set (population count). */
export function countCards(set: CardSet): number {
  let v = set >>> 0;
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return Math.imul((v + (v >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

/** Cards of a set in ascending order (7♠ … A♥). */
export function cardsOf(set: CardSet): Card[] {
  const cards: Card[] = [];
  let rest = set >>> 0;
  while (rest !== 0) {
    const lowest = rest & -rest;
    cards.push(31 - Math.clz32(lowest));
    rest = (rest ^ lowest) >>> 0;
  }
  return cards;
}

/** Lowest / highest card of a non-empty set (by number: suit first, then rank). */
export const lowestCard = (set: CardSet): Card => 31 - Math.clz32(set & -set);
export const highestCard = (set: CardSet): Card => 31 - Math.clz32(set);

/** Ranks held in one suit as an 8-bit mask (bit 0 = seven … bit 7 = ace). */
export const suitRanks = (set: CardSet, suit: Suit): number => (set >>> (suit * 8)) & 0xff;
// END 3

// =====================================================================
// FILE: apps/client/src/games/poker/engine/cards.ts
// PURPOSE: the 52-card deck of Texas hold'em. A card is a number 0…51: rank = card >> 2 (0 = deuce … 12 = ace),
//   suit = card & 3 (0 spades, 1 hearts, 2 diamonds, 3 clubs). Numbers keep the evaluator and the bots fast and
//   make a deal easy to save, replay and test ("As Kh" ⇄ [51, 46]).
// SECTIONS: 1 encoding; 2 text; 3 deck.
// =====================================================================
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { shuffled, type Random } from '../../../shared/engine/random.ts';

// BEGIN 1. Encoding
export type Card = number;
/** 0 = deuce … 8 = ten, 9 = jack, 10 = queen, 11 = king, 12 = ace. */
export type Rank = number;
/** 0 spades, 1 hearts, 2 diamonds, 3 clubs. */
export type Suit = 0 | 1 | 2 | 3;

export const ACE: Rank = 12;
export const rankOf = (card: Card): Rank => card >> 2;
export const suitOf = (card: Card): Suit => (card & 3) as Suit;
export const cardOf = (rank: Rank, suit: Suit): Card => (rank << 2) | suit;
export const isRed = (card: Card): boolean => suitOf(card) === 1 || suitOf(card) === 2;
// END 1

// BEGIN 2. Text
const RANKS = '23456789TJQKA';
const SUITS = 'shdc';
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;

/** "As", "Td", "7c" → a card. */
export function parseCard(text: string): Card {
  const rank = RANKS.indexOf(text[0]?.toUpperCase() ?? '');
  const suit = SUITS.indexOf(text[1]?.toLowerCase() ?? '');
  if (rank < 0 || suit < 0 || text.length !== 2) throw new Error(`Not a card: "${text}"`);
  return cardOf(rank, suit as Suit);
}
/** "As Kh Qd" → cards (tests and examples). */
export const parseCards = (text: string): Card[] => text.trim().split(/\s+/).filter(Boolean).map(parseCard);
export const formatCard = (card: Card): string => `${RANKS[rankOf(card)]}${SUITS[suitOf(card)]}`;
export const formatCards = (cards: readonly Card[]): string => cards.map(formatCard).join(' ');
/** The rank as it is printed on a card face: 2 … 10, J, Q, K, A. */
export const rankLabel = (rank: Rank): string => (rank === 8 ? '10' : RANKS[rank]);
// END 2

// BEGIN 3. Deck
export const FULL_DECK: readonly Card[] = Object.freeze(Array.from({ length: 52 }, (_, card) => card));
/** A shuffled deck; the same random gives the same order. */
export const shuffledDeck = (random: Random): Card[] => shuffled(FULL_DECK, random);
// END 3

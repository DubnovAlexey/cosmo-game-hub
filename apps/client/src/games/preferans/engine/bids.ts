// =====================================================================
// FILE: apps/client/src/games/preferans/engine/bids.ts
// PURPOSE: the bidding ladder (торговля): 6♠ … 8БК, мизер, 9♠ … 10БК — 26 bids. A bid is its position on the
//          ladder, so "higher bid" is a plain number comparison.
// SECTIONS: 1 contracts; 2 the ladder; 3 labels.
// =====================================================================
import { SUIT_SYMBOLS, type Suit } from './cards.ts';

// BEGIN 1. Contracts
/** Suit of trumps in bids: ♠ ♣ ♦ ♥ = 0..3, no trump (без козыря) = 4. */
export type Strain = Suit | 4;
export const NO_TRUMP = 4;
export const STRAINS: readonly Strain[] = [0, 1, 2, 3, 4];
export type Level = 6 | 7 | 8 | 9 | 10;
export const LEVELS: readonly Level[] = [6, 7, 8, 9, 10];
export type GameContract = { readonly kind: 'game'; readonly level: Level; readonly strain: Strain };
export type Contract = GameContract | { readonly kind: 'misere' };
/** A bid: index on BID_LADDER, higher number = higher bid. */
export type Bid = number;
// END 1

// BEGIN 2. The ladder (misère is above 8 no-trump and below 9 spades)
const ladder: Contract[] = [];
for (const level of [6, 7, 8] as const) for (const strain of STRAINS) ladder.push({ kind: 'game', level, strain });
ladder.push({ kind: 'misere' });
for (const level of [9, 10] as const) for (const strain of STRAINS) ladder.push({ kind: 'game', level, strain });
export const BID_LADDER: readonly Contract[] = Object.freeze(ladder);
export const MISERE: Bid = 15;
export const LOWEST_BID: Bid = 0;
export const HIGHEST_BID: Bid = BID_LADDER.length - 1;

export const gameBid = (level: Level, strain: Strain): Bid => (level <= 8 ? (level - 6) * 5 : 16 + (level - 9) * 5) + strain;

export function contractOf(bid: Bid): Contract {
  const contract = BID_LADDER[bid];
  if (!contract) throw new Error(`No such bid: ${bid}`);
  return contract;
}

export const bidOf = (contract: Contract): Bid => (contract.kind === 'misere' ? MISERE : gameBid(contract.level, contract.strain));

/** Trump suit of a contract; null for no-trump and misère. */
export const trumpOf = (contract: Contract): Suit | null =>
  contract.kind === 'game' && contract.strain !== NO_TRUMP ? (contract.strain as Suit) : null;
// END 2

// BEGIN 3. Labels
export type Language = 'ru' | 'en';
export function bidLabel(bid: Bid, language: Language = 'ru'): string {
  const contract = contractOf(bid);
  if (contract.kind === 'misere') return language === 'ru' ? 'Мизер' : 'Misère';
  const strain = contract.strain === NO_TRUMP ? (language === 'ru' ? 'БК' : 'NT') : SUIT_SYMBOLS[contract.strain];
  return `${contract.level}${strain}`;
}
// END 3

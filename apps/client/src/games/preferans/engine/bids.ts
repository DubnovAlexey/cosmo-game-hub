// =====================================================================
// FILE: apps/client/src/games/preferans/engine/bids.ts
// PURPOSE: the bidding ladder (торговля): 6♠ … 8БК, мизер, 9♠ … 10БК — the classic 26 bids, numbered so that a higher
//          light bid has a higher number. Two table options add bids at the end of the numbering, so the numbers of
//          the classic bids (and every saved game) never change; their place in the auction is `bidRank`:
//          - misère without the talon («мизер без прикупа», Wikipedia, rulespal): above the nines, below the tens;
//          - dark bids («втёмную», Classic: Префклуб МГУ, pref-bridge): a level named before looking at the cards,
//            just above every light bid of that level («шесть втёмную» beats 6БК and loses to 7♠).
// SECTIONS: 1 contracts; 2 the ladder; 3 rank; 4 labels.
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
/** Misère; `noTalon` — ordered without taking the talon (a table option). */
export type MisereContract = { readonly kind: 'misere'; readonly noTalon?: boolean };
export type Contract = GameContract | MisereContract;
/** A bid: a number. Light bids 0…25 in ladder order, then misère without the talon (26), then dark bids (106…110). */
export type Bid = number;
// END 1

// BEGIN 2. The ladder (misère is above 8 no-trump and below 9 spades)
const ladder: Contract[] = [];
for (const level of [6, 7, 8] as const) for (const strain of STRAINS) ladder.push({ kind: 'game', level, strain });
ladder.push({ kind: 'misere' });
for (const level of [9, 10] as const) for (const strain of STRAINS) ladder.push({ kind: 'game', level, strain });
ladder.push({ kind: 'misere', noTalon: true });
export const BID_LADDER: readonly Contract[] = Object.freeze(ladder);
export const MISERE: Bid = 15;
/** Misère without the talon: numbered after the classic ladder, ranked between 9БК and 10♠ (see bidRank). */
export const MISERE_NO_TALON: Bid = 26;
export const LOWEST_BID: Bid = 0;
/** The highest light game (10БК): loops over game bids stop here. */
export const HIGHEST_BID: Bid = 25;

export const gameBid = (level: Level, strain: Strain): Bid => (level <= 8 ? (level - 6) * 5 : 16 + (level - 9) * 5) + strain;

/** A dark bid names only a level; the suit is chosen after the talon, like after any won auction. */
const DARK_BASE = 100;
export const darkBid = (level: Level): Bid => DARK_BASE + level;
export const isDarkBid = (bid: Bid | null | undefined): boolean => typeof bid === 'number' && bid >= DARK_BASE + 6 && bid <= DARK_BASE + 10;
export const darkLevel = (bid: Bid): Level => (bid - DARK_BASE) as Level;
export const DARK_BIDS: readonly Bid[] = Object.freeze(LEVELS.map(darkBid));
export const isMisereBid = (bid: Bid | null | undefined): boolean => bid === MISERE || bid === MISERE_NO_TALON;

export function contractOf(bid: Bid): Contract {
  if (isDarkBid(bid)) return { kind: 'game', level: darkLevel(bid), strain: NO_TRUMP };
  const contract = BID_LADDER[bid];
  if (!contract) throw new Error(`No such bid: ${bid}`);
  return contract;
}

export const bidOf = (contract: Contract): Bid =>
  (contract.kind === 'misere' ? (contract.noTalon ? MISERE_NO_TALON : MISERE) : gameBid(contract.level, contract.strain));

/** Trump suit of a contract; null for no-trump and misère. */
export const trumpOf = (contract: Contract): Suit | null =>
  contract.kind === 'game' && contract.strain !== NO_TRUMP ? (contract.strain as Suit) : null;
// END 2

// BEGIN 3. Rank: the place of a bid in the auction
/**
 * Higher rank = higher bid. Light bids rank by their number; a dark bid sits just above every light bid of its level
 * (half a step above that level's no-trump); misère without the talon sits above 9БК and the dark nine, below 10♠.
 */
export function bidRank(bid: Bid): number {
  if (isDarkBid(bid)) return gameBid(darkLevel(bid), NO_TRUMP) + 0.5;
  if (bid === MISERE_NO_TALON) return gameBid(9, NO_TRUMP) + 0.75;
  return bid;
}
export const isHigherBid = (bid: Bid, than: Bid | null): boolean => than === null || bidRank(bid) > bidRank(than);
// END 3

// BEGIN 4. Labels
export type Language = 'ru' | 'en';
export function bidLabel(bid: Bid, language: Language = 'ru'): string {
  if (isDarkBid(bid)) return language === 'ru' ? `${darkLevel(bid)} втёмную` : `${darkLevel(bid)} dark`;
  const contract = contractOf(bid);
  if (contract.kind === 'misere') {
    if (contract.noTalon) return language === 'ru' ? 'Мизер без прикупа' : 'Misère without the talon';
    return language === 'ru' ? 'Мизер' : 'Misère';
  }
  const strain = contract.strain === NO_TRUMP ? (language === 'ru' ? 'БК' : 'NT') : SUIT_SYMBOLS[contract.strain];
  return `${contract.level}${strain}`;
}
// END 4

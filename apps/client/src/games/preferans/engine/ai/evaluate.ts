// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/evaluate.ts
// PURPOSE: quick hand estimates for the decisions before the play (bidding, discard, final contract, whist).
//   They are heuristics on purpose: they run thousands of times per decision (66 discards × 5 strains), while
//   the card play itself is decided by the exact solver on sampled deals.
// SECTIONS: 1 suit shapes; 2 declarer; 3 defender; 4 misère.
// =====================================================================
import { suitRanks, type CardSet, type Suit } from '../cards.ts';
import { NO_TRUMP, type Strain } from '../bids.ts';

// BEGIN 1. Suit shapes
/** Ranks held in a suit, highest first (7 = ace … 0 = seven). */
function ranksDesc(hand: CardSet, suit: Suit): number[] {
  const bits = suitRanks(hand, suit);
  const ranks: number[] = [];
  for (let rank = 7; rank >= 0; rank -= 1) if (bits & (1 << rank)) ranks.push(rank);
  return ranks;
}
/** Sure winners from the top: A = 1, A K = 2, A K Q = 3 … */
function topRun(ranks: readonly number[]): number {
  let run = 0;
  while (run < ranks.length && ranks[run] === 7 - run) run += 1;
  return run;
}
// END 1

// BEGIN 2. Declarer
/** Tricks a hand is expected to take as declarer in `strain` (before or after the talon). */
export function estimateDeclarerTricks(hand: CardSet, strain: Strain): number {
  let tricks = 0;
  for (let suit = 0 as Suit; suit < 4; suit = (suit + 1) as Suit) {
    const ranks = ranksDesc(hand, suit);
    const length = ranks.length;
    if (length === 0) continue;
    const top = topRun(ranks);
    if (strain !== NO_TRUMP && suit === strain) {
      // Trumps: the missing top honours among the first three places are losers, long trumps win the rest.
      let losers = 0;
      for (let place = 0; place < Math.min(length, 3); place += 1) if (!ranks.includes(7 - place)) losers += 1;
      tricks += Math.max(top, length - losers);
    } else {
      let suitTricks = top;
      if (top === 0 && ranks[0] === 6 && length >= 2) suitTricks = 0.5; // guarded king
      if (top === 1 && ranks[1] === 5 && length >= 3) suitTricks += 0.5; // A Q x
      if (strain === NO_TRUMP && top >= 3) suitTricks = length; // a running suit
      else if (strain === NO_TRUMP && top === 2 && length >= 5) suitTricks = length - 1;
      tricks += suitTricks;
    }
  }
  // Without trumps every short suit is a door for the defenders' long suits.
  if (strain === NO_TRUMP) for (let suit = 0 as Suit; suit < 4; suit = (suit + 1) as Suit) if (ranksDesc(hand, suit).length === 0) tricks -= 0.75;
  return Math.max(0, Math.min(10, tricks));
}

/** The strain with the most expected tricks, and that number. */
export function bestStrain(hand: CardSet): { strain: Strain; tricks: number } {
  let best: { strain: Strain; tricks: number } = { strain: 0, tricks: -1 };
  for (const strain of [0, 1, 2, 3, NO_TRUMP] as Strain[]) {
    const tricks = estimateDeclarerTricks(hand, strain);
    if (tricks > best.tricks + 1e-9) best = { strain, tricks };
  }
  return best;
}
// END 2

// BEGIN 3. Defender
/** Tricks a defender expects to take against a game in `trump` (null = no trump). */
export function estimateDefenderTricks(hand: CardSet, trump: Suit | null): number {
  let tricks = 0;
  for (let suit = 0 as Suit; suit < 4; suit = (suit + 1) as Suit) {
    const ranks = ranksDesc(hand, suit);
    const length = ranks.length;
    if (length === 0) continue;
    const has = (rank: number): boolean => ranks.includes(rank);
    if (suit === trump) {
      tricks += (has(7) ? 1 : 0) + (has(6) && length >= 2 ? 0.75 : 0) + (has(5) && length >= 3 ? 0.5 : 0) + (length >= 4 ? 0.5 : 0);
    } else {
      // Side aces survive unless the declarer is void; long side suits get trumped sooner.
      if (has(7)) tricks += length <= 4 ? 1 : 0.6;
      if (has(6)) tricks += has(7) ? (length <= 3 ? 0.6 : 0.3) : length >= 2 ? 0.45 : 0.1;
      if (trump === null && topRun(ranks) >= 2 && length >= 4) tricks += length - 3;
    }
  }
  return tricks;
}
// END 3

// BEGIN 4. Misère
/**
 * Danger of a misère hand: 0 = safe. A suit is safe while its i-th lowest card is not higher than rank 2·i
 * (7; 7 9; 7 9 J …): every lead in it can be ducked. Each card above that line adds one point.
 */
export function misereRisk(hand: CardSet): number {
  let risk = 0;
  for (let suit = 0 as Suit; suit < 4; suit = (suit + 1) as Suit) {
    const ascending = ranksDesc(hand, suit).reverse();
    ascending.forEach((rank, index) => { if (rank > 2 * index) risk += 1; });
  }
  return risk;
}
// END 4

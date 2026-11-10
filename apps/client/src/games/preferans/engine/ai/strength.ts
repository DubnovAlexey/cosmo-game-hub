// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/strength.ts
// PURPOSE: how many tricks a declarer's ten cards are worth in a strain — in one quick look, without the solver.
//   The quick estimate (evaluate.ts) counts sure winners; here it gets corrections learned from the exact solver
//   (strengthTable.ts, written by scripts/load/preferans-learn.mjs): one number for every holding of a suit in its
//   role — the trump suit, a side suit (by the length of the trump suit: a short side suit is worth a ruff only with
//   trumps to spare), a suit at no trump — and what the first lead is worth to the declarer.
//   On deals the learning never saw, the estimate alone is off by 1.2 tricks, with the table by 0.8; a hand rated
//   6.0 makes a six in nine deals of ten, a hand rated 5.0 in two of ten.
//   Used where a look must be instant and is asked thousands of times: which ten of twelve cards to keep (66
//   discards × 5 strains), and which hands a defender may imagine in a declarer who named a game (foresight.ts).
// =====================================================================
import { NO_TRUMP, type Strain } from '../bids.ts';
import type { CardSet } from '../cards.ts';
import { estimateDeclarerTricks } from './evaluate.ts';
import { STRENGTH_TABLE } from './strengthTable.ts';

// The layout of the table (the same numbers as in scripts/load/preferans-learn.mjs).
const HOLDINGS = 256;
const SIDE = HOLDINGS;
const AT_NO_TRUMP = HOLDINGS * 4;
const LEAD_SUIT = HOLDINGS * 5;
const LEAD_NO_TRUMP = HOLDINGS * 5 + 1;
const LENGTHS = new Uint8Array(HOLDINGS);
for (let holding = 1; holding < HOLDINGS; holding += 1) LENGTHS[holding] = LENGTHS[holding >> 1] + (holding & 1);
/** Without knowing who leads: the declarer leads in one deal of three. */
const LEAD_UNKNOWN = 1 / 3;

/**
 * Tricks a declarer is expected to take with these ten cards in `strain` against perfect defence, the cards of the
 * defenders unseen. `leads`: the declarer leads to the first trick (null — not known yet).
 */
export function declarerStrength(hand: CardSet, strain: Strain, leads: boolean | null = null): number {
  const lead = leads === null ? LEAD_UNKNOWN : leads ? 1 : 0;
  let hundredths: number;
  if (strain === NO_TRUMP) {
    hundredths = STRENGTH_TABLE[LEAD_NO_TRUMP] * lead;
    for (let suit = 0; suit < 4; suit += 1) hundredths += STRENGTH_TABLE[AT_NO_TRUMP + ((hand >>> (suit * 8)) & 0xff)];
  } else {
    const trumps = (hand >>> (strain * 8)) & 0xff;
    const length = LENGTHS[trumps];
    const side = SIDE + (length <= 4 ? 0 : length === 5 ? 1 : 2) * HOLDINGS;
    hundredths = STRENGTH_TABLE[LEAD_SUIT] * lead + STRENGTH_TABLE[trumps];
    for (let suit = 0; suit < 4; suit += 1) if (suit !== strain) hundredths += STRENGTH_TABLE[side + ((hand >>> (suit * 8)) & 0xff)];
  }
  return estimateDeclarerTricks(hand, strain) + hundredths / 100;
}

/** The strain these cards are worth most in, and that worth. */
export function bestStrength(hand: CardSet, leads: boolean | null = null): { strain: Strain; tricks: number } {
  let best: { strain: Strain; tricks: number } = { strain: 0, tricks: -Infinity };
  for (const strain of [0, 1, 2, 3, NO_TRUMP] as Strain[]) {
    const tricks = declarerStrength(hand, strain, leads);
    if (tricks > best.tricks + 1e-9) best = { strain, tricks };
  }
  return best;
}

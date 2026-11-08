// =====================================================================
// FILE: apps/client/src/shared/engine/random.ts
// PURPOSE: a small deterministic random generator (mulberry32). The same seed gives the same deal and the same
//          bot decisions: games can be replayed, shared as a number and tested exactly.
// =====================================================================

/** A function returning numbers in [0, 1). */
export type Random = () => number;

// BEGIN createRandom
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// END createRandom

/** Fisher–Yates shuffle into a new array. */
export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = result[i];
    result[i] = result[j];
    result[j] = swap;
  }
  return result;
}

/** An integer in [0, maxExclusive). */
export const randomInt = (random: Random, maxExclusive: number): number => Math.floor(random() * maxExclusive);

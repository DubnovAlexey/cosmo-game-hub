// =====================================================================
// FILE: apps/client/src/games/poker/engine/ai/equity.ts
// PURPOSE: how much of the pot a hand wins on average — Monte Carlo: deal the hidden cards many times (the
//   opponents' hole cards and the rest of the board), evaluate everybody, count a win as 1 and a tie as a share.
//   An opponent who raised is not holding just any two cards: his cards are drawn again until they reach the
//   preflop strength his actions suggest (a light range model, cheap and good enough for a table of bots).
// SECTIONS: 1 preflop strength; 2 equity.
// =====================================================================
import { rankOf, suitOf, type Card } from '../cards.ts';
import { evaluate } from '../evaluate.ts';
// noinspection ES6PreferShortImport
import type { Random } from '../../../../shared/engine/random.ts';

// BEGIN 1. Preflop strength
/**
 * The Chen formula (Bill Chen's quick score of two hole cards), scaled to 0…1: the higher card's points (ace 10,
 * king 8, queen 7, jack 6, then half the face value), doubled for a pair, +2 suited, minus the gap, +1 for low
 * connectors. AA = 1.0, 72 offsuit ≈ 0.
 */
export function preflopScore(a: Card, b: Card): number {
  const high = Math.max(rankOf(a), rankOf(b));
  const low = Math.min(rankOf(a), rankOf(b));
  const points = (rank: number): number => (rank === 12 ? 10 : rank === 11 ? 8 : rank === 10 ? 7 : rank === 9 ? 6 : (rank + 2) / 2);
  let score = points(high);
  if (high === low) score = Math.max(5, score * 2);
  if (suitOf(a) === suitOf(b)) score += 2;
  const gap = high - low - 1;
  if (high !== low) {
    score -= gap <= 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if (gap <= 1 && high < 10) score += 1;
  }
  return Math.max(0, Math.min(1, (Math.ceil(score) + 1) / 21));
}
// END 1

// BEGIN 2. Equity
const scratch: Card[] = [];
const hand: Card[] = [];
/**
 * The hero's average share of the pot against `minScores.length` opponents. `minScores[i]` is the least preflop
 * strength opponent i is believed to hold (0 = any two cards).
 */
export function equity(hole: readonly Card[], board: readonly Card[], minScores: readonly number[], random: Random, samples = 600): number {
  const used = new Set<Card>([...hole, ...board]);
  scratch.length = 0;
  for (let card = 0; card < 52; card += 1) if (!used.has(card)) scratch.push(card);
  const opponents = minScores.length;
  if (opponents === 0) return 1;
  const missing = 5 - board.length;
  const theirs: Card[][] = Array.from({ length: opponents }, () => [0, 0]);
  let total = 0;
  for (let sample = 0; sample < samples; sample += 1) {
    // A partial shuffle: the drawn cards are swapped to the end of the free part.
    let free = scratch.length;
    const draw = (): Card => {
      const index = Math.floor(random() * free);
      free -= 1;
      const card = scratch[index];
      scratch[index] = scratch[free];
      scratch[free] = card;
      return card;
    };
    for (let i = 0; i < opponents; i += 1) {
      let first = draw();
      let second = draw();
      // [EN] Redraw a hand that is too weak for what this opponent did (a few tries, then accept).
      // [RU] Переcдать руку, слишком слабую для того, что сделал соперник (несколько попыток, потом принять).
      for (let tries = 0; tries < 6 && minScores[i] > 0 && preflopScore(first, second) < minScores[i]; tries += 1) {
        free += 2;
        first = draw();
        second = draw();
      }
      theirs[i][0] = first;
      theirs[i][1] = second;
    }
    hand.length = 0;
    for (const card of board) hand.push(card);
    for (let i = 0; i < missing; i += 1) hand.push(draw());
    const fullBoard = hand.slice();
    hand.push(hole[0], hole[1]);
    let best = evaluate(hand);
    let tied = 1;
    let beaten = false;
    for (let i = 0; i < opponents && !beaten; i += 1) {
      const value = evaluate([...fullBoard, theirs[i][0], theirs[i][1]]);
      if (value > best) beaten = true;
      else if (value === best) tied += 1;
    }
    if (!beaten) total += 1 / tied;
  }
  return total / samples;
}
// END 2

// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/knowledge.ts
// PURPOSE: what one seat knows at the table, and random full deals consistent with it — the input of
//   Perfect-Information Monte Carlo (PIMC): bots never look at hidden cards, they solve sampled deals.
// Known: own hand, open hands (open whist, misère after the first trick), played cards, the declarer's own
// discard, revealed all-pass talon cards. Inferred: a player who did not follow a suit is void in it; one who
// did not trump either is also void in trumps.
// SECTIONS: 1 knowledge; 2 sampling.
// =====================================================================
import { cardsOf, countCards, setOf, suitOf, unionOf, withoutSet, type Card, type CardSet } from '../cards.ts';
import { isHandVisible, type DealState } from '../deal.ts';
import type { PlayedCard, Seat } from '../play.ts';
import { shuffled, type Random } from '../../../../shared/engine/random.ts';

// BEGIN 1. Knowledge
export interface Knowledge {
  readonly seat: Seat;
  /** Cards known to be in each seat's hand now. */
  readonly known: readonly CardSet[];
  /** How many cards each seat holds now. */
  readonly counts: readonly number[];
  /** Suits each seat is known to be void in (bit s = void in suit s). */
  readonly voids: readonly number[];
  /** Cards whose place is unknown: hidden hands or out of play. */
  readonly unknown: CardSet;
  /** How many of the unknown cards are out of play (the discard seen from a defender's seat, an unrevealed talon). */
  readonly deadCount: number;
}

function noteVoids(voids: number[], cards: readonly PlayedCard[], lead: Card | null, trump: number): void {
  if (cards.length === 0 && lead === null) return;
  const ledSuit = lead !== null ? suitOf(lead) : suitOf(cards[0].card);
  for (const { seat, card } of cards) {
    const suit = suitOf(card);
    if (suit === ledSuit) continue;
    voids[seat] |= 1 << ledSuit;
    if (trump !== -1 && suit !== trump) voids[seat] |= 1 << trump;
  }
}

export function knowledgeOf(state: DealState, seat: Seat): Knowledge {
  const known = [0, 1, 2].map(owner => (isHandVisible(state, owner as Seat, seat) ? state.hands[owner] : 0));
  const counts = state.hands.map(countCards);
  const voids = [0, 0, 0];
  const trump = state.trump ?? -1;
  let played = 0;
  let knownDead = 0;
  for (const trick of state.tricks) {
    noteVoids(voids, trick.cards, trick.lead, trump);
    played = unionOf(played, setOf(trick.cards.map(entry => entry.card)));
    if (trick.lead !== null) knownDead = unionOf(knownDead, setOf([trick.lead]));
  }
  noteVoids(voids, state.trick, state.trickLead, trump);
  played = unionOf(played, setOf(state.trick.map(entry => entry.card)));
  if (state.trickLead !== null) knownDead = unionOf(knownDead, setOf([state.trickLead]));
  let deadCount = 0;
  if (state.mode === 'raspasy') {
    deadCount = state.talon.filter(card => ((knownDead >>> card) & 1) === 0).length;
  } else if (state.declarer !== null && state.discards.length > 0) {
    if (seat === state.declarer) knownDead = unionOf(knownDead, setOf(state.discards));
    else deadCount = state.discards.length;
  }
  let visible = unionOf(played, knownDead);
  for (const hand of known) visible = unionOf(visible, hand);
  return { seat, known, counts, voids, unknown: withoutSet(0xffffffff, visible), deadCount };
}
// END 1

// BEGIN 2. Sampling
/**
 * A random deal consistent with the knowledge: known cards stay, unknown cards fill the hidden hands
 * (respecting voids) and the dead pile. The most constrained cards are placed first. null if it keeps failing.
 */
export function sampleHands(knowledge: Knowledge, random: Random, attempts = 48): CardSet[] | null {
  const need = [0, 1, 2].map(seat => knowledge.counts[seat] - countCards(knowledge.known[seat]));
  const unknown = cardsOf(knowledge.unknown);
  const eligibleCount = (card: Card): number => [0, 1, 2].filter(seat => need[seat] > 0 && ((knowledge.voids[seat] >> suitOf(card)) & 1) === 0).length;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const ignoreVoids = attempt === attempts - 1; // last resort: impossible void inferences never block a decision
    const cards = shuffled(unknown, random).sort((a, b) => eligibleCount(a) - eligibleCount(b));
    const hands = knowledge.known.slice();
    const left = need.slice();
    let deadLeft = knowledge.deadCount;
    let ok = true;
    for (const card of cards) {
      const suitBit = 1 << suitOf(card);
      let total = deadLeft;
      for (let seat = 0; seat < 3; seat += 1) if (left[seat] > 0 && (ignoreVoids || (knowledge.voids[seat] & suitBit) === 0)) total += left[seat];
      if (total === 0) { ok = false; break; }
      let pick = Math.floor(random() * total);
      let placed = false;
      for (let seat = 0; seat < 3 && !placed; seat += 1) {
        if (left[seat] === 0 || (!ignoreVoids && (knowledge.voids[seat] & suitBit) !== 0)) continue;
        if (pick < left[seat]) { hands[seat] = (hands[seat] | (1 << card)) >>> 0; left[seat] -= 1; placed = true; }
        else pick -= left[seat];
      }
      if (!placed) deadLeft -= 1;
    }
    if (ok && left.every(value => value === 0)) return hands;
  }
  return null;
}
// END 2

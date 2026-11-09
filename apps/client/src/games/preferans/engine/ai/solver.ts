// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/solver.ts
// PURPOSE: double-dummy solver. With every hand known: how many of the remaining tricks the target player
//   takes when all three play perfectly. Alpha-beta over cards, a transposition table at trick boundaries,
//   and equivalent cards (no live card of anybody else between them) searched once.
//   Everyone except the target plays against the target: defenders against the declarer; on misère the
//   defenders try to give the declarer a trick; on all-pass the paranoid view "the other two load me".
// SECTIONS: 1 position and results; 2 equivalent cards; 3 search; 4 public API.
// =====================================================================
import { countCards, type Card, type CardSet, type Suit } from '../cards.ts';
import { legalCards, nextSeat, type PlayedCard, type Seat } from '../play.ts';

// BEGIN 1. Position and results
export interface SolverPosition {
  readonly hands: readonly CardSet[];
  readonly trump: Suit | null;
  /** Who plays next. */
  readonly turn: Seat;
  /** Cards already in the current trick, in play order (0–2). */
  readonly trick: readonly PlayedCard[];
  /** Whose tricks are counted. */
  readonly target: Seat;
  /** The target wants as many tricks as possible (a game) or as few (misère, all-pass). */
  readonly targetWants: 'max' | 'min';
}

/** Tricks the target takes from now on (the current trick included) after this card, with perfect play. */
export interface MoveScore { readonly card: Card; readonly tricks: number }
// END 1

// BEGIN 2. Equivalent cards
/**
 * Groups of a player's legal cards that are equivalent: same suit and no card of anybody else
 * (other hands or the current trick) between them. Each group is listed lowest card first.
 */
export function equivalentGroups(legal: CardSet, othersLive: CardSet): Card[][] {
  const groups: Card[][] = [];
  for (let suit = 0; suit < 4; suit += 1) {
    const mine = (legal >>> (suit * 8)) & 0xff;
    if (mine === 0) continue;
    const others = (othersLive >>> (suit * 8)) & 0xff;
    let group: Card[] | null = null;
    for (let rank = 0; rank < 8; rank += 1) {
      const bit = 1 << rank;
      if ((mine & bit) !== 0) {
        if (!group) { group = []; groups.push(group); }
        group.push(suit * 8 + rank);
      } else if ((others & bit) !== 0) {
        group = null;
      }
    }
  }
  return groups;
}

/** Does `challenger` beat the currently winning `current` card? Same suit: higher wins; otherwise only a trump. */
const beats = (challenger: Card, current: Card, trump: number): boolean => {
  const suit = challenger >> 3;
  return suit === current >> 3 ? challenger > current : suit === trump;
};
// END 2

// BEGIN 3. Search
/**
 * The transposition table of trick-start positions: open addressing in typed arrays (three hands and the
 * leader as the key, packed bounds as the value). One table serves every search of this thread; a generation
 * stamp empties it for the next search without clearing memory, so a search allocates nothing and builds no
 * string keys (the load test of 08.11.2026: the old string-keyed Map made the worst full deal take 1.8 s).
 * The 2^20 slots (16 MB) are allocated by the first search only, so the page thread, which never solves, never
 * pays for them. A crowded region is simply not stored: the table is a cache, a miss only costs time.
 */
const TABLE_BITS = 20;
const TABLE_MASK = (1 << TABLE_BITS) - 1;
const PROBES = 12;
interface Table { readonly hand0: Uint32Array; readonly hand1: Uint32Array; readonly hand2: Uint32Array; readonly info: Uint32Array }
let sharedTable: Table | null = null;
let lastGeneration = 0;

function openTable(): { table: Table; generation: number } {
  sharedTable ??= {
    hand0: new Uint32Array(1 << TABLE_BITS), hand1: new Uint32Array(1 << TABLE_BITS),
    hand2: new Uint32Array(1 << TABLE_BITS), info: new Uint32Array(1 << TABLE_BITS),
  };
  lastGeneration += 1;
  if (lastGeneration > 0xffff) { sharedTable.info.fill(0); lastGeneration = 1; }
  return { table: sharedTable, generation: lastGeneration };
}

/** Thrown inside a search whose deadline has passed; the caller drops that search. */
const STOPPED = new Error('search stopped at its deadline');

class Search {
  readonly hands: number[];
  readonly trump: number;
  readonly target: Seat;
  readonly maximizing: boolean[];
  readonly table: Table;
  readonly generation: number;
  readonly deadline: number;
  nodes = 0;
  stored = 0;

  constructor(position: SolverPosition, deadline = Infinity) {
    this.hands = position.hands.map(hand => hand >>> 0);
    this.trump = position.trump ?? -1;
    this.target = position.target;
    const targetMax = position.targetWants === 'max';
    this.maximizing = [0, 1, 2].map(seat => (seat === position.target ? targetMax : !targetMax));
    const { table, generation } = openTable();
    this.table = table;
    this.generation = generation;
    this.deadline = deadline;
  }

  /** The slot of (hands, leader): its own entry, a free slot, or -1 when the region is crowded. */
  slot(h0: number, h1: number, h2: number, leader: number): number {
    const table = this.table;
    let hash = Math.imul(h0 ^ (h0 >>> 16), 0x9e3779b1) ^ Math.imul(h1 ^ (h1 >>> 15), 0x85ebca77) ^ Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae3d) ^ leader;
    hash ^= hash >>> 16;
    let slot = hash & TABLE_MASK;
    for (let probe = 0; probe < PROBES; probe += 1) {
      const info = table.info[slot];
      if (info >>> 16 !== this.generation) return slot;
      if (table.hand0[slot] === h0 && table.hand1[slot] === h1 && table.hand2[slot] === h2 && ((info >>> 8) & 3) === leader) return slot;
      slot = (slot + 1) & TABLE_MASK;
    }
    return -1;
  }

  /** Value at a trick start where `leader` leads, within the window (alpha, beta); fail-soft. */
  trickStart(leader: Seat, alpha: number, beta: number): number {
    const hands = this.hands;
    const remaining = countCards(hands[leader]);
    if (remaining === 0) return 0;
    const table = this.table;
    const h0 = hands[0];
    const h1 = hands[1];
    const h2 = hands[2];
    let slot = this.slot(h0, h1, h2, leader);
    let lower = 0;
    let upper = remaining;
    if (slot >= 0 && table.info[slot] >>> 16 === this.generation) {
      const info = table.info[slot];
      lower = (info >>> 4) & 15;
      upper = info & 15;
    }
    if (lower >= beta) return lower;
    if (upper <= alpha) return upper;
    if (lower === upper) return lower;
    const a = Math.max(alpha, lower);
    const b = Math.min(beta, upper);
    const value = this.play(leader, 0, -1, 0, -1, 0, a, b);
    if (value <= a) upper = Math.min(upper, value);
    else if (value >= b) lower = Math.max(lower, value);
    else { lower = value; upper = value; }
    // The search below may have used the slot found above, so look again before storing.
    slot = this.slot(h0, h1, h2, leader);
    if (slot >= 0) {
      table.hand0[slot] = h0;
      table.hand1[slot] = h1;
      table.hand2[slot] = h2;
      table.info[slot] = ((this.generation << 16) | (leader << 8) | (lower << 4) | upper) >>> 0;
      this.stored += 1;
    }
    return value;
  }

  /**
   * Legal cards of `seat`, one per group of equivalent cards (the lowest of each group), in a search-friendly
   * order. Written with bit operations only: this runs at every node of the search.
   */
  moves(seat: Seat, n: number, c0: number, c1: number): Card[] {
    const hands = this.hands;
    const hand = hands[seat];
    let legal = hand;
    if (n > 0) {
      const led = c0 >> 3;
      const follow = (hand >>> (led * 8)) & 0xff;
      if (follow !== 0) legal = (follow << (led * 8)) >>> 0;
      else if (this.trump >= 0) {
        const trumps = (hand >>> (this.trump * 8)) & 0xff;
        if (trumps !== 0) legal = (trumps << (this.trump * 8)) >>> 0;
      }
    }
    let othersLive = ((hands[0] | hands[1] | hands[2]) & ~hand) >>> 0;
    if (n > 0) othersLive = (othersLive | (1 << c0)) >>> 0;
    if (n > 1) othersLive = (othersLive | (1 << c1)) >>> 0;
    const reps: Card[] = [];
    for (let suit = 0; suit < 4; suit += 1) {
      const mine = (legal >>> (suit * 8)) & 0xff;
      if (mine === 0) continue;
      const others = (othersLive >>> (suit * 8)) & 0xff;
      let inGroup = false;
      for (let rank = 0; rank < 8; rank += 1) {
        const bit = 1 << rank;
        if ((mine & bit) !== 0) {
          if (!inGroup) { reps.push(suit * 8 + rank); inGroup = true; }
        } else if ((others & bit) !== 0) {
          inGroup = false;
        }
      }
    }
    if (n === 0) return reps.reverse(); // lead high cards first
    // Following: the cheapest card that takes the trick first, then the lowest cards.
    const current = n === 1 || !beats(c1, c0, this.trump) ? c0 : c1;
    for (let index = 0; index < reps.length; index += 1) {
      if (beats(reps[index], current, this.trump)) {
        if (index > 0) { const winner = reps[index]; reps.splice(index, 1); reps.unshift(winner); }
        break;
      }
    }
    return reps;
  }

  /** `seat` plays the (n+1)-th card of the trick; c0/s0 and c1/s1 are the cards already played. */
  play(seat: Seat, n: number, c0: number, s0: Seat, c1: number, s1: Seat, alpha: number, beta: number): number {
    this.nodes += 1;
    if ((this.nodes & 4095) === 0 && Date.now() > this.deadline) throw STOPPED;
    const hand = this.hands[seat];
    const maximize = this.maximizing[seat];
    let best = maximize ? -1 : 99;
    for (const card of this.moves(seat, n, c0, c1)) {
      this.hands[seat] = (hand & ~(1 << card)) >>> 0;
      let value: number;
      if (n === 0) value = this.play(nextSeat(seat), 1, card, seat, -1, 0, alpha, beta);
      else if (n === 1) value = this.play(nextSeat(seat), 2, c0, s0, card, seat, alpha, beta);
      else {
        let winningCard = c0;
        let winner = s0;
        if (beats(c1, winningCard, this.trump)) { winningCard = c1; winner = s1; }
        if (beats(card, winningCard, this.trump)) winner = seat;
        const gained = winner === this.target ? 1 : 0;
        value = gained + this.trickStart(winner, alpha - gained, beta - gained);
      }
      this.hands[seat] = hand;
      if (maximize) {
        if (value > best) best = value;
        if (best > alpha) alpha = best;
      } else {
        if (value < best) best = value;
        if (best < beta) beta = best;
      }
      if (alpha >= beta) break;
    }
    return best;
  }
}
// END 3

// BEGIN 4. Public API
function runRoot(search: Search, position: SolverPosition, card: Card | null): number {
  const trick = position.trick;
  const n = trick.length;
  const c0 = n > 0 ? trick[0].card : -1;
  const s0 = n > 0 ? trick[0].seat : 0;
  const c1 = n > 1 ? trick[1].card : -1;
  const s1 = n > 1 ? trick[1].seat : 0;
  const top = countCards(position.hands[position.turn]) + 1;
  if (card === null) {
    return n === 0 ? search.trickStart(position.turn, -1, top) : search.play(position.turn, n, c0, s0, c1, s1, -1, top);
  }
  // Value after `card`: replay the root step with a single move.
  const seat = position.turn;
  const hand = search.hands[seat];
  search.hands[seat] = (hand & ~(1 << card)) >>> 0;
  let value: number;
  if (n === 0) value = search.play(nextSeat(seat), 1, card, seat, -1, 0, -1, top);
  else if (n === 1) value = search.play(nextSeat(seat), 2, c0, s0, card, seat, -1, top);
  else {
    let winningCard = c0;
    let winner = s0;
    if (beats(c1, winningCard, search.trump)) { winningCard = c1; winner = s1; }
    if (beats(card, winningCard, search.trump)) winner = seat;
    const gained = winner === search.target ? 1 : 0;
    value = gained + search.trickStart(winner, -1, top);
  }
  search.hands[seat] = hand;
  return value;
}

/** Exact number of remaining tricks (the current one included) the target takes with perfect play. */
export function solve(position: SolverPosition): number {
  return runRoot(new Search(position), position, null);
}

/**
 * Value of every legal card of the player to move; equivalent cards get the same value. With a `deadline`
 * (a `Date.now()` time) the search gives up once it passes and returns null: the bot then decides with the
 * samples it already has, so a slow phone never freezes on one hard deal.
 */
export function scoreMoves(position: SolverPosition): MoveScore[];
export function scoreMoves(position: SolverPosition, deadline: number): MoveScore[] | null;
export function scoreMoves(position: SolverPosition, deadline = Infinity): MoveScore[] | null {
  const search = new Search(position, deadline);
  const trick = position.trick;
  const seat = position.turn;
  const ledSuit = trick.length === 0 ? null : ((trick[0].card >> 3) as Suit);
  const legal = legalCards(position.hands[seat], ledSuit, position.trump);
  let othersLive = 0;
  for (let other = 0; other < 3; other += 1) if (other !== seat) othersLive |= position.hands[other];
  for (const played of trick) othersLive |= 1 << played.card;
  const scores: MoveScore[] = [];
  try {
    for (const group of equivalentGroups(legal, othersLive >>> 0)) {
      const tricks = runRoot(search, position, group[0]);
      for (const card of group) scores.push({ card, tricks });
    }
  } catch (error) {
    if (error === STOPPED) return null;
    throw error;
  }
  return scores;
}

/** Search statistics for benchmarks: nodes visited and positions stored in the table. */
export function solveWithStats(position: SolverPosition): { tricks: number; nodes: number; positions: number } {
  const search = new Search(position);
  const tricks = runRoot(search, position, null);
  return { tricks, nodes: search.nodes, positions: search.stored };
}
// END 4

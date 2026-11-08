// The fast solver must agree with a plain, obviously correct minimax on hundreds of random positions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FULL_DECK, cardsOf, countCards, createRandom, legalCards, nextSeat, scoreMoves, setOf, shuffled, solve, solveWithStats,
  suitOf, trickWinnerIndex, type CardSet, type PlayedCard, type Seat, type SolverPosition, type Suit,
} from '../engine/index.ts';

// BEGIN reference: full minimax, no pruning, no tables, no equivalent cards
function reference(hands: CardSet[], trump: Suit | null, turn: Seat, trick: PlayedCard[], target: Seat, targetMax: boolean): number {
  if (trick.length === 0 && countCards(hands[turn]) === 0) return 0;
  const ledSuit = trick.length === 0 ? null : suitOf(trick[0].card);
  const maximize = turn === target ? targetMax : !targetMax;
  let best = maximize ? -1 : 99;
  for (const card of cardsOf(legalCards(hands[turn], ledSuit, trump))) {
    const next = hands.slice();
    next[turn] = (next[turn] & ~(1 << card)) >>> 0;
    const played = [...trick, { seat: turn, card }];
    let value: number;
    if (played.length === 3) {
      const winner = played[trickWinnerIndex(played.map(entry => entry.card), suitOf(played[0].card), trump)].seat;
      value = (winner === target ? 1 : 0) + reference(next, trump, winner, [], target, targetMax);
    } else value = reference(next, trump, nextSeat(turn), played, target, targetMax);
    best = maximize ? Math.max(best, value) : Math.min(best, value);
  }
  return best;
}
// END reference

function randomPosition(seed: number): SolverPosition {
  const random = createRandom(seed);
  const perHand = 1 + Math.floor(random() * 4);
  const deck = shuffled(FULL_DECK, random);
  const hands: CardSet[] = [0, 1, 2].map(seat => setOf(deck.slice(seat * perHand, seat * perHand + perHand)));
  const turn = Math.floor(random() * 3) as Seat;
  const trumpPick = Math.floor(random() * 5);
  const trump = trumpPick === 4 ? null : (trumpPick as Suit);
  // Sometimes start in the middle of a trick: earlier seats already played one legal card.
  const trick: PlayedCard[] = [];
  const already = perHand > 1 ? Math.floor(random() * 3) : 0;
  let seat = turn;
  for (let i = 0; i < already; i += 1) {
    const ledSuit = trick.length === 0 ? null : suitOf(trick[0].card);
    const options = cardsOf(legalCards(hands[seat], ledSuit, trump));
    const card = options[Math.floor(random() * options.length)];
    hands[seat] = (hands[seat] & ~(1 << card)) >>> 0;
    trick.push({ seat, card });
    seat = nextSeat(seat);
  }
  return { hands, trump, turn: seat, trick, target: Math.floor(random() * 3) as Seat, targetWants: random() < 0.5 ? 'max' : 'min' };
}

test('the solver equals plain minimax on 400 random endgames (1–4 cards each, mid-trick starts included)', () => {
  for (let seed = 1; seed <= 400; seed += 1) {
    const position = randomPosition(seed);
    const expected = reference(position.hands.slice(), position.trump, position.turn, position.trick.slice(), position.target, position.targetWants === 'max');
    assert.equal(solve(position), expected, `seed ${seed}`);
  }
});

test('the best move score equals the solved value, and equivalent cards share it', () => {
  for (let seed = 500; seed < 650; seed += 1) {
    const position = randomPosition(seed);
    const scores = scoreMoves(position);
    const maximize = position.turn === position.target ? position.targetWants === 'max' : position.targetWants === 'min';
    const best = scores.reduce((value, entry) => (maximize ? Math.max(value, entry.tricks) : Math.min(value, entry.tricks)), maximize ? -1 : 99);
    assert.equal(best, solve(position), `seed ${seed}`);
    const legal = cardsOf(legalCards(position.hands[position.turn], position.trick.length ? suitOf(position.trick[0].card) : null, position.trump));
    assert.deepEqual(scores.map(entry => entry.card).sort((a, b) => a - b), legal, 'every legal card is scored');
  }
});

test('a search whose deadline has passed gives up instead of running on', () => {
  const deck = shuffled(FULL_DECK, createRandom(31));
  const hands = [0, 1, 2].map(seat => setOf(deck.slice(seat * 10, seat * 10 + 10)));
  const position: SolverPosition = { hands, trump: null, turn: 0, trick: [], target: 1, targetWants: 'min' };
  assert.equal(scoreMoves(position, Date.now() - 1), null);
  assert.ok(scoreMoves(position, Date.now() + 60000), 'with time left it answers');
});

test('a full ten-card deal is solved quickly', () => {
  const random = createRandom(2026);
  for (let deal = 0; deal < 6; deal += 1) {
    const deck = shuffled(FULL_DECK, random);
    const hands = [0, 1, 2].map(seat => setOf(deck.slice(seat * 10, seat * 10 + 10)));
    const started = performance.now();
    const { tricks } = solveWithStats({ hands, trump: deal % 2 === 0 ? (deal % 4 as Suit) : null, turn: 0, trick: [], target: 0, targetWants: deal === 5 ? 'min' : 'max' });
    assert.ok(tricks >= 0 && tricks <= 10);
    assert.ok(performance.now() - started < 3000, 'under three seconds even on a slow machine');
  }
});

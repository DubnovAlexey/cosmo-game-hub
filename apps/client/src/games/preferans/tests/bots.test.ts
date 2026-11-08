// Bots: sampling respects what a seat knows, and three bots play whole deals legally from the auction to the score.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCHI, ZERO_SCORE, addScores, applyAction, chooseAction, countCards, createRandom, knowledgeOf, newDeal, nextDeal, sampleHands,
  settle, suitSet, type DealScore, type DealState,
} from '../engine/index.ts';

function playDeal(state: DealState, seed: number): DealState {
  const random = createRandom(seed);
  let current = state;
  let guard = 0;
  while (current.phase !== 'done') {
    current = applyAction(current, chooseAction(current, { random, samples: 4, timeBudgetMs: 60 }));
    guard += 1;
    assert.ok(guard < 200, 'a deal ends');
  }
  return current;
}

test('sampled deals keep known cards, card counts and voids', () => {
  let state = newDeal({ random: createRandom(7) });
  // All pass and play two tricks so that voids may appear.
  for (let i = 0; i < 3; i += 1) state = applyAction(state, { type: 'pass', seat: state.turn! });
  for (let i = 0; i < 9; i += 1) state = applyAction(state, chooseAction(state, { random: createRandom(i), samples: 2 }));
  const knowledge = knowledgeOf(state, 0);
  const random = createRandom(99);
  for (let i = 0; i < 100; i += 1) {
    const hands = sampleHands(knowledge, random);
    assert.ok(hands, 'a consistent deal exists');
    assert.equal(hands[0], state.hands[0], 'own hand is never resampled');
    for (let seat = 0; seat < 3; seat += 1) {
      assert.equal(countCards(hands[seat]), state.hands[seat] === 0 ? 0 : countCards(state.hands[seat]));
      for (let suit = 0; suit < 4; suit += 1) {
        if ((knowledge.voids[seat] >> suit) & 1) assert.equal(suitSet(hands[seat], suit as 0), 0, `seat ${seat} is void in suit ${suit}`);
      }
    }
  }
});

test('a bot with a tiny time budget still answers at once with a legal card (the hard limits of 08.11)', () => {
  // All pass, so the first trick is played by everyone with ten cards: the hardest moment for the solver.
  let state = newDeal({ random: createRandom(4242) });
  for (let i = 0; i < 3; i += 1) state = applyAction(state, { type: 'pass', seat: state.turn! });
  while (state.phase === 'play' && state.trickLead !== null) state = applyAction(state, chooseAction(state, { random: createRandom(1), samples: 2 }));
  assert.equal(state.phase, 'play');
  const started = performance.now();
  const action = chooseAction(state, { random: createRandom(5), samples: 32, timeBudgetMs: 1 });
  assert.ok(performance.now() - started < 1000, 'answers within a second even on a slow machine');
  assert.equal(action.type, 'play');
  assert.ok(applyAction(state, action), 'the card is legal');
});

test('three bots play six deals from the auction to the score; the settlement sums to zero', () => {
  let state = newDeal({ random: createRandom(11) });
  let sheet: DealScore = ZERO_SCORE;
  const modes = new Set<string>();
  for (let deal = 0; deal < 6; deal += 1) {
    const done = playDeal(state, 100 + deal);
    assert.ok(done.result);
    modes.add(done.result.mode);
    if (done.result.played) assert.equal(done.result.tricksWon.reduce((a, b) => a + b, 0), 10);
    sheet = addScores(sheet, done.result.score);
    state = nextDeal(done, { random: createRandom(200 + deal) });
  }
  const balance = settle(sheet, SOCHI);
  assert.ok(Math.abs(balance.reduce((a, b) => a + b, 0)) < 1e-9);
  assert.ok(modes.size >= 1);
});

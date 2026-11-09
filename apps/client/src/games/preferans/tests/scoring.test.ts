// Sochi scoring of single deals (examples from rulespal.com/preference/rulebook) and the final settlement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LENINGRAD, ROSTOV, SOCHI, addScores, allPassPrices, plainTable, rulesForTable, scoreGame, scoreMisere, scoreRaspasy, settle, ZERO_SCORE,
} from '../engine/index.ts';

test('a made six: 2 to the pool; the single whister writes whists for all defensive tricks and answers for the obligation', () => {
  const score = scoreGame({ declarer: 0, level: 6, tricks: [7, 3, 0], whisters: [1], halfWhister: null, played: true }, SOCHI);
  assert.deepEqual(score.pool, [2, 0, 0]);
  assert.equal(score.whists[1][0], 6, '2 × 3 tricks');
  assert.deepEqual(score.mountain, [0, 2, 0], 'defenders took 3 of 4: one missing trick costs 2');
});

test('seven with five tricks: 8 to the mountain, the whister writes 28, the passer gets 8 consolation', () => {
  const score = scoreGame({ declarer: 0, level: 7, tricks: [5, 5, 0], whisters: [1], halfWhister: null, played: true }, SOCHI);
  assert.equal(score.mountain[0], 8);
  assert.equal(score.whists[1][0], 28);
  assert.equal(score.whists[2][0], 8);
  assert.equal(score.pool[0], 0);
});

test('two whisters on six: the one with fewer than two tricks answers for the shortfall', () => {
  const score = scoreGame({ declarer: 0, level: 6, tricks: [7, 3, 0], whisters: [1, 2], halfWhister: null, played: true }, SOCHI);
  assert.deepEqual(score.mountain, [0, 0, 2]);
  assert.equal(score.whists[1][0], 6);
  assert.equal(score.whists[2][0], 0);
});

test('two whisters on eight with no tricks: the second whister pays; a checked ten that fails', () => {
  const eight = scoreGame({ declarer: 0, level: 8, tricks: [10, 0, 0], whisters: [2, 1], halfWhister: null, played: true }, SOCHI);
  assert.deepEqual(eight.mountain, [0, 6, 0], 'seat 1 said whist second');
  const ten = scoreGame({ declarer: 0, level: 10, tricks: [9, 1, 0], whisters: [1, 2], halfWhister: null, played: true }, SOCHI);
  assert.equal(ten.mountain[0], 10);
  assert.equal(ten.whists[1][0], 20, '10 for the trick + 10 consolation');
  assert.equal(ten.whists[2][0], 10);
  assert.deepEqual([ten.mountain[1], ten.mountain[2]], [0, 0], 'nobody answers on a checked ten');
});

test('not played: both passed, or a half-whist', () => {
  const passed = scoreGame({ declarer: 1, level: 7, tricks: [0, 0, 0], whisters: [], halfWhister: null, played: false }, SOCHI);
  assert.deepEqual(passed.pool, [0, 4, 0]);
  const half = scoreGame({ declarer: 1, level: 6, tricks: [0, 0, 0], whisters: [], halfWhister: 0, played: false }, SOCHI);
  assert.deepEqual(half.pool, [0, 2, 0]);
  assert.equal(half.whists[0][1], 4, 'as if the defenders took their two tricks');
});

test('misère and all-pass', () => {
  assert.deepEqual(scoreMisere(2, [5, 2, 3], SOCHI).mountain, [0, 0, 30]);
  assert.deepEqual(scoreMisere(2, [6, 4, 0], SOCHI).pool, [0, 0, 10]);
  const first = scoreRaspasy([0, 4, 6], 0, SOCHI);
  assert.deepEqual(first.pool, [1, 0, 0]);
  assert.deepEqual(first.mountain, [0, 4, 6]);
  assert.deepEqual(scoreRaspasy([0, 4, 6], 1, SOCHI).mountain, [0, 8, 12]);
  assert.deepEqual(scoreRaspasy([0, 4, 6], 7, SOCHI).mountain, [0, 12, 18], 'the progression stops at 3');
});

test('Leningrad: doubled whists and mountain, gentleman whist, half-responsible whister (pref-bridge examples)', () => {
  // [EN] A six one down, one whister, five defensive tricks: the defence writes 5 × 4 + 2 × 4 = 28 and shares it.
  // [RU] Шестерная без одной, один вистующий, пять взяток защиты: защита пишет 5 × 4 + 2 × 4 = 28 и делит пополам.
  const down = scoreGame({ declarer: 0, level: 6, tricks: [5, 5, 0], whisters: [1], halfWhister: null, played: true }, LENINGRAD);
  assert.equal(down.mountain[0], 4, 'one undertrick at the doubled price');
  assert.deepEqual([down.whists[1][0], down.whists[2][0]], [14, 14]);
  const short = scoreGame({ declarer: 0, level: 6, tricks: [7, 3, 0], whisters: [1], halfWhister: null, played: true }, LENINGRAD);
  assert.equal(short.whists[1][0], 12, 'whists doubled: 3 tricks × 4');
  assert.equal(short.mountain[1], 2, 'the missing trick costs the plain price: half of the doubled scale');
  assert.deepEqual(scoreMisere(1, [3, 2, 5], LENINGRAD).mountain, [0, 40, 0], 'a failed misère costs 20 a trick');
  assert.deepEqual(scoreRaspasy([0, 4, 6], 0, LENINGRAD).mountain, [0, 8, 12], 'all-pass tricks cost 2');
  assert.deepEqual(allPassPrices({ ...plainTable(), variant: 'leningrad' }), [2, 4, 6]);
  assert.equal(rulesForTable({ ...plainTable(), variant: 'leningrad' }).whistsPerPoint, 20);
});

test('Rostov: half-price whister, fixed consolation, all-pass in whists without mountain', () => {
  const short = scoreGame({ declarer: 0, level: 6, tricks: [7, 3, 0], whisters: [1], halfWhister: null, played: true }, ROSTOV);
  assert.equal(short.mountain[1], 1, 'the missing trick costs half the price of a six');
  const down = scoreGame({ declarer: 0, level: 7, tricks: [5, 5, 0], whisters: [1], halfWhister: null, played: true }, ROSTOV);
  assert.equal(down.mountain[0], 8);
  assert.deepEqual([down.whists[1][0], down.whists[2][0]], [30, 30], '(4 × 5 + 2 × 10 × 2) shared by both defenders');
  const allPass = scoreRaspasy([1, 4, 5], 0, ROSTOV);
  assert.deepEqual(allPass.mountain, [0, 0, 0], 'no mountain on a Rostov all-pass');
  assert.deepEqual(allPass.whists[0], [0, 20, 25], 'the fewest tricks write 5 whists per trick of each opponent');
  const tie = scoreRaspasy([3, 3, 4], 0, ROSTOV);
  assert.deepEqual([tie.whists[0][2], tie.whists[1][2], tie.whists[0][1]], [10, 10, 0], 'two with the fewest share the whists on the third');
  assert.deepEqual(scoreRaspasy([0, 5, 5], 3, ROSTOV).pool, [1, 0, 0], 'no tricks: one point into the pool, no progression');
});

test('the final settlement sums to zero and turns mountain into whists', () => {
  const sheet = addScores(addScores(ZERO_SCORE,
    scoreGame({ declarer: 0, level: 7, tricks: [5, 5, 0], whisters: [1], halfWhister: null, played: true }, SOCHI)),
  scoreRaspasy([0, 4, 6], 0, SOCHI));
  const balance = settle(sheet, SOCHI);
  assert.ok(Math.abs(balance[0] + balance[1] + balance[2]) < 1e-9);
  assert.ok(balance[1] > 0 && balance[0] < 0, 'the whister wins, the failed declarer loses');
});

// FILE: shared/tests/random.test.ts — the seeded random generator every game engine relies on:
// the same seed must give the same sequence (replays, shared deals, exact tests), shuffles must be permutations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom, randomInt, shuffled } from '../engine/random.ts';

test('the same seed gives the same sequence; another seed gives another one', () => {
  const take = (seed: number) => { const random = createRandom(seed); return Array.from({ length: 8 }, random); };
  assert.deepEqual(take(42), take(42));
  assert.notDeepEqual(take(42), take(43));
  for (const value of take(7)) assert.ok(value >= 0 && value < 1);
});

test('a shuffle is a permutation and leaves the input untouched', () => {
  const input = Array.from({ length: 32 }, (_, index) => index);
  const output = shuffled(input, createRandom(1));
  assert.deepEqual([...output].sort((a, b) => a - b), input);
  assert.notDeepEqual(output, input);
  assert.deepEqual(input, Array.from({ length: 32 }, (_, index) => index));
});

test('random integers stay inside their range and cover it', () => {
  const random = createRandom(5);
  const seen = new Set<number>();
  for (let i = 0; i < 400; i += 1) {
    const value = randomInt(random, 6);
    assert.ok(Number.isInteger(value) && value >= 0 && value < 6);
    seen.add(value);
  }
  assert.equal(seen.size, 6);
});

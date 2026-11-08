// The score sheet as written on paper: running totals per band, one entry per deal that changed it, and the
// entries of the last deal marked fresh so the table can show what was just written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addScores, ZERO_SCORE, type DealScore } from '../engine/index.ts';
import { bandTotal, buildSheetHistory, isFresh, playerChanged } from '../components/sheetHistory.ts';
import type { DealLogEntry } from '../hooks/usePreferans';

const score = (pool: number[], mountain: number[], whists: number[][]): DealScore => ({ pool, mountain, whists });
const entry = (number: number, deal: DealScore) => ({ number, dealer: 0, result: { score: deal } }) as unknown as DealLogEntry;

const LOG: DealLogEntry[] = [
  entry(1, score([2, 0, 0], [0, 0, 0], [[0, 0, 0], [4, 0, 0], [4, 0, 0]])), // You make a six; both defenders write 4 on you
  entry(2, score([0, 0, 0], [0, 1, 2], [[0, 0, 0], [0, 0, 0], [0, 0, 0]])), // all-pass: Orion 1, Vega 2 in the mountain
  entry(3, score([4, 0, 0], [0, 0, 0], [[0, 0, 0], [8, 0, 0], [0, 0, 0]])), // You make a seven; Orion writes 8 on you
];

test('every band keeps running totals, one entry per deal that changed it', () => {
  const history = buildSheetHistory(LOG);
  assert.deepEqual(history.pool[0], [{ deal: 1, total: 2 }, { deal: 3, total: 6 }]);
  assert.deepEqual(history.pool[1], [], 'nothing written, nothing shown');
  assert.deepEqual(history.mountain[2], [{ deal: 2, total: 2 }]);
  assert.deepEqual(history.whists[1][0], [{ deal: 1, total: 4 }, { deal: 3, total: 12 }]);
  assert.equal(history.lastDeal, 3);
});

test('the last value of every band equals the summed score sheet', () => {
  const history = buildSheetHistory(LOG);
  const sheet = LOG.reduce((sum, item) => addScores(sum, item.result.score), ZERO_SCORE);
  for (let seat = 0; seat < 3; seat += 1) {
    assert.equal(bandTotal(history.pool[seat]), sheet.pool[seat]);
    assert.equal(bandTotal(history.mountain[seat]), sheet.mountain[seat]);
    for (let target = 0; target < 3; target += 1) if (target !== seat) assert.equal(bandTotal(history.whists[seat][target]), sheet.whists[seat][target]);
  }
});

test('what the last deal wrote is fresh; an empty sheet has nothing fresh', () => {
  const history = buildSheetHistory(LOG);
  assert.equal(isFresh(history.pool[0], history.lastDeal), true);
  assert.equal(isFresh(history.mountain[2], history.lastDeal), false, 'written two deals ago');
  assert.equal(playerChanged(history, 1), true, 'Orion wrote whists in the last deal');
  assert.equal(playerChanged(history, 2), false);
  const empty = buildSheetHistory([]);
  assert.equal(empty.lastDeal, 0);
  assert.equal(playerChanged(empty, 0), false);
});

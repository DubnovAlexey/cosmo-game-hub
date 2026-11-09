// [EN] FILE: games/preferans/tests/table-two.test.ts — two at the table («гусарик» with a dummy): the dummy passes by
//      itself, a lone defender whists open and plays the dummy's cards, an all-pass is dealt again, the settlement of
//      two takes the smaller mountain from the larger.
// [RU] ФАЙЛ: вдвоём за столом (гусарик с болваном): болван пасует сам, одинокий защитник вистует в светлую и играет
//      картами болвана, на общий пас карты сдаются заново, расчёт вдвоём вычитает меньшую гору из большей.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SOCHI, applyAction, chooseAction, controllerOf, createRandom, customizeRules, isHandVisible, legalActions, newDeal,
  seatingFor, settleDuel, sheetWidth, tableScore, type DealScore, type DealState,
} from '../engine/index.ts';

const TWO = customizeRules(SOCHI, { dummySeat: 2 });

test('seating of two: you and the opponent deal in turn, the dummy sits in deal seat 2', () => {
  assert.deepEqual(seatingFor(2, 0), { players: [0, 1, 2], sittingOut: null, dealSeat: 0 });
  assert.equal(seatingFor(2, 1).dealSeat, 1);
  assert.equal(seatingFor(2, 2).dealSeat, 0, 'the dummy never deals');
  assert.equal(sheetWidth(2), 3, 'the sheet keeps the dummy column');
});

test('the dummy passes by itself; when both live players pass the cards are dealt again', () => {
  // Dealer 1: the first hand is deal seat 2 — the dummy speaks at once and passes.
  let state: DealState = newDeal({ rules: TWO, dealer: 1, random: createRandom(4) });
  assert.equal(state.turn, 0);
  assert.equal(state.bidding.passed[2], true);
  state = applyAction(state, { type: 'pass', seat: 0 });
  state = applyAction(state, { type: 'pass', seat: 1 });
  assert.equal(state.phase, 'done');
  assert.equal(state.result?.redeal, true, 'no all-pass is played by two');
  assert.deepEqual(state.result?.score.pool, [0, 0, 0]);
});

test('a lone defender whists open and plays the dummy cards; the dummy column stays empty', () => {
  let state: DealState = newDeal({ rules: TWO, dealer: 0, random: createRandom(8) });
  const first = (type: string) => legalActions(state).find(action => action.type === type)!;
  assert.equal(state.turn, 1);
  state = applyAction(state, first('bid')); // the opponent bids the lowest game; the dummy passes
  state = applyAction(state, { type: 'pass', seat: 0 });
  assert.equal(state.phase, 'discard');
  state = applyAction(state, first('discard'));
  state = applyAction(state, first('declare'));
  assert.equal(state.phase, 'whist');
  assert.equal(state.turn, 0, 'the dummy has already passed the whist');
  state = applyAction(state, { type: 'whist', seat: 0, call: 'whist' });
  assert.equal(state.phase, 'play', 'no open-or-closed question: two at the table always whist open');
  assert.equal(state.openHands, true);
  assert.equal(controllerOf(state, 2), 0, 'you play the dummy cards');
  assert.equal(isHandVisible(state, 2, 0), true);
  const random = createRandom(9);
  while (state.phase !== 'done') state = applyAction(state, chooseAction(state, { random, samples: 2, timeBudgetMs: 20 }));
  const sheet = tableScore(state.result!, seatingFor(2, 0), 2, TWO, 0);
  assert.deepEqual(sheet.whists[2], [0, 0, 0], 'whatever the dummy would write goes to the live defender');
});

test('the settlement of two: the smaller mountain is taken from the larger, and it sums to zero', () => {
  const sheet: DealScore = { pool: [10, 6, 0], mountain: [4, 10, 0], whists: [[0, 20, 0], [30, 0, 0], [0, 0, 0]] };
  const point = SOCHI.whistsPerPoint;
  assert.deepEqual(settleDuel(sheet, SOCHI), [-10 + point * 6, 10 - point * 6, 0]);
  // The pool is closed into the mountain first: the opponent lacks 4 of 10.
  const closed = settleDuel(sheet, SOCHI, 10);
  assert.deepEqual(closed, [-10 + point * 10, 10 - point * 10, 0]);
  assert.equal(closed[0] + closed[1], 0);
});

test('two bots and the dummy play whole deals; the dummy never declares', () => {
  const random = createRandom(31);
  for (let dealer = 0; dealer < 6; dealer += 1) {
    const seating = seatingFor(2, dealer);
    let state = newDeal({ rules: TWO, dealer: seating.dealSeat, random });
    let guard = 0;
    while (state.phase !== 'done') {
      state = applyAction(state, chooseAction(state, { random, samples: 2, timeBudgetMs: 20 }));
      guard += 1;
      assert.ok(guard < 200, 'a deal ends');
    }
    const result = state.result!;
    assert.notEqual(result.declarer, 2);
    if (result.played) assert.equal(result.tricksWon.reduce((a, b) => a + b, 0), 10);
    assert.equal(tableScore(result, seating, 2, TWO, 0).pool.length, 3);
  }
});

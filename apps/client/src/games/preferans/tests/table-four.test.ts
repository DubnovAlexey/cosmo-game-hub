// [EN] FILE: games/preferans/tests/table-four.test.ts — four at the table: the dealer sits on the talon. Seating of the
//      deals, the talon taking tricks for the dealer on all-pass, what the dealer writes, the settlement of four.
// [RU] ФАЙЛ: вчетвером за столом — сдающий сидит на прикупе. Рассадка раздач, прикуп берёт взятки за сдающего на
//      распасах, что пишет сдающий, итог на четверых.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FULL_DECK, SOCHI, addScores, applyAction, chooseAction, createRandom, customizeRules, newDeal, parseCards, scoreGame,
  seatingFor, settle, tableScore, type DealResult, type DealScore, type DealState,
} from '../engine/index.ts';

const FOUR = customizeRules(SOCHI, { talonTakesTricks: true });

test('seating: the dealer sits out, the others play clockwise from his left, you keep deal seat 0', () => {
  assert.deepEqual(seatingFor(4, 3).players, [0, 1, 2]);
  assert.equal(seatingFor(4, 3).sittingOut, 3);
  assert.deepEqual(seatingFor(4, 0).players, [1, 2, 3], 'you deal: the three opponents play');
  const one = seatingFor(4, 1);
  assert.deepEqual(one.players, [0, 2, 3]);
  // The first hand of the deal (after the deal seat that deals) is the dealer's left neighbour, player 2.
  assert.equal(one.players[(one.dealSeat + 1) % 3], 2);
  assert.deepEqual(seatingFor(3, 2), { players: [0, 1, 2], sittingOut: null, dealSeat: 2 });
});

test('all-pass at four: a talon card nobody beats takes the trick for the dealer', () => {
  // The talon holds the ace of spades and the ace of hearts: nobody can beat either.
  const talon = parseCards('A♠ A♥');
  const rest = FULL_DECK.filter(card => !talon.includes(card));
  let state: DealState = newDeal({ rules: FOUR, deck: [...rest, ...talon] });
  for (let i = 0; i < 3; i += 1) state = applyAction(state, { type: 'pass', seat: state.turn! });
  const random = createRandom(3);
  while (state.phase !== 'done') state = applyAction(state, chooseAction(state, { random, samples: 2, timeBudgetMs: 20 }));
  const result = state.result!;
  assert.equal(result.talonTricks, 2, 'both talon tricks go to the dealer');
  assert.equal(result.tricksWon.reduce((a, b) => a + b, 0), 8, 'the players share the other eight tricks');
  const sheet = tableScore(result, seatingFor(4, 3), 4, FOUR, 0);
  assert.equal(sheet.mountain[3], 2, 'the dealer writes his two tricks into the mountain at the price of 1');
});

test('the dealer writes consolation on a failed game; the settlement of four sums to zero', () => {
  const score = scoreGame({ declarer: 0, level: 7, tricks: [5, 5, 0], whisters: [1], halfWhister: null, played: true }, SOCHI);
  const result: DealResult = {
    mode: 'game', declarer: 0, contract: { kind: 'game', level: 7, strain: 0 }, played: true, tricksWon: [5, 5, 0],
    whisters: [1], halfWhister: null, score,
  };
  const seating = seatingFor(4, 3); // players 0, 1, 2 play; 3 deals
  const sheet = tableScore(result, seating, 4, SOCHI, 0);
  assert.equal(sheet.whists[3][0], 8, 'two undertricks × the price of a seven');
  assert.equal(sheet.whists[1][0], 28);
  const balance = settle(addScores(sheet, ZERO4), SOCHI);
  assert.equal(balance.length, 4);
  assert.ok(Math.abs(balance.reduce((a, b) => a + b, 0)) < 1e-9);
});

test('three bots and a dealer on the talon play whole deals at a table of four', () => {
  const random = createRandom(21);
  for (let dealer = 0; dealer < 4; dealer += 1) {
    const seating = seatingFor(4, dealer);
    let state = newDeal({ rules: FOUR, dealer: seating.dealSeat, random });
    let guard = 0;
    while (state.phase !== 'done') {
      state = applyAction(state, chooseAction(state, { random, samples: 2, timeBudgetMs: 20 }));
      guard += 1;
      assert.ok(guard < 200, 'a deal ends');
    }
    const result = state.result!;
    if (result.played) assert.equal(result.tricksWon.reduce((a, b) => a + b, 0) + (result.talonTricks ?? 0), 10);
    assert.equal(tableScore(result, seating, 4, FOUR, 0).pool.length, 4);
  }
});

const ZERO4: DealScore = { pool: [0, 0, 0, 0], mountain: [0, 0, 0, 0], whists: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] };

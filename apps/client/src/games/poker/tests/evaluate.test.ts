// [EN] FILE: games/poker/tests/evaluate.test.ts — our hand evaluator against poker's exact numbers: all 2 598 960
//      five-card hands fall into the nine categories exactly as combinatorics says (40 straight flushes, 624 quads …),
//      and the tricky comparisons hold: the wheel, the board playing, kickers, two trips, flush over straight.
// [RU] ФАЙЛ: наша оценка руки против точных чисел покера: все 2 598 960 пятикарточных рук ложатся в девять категорий
//      ровно так, как говорит комбинаторика (40 стрит-флешей, 624 каре …), и держатся хитрые сравнения: «колесо»,
//      игра доски, кикеры, два сета, флеш выше стрита.
import assert from 'node:assert/strict';
import test from 'node:test';
import { FULL_DECK, parseCards } from '../engine/cards.ts';
import {
  FLUSH, FULL_HOUSE, HIGH_CARD, PAIR, QUADS, STRAIGHT, STRAIGHT_FLUSH, TRIPS, TWO_PAIR, bestFive, categoryOf, describe, evaluate,
} from '../engine/evaluate.ts';

const value = (text: string) => evaluate(parseCards(text));

test('all 2 598 960 five-card hands: exactly the textbook counts', () => {
  const counts = new Array(9).fill(0);
  const hand = [0, 0, 0, 0, 0];
  const deck = FULL_DECK;
  for (let a = 0; a < 52; a += 1) for (let b = a + 1; b < 52; b += 1) for (let c = b + 1; c < 52; c += 1)
    for (let d = c + 1; d < 52; d += 1) for (let e = d + 1; e < 52; e += 1) {
      hand[0] = deck[a]; hand[1] = deck[b]; hand[2] = deck[c]; hand[3] = deck[d]; hand[4] = deck[e];
      counts[categoryOf(evaluate(hand))] += 1;
    }
  assert.deepEqual(counts, [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40]);
});

test('categories and their names', () => {
  assert.equal(categoryOf(value('As Ks Qs Js Ts')), STRAIGHT_FLUSH);
  assert.equal(categoryOf(value('9c 9d 9h 9s 2c')), QUADS);
  assert.equal(categoryOf(value('Kc Kd Kh 7s 7c')), FULL_HOUSE);
  assert.equal(categoryOf(value('2h 7h 9h Jh Ah')), FLUSH);
  assert.equal(categoryOf(value('5c 6d 7h 8s 9c')), STRAIGHT);
  assert.equal(categoryOf(value('Qc Qd Qh 3s 9c')), TRIPS);
  assert.equal(categoryOf(value('Jc Jd 4h 4s Ac')), TWO_PAIR);
  assert.equal(categoryOf(value('Tc Td 4h 8s Ac')), PAIR);
  assert.equal(categoryOf(value('2c 5d 9h Js Kc')), HIGH_CARD);
  assert.deepEqual(describe(value('Kc Kd Kh 7s 7c')).ranks.slice(0, 2), [11, 5], 'kings full of sevens');
});

test('the wheel is the lowest straight, the board can play, kickers decide', () => {
  const wheel = value('As 2d 3h 4s 5c');
  const sixHigh = value('2d 3h 4s 5c 6d');
  assert.equal(categoryOf(wheel), STRAIGHT);
  assert.ok(sixHigh > wheel, 'a six-high straight beats the wheel');
  assert.ok(value('Ah Kh Qh Jh 9h') > value('Ad Kd Qc Jd Td'), 'a flush beats a straight');
  // Seven cards: the best five are chosen.
  assert.equal(categoryOf(value('As 2d 3h 4s 5c Kd Kh')), STRAIGHT, 'a straight beats the pair of kings in the same cards');
  assert.equal(categoryOf(value('As 2s 3s 4s 5s 6d 6h')), STRAIGHT_FLUSH, 'a steel wheel');
  // The board plays: both players have the same best five.
  const board = '5c 6d 7h 8s 9c';
  assert.equal(value(`${board} 2c 2d`), value(`${board} 3c 3h`), 'the board straight splits the pot');
  // A higher kicker wins.
  assert.ok(value('Ac Ad Ks 7h 2c 3d 9h') > value('Ac Ad Qs 7h 2c 3d 9h'));
  // Two trips make a full house with the higher trips on top.
  assert.deepEqual(describe(value('9c 9d 9h 4s 4c 4d Ah')).ranks.slice(0, 2), [7, 2]);
  // Three pairs: the third pair's rank is only a kicker.
  assert.equal(value('Kc Kd 8h 8s 3c 3d Ah'), value('Kh Ks 8c 8d 5c 5d Ac'));
  // Quads with the best kicker from the rest.
  assert.ok(value('7c 7d 7h 7s Ac 2d 2h') > value('7c 7d 7h 7s Kc Qd Qh'));
});

test('the best five cards are found for the showdown', () => {
  const cards = parseCards('As Ks 2d Qs 9h Js Ts');
  const five = bestFive(cards);
  assert.equal(five.length, 5);
  assert.equal(evaluate(five), evaluate(cards));
  assert.equal(categoryOf(evaluate(five)), STRAIGHT_FLUSH);
});

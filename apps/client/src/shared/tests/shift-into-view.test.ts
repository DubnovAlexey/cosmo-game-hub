// [EN] FILE: shared/tests/shift-into-view.test.ts — a caption that opens beside a portrait stays on the screen: a box
//      inside is left alone, a box past an edge moves back by exactly the overhang plus the margin, a box wider than
//      the screen keeps its left edge in sight.
// [RU] ФАЙЛ: подпись, которая раскрывается рядом с портретом, остаётся на экране: рамку внутри никто не трогает,
//      рамка за краем возвращается ровно на выступ плюс поле, рамка шире экрана оставляет на виду левый край.
import assert from 'node:assert/strict';
import test from 'node:test';
import { shiftIntoView } from '../utils/shiftIntoView.ts';

test('a caption inside the screen is not moved', () => {
  assert.equal(shiftIntoView(40, 300, 393), 0);
  assert.equal(shiftIntoView(8, 385, 393), 0, 'it may touch the margins');
});

test('a caption past the right edge moves left by the overhang and the margin', () => {
  // The top seat of a phone 393 px wide: the biography is 310 px wide and starts at 95 px.
  const shift = shiftIntoView(95, 405, 393);
  assert.equal(shift, -20);
  assert.equal(405 + shift, 393 - 8);
});

test('a caption past the left edge moves right', () => {
  // A seat at the left edge: the line is centred under it and starts 70 px before the screen.
  const shift = shiftIntoView(-70, 170, 393);
  assert.equal(shift, 78);
  assert.equal(-70 + shift, 8);
});

test('a caption wider than the screen keeps its left edge in sight', () => {
  assert.equal(shiftIntoView(30, 430, 320), -22);
  assert.equal(shiftIntoView(-40, 360, 320), 48);
});

test('the margin can be changed', () => {
  assert.equal(shiftIntoView(100, 400, 393, 0), -7);
  assert.equal(shiftIntoView(100, 400, 393, 16), -23);
});

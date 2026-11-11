// [EN] FILE: shared/tests/place-beside.test.ts — a hero's card beside a small portrait: to the right when there is
//      room, else to the left, on a phone under or over it, and never past the screen; a portrait of a list that
//      grows into its card starts the card at its own corner.
// [RU] ФАЙЛ: карточка героя рядом с маленьким портретом: справа, если есть место, иначе слева, на телефоне — под или
//      над ним, и никогда за экраном; портрет списка, который вырастает в карточку, начинает её от своего угла.
import assert from 'node:assert/strict';
import test from 'node:test';
import { placeBeside, placeOver } from '../utils/placeBeside.ts';

const SCREEN = { width: 1366, height: 768 };
const CARD = { width: 470, height: 300 };

test('the card stands to the right of the portrait when there is room', () => {
  const place = placeBeside({ left: 300, top: 300, right: 378, bottom: 400 }, CARD, SCREEN);
  assert.deepEqual(place, { left: 388, top: 200 });
});

test('near the right edge it stands to the left', () => {
  const place = placeBeside({ left: 1200, top: 300, right: 1278, bottom: 400 }, CARD, SCREEN);
  assert.equal(place.left, 1200 - 10 - 470);
});

test('it never leaves the screen at the top or the bottom', () => {
  assert.equal(placeBeside({ left: 300, top: 0, right: 378, bottom: 60 }, CARD, SCREEN).top, 8);
  assert.equal(placeBeside({ left: 300, top: 720, right: 378, bottom: 768 }, CARD, SCREEN).top, 768 - 8 - 300);
});

test('on a phone it goes under the portrait, or over it near the bottom, inside the screen', () => {
  const phone = { width: 393, height: 852 };
  const card = { width: 310, height: 420 };
  const under = placeBeside({ left: 20, top: 100, right: 98, bottom: 190 }, card, phone);
  assert.deepEqual(under, { left: 8, top: 200 });
  const over = placeBeside({ left: 300, top: 600, right: 378, bottom: 690 }, card, phone);
  assert.equal(over.left, 393 - 8 - 310);
  assert.equal(over.top, 600 - 10 - 420);
});

test('a card taller than the screen keeps its top in sight', () => {
  assert.equal(placeBeside({ left: 300, top: 300, right: 378, bottom: 400 }, { width: 400, height: 900 }, SCREEN).top, 8);
});

test('a portrait that grows into its card starts it at its own corner and keeps it on the screen', () => {
  assert.deepEqual(placeOver({ left: 300, top: 300, right: 378, bottom: 400 }, CARD, SCREEN), { left: 286, top: 286 });
  // [EN] Near the right and the bottom edges the card moves back onto the screen. [RU] У правого и нижнего края карточка отходит обратно на экран.
  assert.deepEqual(placeOver({ left: 1250, top: 700, right: 1328, bottom: 768 }, CARD, SCREEN), { left: 1366 - 8 - 470, top: 768 - 8 - 300 });
  assert.deepEqual(placeOver({ left: 2, top: 2, right: 80, bottom: 100 }, CARD, SCREEN), { left: 8, top: 8 });
});

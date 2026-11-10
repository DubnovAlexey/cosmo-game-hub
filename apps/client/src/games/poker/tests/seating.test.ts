// [EN] FILE: games/poker/tests/seating.test.ts — who sits where at the poker table: you at the bottom, the others
//      clockwise; on a phone every player gets a place of the grid of its own, the two sides stay balanced and the
//      places go round the table in the same clockwise order as the oval.
// [RU] ФАЙЛ: кто где сидит за покерным столом: вы внизу, остальные по часовой стрелке; на телефоне у каждого игрока
//      своё место сетки, две стороны уравновешены, а места идут вокруг стола в том же порядке по часовой стрелке,
//      что и на овале.
import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_SEATS, MIN_SEATS, seating, type SeatArea } from '../components/seating.ts';

const COUNTS = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, index) => MIN_SEATS + index);

test('you sit at the bottom, alone on your side', () => {
  for (const count of COUNTS) for (const narrow of [false, true]) {
    const places = seating(count, narrow);
    assert.equal(places.length, count);
    assert.equal(places[0].side, 'south');
    assert.equal(places[0].area, 's');
    assert.ok(Math.abs(places[0].x - 50) < 1e-9 && places[0].y > 80, 'the bottom of the oval');
    for (const place of places.slice(1)) {
      assert.notEqual(place.side, 'south', `${count} players: nobody else sits on your side`);
      assert.notEqual(place.area, 's');
    }
  }
});

test('the phone grid gives everybody a place of their own', () => {
  for (const count of COUNTS) {
    const areas = seating(count).map(place => place.area);
    assert.equal(new Set(areas).size, count, `${count} players: ${areas.join(' ')}`);
  }
});

test('the phone grid goes clockwise, like the oval and like the action', () => {
  const clockwise: readonly SeatArea[] = ['s', 'sw', 'nw', 'n', 'ne', 'se'];
  for (const count of COUNTS) {
    const order = seating(count).map(place => clockwise.indexOf(place.area));
    for (let index = 1; index < order.length; index += 1) assert.ok(order[index] > order[index - 1], `${count} players: ${order.join(' ')}`);
  }
});

test('both sides of the phone grid hold the same number of players', () => {
  for (const count of COUNTS) {
    const areas = seating(count).map(place => place.area);
    const left = areas.filter(area => area === 'sw' || area === 'nw').length;
    const right = areas.filter(area => area === 'se' || area === 'ne').length;
    assert.equal(left, right, `${count} players: ${areas.join(' ')}`);
  }
});

test('on the oval the next player sits on your left and the sides mirror each other', () => {
  for (const count of COUNTS.filter(seats => seats >= 3)) {
    const places = seating(count);
    assert.ok(places[1].x < 50, `${count} players: the next to act sits on the left`);
    assert.ok(places[count - 1].x > 50, `${count} players: the last to act sits on the right`);
    for (let index = 1; index < count; index += 1) {
      const mirror = places[count - index];
      assert.ok(Math.abs(places[index].x + mirror.x - 100) < 1e-9 && Math.abs(places[index].y - mirror.y) < 1e-9, `${count} players: seat ${index} mirrors seat ${count - index}`);
    }
  }
});

test('a narrow screen pulls the side seats in, the cards of a side seat lie toward the middle', () => {
  for (const count of COUNTS.filter(seats => seats >= 3)) {
    const wide = seating(count, false);
    const narrow = seating(count, true);
    for (let index = 1; index < count; index += 1) {
      assert.ok(Math.abs(narrow[index].x - 50) <= Math.abs(wide[index].x - 50) + 1e-9);
      if (wide[index].side === 'west') assert.ok(wide[index].x < 50);
      if (wide[index].side === 'east') assert.ok(wide[index].x > 50);
    }
  }
});

test('a table of a wrong size is brought into two to six', () => {
  assert.equal(seating(1).length, MIN_SEATS);
  assert.equal(seating(9).length, MAX_SEATS);
  assert.equal(seating(3.4).length, 3);
});

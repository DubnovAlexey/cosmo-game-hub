// [EN] FILE: games/poker/tests/seating.test.ts — who sits where at the poker table, on a computer and on a phone: you
//      at the bottom, everybody on a place of the grid of their own, the places go round the table clockwise like
//      the action, the two sides hold the same number of players, and a phone never uses the places beside the
//      board (the board takes its whole width).
// [RU] ФАЙЛ: кто где сидит за покерным столом, на компьютере и на телефоне: вы внизу, у каждого своё место сетки,
//      места идут вокруг стола по часовой стрелке, как ход, на двух сторонах поровну игроков, а телефон никогда не
//      занимает места рядом с доской (доска занимает всю его ширину).
import assert from 'node:assert/strict';
import test from 'node:test';
import { CLOCKWISE, MAX_SEATS, MIN_SEATS, seating, type SeatArea, type SeatPlace } from '../components/seating.ts';

const COUNTS = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, index) => MIN_SEATS + index);
const SCREENS: readonly (keyof SeatPlace)[] = ['wide', 'phone'];
const LEFT: readonly SeatArea[] = ['sw', 'w', 'nw'];
const RIGHT: readonly SeatArea[] = ['ne', 'e', 'se'];

test('you sit at the bottom, and nobody else does', () => {
  for (const count of COUNTS) for (const screen of SCREENS) {
    const areas = seating(count).map(place => place[screen]);
    assert.equal(areas.length, count);
    assert.equal(areas[0], 's');
    assert.ok(!areas.slice(1).includes('s'), `${count} players, ${screen}: ${areas.join(' ')}`);
  }
});

test('everybody has a place of the grid of their own', () => {
  for (const count of COUNTS) for (const screen of SCREENS) {
    const areas = seating(count).map(place => place[screen]);
    assert.equal(new Set(areas).size, count, `${count} players, ${screen}: ${areas.join(' ')}`);
  }
});

test('the places go round the table clockwise, like the action', () => {
  for (const count of COUNTS) for (const screen of SCREENS) {
    const order = seating(count).map(place => CLOCKWISE.indexOf(place[screen]));
    for (let index = 1; index < order.length; index += 1) assert.ok(order[index] > order[index - 1], `${count} players, ${screen}: ${order.join(' ')}`);
  }
});

test('both sides of the table hold the same number of players', () => {
  for (const count of COUNTS) for (const screen of SCREENS) {
    const areas = seating(count).map(place => place[screen]);
    assert.equal(areas.filter(area => LEFT.includes(area)).length, areas.filter(area => RIGHT.includes(area)).length, `${count} players, ${screen}: ${areas.join(' ')}`);
  }
});

test('with three or more the next to act sits on your left, the last on your right', () => {
  for (const count of COUNTS.filter(seats => seats >= 3)) for (const screen of SCREENS) {
    const areas = seating(count).map(place => place[screen]);
    assert.ok(LEFT.includes(areas[1]), `${count} players, ${screen}`);
    assert.ok(RIGHT.includes(areas[count - 1]), `${count} players, ${screen}`);
  }
});

test('a phone keeps the places beside the board free, a computer the corners beside you', () => {
  for (const count of COUNTS) {
    const places = seating(count);
    for (const place of places) {
      assert.ok(place.phone !== 'w' && place.phone !== 'e', `${count} players: the board of a phone takes the whole width`);
      assert.ok(place.wide !== 'sw' && place.wide !== 'se', `${count} players: on a computer the near corners stay free`);
    }
  }
});

test('a table of a wrong size is brought into two to six', () => {
  assert.equal(seating(1).length, MIN_SEATS);
  assert.equal(seating(9).length, MAX_SEATS);
  assert.equal(seating(3.4).length, 3);
});

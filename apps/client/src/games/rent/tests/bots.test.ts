// [EN] FILE: games/rent/tests/bots.test.ts — whole games of «Blood Rent» played by bots alone, two to six at the
//      table, with and without auctions: every decision is legal, nobody's cash goes below zero, the buildings stay
//      even, a pawned estate has no modules, nothing belongs to a bankrupt, and every game comes to an end. A bot
//      buys what completes its sector and does not walk into a debt it could have avoided.
// [RU] ФАЙЛ: целые партии «Кровной ренты» одних ботов, от двух до шести за столом, с аукционами и без: каждое решение
//      правильное, ни у кого деньги не уходят ниже нуля, постройки ровные, у заложенного владения нет модулей, у
//      банкрота ничего нет, и каждая партия доходит до конца. Бот покупает то, что закрывает его сектор.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_OPTIONS, SECTOR_SQUARES, act, actor, chooseRentAction, createRandom, newRentGame, worthTo, type RentManner, type RentState,
} from '../engine/index.ts';

const MANNERS: readonly RentManner[] = [
  { greed: 0.2, building: 0.3, caution: 0.8 }, { greed: 0.8, building: 0.8, caution: 0.2 }, { greed: 0.5, building: 0.5, caution: 0.5 },
  { greed: 0.9, building: 0.2, caution: 0.6 }, { greed: 0.3, building: 0.9, caution: 0.3 }, { greed: 0.6, building: 0.6, caution: 0.9 },
];

function check(state: RentState): void {
  state.players.forEach((player, index) => {
    assert.ok(player.cash >= 0, `player ${index}: ${player.cash} credits`);
    if (player.bankrupt) assert.ok(state.owner.every(owner => owner !== index), `bankrupt ${index} still owns something`);
  });
  for (const squares of Object.values(SECTOR_SQUARES)) {
    const levels = squares.map(square => state.level[square]);
    assert.ok(Math.max(...levels) - Math.min(...levels) <= 1, `uneven building ${levels}`);
    assert.ok(levels.every(level => level >= 0 && level <= 5));
    if (Math.max(...levels) > 0) assert.ok(squares.every(square => !state.pawned[square] && state.owner[square] === state.owner[squares[0]]), 'modules on a broken or pawned sector');
  }
}

function playOut(players: number, seed: number, auction: boolean): { state: RentState; steps: number } {
  const random = createRandom(seed);
  let state = newRentGame(players, random, { ...DEFAULT_OPTIONS, auction, roundLimit: 60 });
  let steps = 0;
  while (state.phase.kind !== 'over') {
    const action = chooseRentAction(state, MANNERS[actor(state) % MANNERS.length]);
    state = act(state, action, random);
    check(state);
    steps += 1;
    if (steps > 20000) throw new Error(`seed ${seed}: the game does not end`);
  }
  return { state, steps };
}

test('bots play whole games of two to six without a single illegal decision', () => {
  let bankruptcies = 0;
  let games = 0;
  for (let seed = 1; seed <= 30; seed += 1) {
    const players = 2 + (seed % 5);
    const { state } = playOut(players, seed, seed % 3 !== 0);
    assert.ok(state.winner !== null, `seed ${seed}: no winner`);
    assert.equal(state.players[state.winner].bankrupt, false);
    bankruptcies += state.players.filter(player => player.bankrupt).length;
    games += 1;
  }
  // [EN] The rents bite: in thirty games somebody goes bankrupt. [RU] Ренты кусаются: за тридцать партий кто-то разоряется.
  assert.ok(bankruptcies > games / 2, `only ${bankruptcies} bankruptcies in ${games} games`);
});

test('an estate that completes one\'s own sector is worth more than one that does not', () => {
  const [a, b] = SECTOR_SQUARES.scrapyard;
  const game = newRentGame(3, createRandom(1));
  const half = { ...game, owner: game.owner.map((owner, square) => (square === a ? 0 : owner)) };
  const manner = { greed: 0.5, building: 0.5, caution: 0.5 };
  assert.ok(worthTo(half, 0, b, manner) > worthTo(game, 0, b, manner));
  assert.ok(worthTo(half, 1, b, manner) > worthTo(game, 1, b, manner), 'breaking somebody else\'s sector is worth something too');
});

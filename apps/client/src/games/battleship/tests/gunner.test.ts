// [EN] FILE: games/battleship/tests/gunner.test.ts — the computer gunner: it shoots only where a shot is allowed and
//      never reads the ships, finishes a wounded ship, the stronger level needs fewer shots than the weaker one, the
//      same seed repeats the same battle, and two gunners always bring a battle to its end.
// [RU] ФАЙЛ: компьютерный наводчик: стреляет только туда, куда можно, и никогда не читает корабли, добивает раненый
//      корабль, сильный уровень тратит меньше выстрелов, чем слабый, одно и то же зерно повторяет тот же бой, а два
//      наводчика всегда доводят бой до конца.
import assert from 'node:assert/strict';
import test from 'node:test';
// [EN] A relative path on purpose: Node runs the tests directly and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает тесты напрямую и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';
import { GUNNER_LEVELS, chooseShot, likelihoods, type GunnerLevel } from '../engine/ai/gunner.ts';
import { fire, newBattle, otherSeat, type BattleState } from '../engine/battle.ts';
import { HIT, MISS, UNKNOWN, afloat, allSunk, canShoot, cellAt, emptySide, randomFleet, shootAt, type Mark } from '../engine/board.ts';
import { CLASSIC, WESTERN, type BattleRules } from '../engine/rules.ts';

const at = (row: number, column: number): number => cellAt(row, column, 10);

/** Shots a gunner needs to sink `fleets` random fleets, on average. */
function averageShots(level: GunnerLevel, rules: BattleRules, fleets: number): number {
  let total = 0;
  for (let seed = 1; seed <= fleets; seed += 1) {
    const random = createRandom(seed * 31 + 7);
    let side = emptySide(randomFleet(rules, createRandom(seed)), rules);
    while (!allSunk(side)) {
      const cell = chooseShot(side.marks, rules, afloat(side), random, level);
      assert.ok(canShoot(side, cell), `${level}: cell ${cell} may be shot at`);
      side = shootAt(side, cell, rules).side;
      total += 1;
    }
  }
  return total / fleets;
}

test('every level sinks every fleet with legal shots only; a stronger level needs fewer shots', () => {
  const boxed = GUNNER_LEVELS.map(level => averageShots(level, WESTERN, 70));
  assert.ok(boxed[0] > boxed[1] + 5 && boxed[1] > boxed[2] + 2, `the boxed rules: ${boxed.map(value => value.toFixed(1)).join(' > ')}`);
  assert.ok(boxed[2] < 50, 'the hard gunner sinks a boxed fleet in fewer than fifty shots');
  const classic = GUNNER_LEVELS.map(level => averageShots(level, CLASSIC, 70));
  assert.ok(classic[0] > classic[1] + 1.5 && classic[1] > classic[2], `the classic rules: ${classic.map(value => value.toFixed(1)).join(' > ')}`);
});

test('a wounded ship is finished along its line', () => {
  // Two hits in a row at (4,4) and (4,5), a miss at (4,3): the only continuation is (4,6).
  const marks: Mark[] = Array.from({ length: 100 }, () => UNKNOWN as Mark);
  marks[at(4, 4)] = HIT;
  marks[at(4, 5)] = HIT;
  marks[at(4, 3)] = MISS;
  for (const level of ['normal', 'hard'] as const) {
    for (let seed = 1; seed <= 20; seed += 1) assert.equal(chooseShot(marks, CLASSIC, [4, 3, 3, 2], createRandom(seed), level), at(4, 6), `${level}, seed ${seed}`);
  }
  // One hit: the next shot lands beside it.
  const single: Mark[] = Array.from({ length: 100 }, () => UNKNOWN as Mark);
  single[at(5, 5)] = HIT;
  const beside = [at(4, 5), at(6, 5), at(5, 4), at(5, 6)];
  for (const level of ['normal', 'hard'] as const) {
    for (let seed = 1; seed <= 20; seed += 1) assert.ok(beside.includes(chooseShot(single, CLASSIC, [4, 3, 2], createRandom(seed), level)), `${level}, seed ${seed}`);
  }
});

test('the hard gunner counts where a ship can lie', () => {
  const marks: Mark[] = Array.from({ length: 100 }, () => UNKNOWN as Mark);
  const open = likelihoods(marks, WESTERN, [5]);
  assert.equal(open[at(0, 0)], 2, 'a five-decker covers a corner in two ways');
  assert.equal(open[at(4, 4)], 10, 'and a middle cell in ten');
  // A row of misses cuts the sea: no four-decker fits across it.
  for (let column = 0; column < 10; column += 1) marks[at(3, column)] = MISS;
  const cut = likelihoods(marks, CLASSIC, [4]);
  assert.equal(cut[at(1, 4)], 4, 'above the cut only the ways along the row are left (a column of three is too short)');
  assert.equal(cut[at(3, 4)], 0, 'nothing is counted on a cell already shot at');
});

test('the same seed repeats the same battle; two gunners always finish it', () => {
  const play = (seed: number, rules: BattleRules, levels: readonly [GunnerLevel, GunnerLevel]): BattleState => {
    const random = createRandom(seed);
    let battle = newBattle(rules, randomFleet(rules, random), randomFleet(rules, random), seed % 2 === 0 ? 0 : 1);
    let guard = 0;
    while (battle.winner === null) {
      const target = battle.sides[otherSeat(battle.turn)];
      battle = fire(battle, chooseShot(target.marks, rules, afloat(target), random, levels[battle.turn]));
      assert.ok((guard += 1) <= 200, 'a battle ends within two hundred shots');
    }
    return battle;
  };
  assert.deepEqual(play(5, CLASSIC, ['hard', 'normal']).log, play(5, CLASSIC, ['hard', 'normal']).log);
  let hardWins = 0;
  for (let seed = 1; seed <= 60; seed += 1) {
    const battle = play(seed, seed % 2 === 0 ? CLASSIC : WESTERN, ['hard', 'easy']);
    assert.ok(allSunk(battle.sides[otherSeat(battle.winner as 0 | 1)]));
    if (battle.winner === 0) hardWins += 1;
  }
  assert.ok(hardWins >= 36, `the hard gunner beats the easy one in most battles: ${hardWins} of 60`);
});

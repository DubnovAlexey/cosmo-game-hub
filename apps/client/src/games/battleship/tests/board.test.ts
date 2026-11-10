// [EN] FILE: games/battleship/tests/board.test.ts — the sea and the rules of a battle on fixed fleets: where a ship may
//      stand (inside the sea, not on another ship, not touching one in the classic game), a whole legal fleet, a
//      random fleet for both rule sets, a shot (miss, hit, kill, the water opened round a sunk ship), no second
//      shot at a cell, whose turn it is after a hit under both rules, the winner, and a saved battle that plays on.
// [RU] ФАЙЛ: море и правила боя на заданных флотах: где может стоять корабль (внутри моря, не на другом корабле и
//      не касаясь его в классике), целый флот по правилам, случайный флот для обоих наборов правил, выстрел (мимо,
//      ранил, убил, вода, открытая вокруг потопленного), запрет стрелять в клетку дважды, чей ход после попадания
//      при обоих правилах, победитель и сохранённый бой, который играется дальше.
import assert from 'node:assert/strict';
import test from 'node:test';
// [EN] A relative path on purpose: Node runs the tests directly and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает тесты напрямую и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';
import { accuracy, fire, legalShots, newBattle } from '../engine/battle.ts';
import {
  EMPTY, HIT, MISS, SUNK, UNKNOWN, afloat, allSunk, canShoot, cellAt, cellsOfPlacement, emptySide, isFleetLegal, legalPlacements, placementProblem,
  randomFleet, shipsToPlace, shootAt, waterAround, type Ship,
} from '../engine/board.ts';
import { CLASSIC, WESTERN, customizeRules, fleetCells } from '../engine/rules.ts';

const at = (row: number, column: number): number => cellAt(row, column, 10);
const ship = (row: number, column: number, length: number, horizontal: boolean): Ship => ({ cells: cellsOfPlacement({ length, row, column, horizontal }, 10) as number[] });
/** A classic fleet that stands by the rules: every second row, ships a cell apart. */
const CLASSIC_FLEET: Ship[] = [
  ship(0, 0, 4, true), ship(0, 5, 3, true), ship(2, 0, 3, true), ship(2, 4, 2, true), ship(2, 7, 2, true),
  ship(4, 0, 2, true), ship(4, 3, 1, true), ship(4, 5, 1, true), ship(4, 7, 1, true), ship(4, 9, 1, true),
];
const WESTERN_FLEET: Ship[] = [ship(0, 0, 5, true), ship(1, 0, 4, true), ship(2, 0, 3, true), ship(3, 0, 3, true), ship(4, 0, 2, true)];

test('a ship stands inside the sea, not on another ship, and in the classic game not beside one', () => {
  assert.equal(cellsOfPlacement({ length: 4, row: 0, column: 7, horizontal: true }, 10), null, 'four decks do not fit from column 8');
  assert.deepEqual(cellsOfPlacement({ length: 3, row: 7, column: 2, horizontal: false }, 10), [at(7, 2), at(8, 2), at(9, 2)]);
  const placed = [ship(3, 3, 3, true)];
  assert.equal(placementProblem(placed, { length: 2, row: 9, column: 9, horizontal: true }, CLASSIC), 'outside');
  assert.equal(placementProblem(placed, { length: 2, row: 2, column: 4, horizontal: false }, CLASSIC), 'overlap');
  assert.equal(placementProblem(placed, { length: 2, row: 4, column: 3, horizontal: true }, CLASSIC), 'touching', 'side by side');
  assert.equal(placementProblem(placed, { length: 1, row: 2, column: 6, horizontal: true }, CLASSIC), 'touching', 'corner to corner');
  assert.equal(placementProblem(placed, { length: 1, row: 1, column: 6, horizontal: true }, CLASSIC), null, 'a cell of water between them');
  assert.equal(placementProblem(placed, { length: 2, row: 4, column: 3, horizontal: true }, WESTERN), null, 'the boxed rules let ships lie side by side');
});

test('the water round a ship: eight cells round a boat in the open sea, three in a corner', () => {
  assert.equal(waterAround([at(5, 5)], 10).length, 8);
  assert.deepEqual(waterAround([at(0, 0)], 10), [at(0, 1), at(1, 0), at(1, 1)]);
  assert.equal(waterAround(ship(0, 0, 4, true).cells, 10).length, 6, 'a four-decker along the edge wastes only six cells');
  assert.equal(waterAround(ship(4, 3, 4, true).cells, 10).length, 14, 'in the open sea it wastes fourteen');
});

test('a fleet is legal only when every ship of the list stands by the rules', () => {
  assert.ok(isFleetLegal(CLASSIC_FLEET, CLASSIC));
  assert.ok(isFleetLegal(WESTERN_FLEET, WESTERN));
  assert.ok(!isFleetLegal(CLASSIC_FLEET.slice(1), CLASSIC), 'a ship is missing');
  assert.ok(!isFleetLegal(WESTERN_FLEET, CLASSIC), 'another list of ships');
  assert.ok(!isFleetLegal(WESTERN_FLEET, customizeRules(WESTERN, { touching: false })), 'these ships touch');
  const bent: Ship[] = [{ cells: [at(0, 0), at(0, 1), at(1, 1), at(1, 2)] }, ...CLASSIC_FLEET.slice(1)];
  assert.ok(!isFleetLegal(bent, CLASSIC), 'a ship must be straight');
  assert.deepEqual(shipsToPlace([ship(0, 0, 4, true), ship(2, 0, 2, true)], CLASSIC), [3, 3, 2, 2, 1, 1, 1, 1]);
  assert.equal(fleetCells(CLASSIC), 20);
  assert.equal(fleetCells(WESTERN), 17);
});

test('a random fleet always stands by the rules, in both styles and both rule sets', () => {
  for (let seed = 1; seed <= 300; seed += 1) {
    for (const rules of [CLASSIC, WESTERN, customizeRules(WESTERN, { touching: false }), customizeRules(CLASSIC, { touching: true })]) {
      for (const style of ['scattered', 'tucked'] as const) {
        assert.ok(isFleetLegal(randomFleet(rules, createRandom(seed), style), rules), `seed ${seed}, ${rules.id}, ${style}`);
      }
    }
  }
  // The same seed gives the same fleet: a battle can be replayed.
  assert.deepEqual(randomFleet(CLASSIC, createRandom(7)), randomFleet(CLASSIC, createRandom(7)));
});

test('a tucked fleet leaves more free water for the boats than a scattered one', () => {
  const freeAfterBigShips = (style: 'scattered' | 'tucked'): number => {
    let total = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      const big = randomFleet(CLASSIC, createRandom(seed), style).filter(vessel => vessel.cells.length > 1);
      total += legalPlacements(big, 1, CLASSIC).length;
    }
    return total / 200;
  };
  assert.ok(freeAfterBigShips('tucked') > freeAfterBigShips('scattered') + 4);
});

test('a shot: miss, hit, kill; a kill opens the water round the ship in the classic game', () => {
  let side = emptySide(CLASSIC_FLEET, CLASSIC);
  let shot = shootAt(side, at(9, 9), CLASSIC);
  assert.equal(shot.outcome, 'miss');
  assert.equal(shot.side.marks[at(9, 9)], MISS);
  side = shot.side;
  assert.ok(!canShoot(side, at(9, 9)), 'no second shot at the same cell');
  assert.throws(() => shootAt(side, at(9, 9), CLASSIC));
  shot = shootAt(side, at(2, 4), CLASSIC);
  assert.equal(shot.outcome, 'hit');
  assert.equal(shot.side.marks[at(2, 4)], HIT);
  shot = shootAt(shot.side, at(2, 5), CLASSIC);
  assert.equal(shot.outcome, 'sunk');
  assert.equal(shot.ship?.cells.length, 2);
  assert.deepEqual([shot.side.marks[at(2, 4)], shot.side.marks[at(2, 5)]], [SUNK, SUNK]);
  for (const water of waterAround([at(2, 4), at(2, 5)], 10)) assert.equal(shot.side.marks[water], EMPTY, `cell ${water} is known to be empty`);
  assert.ok(!canShoot(shot.side, at(3, 4)), 'nobody shoots at water known to be empty');
  assert.deepEqual(afloat(shot.side), [4, 3, 3, 2, 2, 1, 1, 1, 1]);
  // The boxed rules open nothing: ships may lie right there.
  const western = shootAt(shootAt(emptySide(WESTERN_FLEET, WESTERN), at(4, 0), WESTERN).side, at(4, 1), WESTERN);
  assert.equal(western.outcome, 'sunk');
  assert.equal(western.side.marks[at(5, 0)], UNKNOWN);
  assert.equal(western.side.marks[at(3, 0)], UNKNOWN);
});

test('the turn: a hit shoots again in the classic game, every shot passes the turn in the boxed one', () => {
  let classic = newBattle(CLASSIC, CLASSIC_FLEET, CLASSIC_FLEET, 0);
  classic = fire(classic, at(0, 0));
  assert.equal(classic.turn, 0, 'a hit keeps the turn');
  classic = fire(classic, at(9, 9));
  assert.equal(classic.turn, 1, 'a miss passes it');
  classic = fire(classic, at(4, 3));
  assert.equal(classic.log[2].outcome, 'sunk');
  assert.equal(classic.log[2].sunkLength, 1);
  assert.equal(classic.turn, 1, 'a kill keeps the turn too');
  let western = newBattle(WESTERN, WESTERN_FLEET, WESTERN_FLEET, 1);
  western = fire(western, at(0, 0));
  assert.equal(western.log[0].by, 1);
  assert.equal(western.turn, 0, 'one shot per turn, even after a hit');
  assert.throws(() => newBattle(CLASSIC, WESTERN_FLEET, CLASSIC_FLEET), 'a fleet that breaks the rules does not sail');
});

test('the battle ends when a whole fleet is sunk; a saved battle plays on', () => {
  let battle = newBattle(CLASSIC, CLASSIC_FLEET, CLASSIC_FLEET, 0);
  const targets = CLASSIC_FLEET.flatMap(vessel => vessel.cells);
  for (const [index, cell] of targets.entries()) {
    assert.equal(battle.winner, null);
    if (index === 10) battle = JSON.parse(JSON.stringify(battle)) as typeof battle; // saved and loaded in the middle
    battle = fire(battle, cell);
    assert.ok(!legalShots(battle).includes(cell));
  }
  assert.equal(battle.winner, 0);
  assert.ok(allSunk(battle.sides[1]));
  assert.deepEqual(accuracy(battle, 0), { shots: 20, hits: 20 });
  assert.deepEqual(legalShots(battle), []);
  assert.throws(() => fire(battle, at(9, 9)), 'nobody shoots after the battle');
});

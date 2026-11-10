// =====================================================================
// FILE: apps/client/src/games/battleship/engine/board.ts
// PURPOSE: one side's sea — where its ships lie and what the other side has learned by shooting.
//   A cell is a number: row × size + column (0 … 99 on a 10 × 10 sea). A ship is a straight row of cells.
//   What the shooter knows of every cell (`marks`): nothing, a miss, a hit on a ship still afloat, a part of a
//   sunk ship, or «surely empty» — the water round a sunk ship where the rules forbid ships to touch.
//   Everything is immutable: a shot returns a new side, so a saved game is plain JSON and a test can replay it.
// SECTIONS: 1 cells and ships; 2 placing a fleet; 3 shooting.
// =====================================================================
import type { BattleRules } from './rules.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import type { Random } from '../../../shared/engine/random.ts';

// BEGIN 1. Cells and ships
export interface Ship {
  /** The cells of the ship from bow to stern (left to right or top to bottom). */
  readonly cells: readonly number[];
}
/** Where a ship is being put: its first cell and its direction. */
export interface Placement {
  readonly length: number;
  readonly row: number;
  readonly column: number;
  readonly horizontal: boolean;
}

export const UNKNOWN = 0;
export const MISS = 1;
export const HIT = 2;
export const SUNK = 3;
/** Known to be empty without a shot: the water round a sunk ship (only where ships may not touch). */
export const EMPTY = 4;
export type Mark = 0 | 1 | 2 | 3 | 4;

export interface Side {
  readonly ships: readonly Ship[];
  /** What the opponent knows of every cell. */
  readonly marks: readonly Mark[];
}

export const rowOf = (cell: number, size: number): number => Math.floor(cell / size);
export const columnOf = (cell: number, size: number): number => cell % size;
export const cellAt = (row: number, column: number, size: number): number => row * size + column;
export const isHorizontal = (ship: Ship, size: number): boolean => ship.cells.length < 2 || rowOf(ship.cells[0], size) === rowOf(ship.cells[1], size);

/** The cells a placement covers, or null when it sticks out of the sea. */
export function cellsOfPlacement(placement: Placement, size: number): number[] | null {
  const { length, row, column, horizontal } = placement;
  if (length < 1 || row < 0 || column < 0 || row >= size || column >= size) return null;
  if (horizontal ? column + length > size : row + length > size) return null;
  return Array.from({ length }, (_, index) => (horizontal ? cellAt(row, column + index, size) : cellAt(row + index, column, size)));
}

/** The cells round `cells` (sides and corners), without the cells themselves. */
export function waterAround(cells: readonly number[], size: number): number[] {
  const own = new Set(cells);
  const around = new Set<number>();
  for (const cell of cells) {
    const row = rowOf(cell, size);
    const column = columnOf(cell, size);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const r = row + dr;
        const c = column + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const next = cellAt(r, c, size);
        if (!own.has(next)) around.add(next);
      }
    }
  }
  return [...around].sort((a, b) => a - b);
}
// END 1

// BEGIN 2. Placing a fleet
/** Why a ship cannot stand where it is being put; null — it can. */
export type PlacementProblem = 'outside' | 'overlap' | 'touching';

export function placementProblem(ships: readonly Ship[], placement: Placement, rules: BattleRules): PlacementProblem | null {
  const cells = cellsOfPlacement(placement, rules.size);
  if (!cells) return 'outside';
  const taken = new Set<number>();
  for (const ship of ships) for (const cell of ship.cells) taken.add(cell);
  if (cells.some(cell => taken.has(cell))) return 'overlap';
  if (!rules.touching && waterAround(cells, rules.size).some(cell => taken.has(cell))) return 'touching';
  return null;
}

/** The ship lengths of the fleet that are not on the sea yet, the longest first. */
export function shipsToPlace(ships: readonly Ship[], rules: BattleRules): number[] {
  const left = [...rules.fleet];
  for (const ship of ships) {
    const index = left.indexOf(ship.cells.length);
    if (index >= 0) left.splice(index, 1);
  }
  return left;
}

/** A whole fleet standing by the rules: every ship of the list, straight, inside the sea, not overlapping or touching. */
export function isFleetLegal(ships: readonly Ship[], rules: BattleRules): boolean {
  if (ships.length !== rules.fleet.length || shipsToPlace(ships, rules).length > 0) return false;
  const placed: Ship[] = [];
  for (const ship of ships) {
    const first = ship.cells[0];
    const placement: Placement = { length: ship.cells.length, row: rowOf(first, rules.size), column: columnOf(first, rules.size), horizontal: isHorizontal(ship, rules.size) };
    const cells = cellsOfPlacement(placement, rules.size);
    if (!cells || cells.some((cell, index) => cell !== ship.cells[index])) return false;
    if (placementProblem(placed, placement, rules) !== null) return false;
    placed.push(ship);
  }
  return true;
}

/**
 * How a bot sets its fleet out. 'scattered' — anywhere. 'tucked' — the long ships crowd along the edges, so the water
 * that the rules keep empty round them is wasted outside the sea and the single-deck boats have the most room to
 * hide (the old schoolyard trick; it means something only where ships may not touch).
 */
export type FleetStyle = 'scattered' | 'tucked';

/** Every legal placement of a ship of `length` on a sea with `ships`. */
export function legalPlacements(ships: readonly Ship[], length: number, rules: BattleRules): Placement[] {
  const found: Placement[] = [];
  for (let row = 0; row < rules.size; row += 1) {
    for (let column = 0; column < rules.size; column += 1) {
      for (const horizontal of length === 1 ? [true] : [true, false]) {
        const placement: Placement = { length, row, column, horizontal };
        if (placementProblem(ships, placement, rules) === null) found.push(placement);
      }
    }
  }
  return found;
}

/** A random legal fleet. The longest ships go first; a dead end (rare) starts over. */
export function randomFleet(rules: BattleRules, random: Random, style: FleetStyle = 'scattered'): Ship[] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const ships: Ship[] = [];
    let stuck = false;
    for (const length of rules.fleet) {
      const options = legalPlacements(ships, length, rules);
      if (options.length === 0) { stuck = true; break; }
      let chosen = options[Math.floor(random() * options.length)];
      if (style === 'tucked' && !rules.touching && length > 1) {
        // [EN] Of a handful of random places the one that spoils the least free water wins.
        // [RU] Из горсти случайных мест побеждает то, которое портит меньше всего свободной воды.
        const blocked = new Set<number>();
        for (const ship of ships) { for (const cell of ship.cells) blocked.add(cell); for (const cell of waterAround(ship.cells, rules.size)) blocked.add(cell); }
        let least = Infinity;
        for (let pick = 0; pick < 14; pick += 1) {
          const option = options[Math.floor(random() * options.length)];
          const cells = cellsOfPlacement(option, rules.size) as number[];
          const spoiled = [...cells, ...waterAround(cells, rules.size)].filter(cell => !blocked.has(cell)).length;
          if (spoiled < least) { least = spoiled; chosen = option; }
        }
      }
      ships.push({ cells: cellsOfPlacement(chosen, rules.size) as number[] });
    }
    if (!stuck) return ships;
  }
  throw new Error('No room for the fleet: the sea is too small for these rules');
}

export const emptySide = (ships: readonly Ship[], rules: BattleRules): Side => ({ ships, marks: Array.from({ length: rules.size * rules.size }, () => UNKNOWN as Mark) });
// END 2

// BEGIN 3. Shooting
export type ShotOutcome = 'miss' | 'hit' | 'sunk';
export interface ShotResult {
  readonly side: Side;
  readonly outcome: ShotOutcome;
  /** The ship that was hit or sunk. */
  readonly ship: Ship | null;
}

/** May this cell be shot at? Not twice, and not where the water is known to be empty. */
export const canShoot = (side: Side, cell: number): boolean => cell >= 0 && cell < side.marks.length && side.marks[cell] === UNKNOWN;

/** A shot at `cell` of `side`. Throws when the cell may not be shot at. */
export function shootAt(side: Side, cell: number, rules: BattleRules): ShotResult {
  if (!canShoot(side, cell)) throw new Error(`Cell ${cell} cannot be shot at`);
  const marks = side.marks.slice();
  const ship = side.ships.find(candidate => candidate.cells.includes(cell)) ?? null;
  if (!ship) {
    marks[cell] = MISS;
    return { side: { ships: side.ships, marks }, outcome: 'miss', ship: null };
  }
  marks[cell] = HIT;
  if (ship.cells.some(part => marks[part] !== HIT)) return { side: { ships: side.ships, marks }, outcome: 'hit', ship };
  for (const part of ship.cells) marks[part] = SUNK;
  // [EN] Where ships may not touch, the water round a sunk ship is known to be empty: nobody has to shoot there.
  // [RU] Там, где кораблям нельзя соприкасаться, вода вокруг потопленного заведомо пуста: стрелять туда незачем.
  if (!rules.touching) for (const water of waterAround(ship.cells, rules.size)) if (marks[water] === UNKNOWN) marks[water] = EMPTY;
  return { side: { ships: side.ships, marks }, outcome: 'sunk', ship };
}

export const isSunk = (side: Side, ship: Ship): boolean => ship.cells.every(cell => side.marks[cell] === SUNK);
export const allSunk = (side: Side): boolean => side.ships.every(ship => isSunk(side, ship));
/** The lengths of the ships still afloat, the longest first. */
export const afloat = (side: Side): number[] => side.ships.filter(ship => !isSunk(side, ship)).map(ship => ship.cells.length).sort((a, b) => b - a);
// END 3

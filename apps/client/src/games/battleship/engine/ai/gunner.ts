// =====================================================================
// FILE: apps/client/src/games/battleship/engine/ai/gunner.ts
// PURPOSE: a computer gunner. It sees exactly what a person at the table sees: the marks on the sea it shoots at
//   (misses, hits, sunk ships, water known to be empty) and which ships are still afloat — never the ships
//   themselves. Three levels:
//   - 'easy'   — shoots at random; after a hit tries the cells next to it, and now and then forgets about it;
//   - 'normal' — hunts in a pattern no ship can slip through (every n-th cell, n = the shortest ship afloat) and
//                finishes a wounded ship along its line;
//   - 'hard'   — counts for every cell in how many ways the ships still afloat can lie over it without breaking
//                the rules or what is already known, and shoots where a ship is likeliest (a wounded ship first).
//   Measured on 2000 random classic fleets (tests/gunner.test.ts keeps it true): a random shooter needs about 95
//   shots to sink a fleet, 'easy' about 65, 'normal' about 50, 'hard' about 43.
// SECTIONS: 1 what the gunner knows; 2 easy and normal; 3 hard; 4 entry point.
// =====================================================================
import { EMPTY, HIT, MISS, SUNK, UNKNOWN, cellAt, cellsOfPlacement, columnOf, rowOf, waterAround, type Mark } from '../board.ts';
import type { BattleRules } from '../rules.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import type { Random } from '../../../../shared/engine/random.ts';

export type GunnerLevel = 'easy' | 'normal' | 'hard';
export const GUNNER_LEVELS: readonly GunnerLevel[] = Object.freeze(['easy', 'normal', 'hard']);

// BEGIN 1. What the gunner knows
const pick = <T>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)];
const unknownCells = (marks: readonly Mark[]): number[] => marks.flatMap((mark, cell) => (mark === UNKNOWN ? [cell] : []));
const woundedCells = (marks: readonly Mark[]): number[] => marks.flatMap((mark, cell) => (mark === HIT ? [cell] : []));

/** The four cells that share a side with `cell`. */
function neighbours(cell: number, size: number): number[] {
  const row = rowOf(cell, size);
  const column = columnOf(cell, size);
  const found: number[] = [];
  if (row > 0) found.push(cellAt(row - 1, column, size));
  if (row < size - 1) found.push(cellAt(row + 1, column, size));
  if (column > 0) found.push(cellAt(row, column - 1, size));
  if (column < size - 1) found.push(cellAt(row, column + 1, size));
  return found;
}
// END 1

// BEGIN 2. Easy and normal
/** Unknown cells next to any wounded cell. */
function besideWounds(marks: readonly Mark[], size: number): number[] {
  const found = new Set<number>();
  for (const cell of woundedCells(marks)) for (const next of neighbours(cell, size)) if (marks[next] === UNKNOWN) found.add(next);
  return [...found];
}

/** Unknown cells that continue a line of two or more wounded cells; empty when no line is seen yet. */
function alongWounds(marks: readonly Mark[], size: number): number[] {
  const found = new Set<number>();
  for (const cell of woundedCells(marks)) {
    const row = rowOf(cell, size);
    const column = columnOf(cell, size);
    for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
      const r2 = row + dr;
      const c2 = column + dc;
      if (r2 >= size || c2 >= size || marks[cellAt(r2, c2, size)] !== HIT) continue;
      // A line of hits through `cell` and its neighbour: walk to both ends.
      let backRow = row - dr;
      let backColumn = column - dc;
      while (backRow >= 0 && backColumn >= 0 && marks[cellAt(backRow, backColumn, size)] === HIT) { backRow -= dr; backColumn -= dc; }
      if (backRow >= 0 && backColumn >= 0 && marks[cellAt(backRow, backColumn, size)] === UNKNOWN) found.add(cellAt(backRow, backColumn, size));
      let frontRow = r2 + dr;
      let frontColumn = c2 + dc;
      while (frontRow < size && frontColumn < size && marks[cellAt(frontRow, frontColumn, size)] === HIT) { frontRow += dr; frontColumn += dc; }
      if (frontRow < size && frontColumn < size && marks[cellAt(frontRow, frontColumn, size)] === UNKNOWN) found.add(cellAt(frontRow, frontColumn, size));
    }
  }
  return [...found];
}

function easyShot(marks: readonly Mark[], rules: BattleRules, random: Random): number {
  const beside = besideWounds(marks, rules.size);
  // One time in five the beginner forgets the wounded ship and shoots somewhere else.
  if (beside.length > 0 && random() >= 0.2) return pick(beside, random);
  return pick(unknownCells(marks), random);
}

function normalShot(marks: readonly Mark[], rules: BattleRules, afloat: readonly number[], random: Random): number {
  const along = alongWounds(marks, rules.size);
  if (along.length > 0) return pick(along, random);
  const beside = besideWounds(marks, rules.size);
  if (beside.length > 0) return pick(beside, random);
  // Hunting: every n-th cell on the diagonals, n = the shortest ship afloat — no ship can lie between the shots.
  const step = Math.max(1, Math.min(...afloat, rules.size));
  const unknown = unknownCells(marks);
  const pattern = unknown.filter(cell => (rowOf(cell, rules.size) + columnOf(cell, rules.size)) % step === 0);
  return pick(pattern.length > 0 ? pattern : unknown, random);
}
// END 2

// BEGIN 3. Hard
/**
 * For every unknown cell: in how many ways the ships afloat can lie over it. A ship may lie only on cells that are
 * unknown or wounded; where ships may not touch, it also may not lie beside a wound it does not cover. While a
 * wounded ship is afloat only the ways that cover a wound count, and a way that covers more wounds counts for much
 * more: the shot finishes the wounded ship along its line.
 */
export function likelihoods(marks: readonly Mark[], rules: BattleRules, afloat: readonly number[]): number[] {
  const size = rules.size;
  const score = new Array<number>(marks.length).fill(0);
  const wounded = woundedCells(marks).length > 0;
  for (const length of afloat) {
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        for (const horizontal of length === 1 ? [true] : [true, false]) {
          const cells = cellsOfPlacement({ length, row, column, horizontal }, size);
          if (!cells) continue;
          let wounds = 0;
          let fits = true;
          for (const cell of cells) {
            const mark = marks[cell];
            if (mark === MISS || mark === SUNK || mark === EMPTY) { fits = false; break; }
            if (mark === HIT) wounds += 1;
          }
          if (!fits || (wounded && wounds === 0) || wounds === length) continue;
          if (!rules.touching && waterAround(cells, size).some(cell => marks[cell] === HIT)) continue;
          const weight = wounds === 0 ? 1 : Math.pow(20, wounds);
          for (const cell of cells) if (marks[cell] === UNKNOWN) score[cell] += weight;
        }
      }
    }
  }
  return score;
}

function hardShot(marks: readonly Mark[], rules: BattleRules, afloat: readonly number[], random: Random): number {
  const score = likelihoods(marks, rules, afloat);
  let best = 0;
  for (const value of score) if (value > best) best = value;
  if (best <= 0) return normalShot(marks, rules, afloat, random);
  return pick(score.flatMap((value, cell) => (value >= best * 0.999 ? [cell] : [])), random);
}
// END 3

// BEGIN 4. Entry point
/**
 * The cell a gunner of `level` shoots at. `marks` — what is known of the sea it shoots at; `afloat` — the lengths of
 * the ships not sunk yet (both sides always know them: every kill is announced).
 */
export function chooseShot(marks: readonly Mark[], rules: BattleRules, afloat: readonly number[], random: Random, level: GunnerLevel = 'normal'): number {
  if (unknownCells(marks).length === 0) throw new Error('Nowhere to shoot');
  if (level === 'easy') return easyShot(marks, rules, random);
  if (level === 'hard') return hardShot(marks, rules, afloat, random);
  return normalShot(marks, rules, afloat, random);
}
// END 4

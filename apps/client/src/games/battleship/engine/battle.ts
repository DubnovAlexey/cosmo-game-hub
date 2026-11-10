// =====================================================================
// FILE: apps/client/src/games/battleship/engine/battle.ts
// PURPOSE: a whole battle between two fleets: whose turn it is, a shot, the log, the winner.
//   Seat 0 is you, seat 1 is the opponent; a seat always shoots at the other seat's sea.
//   The turn follows the table's rule: with `shootAgain` a hit or a kill keeps the turn, a miss passes it; without
//   it every shot passes the turn. The battle ends when one fleet is wholly sunk.
//   Immutable and plain JSON, so it is saved after every shot and continued after a reload.
// =====================================================================
import { allSunk, canShoot, emptySide, isFleetLegal, shootAt, type Ship, type ShotOutcome, type Side } from './board.ts';
import type { BattleRules } from './rules.ts';

export type Seat = 0 | 1;
export const otherSeat = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

export interface ShotRecord {
  readonly by: Seat;
  readonly cell: number;
  readonly outcome: ShotOutcome;
  /** The length of the ship that went down with this shot. */
  readonly sunkLength?: number;
}

export interface BattleState {
  readonly rules: BattleRules;
  /** sides[0] — your sea, sides[1] — the opponent's. */
  readonly sides: readonly [Side, Side];
  readonly turn: Seat;
  readonly winner: Seat | null;
  readonly log: readonly ShotRecord[];
}

/** A new battle. Both fleets must stand by the rules. */
export function newBattle(rules: BattleRules, yours: readonly Ship[], theirs: readonly Ship[], first: Seat = 0): BattleState {
  if (!isFleetLegal(yours, rules) || !isFleetLegal(theirs, rules)) throw new Error('A fleet does not stand by the rules');
  return { rules, sides: [emptySide(yours, rules), emptySide(theirs, rules)], turn: first, winner: null, log: [] };
}

/** The cells the seat on turn may shoot at. */
export function legalShots(state: BattleState): number[] {
  if (state.winner !== null) return [];
  const target = state.sides[otherSeat(state.turn)];
  const cells: number[] = [];
  for (let cell = 0; cell < target.marks.length; cell += 1) if (canShoot(target, cell)) cells.push(cell);
  return cells;
}

/** The seat on turn shoots at `cell` of the other sea. */
export function fire(state: BattleState, cell: number): BattleState {
  if (state.winner !== null) throw new Error('The battle is over');
  const by = state.turn;
  const targetSeat = otherSeat(by);
  const result = shootAt(state.sides[targetSeat], cell, state.rules);
  const sides: [Side, Side] = targetSeat === 0 ? [result.side, state.sides[1]] : [state.sides[0], result.side];
  const record: ShotRecord = result.outcome === 'sunk' && result.ship
    ? { by, cell, outcome: result.outcome, sunkLength: result.ship.cells.length }
    : { by, cell, outcome: result.outcome };
  const won = allSunk(result.side);
  const keeps = result.outcome !== 'miss' && state.rules.shootAgain;
  return { rules: state.rules, sides, turn: won || keeps ? by : targetSeat, winner: won ? by : null, log: [...state.log, record] };
}

/** How many shots a seat has fired and how many of them hit. */
export function accuracy(state: BattleState, seat: Seat): { shots: number; hits: number } {
  let shots = 0;
  let hits = 0;
  for (const record of state.log) if (record.by === seat) { shots += 1; if (record.outcome !== 'miss') hits += 1; }
  return { shots, hits };
}

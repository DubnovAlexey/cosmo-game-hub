// =====================================================================
// FILE: apps/client/src/games/battleship/engine/rules.ts
// PURPOSE: the rules of a sea battle as data. Two well-known sets and two switches between them:
//   - CLASSIC — the notebook game of Russian schoolyards («Морской бой»): a 10 × 10 sea, ten ships (one of four
//     decks, two of three, three of two, four of one), ships never touch even by a corner, and whoever hits
//     shoots again;
//   - WESTERN — the boxed game known as Battleship: five ships (5, 4, 3, 3, 2), ships may lie side by side, one shot
//     per turn whatever it hits.
//   A table may mix them: `touching` and `shootAgain` are separate switches (customizeRules).
//   Pure data without React and without the DOM, so the Node tests use it too.
// =====================================================================

export type RulesId = 'classic' | 'western';

export interface BattleRules {
  readonly id: RulesId;
  /** The sea is `size` × `size` cells. */
  readonly size: number;
  /** The lengths of the ships of one fleet, the longest first. */
  readonly fleet: readonly number[];
  /** Ships may lie next to each other; false — not even corner to corner. */
  readonly touching: boolean;
  /** A hit (and a kill) gives another shot; false — one shot per turn. */
  readonly shootAgain: boolean;
}

export const CLASSIC: BattleRules = Object.freeze({
  id: 'classic', size: 10, fleet: Object.freeze([4, 3, 3, 2, 2, 2, 1, 1, 1, 1]), touching: false, shootAgain: true,
});
export const WESTERN: BattleRules = Object.freeze({
  id: 'western', size: 10, fleet: Object.freeze([5, 4, 3, 3, 2]), touching: true, shootAgain: false,
});
export const RULE_SETS: Readonly<Record<RulesId, BattleRules>> = Object.freeze({ classic: CLASSIC, western: WESTERN });

export interface RuleOptions {
  readonly touching?: boolean;
  readonly shootAgain?: boolean;
}

/** A rule set with the switches of the table menu applied. */
export function customizeRules(base: BattleRules, options: RuleOptions): BattleRules {
  return Object.freeze({
    ...base,
    touching: options.touching ?? base.touching,
    shootAgain: options.shootAgain ?? base.shootAgain,
  });
}

/** How many cells of ships a fleet has: the number of hits that wins the battle. */
export const fleetCells = (rules: BattleRules): number => rules.fleet.reduce((sum, length) => sum + length, 0);

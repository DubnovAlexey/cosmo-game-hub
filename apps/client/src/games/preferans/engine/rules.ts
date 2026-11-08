// =====================================================================
// FILE: apps/client/src/games/preferans/engine/rules.ts
// PURPOSE: a rule set (вариант правил) as data. Sochi («Сочинка») is the default; other variants
//          (Leningrad, Rostov) become another object, not another engine.
// Sources: rulespal.com/preference/rulebook (Sochi tables), en.wikipedia.org/wiki/Preferans.
// =====================================================================
import type { Level } from './bids.ts';

export interface RuleSet {
  readonly name: string;
  /** Price of a game by level (стоимость игры): the pool points for making it, the unit of every penalty. */
  readonly gameValue: Readonly<Record<Level, number>>;
  readonly misereValue: number;
  /** Tricks the defenders must take together (обязательство вистующих). */
  readonly whistObligation: Readonly<Record<Level, number>>;
  /** A ten-trick game is not whisted but checked (проверяется): both defenders play, nobody is responsible. */
  readonly tenIsChecked: boolean;
  /** Levels where the second defender may say half-whist (полвиста) after the first one passed. */
  readonly halfWhistLevels: readonly Level[];
  /** All-pass (распасы): price of one trick for the 1st, 2nd, 3rd all-pass in a row; the last value repeats. */
  readonly raspasyProgression: readonly number[];
  /** On all-pass the two talon cards set the suit of the first two tricks; the first hand leads the third. */
  readonly raspasyTalonLeads: boolean;
  /** A senior hand may hold (say «здесь») an equal bid made by a junior hand. */
  readonly seniorHold: boolean;
  /** Stalingrad («Сталинград»): on a six of spades both defenders must whist, so it is always played, closed. */
  readonly stalingrad: boolean;
  /**
   * Conceding a hopeless game after the talon («уход без двух / без трёх»): the declarer writes this many tricks
   * at the price of the level he bid into his mountain, and nobody writes whists. 0 = not allowed.
   */
  readonly concedeTricks: 0 | 2 | 3;
  /** Whists per point of pool or mountain in the final settlement. */
  readonly whistsPerPoint: number;
}

// BEGIN SOCHI
export const SOCHI: RuleSet = Object.freeze({
  name: 'sochi',
  gameValue: Object.freeze({ 6: 2, 7: 4, 8: 6, 9: 8, 10: 10 }),
  misereValue: 10,
  whistObligation: Object.freeze({ 6: 4, 7: 2, 8: 1, 9: 1, 10: 0 }),
  tenIsChecked: true,
  halfWhistLevels: Object.freeze([6, 7] as Level[]),
  raspasyProgression: Object.freeze([1, 2, 3]),
  raspasyTalonLeads: true,
  seniorHold: true,
  stalingrad: false,
  concedeTricks: 0,
  whistsPerPoint: 10,
});
// END SOCHI

// BEGIN customizeRules: the table options a player may switch before a pool
export interface RuleOptions {
  /** All-pass trick prices in a row, e.g. [1, 2, 3] (Sochi), [1, 2, 4], or [1] for no progression. */
  readonly raspasyProgression?: readonly number[];
  /** Ten-trick games are checked (true, Sochi) or whisted like eight and nine (false). */
  readonly tenIsChecked?: boolean;
  /** Half-whist (полвиста) on six and seven. */
  readonly halfWhist?: boolean;
  /** The senior hand may hold an equal bid («здесь»). */
  readonly seniorHold?: boolean;
  /** On all-pass the talon leads the first two tricks. */
  readonly raspasyTalonLeads?: boolean;
  /** Stalingrad: both defenders must whist a six of spades. */
  readonly stalingrad?: boolean;
  /** Conceding a hopeless game: 2 or 3 tricks, 0 = not allowed. */
  readonly concedeTricks?: 0 | 2 | 3;
}

export function customizeRules(base: RuleSet, options: RuleOptions): RuleSet {
  const progression = options.raspasyProgression?.filter(price => Number.isFinite(price) && price > 0);
  return Object.freeze({
    ...base,
    name: `${base.name}-custom`,
    raspasyProgression: Object.freeze(progression && progression.length > 0 ? [...progression] : [...base.raspasyProgression]),
    tenIsChecked: options.tenIsChecked ?? base.tenIsChecked,
    halfWhistLevels: Object.freeze(options.halfWhist === false ? [] : options.halfWhist === true ? ([6, 7] as Level[]) : [...base.halfWhistLevels]),
    seniorHold: options.seniorHold ?? base.seniorHold,
    raspasyTalonLeads: options.raspasyTalonLeads ?? base.raspasyTalonLeads,
    stalingrad: options.stalingrad ?? base.stalingrad,
    concedeTricks: options.concedeTricks ?? base.concedeTricks,
  });
}
// END customizeRules

// =====================================================================
// FILE: apps/client/src/games/preferans/engine/rules.ts
// PURPOSE: a rule set (вариант правил) as data. Sochi («Сочинка») is the default; Leningrad and Rostov are
//          other objects, not other engines: the scoring reads the scales and switches below.
// Sources: rulespal.com/preference/rulebook (Sochi tables), en.wikipedia.org/wiki/Preferans; Leningrad and Rostov —
//          pref-bridge.ucoz.net (PrefRulesLeningrad, PrefRulesRostov), preferans.games, gambler.ru, ru.wikipedia.org
//          (the research of 08.11.2026, reports/Правила и варианты преферанса.md).
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
  /** Whists for one defensive trick (and for one undertrick of consolation), in game prices: Leningrad doubles them. */
  readonly whistScale: number;
  /** A failed game: the declarer's mountain per undertrick, in game prices (ремиз): Leningrad doubles it. */
  readonly remizScale: number;
  /**
   * A defender short of the obligation: mountain per missing trick, in game prices. 1 = responsible whist (Sochi);
   * Leningrad also writes 1, which is half of its doubled scale (полуответственный); Rostov ½ (1/2/3/4/5).
   */
  readonly whisterPenaltyScale: number;
  /** Consolation per undertrick from every defender: null = the price of a trick in whists; a number = fixed whists (Rostov 10). */
  readonly consolationWhists: number | null;
  /**
   * Gentleman's whist (джентльменский): one defender whisted and the declarer went down — everything the defence
   * writes, consolation included, is shared equally with the passer. Off = greedy whist (жлобский, Sochi).
   */
  readonly gentlemanWhist: boolean;
  /** A failed misère: mountain per trick taken (Leningrad 20). */
  readonly misereMountain: number;
  /** All-pass: the price of a trick is the progression value times this (Leningrad 2: 2 · 4 · 6). */
  readonly raspasyScale: number;
  /**
   * Rostov all-pass: no mountain. Whoever took the fewest tricks writes this many whists on each opponent for every
   * trick of that opponent (two with the fewest share them); no tricks = the price into the pool. 0 = mountain all-pass.
   */
  readonly raspasyWhists: number;
  /** Two whisters on nine and ten share the responsibility for the obligation (Rostov); otherwise the second whister answers. */
  readonly sharedHighResponsibility: boolean;
  /**
   * End of the pool. 'own': whoever did not reach the target writes the shortfall into the mountain (Sochi, Rostov).
   * 'common' (Leningrad): the pool is one total; each player writes twice his distance below the average pool into
   * the mountain, and whoever is above the average writes the same amount off.
   */
  readonly poolEnd: 'own' | 'common';
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
  whistScale: 1,
  remizScale: 1,
  whisterPenaltyScale: 1,
  consolationWhists: null,
  gentlemanWhist: false,
  misereMountain: 10,
  raspasyScale: 1,
  raspasyWhists: 0,
  sharedHighResponsibility: false,
  poolEnd: 'own',
});
// END SOCHI

// BEGIN LENINGRAD
/**
 * Leningrad («Ленинградка», «Питер»): the same prices in the pool, but whists, the declarer's mountain and the
 * consolation are doubled, the whist is half-responsible and gentleman's, a failed misère costs 20 a trick,
 * a pool point is worth 20 whists, all-pass tricks cost 2 · 4 · 6, the pool is one common total and the ten is whisted.
 */
export const LENINGRAD: RuleSet = Object.freeze({
  ...SOCHI,
  name: 'leningrad',
  tenIsChecked: false,
  whistsPerPoint: 20,
  whistScale: 2,
  remizScale: 2,
  whisterPenaltyScale: 1,
  gentlemanWhist: true,
  misereMountain: 20,
  raspasyScale: 2,
  poolEnd: 'common',
});
// END LENINGRAD

// BEGIN ROSTOV
/**
 * Rostov («Ростовка»): Sochi prices, a softer whist (half the price per missing trick, gentleman's), consolation
 * of 10 whists from each defender, two whisters share the answer on nine and ten, and all-pass is paid in whists
 * (5 per trick) with a closed talon and no progression.
 */
export const ROSTOV: RuleSet = Object.freeze({
  ...SOCHI,
  name: 'rostov',
  raspasyProgression: Object.freeze([1]),
  raspasyTalonLeads: false,
  whisterPenaltyScale: 0.5,
  consolationWhists: 10,
  gentlemanWhist: true,
  raspasyWhists: 5,
  sharedHighResponsibility: true,
});
// END ROSTOV

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

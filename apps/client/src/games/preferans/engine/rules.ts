// =====================================================================
// FILE: apps/client/src/games/preferans/engine/rules.ts
// PURPOSE: a rule set (вариант правил) as data. Sochi («Сочинка») is the default; Leningrad, Rostov and Classic are
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
  /**
   * Four at the table, all-pass (Wikipedia, en-Wikipedia, gambler.ru): the talon cards are the dealer's hand. Each
   * leads its trick, and a talon card that nobody beats takes the trick for the dealer (at most two tricks).
   */
  readonly talonTakesTricks: boolean;
  /**
   * Two at the table («гусарик», Wikipedia, rulespal, yellowclub): this seat is the dummy («болван»), a third hand
   * that always passes. Its defender decides to whist without seeing it; the whist is then always open and the
   * defender plays both hands. null = three real players.
   */
  readonly dummySeat: 0 | 1 | 2 | null;
  /** Everybody passed and there is no all-pass at this table (two players): the deal is simply dealt again. */
  readonly allPassRedeal: boolean;
  /**
   * «Вист — пас — полвиста» (Wikipedia, pref-bridge Leningrad): a lone whister on a six or a seven (the other defender
   * passed) may take half-whist instead of playing: the game counts as made and he writes half of the obligation.
   */
  readonly whistPassHalf: boolean;
  /**
   * Misère without the talon («мизер без прикупа», Wikipedia, rulespal): a bid above the nines, played without taking
   * the talon; our table lets only a ten beat it (sources differ: МГУ, mail.ru, pref-bridge). Scored like misère.
   */
  readonly misereNoTalon: boolean;
  /**
   * Dark calls (Classic, Префклуб МГУ, pref-bridge): as the first word, before looking at the cards, a pass in the dark
   * or a level in the dark. A dark game costs double — pool, mountain and whists; all-pass after a dark pass too.
   */
  readonly darkBids: boolean;
  /**
   * Bombs (Classic: «бомба», «брандер», «ёлка»): after an all-pass with dark passes every dark passer gets a bomb; his
   * next game or misère costs ×2, ×4 or ×8 for one, two or three bombs. Made — the bombs burn out; failed — they stay.
   */
  readonly bombs: boolean;
  /**
   * Paid talon («платный прикуп», en-Wikipedia, ФСПР section 6): quick tricks in the talon — an ace or a marriage
   * (king and queen of a suit) 1, ace and king of a suit 2, two aces 3 — cost the declarer the price of the game each;
   * each defender writes half of it on him (four at the table the dealer writes all of it).
   */
  readonly paidTalon: boolean;
  /**
   * American help («американская помощь», Кодекс 4.2.3; own pools only): points above the target go into the pool of
   * the opponent with the biggest pool still short of it (a tie: the one on the left), and the helper writes
   * whistsPerPoint whists on him for every point.
   */
  readonly americanHelp: boolean;
  /** Four at the table: when both defenders pass, the dealer may look at one of their hands and whist with it himself. */
  readonly dealerWhists: boolean;
  /** Four at the table: the misère declarer may call the dealer to share it — pool or mountain split in half. */
  readonly misereHalves: boolean;
  /** Teeth («зуб», Префклуб МГУ): a mark on the sheet towards whoever set you down; it does not change the score. */
  readonly teeth: boolean;
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
  talonTakesTricks: false,
  dummySeat: null,
  allPassRedeal: false,
  whistPassHalf: false,
  misereNoTalon: false,
  darkBids: false,
  bombs: false,
  paidTalon: false,
  americanHelp: false,
  dealerWhists: false,
  misereHalves: false,
  teeth: false,
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

// BEGIN CLASSIC
/**
 * Classic («Классика», Префклуб МГУ, pref-bridge Classic): Sochi prices and whist, all-pass 1 · 2 · 4, and the two
 * mechanics no other variant has — dark calls and bombs (table options of this variant).
 */
export const CLASSIC: RuleSet = Object.freeze({
  ...SOCHI,
  name: 'classic',
  raspasyProgression: Object.freeze([1, 2, 4]),
});
// END CLASSIC

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
  /** Four at the table: on all-pass the talon is the dealer's hand and may take tricks. */
  readonly talonTakesTricks?: boolean;
  /** Two at the table: the dummy's seat (it always passes); all-pass becomes a new deal. */
  readonly dummySeat?: 0 | 1 | 2 | null;
  readonly whistPassHalf?: boolean;
  readonly misereNoTalon?: boolean;
  readonly darkBids?: boolean;
  readonly bombs?: boolean;
  readonly paidTalon?: boolean;
  readonly americanHelp?: boolean;
  readonly dealerWhists?: boolean;
  readonly misereHalves?: boolean;
  readonly teeth?: boolean;
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
    talonTakesTricks: options.talonTakesTricks ?? base.talonTakesTricks,
    dummySeat: options.dummySeat === undefined ? base.dummySeat : options.dummySeat,
    allPassRedeal: options.dummySeat === undefined ? base.allPassRedeal : options.dummySeat !== null,
    whistPassHalf: options.whistPassHalf ?? base.whistPassHalf,
    misereNoTalon: options.misereNoTalon ?? base.misereNoTalon,
    darkBids: options.darkBids ?? base.darkBids,
    // [EN] Bombs are born from dark passes: without dark calls there are none. [RU] Бомбы рождаются из тёмных пасов: без тёмных заявок их нет.
    bombs: (options.bombs ?? base.bombs) && (options.darkBids ?? base.darkBids),
    paidTalon: options.paidTalon ?? base.paidTalon,
    americanHelp: options.americanHelp ?? base.americanHelp,
    dealerWhists: options.dealerWhists ?? base.dealerWhists,
    misereHalves: options.misereHalves ?? base.misereHalves,
    teeth: options.teeth ?? base.teeth,
  });
}
// END customizeRules

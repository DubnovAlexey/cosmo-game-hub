// =====================================================================
// FILE: apps/client/src/games/preferans/engine/scoring.ts
// PURPOSE: what one finished deal writes on the score sheet (Sochi): pool (пуля), mountain (гора) and whists
//          (висты, whists[a][b] = whists player a writes on player b).
// Rules (rulespal.com/preference/rulebook, Wikipedia «Preferans»):
//   - a made game: its price to the declarer's pool; a failed one: price × undertricks to his mountain;
//   - whists: price × tricks; a single whister takes all defensive tricks (greedy, «жлобский» whist);
//   - consolation (консоляция) on a failed game: every defender writes price × undertricks on the declarer;
//   - defenders short of their obligation: price × missing tricks to the responsible whister's mountain
//     (on 6: who took fewer than 2; on 7: who took none; on 8–9: the second whister);
//   - misère: price to the pool for no tricks, otherwise price × tricks to the mountain; nobody whists;
//   - all-pass: every trick costs the progression price (1, 2, 3…) in the mountain, no tricks = that price
//     in the pool;
//   - a conceded game («уход без двух / без трёх», preferans.games/rules, Wikipedia «Преферанс»): the declarer
//     writes the conceded tricks at the price of the level he bid into his mountain; nobody writes whists.
// SECTIONS: 1 score shape; 2 game; 3 misère; 4 all-pass; 5 dispatcher.
// =====================================================================
import type { Level } from './bids.ts';
import { otherSeats, type Seat } from './play.ts';
import type { RuleSet } from './rules.ts';

// BEGIN 1. Score shape
export interface DealScore {
  readonly pool: readonly number[];
  readonly mountain: readonly number[];
  /** whists[a][b]: whists player a writes on player b. */
  readonly whists: readonly (readonly number[])[];
}
interface MutableScore { pool: number[]; mountain: number[]; whists: number[][] }
const emptyScore = (): MutableScore => ({ pool: [0, 0, 0], mountain: [0, 0, 0], whists: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] });
// END 1

// BEGIN 2. Game
export interface GameScoreInput {
  readonly declarer: Seat;
  readonly level: Level;
  /** Tricks taken by every seat (only used when the game was played). */
  readonly tricks: readonly number[];
  /** Whisters in the order they said «вист» (responsibility on 8–9 goes to the second). Both defenders on a checked ten. */
  readonly whisters: readonly Seat[];
  /** The second defender said half-whist and the first one did not return the whist: the game is not played. */
  readonly halfWhister: Seat | null;
  /** False when nobody whisted or after a half-whist: the game counts as made without play. */
  readonly played: boolean;
}

export function scoreGame(input: GameScoreInput, rules: RuleSet): DealScore {
  const score = emptyScore();
  const value = rules.gameValue[input.level];
  const declarer = input.declarer;
  const obligation = input.level === 10 && rules.tenIsChecked ? 0 : rules.whistObligation[input.level];
  if (!input.played) {
    score.pool[declarer] += value;
    // Half-whist: the half-whister writes as if the defenders took half of their obligation (2 on 6, 1 on 7).
    if (input.halfWhister !== null) score.whists[input.halfWhister][declarer] += value * (obligation / 2);
    return score;
  }
  const undertricks = Math.max(0, input.level - input.tricks[declarer]);
  if (undertricks === 0) score.pool[declarer] += value;
  else score.mountain[declarer] += value * undertricks;

  const defenders = otherSeats(declarer);
  const defenceTricks = input.tricks[defenders[0]] + input.tricks[defenders[1]];
  if (input.whisters.length === 1) {
    score.whists[input.whisters[0]][declarer] += value * defenceTricks;
  } else {
    for (const whister of input.whisters) score.whists[whister][declarer] += value * input.tricks[whister];
  }
  if (undertricks > 0) for (const defender of defenders) score.whists[defender][declarer] += value * undertricks;

  const shortfall = Math.max(0, obligation - defenceTricks);
  if (shortfall > 0) {
    if (input.whisters.length === 1) {
      score.mountain[input.whisters[0]] += value * shortfall;
    } else if (input.whisters.length === 2) {
      if (obligation >= 2) {
        const half = obligation / 2;
        for (const whister of input.whisters) {
          const own = Math.min(Math.max(0, half - input.tricks[whister]), shortfall);
          score.mountain[whister] += value * own;
        }
      } else {
        score.mountain[input.whisters[1]] += value * shortfall;
      }
    }
  }
  return score;
}
// END 2

// BEGIN 3. Misère
export function scoreMisere(declarer: Seat, tricks: readonly number[], rules: RuleSet): DealScore {
  const score = emptyScore();
  const taken = tricks[declarer];
  if (taken === 0) score.pool[declarer] += rules.misereValue;
  else score.mountain[declarer] += rules.misereValue * taken;
  return score;
}
// END 3

// BEGIN 4. All-pass
/** Price of one all-pass trick: `round` is how many all-pass deals in a row came before this one. */
/** A conceded game: `tricks` × the price of the bid level into the declarer's mountain, nothing else. */
export function scoreConcession(declarer: Seat, level: Level, tricks: number, rules: RuleSet): DealScore {
  const score = emptyScore();
  score.mountain[declarer] += rules.gameValue[level] * tricks;
  return score;
}

export const raspasyPrice = (round: number, rules: RuleSet): number =>
  rules.raspasyProgression[Math.min(round, rules.raspasyProgression.length - 1)];

export function scoreRaspasy(tricks: readonly number[], round: number, rules: RuleSet): DealScore {
  const score = emptyScore();
  const price = raspasyPrice(round, rules);
  for (let seat = 0; seat < 3; seat += 1) {
    if (tricks[seat] === 0) score.pool[seat] += price;
    else score.mountain[seat] += price * tricks[seat];
  }
  return score;
}
// END 4

// BEGIN 5. Sheet arithmetic
export function addScores(a: DealScore, b: DealScore): DealScore {
  return {
    pool: a.pool.map((value, seat) => value + b.pool[seat]),
    mountain: a.mountain.map((value, seat) => value + b.mountain[seat]),
    whists: a.whists.map((row, from) => row.map((value, to) => value + b.whists[from][to])),
  };
}
export const ZERO_SCORE: DealScore = Object.freeze(emptyScore());

/**
 * Final settlement in whists, zero-sum: each player's whists written on others minus whists written on him,
 * plus 10 whists per mountain point below the table average (Wikipedia: whists − 10 × mountain, then shifted so
 * that the scores sum to zero). With `poolTarget`, an unfinished pool counts as mountain («недописанная пуля»).
 */
export function settle(sheet: DealScore, rules: RuleSet, poolTarget?: number): number[] {
  const mountain = sheet.mountain.map((value, seat) => value + (poolTarget === undefined ? 0 : Math.max(0, poolTarget - sheet.pool[seat])));
  const average = (mountain[0] + mountain[1] + mountain[2]) / 3;
  return [0, 1, 2].map(seat => {
    let net = 0;
    for (let other = 0; other < 3; other += 1) net += sheet.whists[seat][other] - sheet.whists[other][seat];
    return net + rules.whistsPerPoint * (average - mountain[seat]);
  });
}
// END 5

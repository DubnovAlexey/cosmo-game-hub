// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/foresight.ts
// PURPOSE: the decisions before the play — a bid, a misère, the discard, the contract, a whist — made by
//   imagination instead of rules of thumb. The bot deals the cards it cannot see at random the way they could lie
//   (a talon, the other two hands), lets the exact solver (solver.ts) play every imagined deal, and counts: how
//   often a game of a level is made, how often a misère comes home clean, how many tricks the defence takes. The
//   same idea already chooses every card (bot.ts, Perfect-Information Monte Carlo); here it answers «is it worth
//   it?» before the first card. The bot never looks at hidden cards: every imagined deal is drawn only from what
//   its seat knows.
//   Why: the quick estimates (evaluate.ts) count sure winners and miss the rest — measured on 10.11.2026 against
//   the solver, 71% of the games passed without a whist, the whisters fell short in 28% of the games they did
//   whist, and the declarers made only 61% of the contested ones.
// SECTIONS: 1 thinking time; 2 plans; 3 a bidder; 4 after the talon; 5 a defender; 6 what a result is worth.
// =====================================================================
import { NO_TRUMP, gameBid, type Bid, type Level, type Strain } from '../bids.ts';
import { cardsOf, rankOf, removeCard, setOf, unionOf, withoutSet, type Card, type CardSet, type Suit } from '../cards.ts';
import { otherSeats, type Seat } from '../play.ts';
import type { RuleSet } from '../rules.ts';
import { scoreGame, type DealScore, type GameScoreInput } from '../scoring.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { shuffled, type Random } from '../../../../shared/engine/random.ts';
import { misereRisk } from './evaluate.ts';
import { solveBefore } from './solver.ts';
import { declarerStrength } from './strength.ts';

// BEGIN 1. Thinking time
/** How long and how widely a bot may imagine: so many deals at most, and about so many milliseconds. */
export interface Thinking {
  readonly random: Random;
  readonly samples: number;
  readonly timeBudgetMs: number;
}
/** Deals imagined before the budget may stop the thinking: fewer would be a coin toss. */
const LEAST_DEALS = 6;

interface Pace { readonly started: number; readonly samples: number; readonly budget: number }
const paceOf = (thinking: Thinking): Pace => ({ started: Date.now(), samples: Math.max(1, Math.round(thinking.samples)), budget: Math.max(1, thinking.timeBudgetMs) });
/**
 * The same hard limits as the card play (bot.ts), so a slow phone never freezes: all the deals asked for; after
 * the budget — only until the least number is reached; after three budgets — stop with whatever there is.
 */
function goesOn(pace: Pace, done: number): boolean {
  if (done >= pace.samples) return false;
  const spent = Date.now() - pace.started;
  if (done >= LEAST_DEALS && spent > pace.budget) return false;
  return !(done >= 1 && spent > pace.budget * 3);
}
/** One deal may take this long; the first one longer, so there is at least one answer. */
const deadlineOf = (pace: Pace, done: number): number => pace.started + pace.budget * (done === 0 ? 6 : 3);
const trumpOf = (strain: Strain): Suit | null => (strain === NO_TRUMP ? null : strain);
// END 1

// BEGIN 2. Plans
/** What a declarer keeps of his twelve cards and what he plays. */
export interface GamePlan {
  readonly rest: CardSet;
  readonly discard: readonly [Card, Card];
  readonly strain: Strain;
  /** What the ten cards kept are worth in that strain at one look (strength.ts). */
  readonly estimate: number;
}

/**
 * Every way to keep ten of twelve cards for a game, the most promising first: 66 discards × the strains asked for,
 * each rated at one look (strength.ts). `only` restricts the strain (a defender imagining a declarer who named it);
 * `leads`: the declarer leads to the first trick.
 */
export function gamePlans(twelve: CardSet, only: Strain | null = null, limit = 1, leads: boolean | null = null): GamePlan[] {
  const cards = cardsOf(twelve);
  const strains: readonly Strain[] = only === null ? [0, 1, 2, 3, NO_TRUMP] : [only];
  const plans: GamePlan[] = [];
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const rest = removeCard(removeCard(twelve, cards[i]), cards[j]);
      let best: Strain = strains[0];
      let bestValue = -Infinity;
      for (const strain of strains) {
        const value = declarerStrength(rest, strain, leads);
        if (value > bestValue + 1e-9) { bestValue = value; best = strain; }
      }
      plans.push({ rest, discard: [cards[i], cards[j]], strain: best, estimate: bestValue });
    }
  }
  plans.sort((a, b) => b.estimate - a.estimate);
  return plans.slice(0, Math.max(1, limit));
}
export const gamePlan = (twelve: CardSet, only: Strain | null = null, leads: boolean | null = null): GamePlan => gamePlans(twelve, only, 1, leads)[0];

/** Ways to keep ten of twelve cards for a misère, the safest first (then the highest cards thrown away). */
export function miserePlans(twelve: CardSet, limit = 1): { rest: CardSet; discard: readonly [Card, Card] }[] {
  const cards = cardsOf(twelve);
  const plans: { rest: CardSet; discard: readonly [Card, Card]; value: number }[] = [];
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const rest = removeCard(removeCard(twelve, cards[i]), cards[j]);
      plans.push({ rest, discard: [cards[i], cards[j]], value: -misereRisk(rest) * 100 + rankOf(cards[i]) + rankOf(cards[j]) });
    }
  }
  plans.sort((a, b) => b.value - a.value);
  return plans.slice(0, Math.max(1, limit)).map(({ rest, discard }) => ({ rest, discard }));
}
// END 2

// BEGIN 3. A bidder
/** One imagined deal for a hand that wins the auction: the strain it would name and the tricks it would take. */
export interface DeclarerWorld { readonly strain: Strain; readonly tricks: number }

/** Places a hand and the two others round the table. */
function seated(seat: Seat, own: CardSet, left: CardSet, right: CardSet): CardSet[] {
  const hands: CardSet[] = [0, 0, 0];
  const [next, last] = otherSeats(seat);
  hands[seat] = own;
  hands[next] = left;
  hands[last] = right;
  return hands;
}

/**
 * A hand before the talon: imagined talons and opponents; in each the hand takes the talon, keeps the best ten
 * cards (gamePlan) and plays its best strain against perfect defence. `lead` is who leads to the first trick.
 */
export function imagineDeclaring(hand: CardSet, seat: Seat, lead: Seat, thinking: Thinking): DeclarerWorld[] {
  const unknown = cardsOf(withoutSet(0xffffffff, hand));
  const worlds: DeclarerWorld[] = [];
  const pace = paceOf(thinking);
  while (goesOn(pace, worlds.length)) {
    const cards = shuffled(unknown, thinking.random);
    const plan = gamePlan(unionOf(hand, setOf(cards.slice(0, 2))), null, seat === lead);
    const hands = seated(seat, plan.rest, setOf(cards.slice(2, 12)), setOf(cards.slice(12, 22)));
    const tricks = solveBefore({ hands, trump: trumpOf(plan.strain), turn: lead, trick: [], target: seat, targetWants: 'max' }, deadlineOf(pace, worlds.length));
    if (tricks === null) break;
    worlds.push({ strain: plan.strain, tricks });
  }
  return worlds;
}

/** The share of imagined deals in which a contract not lower than `bid` is made. */
export function chanceOfBid(worlds: readonly DeclarerWorld[], bid: Bid): number {
  if (worlds.length === 0) return 0;
  let made = 0;
  for (const world of worlds) if (world.tricks >= 6 && gameBid(Math.min(10, world.tricks) as Level, world.strain) >= bid) made += 1;
  return made / worlds.length;
}

/**
 * A misère before the talon: tricks the hand is made to take in every imagined deal (0 = clean). With the talon
 * the hand keeps its safest ten cards; without it («мизер без прикупа») it plays the ten it holds.
 */
export function imagineMisere(hand: CardSet, seat: Seat, lead: Seat, thinking: Thinking, withTalon = true): number[] {
  const unknown = cardsOf(withoutSet(0xffffffff, hand));
  const taken: number[] = [];
  const pace = paceOf(thinking);
  while (goesOn(pace, taken.length)) {
    const cards = shuffled(unknown, thinking.random);
    const rest = withTalon ? miserePlans(unionOf(hand, setOf(cards.slice(0, 2))))[0].rest : hand;
    const hands = seated(seat, rest, setOf(cards.slice(2, 12)), setOf(cards.slice(12, 22)));
    const tricks = solveBefore({ hands, trump: null, turn: lead, trick: [], target: seat, targetWants: 'min' }, deadlineOf(pace, taken.length));
    if (tricks === null) break;
    taken.push(tricks);
  }
  return taken;
}
// END 3

// BEGIN 4. After the talon
/**
 * The declarer holds his twelve (or already ten) cards and compares ways to play them: every plan is played in
 * the same imagined deals of the other twenty cards, so the plans are compared like for like.
 * Returns tricks[plan][deal]; `wants` is 'min' for a misère.
 */
export function imaginePlans(
  plans: readonly { readonly rest: CardSet; readonly strain: Strain | null }[], known: CardSet, seat: Seat, lead: Seat, thinking: Thinking, wants: 'max' | 'min' = 'max',
): number[][] {
  const unknown = cardsOf(withoutSet(0xffffffff, known));
  const tricks: number[][] = plans.map(() => []);
  const pace = paceOf(thinking);
  let deals = 0;
  while (goesOn(pace, deals)) {
    const cards = shuffled(unknown, thinking.random);
    const left = setOf(cards.slice(0, 10));
    const right = setOf(cards.slice(10, 20));
    const row: number[] = [];
    for (const plan of plans) {
      const value = solveBefore({ hands: seated(seat, plan.rest, left, right), trump: plan.strain === null ? null : trumpOf(plan.strain), turn: lead, trick: [], target: seat, targetWants: wants }, deadlineOf(pace, deals));
      if (value === null) break;
      row.push(value);
    }
    // [EN] A deal counts only when every plan was played in it. [RU] Расклад считается, только когда в нём сыграны все планы.
    if (row.length < plans.length) break;
    row.forEach((value, index) => tricks[index].push(value));
    deals += 1;
  }
  return tricks;
}
// END 4

// BEGIN 5. A defender
/**
 * How a declarer's ten cards look at one look (strength.ts) next to the level he named. A declarer names a game he
 * expects to make, and a higher one when he clearly can: an imagined deal where his cards are much weaker than his
 * game — or much stronger — is not how the cards lie. Set by measurement (preferans-calibrate.mjs prints the
 * strength of real declarers minus their level): nine declarers of ten lie between these two numbers.
 */
export const DECLARER_AT_LEAST = -0.35;
export const DECLARER_AT_MOST = 1.6;
/** Tries to find a plausible declarer for one imagined deal; after that the nearest one seen is taken. */
const DECLARER_TRIES = 48;
/** After this many plain tries the declarer is dealt his cards with a lean toward trumps and honours. */
const PLAIN_TRIES = 12;

/**
 * Twenty-two unseen cards in the order they are dealt (twelve to the declarer first). `lean` 0 is a plain shuffle.
 * With a lean the trumps and the honours tend to come first: a declarer who named eight or nine holds them, and a
 * plain shuffle finds such a hand once in thousands of tries. Each card gets the key random^(1/weight); the
 * largest keys come first — a weighted draw without putting cards back.
 */
function dealLeaning(unknown: readonly Card[], strain: Strain, lean: number, random: Random): Card[] {
  if (lean <= 0) return shuffled(unknown, random);
  return unknown
    .map(card => {
      const honour = rankOf(card) >= 5;
      const weight = strain === NO_TRUMP ? (honour ? 1 + 0.9 * lean : 1) : (card >> 3 === strain ? 1 + 1.5 * lean : 1) * (honour ? 1 + 0.5 * lean : 1);
      return { card, key: Math.pow(random(), 1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map(entry => entry.card);
}

/**
 * A defender's view of a declared game: the declarer's tricks in every imagined deal. The twenty-two cards the
 * defender does not see are dealt as twelve to the declarer (his hand with the talon — he keeps the best ten for
 * the strain he named) and ten to the partner; deals where the declarer could not have named this game are thrown
 * away (see DECLARER_AT_LEAST). `partner` is given when its cards are known (the dealer of four looked at them).
 */
export function imagineDefending(
  hand: CardSet, seat: Seat, declarer: Seat, level: Level, strain: Strain, lead: Seat, thinking: Thinking, partner: CardSet | null = null,
): number[] {
  const unknown = cardsOf(withoutSet(0xffffffff, partner === null ? hand : unionOf(hand, partner)));
  const other = otherSeats(declarer).find(defender => defender !== seat) as Seat;
  const declarerTricks: number[] = [];
  const pace = paceOf(thinking);
  while (goesOn(pace, declarerTricks.length)) {
    // [EN] The first deal whose declarer fits his game; if none of the tries does, the one that came nearest.
    // [RU] Первый расклад, в котором играющий соответствует своей игре; если не подошёл ни один, берётся ближайший.
    let chosen: { plan: GamePlan; partnerHand: CardSet; miss: number } | null = null;
    for (let attempt = 0; attempt < DECLARER_TRIES; attempt += 1) {
      // [EN] A hand that fits a six turns up in a plain shuffle; for a higher game the deal soon starts to lean.
      // [RU] Рука под шестерную находится и в простой тасовке; для игры выше раздача вскоре начинает «клонить».
      const lean = attempt < PLAIN_TRIES ? 0 : (level - 6) * (attempt < PLAIN_TRIES * 2 ? 0.5 : 1) + 0.5;
      const cards = dealLeaning(unknown, strain, lean, thinking.random);
      const plan = gamePlan(setOf(cards.slice(0, 12)), strain, declarer === lead);
      const margin = plan.estimate - level;
      const miss = margin < DECLARER_AT_LEAST ? DECLARER_AT_LEAST - margin : margin > DECLARER_AT_MOST ? margin - DECLARER_AT_MOST : 0;
      if (chosen === null || miss < chosen.miss) chosen = { plan, partnerHand: partner ?? setOf(cards.slice(12, 22)), miss };
      if (miss === 0) break;
    }
    if (chosen === null) break;
    const hands: CardSet[] = [0, 0, 0];
    hands[declarer] = chosen.plan.rest;
    hands[seat] = hand;
    hands[other] = chosen.partnerHand;
    const tricks = solveBefore({ hands, trump: trumpOf(strain), turn: lead, trick: [], target: declarer, targetWants: 'max' }, deadlineOf(pace, declarerTricks.length));
    if (tricks === null) break;
    declarerTricks.push(tricks);
  }
  return declarerTricks;
}
// END 5

// BEGIN 6. What a result is worth
/**
 * One deal's score as one number for one player, in whists, zero-sum round the table: the whists written on the
 * others minus the whists written on him, plus what the pool and the mountain turn into at the final settlement
 * (scoring.ts settle: a point of mountain above the table's average costs whistsPerPoint whists; a point of pool
 * is a point of mountain less, because an unfinished pool is written into the mountain when the game ends).
 */
export function worth(score: DealScore, seat: Seat, rules: RuleSet): number {
  const players = score.pool.length;
  let net = 0;
  let total = 0;
  for (let other = 0; other < players; other += 1) {
    net += score.whists[seat][other] - score.whists[other][seat];
    total += score.mountain[other] - score.pool[other];
  }
  return net + rules.whistsPerPoint * (total / players - (score.mountain[seat] - score.pool[seat]));
}

/** The average worth of a game for `seat` over imagined deals; `input` says who whisted and how the tricks fell. */
export function averageWorth(declarerTricks: readonly number[], seat: Seat, rules: RuleSet, input: (declarerTricks: number) => GameScoreInput): number {
  if (declarerTricks.length === 0) return 0;
  let sum = 0;
  for (const tricks of declarerTricks) sum += worth(scoreGame(input(tricks), rules), seat, rules);
  return sum / declarerTricks.length;
}

/** Tricks of every seat when the declarer takes `own` and the defenders share the rest evenly (who takes which is not known in advance). */
export function tricksRound(declarer: Seat, own: number): number[] {
  const tricks = [0, 0, 0];
  const [first, second] = otherSeats(declarer);
  tricks[declarer] = own;
  tricks[first] = (10 - own) / 2;
  tricks[second] = (10 - own) / 2;
  return tricks;
}
/** Share of `values` that satisfy `test`. */
export const shareOf = (values: readonly number[], test: (value: number) => boolean): number =>
  (values.length === 0 ? 0 : values.filter(test).length / values.length);
// END 6

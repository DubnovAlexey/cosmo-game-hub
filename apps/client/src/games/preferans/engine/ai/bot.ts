// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/bot.ts
// PURPOSE: a computer player for any decision of a deal. Everything is decided the same way: the bot imagines
//   deals consistent with what its seat knows and lets the exact solver (solver.ts) play them.
//   - Card play: Perfect-Information Monte Carlo — the card with the best average over the imagined deals.
//   - Before the play (a bid, a misère, the discard, the contract, a whist): foresight.ts — how often the game
//     is made, how many tricks the defence takes, and what each choice is worth by the table's own scoring.
//   - The quick estimates (evaluate.ts) pick the discards worth imagining and stand in when there is no time.
// SECTIONS: 1 options; 2 bidding; 3 discard and contract; 4 whist; 5 card play; 6 entry point.
// =====================================================================
import { legalBids } from '../bidding.ts';
import {
  LEVELS, MISERE, MISERE_NO_TALON, contractOf, darkBid, darkLevel, gameBid, isDarkBid, isMisereBid,
  type Bid, type Level, type Strain,
} from '../bids.ts';
import { canPassDark, isFirstCall } from '../bidding.ts';
import { cardsOf, rankOf, setOf, suitOf, suitSet, unionOf, type Card, type CardSet } from '../cards.ts';
import { controllerOf, legalActions, legalPlays, ledSuitOf, type Action, type DealState, type WhistCall } from '../deal.ts';
import { otherSeats, type Seat } from '../play.ts';
import type { RuleSet } from '../rules.ts';
import { scoreConcession, scoreGame, type GameScoreInput } from '../scoring.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { createRandom, type Random } from '../../../../shared/engine/random.ts';
import { bestStrain, estimateDeclarerTricks, estimateDefenderTricks, misereRisk } from './evaluate.ts';
import {
  averageWorth, chanceOfBid, gamePlans, imagineDeclaring, imagineDefending, imagineMisere, imaginePlans, miserePlans, shareOf, tricksRound, worth,
  type Thinking,
} from './foresight.ts';
import { knowledgeOf, sampleHands } from './knowledge.ts';
import { scoreMoves } from './solver.ts';
import { bestStrength, declarerStrength } from './strength.ts';

// BEGIN 1. Options
/**
 * A character's manner at the table (the dwellers of the lair differ, characters/roster.ts). Small shifts of the
 * same sound decisions, so every style still plays legal, sensible preferans.
 */
export interface BotStyle {
  /** A bold bidder (+0.4) bids games that are made less often, a careful one (−0.2) wants a surer game. */
  readonly boldness: number;
  /** 0.8 whists eagerly, even when the whist is worth a little less than nothing; 1.2 only when it clearly pays. */
  readonly whistCaution: number;
  /** How risky a misère it still bids: 0 = only one that nearly always comes home, 3 = a coin toss is enough. */
  readonly misereNerve: number;
}
export const NEUTRAL_STYLE: BotStyle = Object.freeze({ boldness: 0, whistCaution: 1, misereNerve: 0 });

export interface BotOptions {
  readonly random?: Random;
  /** Deals sampled per card decision. */
  readonly samples?: number;
  /** Sampling stops after this many milliseconds (at least three samples are solved). */
  readonly timeBudgetMs?: number;
  /** The manner of the character at this seat; neutral when absent. */
  readonly style?: BotStyle;
  /**
   * Deals imagined per decision before the play (a bid, the discard, the contract, a whist). Absent: a little more
   * than `samples`, at least twelve. 0: no imagining at all — the quick estimates decide, as the bots did before
   * 10.11.2026 (kept for comparison in preferans-calibrate.mjs and as the fallback of a slow device).
   */
  readonly foresight?: number;
}

/**
 * A game is bid when it is made at least this often in the imagined deals (the talon taken, the best ten cards
 * kept, perfect play of all three). Measured on 10.11.2026 (preferans-calibrate.mjs): with these numbers the bots
 * make about four contested games of five and one deal in four or five goes to all-pass.
 */
const BID_CHANCE = 0.66;
/** Both others have passed: a pass now means all-pass, which costs the strongest hand most, so an even chance is enough. */
const LAST_CHANCE = 0.48;
/** Boldness in the same units as before (tricks of the old estimate): +0.4 lowers the chance wanted by 0.2. */
const BOLDNESS_TO_CHANCE = 0.5;
/**
 * Hands that need no imagining, by their strength at one look before the talon (strength.ts; measured on 4500
 * hands, 10.11.2026): below 2.6 a six is made in one deal of eight at best — a pass; from 6.0 it is made in 97 deals
 * of 100 — a bid of six at once. Between them the bot imagines.
 */
const HOPELESS_STRENGTH = 2.6;
const SURE_SIX_STRENGTH = 6.0;
/** A misère is bid when it comes home clean at least this often; every point of nerve lowers it. */
const MISERE_CHANCE = 0.72;
const MISERE_NERVE_STEP = 0.07;
/** Misère hands with more dangerous cards than this before the talon are not worth imagining. */
const MISERE_RISK_TO_IMAGINE = 3;
/** A cautious whister (1.2) wants a whist to be worth this many whists × 0.2 more before it says «вист». */
const CAUTION_WHISTS = 15;
/**
 * Every whister wants a whist to pay at least this many whists more than letting the game go: the imagined deals are
 * few, and a whist that only breaks even on paper loses a little at the table.
 */
const WHIST_MARGIN = 2;
/** Fewer imagined deals than this decide nothing: the quick estimates answer instead. */
const ENOUGH_DEALS = 4;

/** The old rule of thumb, kept as the fallback: what the two talon cards add to the estimate before the talon. */
const TALON_BONUS = 1.0;
const LAST_CHANCE_BONUS = 0.6;

function thinkingOf(options: BotOptions, share = 1): Thinking | null {
  const samples = options.foresight ?? Math.max(12, Math.round((options.samples ?? 24) * 1.25));
  if (samples <= 0) return null;
  return {
    random: options.random ?? createRandom(Date.now() >>> 0),
    samples: Math.max(ENOUGH_DEALS, Math.round(samples * share)),
    timeBudgetMs: (options.timeBudgetMs ?? 400) * 2,
  };
}
// END 1

// BEGIN 2. Bidding
function chooseBid(state: DealState, seat: Seat, style: BotStyle, options: BotOptions): Action {
  const bidding = state.bidding;
  const legal = legalBids(bidding, state.rules);
  const random = options.random;
  // [EN] Dark calls are decided before looking at the cards, so they never read the hand: a little chance, more for
  //      a bold character and where dark passes earn bombs. A dark bidder then only passes.
  // [RU] Тёмные слова решаются до взгляда в карты, поэтому руку не читают: небольшой шанс, больше у смелого персонажа
  //      и там, где тёмный пас приносит бомбы. Сказавший втёмную дальше только пасует.
  const own = bidding.lastBid[seat];
  if (own !== null && isDarkBid(own)) return { type: 'pass', seat };
  if (state.rules.darkBids && isFirstCall(bidding, seat) && random) {
    const bold = Math.max(0, style.boldness);
    const roll = random();
    const passChance = (state.rules.bombs ? 0.1 : 0.05) + 0.1 * bold;
    if (canPassDark(bidding, state.rules) && roll < passChance) return { type: 'pass', seat, dark: true };
    const dark = legal.find(bid => isDarkBid(bid));
    if (dark !== undefined && dark === darkBid(6) && roll < passChance + 0.02 + 0.06 * bold) return { type: 'bid', seat, bid: dark };
  }
  const hand = state.hands[seat];
  const thinking = thinkingOf(options);
  const lead = state.firstHand;

  // Misère: a clean hand at once; a hand with a few dangerous cards — when the talon rescues it often enough.
  if (legal.includes(MISERE)) {
    const risk = misereRisk(hand);
    let bid = risk === 0;
    if (!bid && thinking && risk <= MISERE_RISK_TO_IMAGINE) {
      const taken = imagineMisere(hand, seat, lead, thinking);
      bid = taken.length >= ENOUGH_DEALS
        ? shareOf(taken, tricks => tricks === 0) >= MISERE_CHANCE - MISERE_NERVE_STEP * style.misereNerve
        : risk <= style.misereNerve;
    } else if (!bid && !thinking) {
      bid = risk <= style.misereNerve;
    }
    if (bid) return { type: 'bid', seat, bid: MISERE };
  }
  // [EN] Without the talon only a hand that needs no help: beats the nines, scores like misère. [RU] Без прикупа — только рука, которой помощь не нужна.
  if (legal.includes(MISERE_NO_TALON) && !legal.includes(MISERE) && misereRisk(hand) <= 0) return { type: 'bid', seat, bid: MISERE_NO_TALON };

  const cheapest = legal.find(bid => bid !== MISERE && bid !== MISERE_NO_TALON && !isDarkBid(bid));
  if (cheapest === undefined) return { type: 'pass', seat };
  const best = bestStrain(hand);
  const lastChance = bidding.highest === null && otherSeats(seat).every(other => bidding.passed[other]);
  const byEstimate = (): Action => {
    const level = Math.min(10, Math.floor(best.tricks + TALON_BONUS + (lastChance ? LAST_CHANCE_BONUS : 0) + style.boldness));
    return level >= 6 && cheapest <= gameBid(level as Level, best.strain) ? { type: 'bid', seat, bid: cheapest } : { type: 'pass', seat };
  };
  if (!thinking) return byEstimate();
  const strength = bestStrength(hand, seat === lead).tricks + style.boldness * 0.5;
  if (strength < HOPELESS_STRENGTH) return { type: 'pass', seat };
  if (strength >= SURE_SIX_STRENGTH && cheapest < gameBid(7, 0)) return { type: 'bid', seat, bid: cheapest };
  const worlds = imagineDeclaring(hand, seat, lead, thinking);
  if (worlds.length < ENOUGH_DEALS) return byEstimate();
  const wanted = (lastChance ? LAST_CHANCE : BID_CHANCE) - BOLDNESS_TO_CHANCE * style.boldness;
  return chanceOfBid(worlds, cheapest) >= wanted ? { type: 'bid', seat, bid: cheapest } : { type: 'pass', seat };
}
// END 2

// BEGIN 3. Discard and contract
/** The lowest game the declarer may name: his winning bid; a dark level allows any suit of that level. */
function requiredBid(state: DealState): Bid {
  const won = state.winningBid ?? 0;
  return isDarkBid(won) ? gameBid(darkLevel(won), 0) : won;
}

/**
 * What a game of `level` is worth to its declarer over the imagined deals, by the table's own scoring. One
 * defender is taken to whist every time: the cautious view — a game nobody whists only scores better.
 */
function contractWorth(declarerTricks: readonly number[], declarer: Seat, level: Level, rules: RuleSet): number {
  const whister = otherSeats(declarer)[0];
  const input = (tricks: number): GameScoreInput => ({ declarer, level, tricks: tricksRound(declarer, tricks), whisters: [whister], halfWhister: null, played: true });
  return averageWorth(declarerTricks, declarer, rules, input);
}

/** The game of `strain`, not lower than `required`, that is worth most; a higher level only when it clearly pays. */
function bestContract(declarerTricks: readonly number[], strain: Strain, required: Bid, declarer: Seat, rules: RuleSet): { bid: Bid; worth: number } | null {
  let best: { bid: Bid; worth: number } | null = null;
  for (const level of LEVELS) {
    const bid = gameBid(level, strain);
    if (bid < required) continue;
    const value = contractWorth(declarerTricks, declarer, level, rules);
    if (best === null || value > best.worth + 1e-9) best = { bid, worth: value };
  }
  return best;
}

function chooseDiscard(state: DealState, seat: Seat, options: BotOptions): Action {
  const twelve = state.hands[seat];
  const lead = state.firstHand;
  if (isMisereBid(state.winningBid)) {
    // Misère: the safest ways to keep ten cards, compared by how often they come home clean.
    const plans = miserePlans(twelve, 4);
    const thinking = thinkingOf(options, 0.5);
    if (!thinking) return { type: 'discard', seat, cards: plans[0].discard };
    const taken = imaginePlans(plans.map(plan => ({ rest: plan.rest, strain: null })), twelve, seat, lead, thinking, 'min');
    let chosen = 0;
    let bestValue = -Infinity;
    taken.forEach((tricks, index) => {
      if (tricks.length < ENOUGH_DEALS) return;
      // Clean deals first; among equally clean plans the one that takes fewer tricks when caught.
      const value = shareOf(tricks, count => count === 0) * 100 - tricks.reduce((sum, count) => sum + count, 0) / tricks.length;
      if (value > bestValue + 1e-9) { bestValue = value; chosen = index; }
    });
    return { type: 'discard', seat, cards: plans[chosen].discard };
  }
  // A game: the most promising discards (each with its strain), compared by what their best contract is worth.
  const plans = gamePlans(twelve, null, 5, seat === lead);
  const thinking = thinkingOf(options, 0.5);
  if (!thinking) return { type: 'discard', seat, cards: plans[0].discard };
  const required = requiredBid(state);
  const tricks = imaginePlans(plans, twelve, seat, lead, thinking);
  let chosen = 0;
  let bestValue = -Infinity;
  tricks.forEach((declarerTricks, index) => {
    if (declarerTricks.length < ENOUGH_DEALS) return;
    const contract = bestContract(declarerTricks, plans[index].strain, required, seat, state.rules);
    if (contract !== null && contract.worth > bestValue + 1e-9) { bestValue = contract.worth; chosen = index; }
  });
  return { type: 'discard', seat, cards: plans[chosen].discard };
}

/** The contract by the quick estimates: the largest safety margin, among equally safe contracts the cheapest. */
function chooseContractByEstimate(state: DealState, seat: Seat): Action {
  const hand = state.hands[seat];
  let best: Bid = state.winningBid ?? 0;
  let bestMargin = -Infinity;
  for (const action of legalActions(state)) {
    if (action.type !== 'declare') continue;
    const contract = contractOf(action.bid);
    if (contract.kind !== 'game') continue;
    const margin = Math.min(estimateDeclarerTricks(hand, contract.strain as Strain) - contract.level, 0.5);
    if (margin > bestMargin + 1e-9) { bestMargin = margin; best = action.bid; }
  }
  // A hopeless game on a table that allows conceding: giving up costs a fixed price in the mountain, while
  // playing it out also pays the defenders' whists and consolation.
  const concede = state.rules.concedeTricks;
  if (concede > 0 && -bestMargin >= concede - 0.5) return { type: 'concede', seat };
  return { type: 'declare', seat, bid: best };
}

function chooseContract(state: DealState, seat: Seat, options: BotOptions): Action {
  const thinking = thinkingOf(options);
  if (!thinking) return chooseContractByEstimate(state, seat);
  const hand = state.hands[seat];
  const required = requiredBid(state);
  // The two strains the quick estimate likes best: the cards are already chosen, only the name of the game is open.
  const strains = ([0, 1, 2, 3, 4] as Strain[])
    .map(strain => ({ strain, estimate: declarerStrength(hand, strain, seat === state.firstHand) }))
    .sort((a, b) => b.estimate - a.estimate)
    .slice(0, 2);
  const known = unionOf(hand, setOf(state.discards));
  const tricks = imaginePlans(strains.map(({ strain }) => ({ rest: hand, strain })), known, seat, state.firstHand, thinking);
  let best: { bid: Bid; worth: number } | null = null;
  tricks.forEach((declarerTricks, index) => {
    if (declarerTricks.length < ENOUGH_DEALS) return;
    const contract = bestContract(declarerTricks, strains[index].strain, required, seat, state.rules);
    if (contract !== null && (best === null || contract.worth > best.worth + 1e-9)) best = contract;
  });
  if (best === null) return chooseContractByEstimate(state, seat);
  const chosen: { bid: Bid; worth: number } = best;
  // [EN] A hopeless game where the table lets the declarer give up: the fixed price against the worth of playing.
  // [RU] Безнадёжная игра там, где стол разрешает уйти: твёрдая цена против того, чего стоит доиграть.
  const concede = state.rules.concedeTricks;
  if (concede > 0) {
    const bidLevel = contractOf(required).kind === 'game' ? (contractOf(required) as { level: Level }).level : 6;
    if (worth(scoreConcession(seat, bidLevel, concede, state.rules), seat, state.rules) > chosen.worth) return { type: 'concede', seat };
  }
  return { type: 'declare', seat, bid: chosen.bid };
}
// END 3

// BEGIN 4. Whist
function whistObligation(state: DealState): { obligation: number; level: number } {
  const contract = state.contract;
  const level = contract && contract.kind === 'game' ? contract.level : 6;
  return { obligation: state.rules.whistObligation[level as Level], level };
}

/** The whist by the quick estimates of the defender's own hand — the fallback when there is no time to imagine. */
function chooseWhistByEstimate(state: DealState, seat: Seat, style: BotStyle, legal: readonly (WhistCall | null)[]): Action {
  const whist = state.whist;
  // [EN] An eager whister sees a little more in its hand, a cautious one a little less. [RU] Охотник вистовать видит в руке чуть больше, осторожный — чуть меньше.
  const expected = estimateDefenderTricks(state.hands[seat], state.trump) / style.whistCaution;
  const { obligation, level } = whistObligation(state);
  if (!whist || whist.order[0] === seat) return { type: 'whist', seat, call: expected >= obligation / 2 ? 'whist' : 'pass' };
  if (whist.calls[0] === 'whist') {
    const enough = level >= 8 ? expected >= 1 : expected >= obligation / 2; // on 8–9 the second whister answers for the trick
    return { type: 'whist', seat, call: enough ? 'whist' : 'pass' };
  }
  if (expected >= obligation * 0.8) return { type: 'whist', seat, call: 'whist' };
  if (legal.includes('half') && expected >= obligation / 2 - 0.25) return { type: 'whist', seat, call: 'half' };
  return { type: 'whist', seat, call: 'pass' };
}

/**
 * What every answer of a defender is worth to it, over imagined deals of the declared game: the game is not played
 * (both pass), this defender whists alone, both whist, the other one whists alone, this one takes half-whist.
 * null when the game could not be imagined (no time, not a game).
 */
function whistWorth(state: DealState, seat: Seat, options: BotOptions, hand: CardSet = state.hands[seat], partnerHand: CardSet | null = null):
  { quiet: number; alone: number; both: number; watching: number; half: number; partnerHalf: number } | null {
  const contract = state.contract;
  const declarer = state.declarer;
  const thinking = thinkingOf(options);
  if (!thinking || !contract || contract.kind !== 'game' || declarer === null) return null;
  const level = contract.level;
  const view = imagineDefending(hand, seat, declarer, level, contract.strain, state.firstHand, thinking, partnerHand);
  if (view.length < ENOUGH_DEALS) return null;
  const rules = state.rules;
  const partner = otherSeats(declarer).find(defender => defender !== seat) as Seat;
  const first = state.whist?.order[0] ?? seat;
  const played = (whisters: readonly Seat[]) => (tricks: number): GameScoreInput => ({ declarer, level, tricks: tricksRound(declarer, tricks), whisters, halfWhister: null, played: true });
  const unplayed = (halfWhister: Seat | null): number => worth(scoreGame({ declarer, level, tricks: [0, 0, 0], whisters: [], halfWhister, played: false }, rules), seat, rules);
  return {
    quiet: unplayed(null),
    alone: averageWorth(view, seat, rules, played([seat])),
    both: averageWorth(view, seat, rules, played(first === seat ? [seat, partner] : [partner, seat])),
    watching: averageWorth(view, seat, rules, played([partner])),
    half: unplayed(seat),
    partnerHalf: unplayed(partner),
  };
}

function chooseWhist(state: DealState, seat: Seat, style: BotStyle, options: BotOptions): Action {
  const whist = state.whist;
  const legal = legalActions(state).map(action => (action.type === 'whist' ? action.call : null));
  // A forced call (Stalingrad: only «вист» on a six of spades) needs no thinking.
  if (legal.length === 1 && legal[0] !== null) return { type: 'whist', seat, call: legal[0] };
  const value = whist ? whistWorth(state, seat, options) : null;
  if (!whist || value === null) return chooseWhistByEstimate(state, seat, style, legal);
  // [EN] A cautious whister wants a whist to pay a little, an eager one whists even at a small loss.
  // [RU] Осторожный вистующий хочет, чтобы вист немного окупался, охотник вистует и с небольшим убытком.
  const caution = WHIST_MARGIN + (style.whistCaution - 1) * CAUTION_WHISTS;
  if (whist.order[0] === seat) return { type: 'whist', seat, call: value.alone - caution > value.quiet ? 'whist' : 'pass' };
  if (whist.calls[0] === 'whist') return { type: 'whist', seat, call: value.both - caution > value.watching ? 'whist' : 'pass' };
  // The first defender passed: whist alone, take the sure half where the table has it, or let the game go.
  const quiet = legal.includes('half') ? Math.max(value.half, value.quiet) : value.quiet;
  if (value.alone - caution > quiet) return { type: 'whist', seat, call: 'whist' };
  return { type: 'whist', seat, call: legal.includes('half') && value.half >= value.quiet ? 'half' : 'pass' };
}
// END 4

// BEGIN 5. Card play
/** Talon-led all-pass tricks: duck with the lowest card of the suit; with none, shed the most dangerous card. */
function chooseTalonTrickCard(state: DealState): Card {
  const legal = legalPlays(state);
  const ledSuit = ledSuitOf(state);
  const follow = ledSuit === null ? [] : legal.filter(card => suitOf(card) === ledSuit);
  if (follow.length > 0) return follow[0];
  return legal.reduce((worst, card) => (rankOf(card) > rankOf(worst) ? card : worst), legal[0]);
}

function choosePlay(state: DealState, seat: Seat, options: BotOptions): Card {
  const legal = legalPlays(state);
  if (legal.length === 1) return legal[0];
  if (state.trickLead !== null) return chooseTalonTrickCard(state);
  const random = options.random ?? createRandom(Date.now() >>> 0);
  const samples = options.samples ?? 24;
  const budget = options.timeBudgetMs ?? 400;
  const mode = state.mode ?? 'game';
  const target: Seat = mode === 'raspasy' ? seat : (state.declarer as Seat);
  const targetWants = mode === 'game' ? 'max' : 'min';
  // This seat wants the target's tricks high when it is the declarer in a game or a defender against misère.
  const wantsHigh = mode === 'game' ? seat === state.declarer : mode === 'misere' ? seat !== state.declarer : false;
  const knowledge = knowledgeOf(state, controllerOf(state, seat));
  const totals = new Map<Card, number>(legal.map(card => [card, 0]));
  const started = Date.now();
  // Hard limits, so a slow phone never freezes on a hard deal: after the budget the bot stops once it has three
  // samples; after three budgets it stops with whatever it has; the first sample may take up to six budgets.
  // If even that one is not solved in time, the bot plays its lowest legal card — a safe duck — and the game goes on.
  const hardStop = started + budget * 3;
  const firstDeadline = started + budget * 6;
  let solved = 0;
  for (let sample = 0; sample < samples; sample += 1) {
    if (solved >= 3 && Date.now() - started > budget) break;
    if (solved >= 1 && Date.now() > hardStop) break;
    const hands = sampleHands(knowledge, random);
    if (!hands) continue;
    const scores = scoreMoves({ hands, trump: state.trump, turn: seat, trick: state.trick, target, targetWants }, solved === 0 ? firstDeadline : hardStop);
    if (!scores) break;
    for (const { card, tricks } of scores) totals.set(card, (totals.get(card) ?? 0) + tricks);
    solved += 1;
  }
  if (solved === 0) return legal[0];
  let best = legal[0];
  let bestValue = wantsHigh ? -Infinity : Infinity;
  for (const card of legal) {
    const value = totals.get(card) ?? 0;
    // Ties keep the lower card: high cards are worth more later.
    const better = wantsHigh ? value > bestValue + 1e-9 : value < bestValue - 1e-9;
    if (better) { best = card; bestValue = value; }
  }
  return best;
}
// END 5

// BEGIN 6. Entry point
/**
 * The decision of the seat on turn (in open whist the whister also plays the passer's cards).
 * A safety net checks every non-card decision against the rules: if a decision ever proposes something the
 * table does not allow (a new rule option it does not know yet), the bot takes the first legal action instead
 * of stopping the game.
 */
export function chooseAction(state: DealState, options: BotOptions = {}): Action {
  const action = decide(state, options);
  if (state.phase === 'play') return action;
  const legal = legalActions(state);
  const key = JSON.stringify(action);
  return legal.some(candidate => JSON.stringify(candidate) === key) || legal.length === 0 ? action : legal[0];
}

function decide(state: DealState, options: BotOptions): Action {
  const seat = state.turn;
  if (seat === null) throw new Error('The deal is over: nobody has to act');
  const style = options.style ?? NEUTRAL_STYLE;
  switch (state.phase) {
    case 'bidding': return chooseBid(state, seat, style, options);
    case 'misereShare': {
      // [EN] Four at the table: a misère with any risk is shared with the dealer. [RU] Вчетвером мизер с риском делят со сдающим.
      return { type: 'shareMisere', seat, share: misereRisk(state.hands[seat]) > style.misereNerve * 0.5 };
    }
    case 'discard': return chooseDiscard(state, seat, options);
    case 'declare': return chooseContract(state, seat, options);
    case 'whist': return chooseWhist(state, seat, style, options);
    case 'whistReturn': {
      // [EN] The partner took half-whist: come back and whist alone only when that is worth more than letting the half stand.
      // [RU] Партнёр взял полвиста: вернуться и вистовать одному стоит, только если это выгоднее, чем оставить полвиста.
      const value = whistWorth(state, seat, options);
      if (value !== null) return { type: 'returnWhist', seat, accept: value.alone - WHIST_MARGIN - (style.whistCaution - 1) * CAUTION_WHISTS > value.partnerHalf };
      const { obligation } = whistObligation(state);
      return { type: 'returnWhist', seat, accept: estimateDefenderTricks(state.hands[seat], state.trump) >= obligation * 0.75 };
    }
    case 'whistMode': {
      // [EN] Whist–pass–half: a lone whister whose whist is worth less than the sure half takes the half instead.
      // [RU] Вист — пас — полвиста: одинокий вистующий, чей вист стоит меньше верных полвиста, берёт полвиста.
      const canHalf = legalActions(state).some(action => action.type === 'takeHalf');
      if (canHalf) {
        const value = whistWorth(state, seat, options);
        if (value !== null) return value.half > value.alone ? { type: 'takeHalf', seat } : { type: 'whistMode', seat, open: true };
        const { obligation } = whistObligation(state);
        if (estimateDefenderTricks(state.hands[seat], state.trump) / style.whistCaution < obligation * 0.9) return { type: 'takeHalf', seat };
      }
      return { type: 'whistMode', seat, open: true };
    }
    case 'dealerWhist': {
      // [EN] The dealer looks at the first defender's hand and whists with it when that whist is worth more than
      //      letting the game go (counted as that defender's own whist).
      // [RU] Сдающий смотрит руку первого защитника и вистует ею, если такой вист стоит больше, чем отпустить игру
      //      (считается как собственный вист этого защитника).
      const whist = state.whist;
      if (!whist) return { type: 'dealerWhist', seat, whist: false };
      const look = whist.dealerLook;
      if (look === null || look === undefined) return { type: 'dealerLook', seat, defender: whist.order[0] };
      const value = whistWorth(state, look, options, state.hands[look]);
      if (value !== null) return { type: 'dealerWhist', seat, whist: value.alone - WHIST_MARGIN - (style.whistCaution - 1) * CAUTION_WHISTS > value.quiet };
      const { obligation } = whistObligation(state);
      return { type: 'dealerWhist', seat, whist: estimateDefenderTricks(state.hands[look], state.trump) / style.whistCaution >= obligation * 0.8 };
    }
    case 'play': return { type: 'play', seat, card: choosePlay(state, seat, options) };
    default: throw new Error(`No decision in phase ${state.phase}`);
  }
}

/** Handy for tests and demos: suit cards of a hand, highest first. */
export const describeSuit = (hand: CardSet, suit: 0 | 1 | 2 | 3): Card[] => cardsOf(suitSet(hand, suit)).reverse();
// END 6

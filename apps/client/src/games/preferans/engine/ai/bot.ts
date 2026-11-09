// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/bot.ts
// PURPOSE: a computer player for any decision of a deal. Card play: Perfect-Information Monte Carlo —
//   sample deals consistent with what this seat knows, solve each exactly (solver.ts), play the card with the
//   best average. Bidding, discard, contract and whist: quick hand estimates (evaluate.ts).
// SECTIONS: 1 options; 2 bidding; 3 discard and contract; 4 whist; 5 card play; 6 entry point.
// =====================================================================
import { legalBids } from '../bidding.ts';
import { MISERE, MISERE_NO_TALON, darkBid, gameBid, contractOf, isDarkBid, type Bid, type Level, type Strain } from '../bids.ts';
import { canPassDark, isFirstCall } from '../bidding.ts';
import { cardsOf, rankOf, removeCard, suitOf, suitSet, type Card, type CardSet } from '../cards.ts';
import { controllerOf, legalActions, legalPlays, ledSuitOf, type Action, type DealState } from '../deal.ts';
import { otherSeats, type Seat } from '../play.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { createRandom, type Random } from '../../../../shared/engine/random.ts';
import { bestStrain, estimateDeclarerTricks, estimateDefenderTricks, misereRisk } from './evaluate.ts';
import { knowledgeOf, sampleHands } from './knowledge.ts';
import { scoreMoves } from './solver.ts';

// BEGIN 1. Options
/**
 * A character's manner at the table (the dwellers of the lair differ, characters/roster.ts). Small shifts of the
 * same sound heuristics, so every style still plays legal, sensible preferans.
 */
export interface BotStyle {
  /** Added to the bidding estimate: a bold bidder (+0.4) bids lighter hands, a careful one (−0.2) wants more. */
  readonly boldness: number;
  /** Multiplies the whist thresholds: 0.8 whists eagerly, 1.2 only with a sure defence. */
  readonly whistCaution: number;
  /** The highest misère risk (evaluate.ts: dangerous cards) still bid: 0 = only a clean misère. */
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
}
/**
 * What the two talon cards add to the estimate before the talon. Measured on 08.11.2026 (4500 hands, talon taken,
 * best discard, double-dummy play): an estimate of 5.0 ends with 6.2 tricks on average and makes six in 72% of deals.
 * The earlier 0.6 bid only 13% of hands although 38% make six, so two deals in three went to all-pass.
 */
const TALON_BONUS = 1.0;
/**
 * Both others have passed: a pass now means all-pass, which costs the strongest hand most, so it bids a bit lighter.
 * With both bonuses, 300 deals of three bots: all-pass 33% (it was 63%), games 67%, played games made 68%.
 */
const LAST_CHANCE_BONUS = 0.6;
// END 1

// BEGIN 2. Bidding
function chooseBid(state: DealState, seat: Seat, style: BotStyle, random?: Random): Action {
  const bidding = state.bidding;
  const legal = legalBids(bidding, state.rules);
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
  if (legal.includes(MISERE) && misereRisk(hand) <= style.misereNerve) return { type: 'bid', seat, bid: MISERE };
  // [EN] Without the talon only a hand that needs no help: beats the nines, scores like misère. [RU] Без прикупа — только рука, которой помощь не нужна.
  if (legal.includes(MISERE_NO_TALON) && !legal.includes(MISERE) && misereRisk(hand) <= 0) return { type: 'bid', seat, bid: MISERE_NO_TALON };
  const best = bestStrain(hand);
  const lastChance = bidding.highest === null && otherSeats(seat).every(other => bidding.passed[other]);
  const level = Math.min(10, Math.floor(best.tricks + TALON_BONUS + (lastChance ? LAST_CHANCE_BONUS : 0) + style.boldness));
  const cheapest = legal.find(bid => bid !== MISERE && bid !== MISERE_NO_TALON && !isDarkBid(bid));
  if (level < 6 || cheapest === undefined) return { type: 'pass', seat };
  return cheapest <= gameBid(level as Level, best.strain) ? { type: 'bid', seat, bid: cheapest } : { type: 'pass', seat };
}
// END 2

// BEGIN 3. Discard and contract
function chooseDiscard(state: DealState, seat: Seat): Action {
  const cards = cardsOf(state.hands[seat]);
  const misere = state.winningBid === MISERE;
  let bestPair: [Card, Card] = [cards[0], cards[1]];
  let bestValue = -Infinity;
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const rest = removeCard(removeCard(state.hands[seat], cards[i]), cards[j]);
      // Misère: the safest hand, then dropping the highest cards. A game: the most expected tricks.
      const value = misere ? -misereRisk(rest) * 100 + rankOf(cards[i]) + rankOf(cards[j]) : bestStrain(rest).tricks;
      if (value > bestValue) { bestValue = value; bestPair = [cards[i], cards[j]]; }
    }
  }
  return { type: 'discard', seat, cards: bestPair };
}

function chooseContract(state: DealState, seat: Seat): Action {
  const hand = state.hands[seat];
  let best: Bid = state.winningBid ?? 0;
  let bestMargin = -Infinity;
  for (const action of legalActions(state)) {
    if (action.type !== 'declare') continue;
    const contract = contractOf(action.bid);
    if (contract.kind !== 'game') continue;
    const margin = Math.min(estimateDeclarerTricks(hand, contract.strain as Strain) - contract.level, 0.5);
    // The largest safety margin; among equally safe contracts the cheapest one.
    if (margin > bestMargin + 1e-9) { bestMargin = margin; best = action.bid; }
  }
  // A hopeless game on a table that allows conceding: giving up costs a fixed price in the mountain, while
  // playing it out also pays the defenders' whists and consolation. Concede only when the expected shortfall
  // is clearly that large (the estimates are rough).
  const concede = state.rules.concedeTricks;
  if (concede > 0 && -bestMargin >= concede - 0.5) return { type: 'concede', seat };
  return { type: 'declare', seat, bid: best };
}
// END 3

// BEGIN 4. Whist
function whistObligation(state: DealState): { obligation: number; level: number } {
  const contract = state.contract;
  const level = contract && contract.kind === 'game' ? contract.level : 6;
  return { obligation: state.rules.whistObligation[level as Level], level };
}

function chooseWhist(state: DealState, seat: Seat, style: BotStyle): Action {
  const whist = state.whist;
  // [EN] An eager whister sees a little more in its hand, a cautious one a little less. [RU] Охотник вистовать видит в руке чуть больше, осторожный — чуть меньше.
  const expected = estimateDefenderTricks(state.hands[seat], state.trump) / style.whistCaution;
  const { obligation, level } = whistObligation(state);
  const legal = legalActions(state).map(action => (action.type === 'whist' ? action.call : null));
  // A forced call (Stalingrad: only «вист» on a six of spades) needs no thinking.
  if (legal.length === 1 && legal[0] !== null) return { type: 'whist', seat, call: legal[0] };
  if (!whist || whist.order[0] === seat) return { type: 'whist', seat, call: expected >= obligation / 2 ? 'whist' : 'pass' };
  if (whist.calls[0] === 'whist') {
    const enough = level >= 8 ? expected >= 1 : expected >= obligation / 2; // on 8–9 the second whister answers for the trick
    return { type: 'whist', seat, call: enough ? 'whist' : 'pass' };
  }
  if (expected >= obligation * 0.8) return { type: 'whist', seat, call: 'whist' };
  if (legal.includes('half') && expected >= obligation / 2 - 0.25) return { type: 'whist', seat, call: 'half' };
  return { type: 'whist', seat, call: 'pass' };
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
 * A safety net checks every non-card decision against the rules: if a heuristic ever proposes something the
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
    case 'bidding': return chooseBid(state, seat, style, options.random);
    case 'misereShare': {
      // [EN] Four at the table: a misère with any risk is shared with the dealer. [RU] Вчетвером мизер с риском делят со сдающим.
      return { type: 'shareMisere', seat, share: misereRisk(state.hands[seat]) > style.misereNerve * 0.5 };
    }
    case 'discard': return chooseDiscard(state, seat);
    case 'declare': return chooseContract(state, seat);
    case 'whist': return chooseWhist(state, seat, style);
    case 'whistReturn': {
      const { obligation } = whistObligation(state);
      return { type: 'returnWhist', seat, accept: estimateDefenderTricks(state.hands[seat], state.trump) >= obligation * 0.75 };
    }
    case 'whistMode': {
      // [EN] Whist–pass–half: a lone whister who expects less than the obligation takes the sure half instead.
      // [RU] Вист — пас — полвиста: одинокий вистующий, ожидающий меньше обязательства, берёт верные полвиста.
      const { obligation } = whistObligation(state);
      const canHalf = legalActions(state).some(action => action.type === 'takeHalf');
      if (canHalf && estimateDefenderTricks(state.hands[seat], state.trump) / style.whistCaution < obligation * 0.9) return { type: 'takeHalf', seat };
      return { type: 'whistMode', seat, open: true };
    }
    case 'dealerWhist': {
      // [EN] The dealer looks at the first defender's hand and whists with it when it holds the obligation.
      // [RU] Сдающий смотрит руку первого защитника и вистует ею, если она тянет обязательство.
      const whist = state.whist;
      if (!whist) return { type: 'dealerWhist', seat, whist: false };
      const look = whist.dealerLook;
      if (look === null || look === undefined) return { type: 'dealerLook', seat, defender: whist.order[0] };
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

// =====================================================================
// FILE: apps/client/src/games/poker/engine/ai/bot.ts
// PURPOSE: a computer player for no-limit hold'em. Every decision weighs the hand's equity (equity.ts) against the
//   price of staying in (pot odds), measured against the fair share at this many opponents. Raises are sized like a
//   person's (3 big blinds to open, ×3 against a raise, half to three quarters of the pot after the flop); a short
//   stack plays push-or-fold. A character's style shifts the thresholds: a tight player wants more, an aggressive one
//   raises more, a bluffer bets with nothing. The opponents' cards are never read: the bot only knows its own hand,
//   the board and the betting.
// SECTIONS: 1 styles; 2 what the betting says; 3 sizing; 4 decision.
// =====================================================================
import { applyAction, legalActions, potSize, type HandState, type PokerAction } from '../holdem.ts';
import { equity } from './equity.ts';
// noinspection ES6PreferShortImport
import { createRandom, type Random } from '../../../../shared/engine/random.ts';

// BEGIN 1. Styles
export interface PokerStyle {
  /** −0.15 loose (plays many hands) … +0.15 tight (only good ones). */
  readonly tightness: number;
  /** 0 passive (calls) … 1 aggressive (bets and raises). */
  readonly aggression: number;
  /** How often it bets with nothing when checked to: 0 … 0.35. */
  readonly bluff: number;
}
export const NEUTRAL_POKER_STYLE: PokerStyle = Object.freeze({ tightness: 0, aggression: 0.5, bluff: 0.1 });

export interface PokerBotOptions {
  readonly random?: Random;
  /** Monte Carlo deals per decision (strong 800, casual 250). */
  readonly samples?: number;
  /** Extra randomness of a casual player's judgement (0 … 0.3). */
  readonly noise?: number;
  readonly style?: PokerStyle;
}
// END 1

// BEGIN 2. What the betting says
/** The least preflop strength each live opponent is believed to hold, from how he played this hand. */
function opponentRanges(state: HandState, seat: number): number[] {
  const raisers = new Set<number>();
  const callers = new Set<number>();
  for (const entry of state.log) {
    if (entry.kind !== 'action' || entry.seat === seat) continue;
    if (entry.action === 'raise' || entry.action === 'bet' || entry.action === 'allIn') raisers.add(entry.seat);
    else if (entry.action === 'call') callers.add(entry.seat);
  }
  const ranges: number[] = [];
  state.seats.forEach((other, index) => {
    if (index === seat || other.out || other.folded) return;
    ranges.push(raisers.has(index) ? 0.5 : callers.has(index) ? 0.35 : 0);
  });
  return ranges;
}
// END 2

// BEGIN 3. Sizing
/** A round number of chips: to the nearest small blind. */
const round = (chips: number, unit: number): number => Math.max(unit, Math.round(chips / unit) * unit);

function raiseTo(state: HandState, seat: number, strength: number, style: PokerStyle): number {
  const legal = legalActions(state);
  if (!legal?.raise) return legal?.allIn ?? 0;
  const { big } = state.level;
  const pot = potSize(state);
  let target: number;
  if (state.street === 'preflop') {
    const limpers = state.seats.filter((other, index) => index !== seat && !other.folded && other.bet === state.currentBet && state.currentBet === big).length;
    target = state.currentBet <= big ? big * 3 + Math.max(0, limpers - 1) * big : state.currentBet * 3;
  } else {
    const fraction = 0.5 + 0.25 * style.aggression + (strength > 2 ? 0.15 : 0);
    target = state.currentBet + Math.max(state.minRaise, pot * fraction);
  }
  const to = Math.min(legal.raise.max, Math.max(legal.raise.min, round(target, state.level.small)));
  // Nearly everything in: put it all in.
  return to >= legal.raise.max * 0.8 ? legal.raise.max : to;
}
// END 3

// BEGIN 4. Decision
export function choosePokerAction(state: HandState, options: PokerBotOptions = {}): PokerAction {
  const seat = state.turn;
  const legal = legalActions(state);
  if (seat === null || !legal) throw new Error('Nobody has to act');
  const random = options.random ?? createRandom(Date.now() >>> 0);
  const style = options.style ?? NEUTRAL_POKER_STYLE;
  const me = state.seats[seat];
  const ranges = opponentRanges(state, seat);
  const share = equity(me.hole, state.board, ranges, random, options.samples ?? 600);
  const fair = 1 / (ranges.length + 1);
  // [EN] 1 = an average hand at this table; the noise is a casual player's misjudgement.
  // [RU] 1 — средняя рука за этим столом; шум — ошибка суждения у обычного игрока.
  const strength = share / fair + (random() - 0.5) * 2 * (options.noise ?? 0.08);
  const pot = potSize(state);
  const toCall = legal.call;
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const { big } = state.level;
  const preflop = state.street === 'preflop';
  const pass: PokerAction = legal.check ? { type: 'check', seat } : { type: 'fold', seat };
  const raise = (): PokerAction => {
    const to = raiseTo(state, seat, strength, style);
    if (legal.raise && to < legal.raise.max) return { type: 'raise', seat, to };
    return legal.allIn !== null && legal.allIn > state.currentBet ? { type: 'allIn', seat } : toCall > 0 ? { type: 'call', seat } : { type: 'check', seat };
  };
  // A short stack plays push-or-fold before the flop.
  if (preflop && me.stack + me.bet <= big * 12) {
    if (strength > 1.2 + style.tightness * 2 - style.aggression * 0.1) return legal.allIn !== null ? { type: 'allIn', seat } : toCall > 0 ? { type: 'call', seat } : pass;
    return pass;
  }
  const tight = style.tightness * 2;
  const reraise = 0.3 * state.raisesThisStreet;
  if (toCall === 0) {
    const bet = (preflop ? 1.3 : 1.25) + tight - style.aggression * 0.2;
    if (strength > bet && (legal.raise || legal.allIn !== null)) return raise();
    // A bluff when checked to, against one or two players after the flop.
    if (!preflop && ranges.length <= 2 && random() < style.bluff && (legal.raise || legal.allIn !== null)) return raise();
    return pass;
  }
  const raiseAt = (preflop ? 1.6 : 1.55) + tight + reraise - style.aggression * 0.25;
  if (strength > raiseAt && state.raisesThisStreet < 4 && (legal.raise || (legal.allIn !== null && legal.allIn > state.currentBet))) return raise();
  // Call when the share of the pot beats its price, a tight player with a margin.
  const margin = 0.03 + style.tightness * 0.4 + (preflop ? 0.02 : 0);
  if (share >= potOdds + margin) return { type: 'call', seat };
  // A rare semi-bluff raise heads-up after the flop.
  if (!preflop && ranges.length === 1 && random() < style.bluff * 0.25 && legal.raise) return raise();
  return pass;
}

/** Plays one hand to its end with bots in every seat (load checks and tests). */
export function playOut(state: HandState, options: (seat: number) => PokerBotOptions): HandState {
  let current = state;
  for (let guard = 0; current.phase === 'betting'; guard += 1) {
    if (guard > 400) throw new Error('A hand did not end in 400 actions');
    current = applyAction(current, choosePokerAction(current, options(current.turn as number)));
  }
  return current;
}
// END 4

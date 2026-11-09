// [EN] FILE: games/preferans/tests/options-extra.test.ts — the table options that were «coming soon» until 09.11.2026:
//      whist–pass–half, misère without the talon, dark calls and bombs (Classic), paid talon, American help, the
//      dealer's whist and shared misère at a table of four. Each test plays the rule through the engine.
// [RU] ФАЙЛ: опции стола, которые до 09.11.2026 были «скоро»: вист — пас — полвиста, мизер без прикупа, тёмные заявки
//      и бомбы (Классика), платный прикуп, американская помощь, вист сдающего и мизер пополам вчетвером. Каждый тест
//      проводит правило через движок.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLASSIC, FULL_DECK, MISERE, MISERE_NO_TALON, SOCHI, americanHelp, applyAction, chooseAction, createRandom, customizeRules,
  bombsAfter, darkBid, dealerDecides, gameBid, legalActions, newDeal, parseCards, seatingFor, tableScore, talonQuickTricks,
  type Action, type DealScore, type DealState, type RuleSet,
} from '../engine/index.ts';
import { teethOf } from '../components/teeth.ts';

const first = (state: DealState, type: Action['type']): Action => {
  const action = legalActions(state).find(candidate => candidate.type === type);
  assert.ok(action, `no legal ${type}`);
  return action;
};
const bidsOf = (state: DealState): number[] => legalActions(state).flatMap(action => (action.type === 'bid' ? [action.bid] : []));
const playOut = (state: DealState, seed = 5): DealState => {
  const random = createRandom(seed);
  let current = state;
  for (let guard = 0; current.phase !== 'done'; guard += 1) {
    assert.ok(guard < 120, 'the deal ends');
    current = applyAction(current, chooseAction(current, { random, samples: 2, timeBudgetMs: 20 }));
  }
  return current;
};
/** Seat 0 wins the auction with `bid`, the others pass; the deal stands after the auction. */
const winAuction = (rules: RuleSet, bid: number, options: { deck?: number[]; bombs?: number[] } = {}): DealState => {
  let state = newDeal({ rules, dealer: 2, random: createRandom(11), ...options });
  state = applyAction(state, { type: 'bid', seat: 0, bid });
  state = applyAction(state, { type: 'pass', seat: 1 });
  return applyAction(state, { type: 'pass', seat: 2 });
};
/** …then discards, declares `contract` and both defenders pass. */
const declareUnwhisted = (state: DealState, contract: number): DealState => {
  let current = applyAction(state, first(state, 'discard'));
  current = applyAction(current, { type: 'declare', seat: 0, bid: contract });
  current = applyAction(current, { type: 'whist', seat: 1, call: 'pass' });
  return applyAction(current, { type: 'whist', seat: 2, call: 'pass' });
};

test('whist–pass–half: a lone whister on a six takes half-whist instead of playing', () => {
  const play = (rules: RuleSet) => {
    let state = applyAction(winAuction(rules, 0), first(winAuction(rules, 0), 'discard'));
    state = applyAction(state, { type: 'declare', seat: 0, bid: 0 });
    state = applyAction(state, { type: 'whist', seat: 1, call: 'whist' });
    return applyAction(state, { type: 'whist', seat: 2, call: 'pass' });
  };
  assert.equal(legalActions(play(SOCHI)).some(action => action.type === 'takeHalf'), false, 'not without the option');
  const state = play(customizeRules(SOCHI, { whistPassHalf: true }));
  assert.equal(state.phase, 'whistMode');
  const done = applyAction(state, { type: 'takeHalf', seat: 1 });
  assert.equal(done.phase, 'done');
  assert.equal(done.result?.played, false);
  assert.equal(done.result?.halfWhister, 1);
  assert.equal(done.result?.score.pool[0], 2, 'the six counts as made');
  assert.equal(done.result?.score.whists[1][0], 4, 'half of the obligation: 2 tricks × 2');
});

test('misère without the talon: above the nines, only a ten beats it, played with ten cards', () => {
  const rules = customizeRules(SOCHI, { misereNoTalon: true });
  assert.equal(bidsOf(newDeal({ rules: SOCHI, dealer: 2 })).includes(MISERE_NO_TALON), false, 'not without the option');
  let state = newDeal({ rules, dealer: 2, random: createRandom(4) });
  state = applyAction(state, { type: 'bid', seat: 0, bid: MISERE_NO_TALON });
  assert.deepEqual(bidsOf(state), [21, 22, 23, 24, 25], 'only the tens are higher');
  state = applyAction(state, { type: 'pass', seat: 1 });
  state = applyAction(state, { type: 'pass', seat: 2 });
  assert.equal(state.phase, 'play', 'no talon, no discard');
  assert.equal(state.mode, 'misere');
  assert.deepEqual(state.discards, []);
  const done = playOut(state);
  assert.equal(done.result?.noTalon, true);
  const taken = done.result!.tricksWon[0];
  assert.equal(taken === 0 ? done.result!.score.pool[0] : done.result!.score.mountain[0], taken === 0 ? 10 : 10 * taken, 'scored like misère');
  // A misère bidder may raise to misère without the talon over a nine.
  let raise = newDeal({ rules, dealer: 2, random: createRandom(4) });
  raise = applyAction(raise, { type: 'bid', seat: 0, bid: MISERE });
  raise = applyAction(raise, { type: 'bid', seat: 1, bid: gameBid(9, 0) });
  raise = applyAction(raise, { type: 'pass', seat: 2 });
  assert.deepEqual(bidsOf(raise), [MISERE_NO_TALON]);
});

test('dark calls: a dark six beats 6NT and loses to 7♠; the game it wins costs double', () => {
  const rules = customizeRules(CLASSIC, { darkBids: true });
  let state = newDeal({ rules, dealer: 2, random: createRandom(8) });
  assert.ok(legalActions(state).some(action => action.type === 'pass' && action.dark), 'a dark pass as the first word');
  state = applyAction(state, { type: 'bid', seat: 0, bid: darkBid(6) });
  const second = bidsOf(state);
  assert.ok(!second.includes(gameBid(6, 4)) && second.includes(gameBid(7, 0)) && second.includes(darkBid(7)) && !second.includes(darkBid(6)));
  state = applyAction(state, { type: 'pass', seat: 1 });
  state = applyAction(state, { type: 'pass', seat: 2 });
  assert.equal(state.phase, 'discard');
  const discarded = applyAction(state, first(state, 'discard'));
  assert.ok(legalActions(discarded).some(action => action.type === 'declare' && action.bid === 0), 'any six may be named after a dark six');
  const done = declareUnwhisted(state, 0);
  assert.equal(done.result?.dark, true);
  assert.equal(done.result?.multiplier, 2);
  assert.equal(done.result?.score.pool[0], 4, 'a six counted without play, doubled');
  // An all-pass after a dark pass costs double too, and remembers who passed in the dark.
  let allPass = newDeal({ rules, dealer: 2, random: createRandom(9) });
  allPass = applyAction(allPass, { type: 'pass', seat: 0, dark: true });
  allPass = applyAction(allPass, { type: 'pass', seat: 1 });
  allPass = applyAction(allPass, { type: 'pass', seat: 2 });
  const played = playOut(allPass);
  assert.deepEqual(played.result?.darkPassers, [0]);
  assert.equal(played.result?.multiplier, 2);
});

test('bombs: two bombs make the declarer\'s game cost four times as much', () => {
  const rules = customizeRules(CLASSIC, { darkBids: true, bombs: true });
  const done = declareUnwhisted(winAuction(rules, 0, { bombs: [2, 0, 0] }), 0);
  assert.equal(done.result?.multiplier, 4);
  assert.equal(done.result?.score.pool[0], 8);
});

test('paid talon: quick tricks in the talon and the price the declarer pays for them', () => {
  const quick = (text: string) => talonQuickTricks(parseCards(text));
  assert.deepEqual([quick('A♠ A♥'), quick('A♠ K♠'), quick('A♠ 7♥'), quick('K♥ Q♥'), quick('K♥ Q♠'), quick('10♠ 7♦')], [3, 2, 1, 1, 0, 0]);
  const talon = parseCards('A♠ A♥');
  const deck = [...FULL_DECK.filter(card => !talon.includes(card)), ...talon];
  const done = declareUnwhisted(winAuction(customizeRules(SOCHI, { paidTalon: true }), 0, { deck }), 0);
  assert.equal(done.result?.talonPremium, 6, 'three quick tricks × the price of a six');
  assert.equal(done.result?.score.whists[1][0], 3);
  assert.equal(done.result?.score.whists[2][0], 3);
});

test('American help: the surplus goes to the biggest pool still short of the target, ties to the left', () => {
  const sheet = (pool: number[]): DealScore => ({ pool, mountain: [0, 0, 0], whists: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] });
  const help = americanHelp(sheet([14, 6, 8]), 3, 10, SOCHI);
  assert.deepEqual(help.pool, [-4, 2, 2]);
  assert.deepEqual(help.whists[0], [0, 20, 20], '10 whists for every point given');
  const tie = americanHelp(sheet([12, 7, 7]), 3, 10, SOCHI);
  assert.deepEqual(tie.pool, [-2, 2, 0], 'the left neighbour (clockwise next) is helped first');
});

test('the dealer\'s whist at four: both pass, the dealer takes a passer\'s hand and whists for himself', () => {
  const rules = customizeRules(SOCHI, { talonTakesTricks: true, dealerWhists: true });
  let state = declareUnwhisted(winAuction(rules, 0), 0);
  assert.equal(state.phase, 'dealerWhist');
  assert.ok(dealerDecides(state));
  state = applyAction(state, { type: 'dealerLook', seat: state.turn!, defender: 1 });
  state = applyAction(state, { type: 'dealerWhist', seat: state.turn!, whist: true });
  assert.equal(state.phase, 'play');
  assert.deepEqual(state.whist?.whisters, [1]);
  const done = playOut(state);
  assert.equal(done.result?.dealerSeat, 1);
  const seating = seatingFor(4, 3); // players 0, 1, 2 play, player 3 deals
  const sheet = tableScore(done.result!, seating, 4, rules, 0);
  assert.deepEqual(sheet.whists[1], [0, 0, 0, 0], 'the passer writes nothing');
  assert.ok(sheet.whists[3][0] > 0 || sheet.mountain[3] > 0, 'the dealer writes the defence');
});

test('shared misère at four: the declarer calls the dealer, pool or mountain is split in half', () => {
  const rules = customizeRules(SOCHI, { talonTakesTricks: true, misereHalves: true });
  let state = winAuction(rules, MISERE);
  assert.equal(state.phase, 'misereShare');
  state = applyAction(state, { type: 'shareMisere', seat: 0, share: true });
  assert.equal(state.phase, 'discard');
  const done = playOut(state);
  assert.equal(done.result?.misereShared, true);
  const sheet = tableScore(done.result!, seatingFor(4, 3), 4, rules, 0);
  assert.equal(sheet.pool[0], sheet.pool[3]);
  assert.equal(sheet.mountain[0], sheet.mountain[3]);
});

test('teeth: a declarer who was set draws a tooth towards each whister', () => {
  const failed = declareUnwhisted(winAuction(SOCHI, 0), 0); // a six counted without play: no tooth
  const entry = (result: NonNullable<DealState['result']>) => ({ number: 1, dealer: 2 as const, result, seating: seatingFor(3, 2) });
  assert.deepEqual(teethOf([entry(failed.result!)]), []);
  const setDown = { ...failed.result!, played: true, tricksWon: [4, 4, 2], whisters: [1, 2] as const };
  assert.deepEqual(teethOf([entry(setDown), entry(setDown)]), [{ from: 0, to: 1, count: 2 }, { from: 0, to: 2, count: 2 }]);
});

test('bombs between deals: a dark all-pass arms the dark passers, a made game burns the declarer\'s bombs', () => {
  const seating = seatingFor(3, 2);
  const base = { declarer: null, contract: null, played: true, tricksWon: [3, 3, 4], whisters: [], halfWhister: null, score: { pool: [0, 0, 0], mountain: [0, 0, 0], whists: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] } } as const;
  assert.deepEqual(bombsAfter([0, 0, 0, 0], { ...base, mode: 'raspasy', darkPassers: [0, 2] }, seating), [1, 0, 1, 0]);
  assert.deepEqual(bombsAfter([3, 0, 0, 0], { ...base, mode: 'raspasy', darkPassers: [0] }, seating), [3, 0, 0, 0], 'three at most');
  const made = { ...base, mode: 'game', declarer: 0, contract: { kind: 'game', level: 6, strain: 0 }, tricksWon: [6, 2, 2] } as const;
  assert.deepEqual(bombsAfter([2, 1, 0, 0], made, seating), [0, 1, 0, 0]);
  const failed = { ...made, tricksWon: [5, 3, 2] } as const;
  assert.deepEqual(bombsAfter([2, 1, 0, 0], failed, seating), [2, 1, 0, 0], 'a failed game keeps them');
});

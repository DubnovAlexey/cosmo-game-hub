// Table options from the setup panel really change the rules the engine applies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCHI, applyAction, customizeRules, gameBid, legalActions, legalBids, newDeal, parseCards, scoreRaspasy, startBidding, applyCall,
  type DealState,
} from '../engine/index.ts';

const DECK = parseCards(`
  A♠ K♠ Q♠ J♠ 10♠ 9♠ A♣ K♣ Q♣ J♣
  A♦ K♦ Q♦ J♦ 10♦ 9♦ A♥ K♥ Q♥ J♥
  8♠ 7♠ 10♣ 9♣ 8♣ 7♣ 8♦ 7♦ 10♥ 9♥
  7♥ 8♥`);

function declared(rules = SOCHI, bid = gameBid(6, 0)): DealState {
  let state = newDeal({ deck: DECK, dealer: 2, rules });
  state = applyAction(state, { type: 'bid', seat: 0, bid: gameBid(6, 0) });
  state = applyAction(applyAction(state, { type: 'pass', seat: 1 }), { type: 'pass', seat: 2 });
  state = applyAction(state, { type: 'discard', seat: 0, cards: [DECK[30], DECK[31]] });
  return applyAction(state, { type: 'declare', seat: 0, bid });
}

test('without half-whist the second defender cannot say it', () => {
  const sochi = applyAction(declared(), { type: 'whist', seat: 1, call: 'pass' });
  assert.ok(legalActions(sochi).some(action => action.type === 'whist' && action.call === 'half'));
  const strict = applyAction(declared(customizeRules(SOCHI, { halfWhist: false })), { type: 'whist', seat: 1, call: 'pass' });
  assert.ok(!legalActions(strict).some(action => action.type === 'whist' && action.call === 'half'));
});

test('without «здесь» a senior hand must bid higher', () => {
  const noHold = customizeRules(SOCHI, { seniorHold: false });
  let state = startBidding(0);
  state = applyCall(state, { seat: 0, call: 'bid', bid: gameBid(6, 0) }, noHold);
  state = applyCall(state, { seat: 1, call: 'bid', bid: gameBid(6, 1) }, noHold);
  state = applyCall(state, { seat: 2, call: 'pass' }, noHold);
  assert.equal(legalBids(state, noHold)[0], gameBid(6, 2));
  assert.equal(legalBids(state, SOCHI)[0], gameBid(6, 1), 'Sochi lets the first hand hold');
});

test('all-pass price progression and talon leads follow the options', () => {
  const flat = customizeRules(SOCHI, { raspasyProgression: [1] });
  assert.deepEqual(scoreRaspasy([1, 2, 7], 5, flat).mountain, [1, 2, 7]);
  const steep = customizeRules(SOCHI, { raspasyProgression: [1, 2, 4] });
  assert.deepEqual(scoreRaspasy([1, 2, 7], 9, steep).mountain, [4, 8, 28]);
  const noTalon = customizeRules(SOCHI, { raspasyTalonLeads: false });
  let state = newDeal({ deck: DECK, dealer: 2, rules: noTalon });
  for (let i = 0; i < 3; i += 1) state = applyAction(state, { type: 'pass', seat: state.turn! });
  assert.equal(state.trickLead, null, 'the first hand leads the first trick');
});

test('a whisted ten asks the defenders instead of being checked', () => {
  const checked = declared(SOCHI, gameBid(10, 0));
  assert.equal(checked.phase, 'play');
  const whisted = declared(customizeRules(SOCHI, { tenIsChecked: false }), gameBid(10, 0));
  assert.equal(whisted.phase, 'whist');
});

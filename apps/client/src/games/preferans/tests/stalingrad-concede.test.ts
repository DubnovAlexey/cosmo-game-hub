// Two extras of the table menu that change play and score: Stalingrad and conceding a hopeless game.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCHI, applyAction, chooseAction, customizeRules, gameBid, legalActions, newDeal, parseCards,
  type Action, type DealState, type RuleSet,
} from '../engine/index.ts';

// First hand (seat 0, dealer 2): spades and clubs; seat 1: diamonds and hearts; seat 2: small cards; talon 7♥ 8♥.
const DECK = parseCards(`
  A♠ K♠ Q♠ J♠ 10♠ 9♠ A♣ K♣ Q♣ J♣
  A♦ K♦ Q♦ J♦ 10♦ 9♦ A♥ K♥ Q♥ J♥
  8♠ 7♠ 10♣ 9♣ 8♣ 7♣ 8♦ 7♦ 10♥ 9♥
  7♥ 8♥`);
// Here the first hand holds only small cards: whatever it names, it falls far short.
const WEAK = parseCards(`
  7♠ 8♠ 7♣ 8♣ 7♦ 8♦ 7♥ 8♥ 9♣ 9♦
  A♠ K♠ Q♠ J♠ A♣ K♣ Q♣ J♣ A♦ K♦
  10♠ 9♠ 10♣ Q♦ J♦ 10♦ A♥ K♥ Q♥ J♥
  10♥ 9♥`);

const act = (state: DealState, action: Action): DealState => applyAction(state, action);
/** Seat 0 wins the auction with six of spades and discards the first two cards of the deck. */
function toDeclare(rules: RuleSet, deck = DECK): DealState {
  let state = newDeal({ deck, dealer: 2, rules });
  state = act(state, { type: 'bid', seat: 0, bid: gameBid(6, 0) });
  state = act(act(state, { type: 'pass', seat: 1 }), { type: 'pass', seat: 2 });
  return act(state, { type: 'discard', seat: 0, cards: [deck[30], deck[31]] });
}
const whistCalls = (state: DealState) => legalActions(state).flatMap(action => (action.type === 'whist' ? [action.call] : []));

test('Stalingrad: on a six of spades both defenders must whist, and the game is played closed', () => {
  const rules = customizeRules(SOCHI, { stalingrad: true });
  let state = act(toDeclare(rules), { type: 'declare', seat: 0, bid: gameBid(6, 0) });
  assert.deepEqual(whistCalls(state), ['whist']);
  assert.throws(() => act(state, { type: 'whist', seat: 1, call: 'pass' }));
  state = act(state, { type: 'whist', seat: 1, call: 'whist' });
  assert.deepEqual(whistCalls(state), ['whist'], 'no half-whist either');
  state = act(state, { type: 'whist', seat: 2, call: 'whist' });
  assert.equal(state.phase, 'play');
  assert.equal(state.openHands, false);
  assert.deepEqual(whistCalls(act(toDeclare(rules), { type: 'declare', seat: 0, bid: gameBid(6, 1) })), ['whist', 'pass'], 'any other six is free');
  assert.deepEqual(whistCalls(act(toDeclare(SOCHI), { type: 'declare', seat: 0, bid: gameBid(6, 0) })), ['whist', 'pass'], 'off by default');
});

test('a bot defender obeys Stalingrad even with cards too weak to whist', () => {
  const rules = customizeRules(SOCHI, { stalingrad: true });
  let state = act(toDeclare(rules), { type: 'declare', seat: 0, bid: gameBid(6, 0) });
  state = act(state, { type: 'whist', seat: 1, call: 'whist' });
  assert.deepEqual(chooseAction(state, { samples: 3 }), { type: 'whist', seat: 2, call: 'whist' });
});

test('conceding: the conceded tricks at the price of the bid level go to the mountain, nobody writes whists', () => {
  const three = toDeclare(customizeRules(SOCHI, { concedeTricks: 3 }));
  assert.ok(legalActions(three).some(action => action.type === 'concede'));
  const done = act(three, { type: 'concede', seat: 0 });
  assert.equal(done.phase, 'done');
  assert.equal(done.result?.conceded, 3);
  assert.deepEqual(done.result?.score.mountain, [6, 0, 0], 'three tricks × the price of a six (2)');
  assert.deepEqual(done.result?.score.pool, [0, 0, 0]);
  assert.ok(done.result?.score.whists.every(row => row.every(value => value === 0)));
  const two = act(toDeclare(customizeRules(SOCHI, { concedeTricks: 2 })), { type: 'concede', seat: 0 });
  assert.deepEqual(two.result?.score.mountain, [4, 0, 0]);
  assert.equal(legalActions(toDeclare(SOCHI)).some(action => action.type === 'concede'), false, 'off by default');
  assert.throws(() => act(toDeclare(SOCHI), { type: 'concede', seat: 0 }));
});

test('a bot declarer concedes a hopeless game only where the table allows it', () => {
  const allowed = toDeclare(customizeRules(SOCHI, { concedeTricks: 3 }), WEAK);
  assert.deepEqual(chooseAction(allowed, { samples: 3 }), { type: 'concede', seat: 0 });
  assert.equal(chooseAction(toDeclare(SOCHI, WEAK), { samples: 3 }).type, 'declare');
  assert.equal(chooseAction(toDeclare(customizeRules(SOCHI, { concedeTricks: 3 })), { samples: 3 }).type, 'declare', 'a good hand plays');
});

// The deal state machine: every path from the auction to the score, and illegal actions refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MISERE, applyAction, cardsOf, countCards, gameBid, legalActions, legalPlays, newDeal, parseCards, setOf, suitOf,
  type Action, type DealState,
} from '../engine/index.ts';

// First hand (seat 0, dealer 2) gets spades and clubs, seat 1 diamonds and hearts, seat 2 the rest; talon 7♥ 8♥.
const DECK = parseCards(`
  A♠ K♠ Q♠ J♠ 10♠ 9♠ A♣ K♣ Q♣ J♣
  A♦ K♦ Q♦ J♦ 10♦ 9♦ A♥ K♥ Q♥ J♥
  8♠ 7♠ 10♣ 9♣ 8♣ 7♣ 8♦ 7♦ 10♥ 9♥
  7♥ 8♥`);
const deal = (): DealState => newDeal({ deck: DECK, dealer: 2 });
const act = (state: DealState, action: Action): DealState => applyAction(state, action);
/** Plays the deal out with the first legal card each time. */
function playOut(state: DealState): DealState {
  let current = state;
  while (current.phase === 'play') current = act(current, legalActions(current)[0]);
  return current;
}

test('dealing: ten cards each from the first hand clockwise, two in the talon', () => {
  const state = deal();
  assert.equal(state.firstHand, 0);
  assert.deepEqual(state.hands.map(countCards), [10, 10, 10]);
  assert.equal(state.hands[0], setOf(DECK.slice(0, 10)));
  assert.deepEqual(state.talon, DECK.slice(30));
  assert.equal(state.turn, 0);
});

test('a game: auction, talon, discard, contract, two whisters, play and score', () => {
  let state = deal();
  state = act(state, { type: 'bid', seat: 0, bid: gameBid(6, 0) });
  state = act(state, { type: 'pass', seat: 1 });
  state = act(state, { type: 'pass', seat: 2 });
  assert.equal(state.phase, 'discard');
  assert.equal(countCards(state.hands[0]), 12, 'the talon joined the hand');
  state = act(state, { type: 'discard', seat: 0, cards: [DECK[30], DECK[31]] });
  assert.throws(() => act(state, { type: 'declare', seat: 0, bid: gameBid(6, 0) - 1 }), /at least/);
  assert.throws(() => act(state, { type: 'declare', seat: 0, bid: MISERE }));
  state = act(state, { type: 'declare', seat: 0, bid: gameBid(8, 0) });
  assert.equal(state.phase, 'whist');
  assert.equal(state.turn, 1, 'the declarer\'s left neighbour decides first');
  state = act(state, { type: 'whist', seat: 1, call: 'whist' });
  state = act(state, { type: 'whist', seat: 2, call: 'whist' });
  assert.equal(state.phase, 'play');
  assert.equal(state.turn, 0, 'the first hand leads');
  assert.throws(() => act(state, { type: 'play', seat: 1, card: legalPlays(state)[0] }), /turn/);
  const done = playOut(state);
  assert.equal(done.phase, 'done');
  assert.equal(done.result?.tricksWon.reduce((a, b) => a + b, 0), 10);
  assert.ok(done.result && done.result.score.pool[0] + done.result.score.mountain[0] > 0);
});

test('nobody whists: the game counts without play; a half-whist that is not returned too', () => {
  let state = deal();
  state = act(act(act(state, { type: 'bid', seat: 0, bid: gameBid(6, 0) }), { type: 'pass', seat: 1 }), { type: 'pass', seat: 2 });
  state = act(state, { type: 'discard', seat: 0, cards: [DECK[30], DECK[31]] });
  state = act(state, { type: 'declare', seat: 0, bid: gameBid(6, 0) });
  const passed = act(act(state, { type: 'whist', seat: 1, call: 'pass' }), { type: 'whist', seat: 2, call: 'pass' });
  assert.equal(passed.phase, 'done');
  assert.equal(passed.result?.played, false);
  assert.deepEqual(passed.result?.score.pool, [2, 0, 0]);
  let half = act(state, { type: 'whist', seat: 1, call: 'pass' });
  assert.ok(legalActions(half).some(action => action.type === 'whist' && action.call === 'half'));
  half = act(half, { type: 'whist', seat: 2, call: 'half' });
  assert.equal(half.phase, 'whistReturn');
  const declined = act(half, { type: 'returnWhist', seat: 1, accept: false });
  assert.equal(declined.result?.halfWhister, 2);
  assert.equal(declined.result?.score.whists[2][0], 4);
  const returned = act(half, { type: 'returnWhist', seat: 1, accept: true });
  assert.equal(returned.phase, 'whistMode');
  const open = act(returned, { type: 'whistMode', seat: 1, open: true });
  assert.equal(open.openHands, true);
  assert.deepEqual(open.whist?.whisters, [1]);
});

test('misère: no contract choice and no whist; the defenders open their cards after the first trick', () => {
  let state = deal();
  state = act(state, { type: 'bid', seat: 0, bid: MISERE });
  state = act(act(state, { type: 'pass', seat: 1 }), { type: 'pass', seat: 2 });
  state = act(state, { type: 'discard', seat: 0, cards: [DECK[0], DECK[1]] });
  assert.equal(state.phase, 'play');
  assert.equal(state.mode, 'misere');
  assert.equal(state.openHands, false);
  for (let i = 0; i < 3; i += 1) state = act(state, legalActions(state)[0]);
  assert.equal(state.openHands, true);
  const done = playOut(state);
  assert.equal(done.result?.mode, 'misere');
});

test('all-pass: the talon sets the suit of the first two tricks, the first hand leads the third', () => {
  let state = deal();
  state = act(act(act(state, { type: 'pass', seat: 0 }), { type: 'pass', seat: 1 }), { type: 'pass', seat: 2 });
  assert.equal(state.mode, 'raspasy');
  assert.equal(state.trickLead, DECK[30]);
  assert.ok(legalPlays(state).every(card => suitOf(card) === suitOf(DECK[30])) || legalPlays(state).length === countCards(state.hands[0]));
  for (let i = 0; i < 3; i += 1) state = act(state, legalActions(state)[0]);
  assert.equal(state.trickLead, DECK[31]);
  assert.equal(state.turn, 0);
  for (let i = 0; i < 3; i += 1) state = act(state, legalActions(state)[0]);
  assert.equal(state.trickLead, null);
  assert.equal(state.turn, 0, 'the first hand leads the third trick');
  const done = playOut(state);
  assert.equal(done.result?.tricksWon.reduce((a, b) => a + b, 0), 10);
  assert.deepEqual(cardsOf(done.hands[0] | done.hands[1] | done.hands[2]), []);
});

test('illegal actions are refused', () => {
  const state = deal();
  assert.throws(() => act(state, { type: 'pass', seat: 1 }), /turn/);
  assert.throws(() => act(state, { type: 'play', seat: 0, card: DECK[0] }));
  assert.throws(() => newDeal({ deck: DECK.slice(1) }));
});

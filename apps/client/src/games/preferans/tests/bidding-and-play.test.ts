// The auction (Sochi) and the trick rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MISERE, SOCHI, applyCall, biddingResult, gameBid, legalBids, legalCards, parseCard, parseCards, setOf, startBidding,
  trickWinnerIndex, type BiddingState, type Seat,
} from '../engine/index.ts';

const bid = (state: BiddingState, seat: Seat, value: number) => applyCall(state, { seat, call: 'bid', bid: value }, SOCHI);
const pass = (state: BiddingState, seat: Seat) => applyCall(state, { seat, call: 'pass' }, SOCHI);

test('three passes are an all-pass; one bid and two passes win the auction', () => {
  let state = startBidding(1);
  state = pass(pass(pass(state, 1), 2), 0);
  assert.deepEqual(biddingResult(state), { kind: 'raspasy' });
  let won = startBidding(0);
  won = pass(pass(bid(won, 0, gameBid(6, 0)), 1), 2);
  assert.deepEqual(biddingResult(won), { kind: 'won', seat: 0, bid: gameBid(6, 0) });
});

test('a senior hand may say «здесь» to a junior bid, a junior must bid higher', () => {
  let state = startBidding(0);
  state = bid(state, 0, gameBid(6, 0));
  state = bid(state, 1, gameBid(6, 1));
  state = bid(state, 2, gameBid(6, 2));
  assert.equal(legalBids(state, SOCHI)[0], gameBid(6, 2), 'the first hand holds 6♦');
  state = bid(state, 0, gameBid(6, 2));
  assert.equal(legalBids(state, SOCHI)[0], gameBid(6, 3), 'the second hand cannot hold the first hand');
  assert.throws(() => bid(state, 1, gameBid(6, 2)));
});

test('misère only as the first bid; after it the misère player can only pass', () => {
  let state = startBidding(0);
  state = bid(state, 0, gameBid(6, 0));
  assert.ok(legalBids(state, SOCHI).includes(MISERE), 'the second hand still may say misère');
  state = bid(state, 1, MISERE);
  state = pass(state, 2);
  assert.ok(!legalBids(state, SOCHI).includes(MISERE), 'the first hand already bid a game');
  assert.equal(legalBids(state, SOCHI)[0], gameBid(9, 0), 'misère is beaten by nine spades');
  state = bid(state, 0, gameBid(9, 0));
  assert.deepEqual(legalBids(state, SOCHI), [], 'the misère player can only pass now');
  state = pass(state, 1);
  assert.deepEqual(biddingResult(state), { kind: 'won', seat: 0, bid: gameBid(9, 0) });
});

test('legal cards: follow suit, else trump, else anything', () => {
  const hand = setOf(parseCards('A♠ 7♠ K♥ 9♦'));
  assert.deepEqual(legalCards(hand, 0, 3), setOf(parseCards('A♠ 7♠')));
  assert.deepEqual(legalCards(hand, 1, 3), setOf(parseCards('K♥')), 'void in clubs: must trump with hearts');
  assert.deepEqual(legalCards(hand, 1, null), hand, 'no trumps: any card');
  assert.deepEqual(legalCards(hand, null, 3), hand, 'leading: any card');
});

test('trick winner: the highest trump, else the highest card of the led suit', () => {
  const cards = parseCards('10♠ A♦ 7♥');
  assert.equal(trickWinnerIndex(cards, 0, 3), 2, 'a small trump beats');
  assert.equal(trickWinnerIndex(cards, 0, null), 0, 'without trumps the led suit wins');
  assert.equal(trickWinnerIndex(parseCards('K♣ A♣ 8♣'), 1, 0), 1);
  assert.equal(trickWinnerIndex(parseCards('K♣ A♦ 8♥'), 0, null), -1, 'a talon lead nobody followed');
  assert.equal(parseCard('A♥'), 31);
});

// Cards as numbers and bit masks, the bidding ladder and labels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FULL_DECK, MISERE, bidLabel, cardLabel, cardsOf, contractOf, countCards, gameBid, hasCard, highestCard, lowestCard,
  parseCard, parseCards, removeCard, setOf, BID_LADDER, MISERE_NO_TALON, bidRank, darkBid,
} from '../engine/index.ts';

test('the deck has 32 different cards and every label parses back', () => {
  assert.equal(FULL_DECK.length, 32);
  assert.equal(setOf(FULL_DECK), 0xffffffff);
  for (const card of FULL_DECK) assert.equal(parseCard(cardLabel(card)), card);
  assert.deepEqual(parseCards('A♠ 10h qd 7♣').map(cardLabel), ['A♠', '10♥', 'Q♦', '7♣']);
  assert.throws(() => parseCard('1x'));
});

test('card sets work for the highest card too (bit 31 = A♥)', () => {
  const aceOfHearts = parseCard('A♥');
  const set = setOf([aceOfHearts, parseCard('7♠'), parseCard('K♦')]);
  assert.equal(countCards(set), 3);
  assert.ok(hasCard(set, aceOfHearts));
  assert.deepEqual(cardsOf(set).map(cardLabel), ['7♠', 'K♦', 'A♥']);
  assert.equal(highestCard(set), aceOfHearts);
  assert.equal(lowestCard(set), parseCard('7♠'));
  const without = removeCard(set, aceOfHearts);
  assert.equal(countCards(without), 2);
  assert.ok(without >= 0, 'sets stay unsigned');
});

test('the ladder: 26 bids, misère between 8 no-trump and 9 spades', () => {
  // [EN] 26 classic bids, then misère without the talon (a table option), numbered last so old numbers stay.
  // [RU] 26 классических заявок, затем мизер без прикупа (опция стола) — последним номером, чтобы старые номера не менялись.
  assert.equal(BID_LADDER.length, 27);
  assert.ok(bidRank(gameBid(9, 4)) < bidRank(MISERE_NO_TALON) && bidRank(MISERE_NO_TALON) < bidRank(gameBid(10, 0)));
  assert.ok(bidRank(gameBid(6, 4)) < bidRank(darkBid(6)) && bidRank(darkBid(6)) < bidRank(gameBid(7, 0)), 'a dark six sits between 6NT and 7♠');
  assert.equal(bidLabel(gameBid(8, 4)), '8БК');
  assert.equal(bidLabel(MISERE), 'Мизер');
  assert.equal(bidLabel(gameBid(9, 0)), '9♠');
  assert.ok(gameBid(8, 4) < MISERE && MISERE < gameBid(9, 0));
  assert.equal(bidLabel(gameBid(10, 4), 'en'), '10NT');
  assert.deepEqual(contractOf(gameBid(7, 2)), { kind: 'game', level: 7, strain: 2 });
});

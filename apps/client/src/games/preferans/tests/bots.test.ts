// Bots: sampling respects what a seat knows, and three bots play whole deals legally from the auction to the score.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FULL_DECK, SOCHI, ZERO_SCORE, addScores, applyAction, chanceOfBid, chooseAction, countCards, createRandom, imagineDeclaring, knowledgeOf, newDeal,
  nextDeal, parseCards, sampleHands, setOf, settle, suitSet, type DealScore, type DealState,
} from '../engine/index.ts';

function playDeal(state: DealState, seed: number): DealState {
  const random = createRandom(seed);
  let current = state;
  let guard = 0;
  while (current.phase !== 'done') {
    current = applyAction(current, chooseAction(current, { random, samples: 4, timeBudgetMs: 60 }));
    guard += 1;
    assert.ok(guard < 200, 'a deal ends');
  }
  return current;
}

test('sampled deals keep known cards, card counts and voids', () => {
  let state = newDeal({ random: createRandom(7) });
  // All pass and play two tricks so that voids may appear.
  for (let i = 0; i < 3; i += 1) state = applyAction(state, { type: 'pass', seat: state.turn! });
  for (let i = 0; i < 9; i += 1) state = applyAction(state, chooseAction(state, { random: createRandom(i), samples: 2 }));
  const knowledge = knowledgeOf(state, 0);
  const random = createRandom(99);
  for (let i = 0; i < 100; i += 1) {
    const hands = sampleHands(knowledge, random);
    assert.ok(hands, 'a consistent deal exists');
    assert.equal(hands[0], state.hands[0], 'own hand is never resampled');
    for (let seat = 0; seat < 3; seat += 1) {
      assert.equal(countCards(hands[seat]), state.hands[seat] === 0 ? 0 : countCards(state.hands[seat]));
      for (let suit = 0; suit < 4; suit += 1) {
        if (((knowledge.voids[seat] >> suit) & 1) !== 0) assert.equal(suitSet(hands[seat], suit as 0), 0, `seat ${seat} is void in suit ${suit}`);
      }
    }
  }
});

test('a bot with a tiny time budget still answers at once with a legal card (the hard limits of 08.11)', () => {
  // All pass, so the first trick is played by everyone with ten cards: the hardest moment for the solver.
  let state = newDeal({ random: createRandom(4242) });
  for (let i = 0; i < 3; i += 1) state = applyAction(state, { type: 'pass', seat: state.turn! });
  while (state.phase === 'play' && state.trickLead !== null) state = applyAction(state, chooseAction(state, { random: createRandom(1), samples: 2 }));
  assert.equal(state.phase, 'play');
  const started = performance.now();
  const action = chooseAction(state, { random: createRandom(5), samples: 32, timeBudgetMs: 1 });
  assert.ok(performance.now() - started < 1000, 'answers within a second even on a slow machine');
  assert.equal(action.type, 'play');
  assert.ok(applyAction(state, action), 'the card is legal');
});

test('a borderline hand opens nothing but saves the deal from all-pass after two passes', () => {
  // [EN] The bot imagines deals (the talon, the other hands) and lets the solver play them: this hand makes a six in
  //      a little more than half of them. That is too thin to open the bidding (two deals of three are wanted), but
  //      after two passes a pass means all-pass, and an even chance is enough.
  // [RU] Бот воображает расклады (прикуп, чужие руки) и даёт решателю их сыграть: эта рука делает шестерную чуть
  //      больше чем в половине из них. Для первого слова этого мало (нужно два расклада из трёх), но после двух
  //      пасов пас означает распасы, и хватает равных шансов.
  const hand = parseCards('A♠ Q♠ 10♠ 8♠ 7♠ Q♣ 9♣ K♦ 8♦ 9♥');
  const others = FULL_DECK.filter(card => !hand.includes(card));
  const think = { foresight: 200, timeBudgetMs: 60000 };
  // A fixed deck gives ten cards to the first hand, ten to each of the next two, and the last two to the talon.
  const speaksFirst = newDeal({ deck: [...hand, ...others] });
  const chance = chanceOfBid(imagineDeclaring(setOf(hand), speaksFirst.turn!, speaksFirst.firstHand, { random: createRandom(1), samples: 200, timeBudgetMs: 60000 }), 0);
  assert.ok(chance > 0.5 && chance < 0.64, `the hand is a borderline one: a six in ${Math.round(chance * 100)}% of the imagined deals`);
  assert.equal(chooseAction(speaksFirst, { random: createRandom(1), ...think }).type, 'pass', 'speaking first it passes');
  let speaksLast = newDeal({ deck: [...others.slice(0, 20), ...hand, ...others.slice(20)] });
  for (let i = 0; i < 2; i += 1) speaksLast = applyAction(speaksLast, { type: 'pass', seat: speaksLast.turn! });
  assert.equal(chooseAction(speaksLast, { random: createRandom(1), ...think }).type, 'bid', 'after two passes it bids a six instead of all-pass');
  // [EN] Characters differ: a bold one (Carmilla, +0.5) opens with the same hand, a careful one still passes last.
  // [RU] Персонажи разные: смелая (Кармилла, +0.5) открывает торговлю с той же рукой, осторожный и последним пасует.
  const bold = { boldness: 0.5, whistCaution: 0.9, misereNerve: 1 };
  const careful = { boldness: -0.3, whistCaution: 1.2, misereNerve: 0 };
  assert.equal(chooseAction(speaksFirst, { random: createRandom(1), style: bold, ...think }).type, 'bid', 'a bold character opens');
  assert.equal(chooseAction(speaksLast, { random: createRandom(1), style: careful, ...think }).type, 'pass', 'a careful character prefers all-pass');
  // [EN] Without imagining (a device too slow to think) the old rule of thumb still answers, and it answers legally.
  // [RU] Без воображения (устройство слишком медленное, чтобы думать) по-прежнему отвечает старое правило, и отвечает по правилам.
  assert.ok(['pass', 'bid'].includes(chooseAction(speaksFirst, { random: createRandom(1), foresight: 0 }).type));
});

test('a hopeless hand passes and a sure one bids at once, without imagining a single deal', () => {
  // Middle cards in every suit: too weak for a game and too high for a misère.
  const weak = parseCards('Q♠ J♠ 9♠ K♣ 10♣ 9♣ J♦ 10♦ Q♥ 9♥');
  const strong = parseCards('A♠ K♠ Q♠ J♠ 10♠ 9♠ A♣ K♣ A♦ 7♥');
  for (const [hand, expected] of [[weak, 'pass'], [strong, 'bid']] as const) {
    const state = newDeal({ deck: [...hand, ...FULL_DECK.filter(card => !hand.includes(card))] });
    const started = Date.now();
    // A budget of a minute and a thousand deals: only a decision made at one look can come back at once.
    assert.equal(chooseAction(state, { random: createRandom(3), foresight: 1000, timeBudgetMs: 60000 }).type, expected);
    assert.ok(Date.now() - started < 1500, 'decided at one look');
  }
});

test('three bots play six deals from the auction to the score; the settlement sums to zero', () => {
  let state = newDeal({ random: createRandom(11) });
  let sheet: DealScore = ZERO_SCORE;
  const modes = new Set<string>();
  for (let deal = 0; deal < 6; deal += 1) {
    const done = playDeal(state, 100 + deal);
    assert.ok(done.result);
    modes.add(done.result.mode);
    if (done.result.played) assert.equal(done.result.tricksWon.reduce((a, b) => a + b, 0), 10);
    sheet = addScores(sheet, done.result.score);
    state = nextDeal(done, { random: createRandom(200 + deal) });
  }
  const balance = settle(sheet, SOCHI);
  assert.ok(Math.abs(balance.reduce((a, b) => a + b, 0)) < 1e-9);
  assert.ok(modes.size >= 1);
});

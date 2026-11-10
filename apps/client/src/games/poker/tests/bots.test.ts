// [EN] FILE: games/poker/tests/bots.test.ts — the poker bots: their equity matches the known numbers (aces against a
//      random hand ≈ 85%, seven-deuce offsuit ≈ 35%), they raise aces and fold rubbish against a big raise, and whole
//      sit-and-goes of six bots end with one winner, never an illegal action and never a chip lost or made.
// [RU] ФАЙЛ: боты покера: их эквити совпадает с известными числами (тузы против случайной руки ≈ 85%, семь-два
//      разномастные ≈ 35%), с тузами они рейзят, а мусор сбрасывают против большого рейза, и целые турниры шести
//      ботов кончаются одним победителем, без единого неверного хода и без потерянной или лишней фишки.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NEUTRAL_POKER_STYLE, applyAction, choosePokerAction, createRandom, equity, legalActions, newTable, nextHand, parseCards, playOut, preflopScore,
  type HandState,
} from '../engine/index.ts';

test('equity matches the known heads-up numbers', () => {
  const aces = equity(parseCards('As Ad'), [], [0], createRandom(1), 4000);
  const rubbish = equity(parseCards('7c 2d'), [], [0], createRandom(2), 4000);
  assert.ok(Math.abs(aces - 0.852) < 0.025, `AA vs random: ${aces}`);
  assert.ok(Math.abs(rubbish - 0.346) < 0.025, `72o vs random: ${rubbish}`);
  // A made flush on the river against one random hand wins nearly always.
  const flush = equity(parseCards('Ah Kh'), parseCards('2h 7h 9h Jc 4s'), [0], createRandom(3), 2000);
  assert.ok(flush > 0.9, `nut flush: ${flush}`);
  assert.ok(preflopScore(parseCards('As')[0], parseCards('Ah')[0]) === 1);
  assert.ok(preflopScore(parseCards('7c')[0], parseCards('2d')[0]) < 0.1);
});

test('a bot raises aces and folds rubbish against a big raise', () => {
  const aces = newTable(4, createRandom(5), { button: 0, holes: [undefined, undefined, undefined, parseCards('As Ad')] });
  assert.equal(aces.turn, 3);
  const withAces = choosePokerAction(aces, { random: createRandom(6), style: NEUTRAL_POKER_STYLE });
  assert.ok(withAces.type === 'raise' || withAces.type === 'allIn', `aces: ${withAces.type}`);
  let facing = newTable(3, createRandom(7), { button: 0, holes: [undefined, parseCards('7c 2d'), undefined] });
  facing = applyAction(facing, { type: 'raise', seat: 0, to: 600 });
  assert.equal(facing.turn, 1);
  assert.equal(choosePokerAction(facing, { random: createRandom(8) }).type, 'fold');
});

test('whole sit-and-goes of bots: one winner, legal actions, no chip lost or made', () => {
  for (let table = 0; table < 6; table += 1) {
    const random = createRandom(100 + table);
    const players = 2 + (table % 5);
    let state: HandState | null = newTable(players, random, { button: table % players });
    const total = players * 1500;
    let hands = 0;
    while (state && hands < 400) {
      // Every action of every bot is checked by the engine itself (applyAction throws on an illegal one).
      const done = playOut(state, () => ({ random, samples: 60, noise: 0.15 }));
      assert.equal(done.seats.reduce((sum, seat) => sum + seat.stack, 0), total, `table ${table}, hand ${done.handNumber}: chips conserved`);
      assert.ok(legalActions(done) === null);
      hands += 1;
      state = nextHand(done, random);
    }
    assert.equal(state, null, `table ${table} (${players} players) ended in ${hands} hands`);
  }
});

// [EN] FILE: games/poker/tests/holdem.test.ts — the casino rules of no-limit hold'em on fixed deals: who speaks first
//      heads-up and three-handed, the minimum raise, a short all-in that does not reopen the betting, side pots and
//      an uncalled bet coming back, a split pot with the odd chip left of the button, a walk, an all-in run-out,
//      the next hand (button, busted player, rising blinds), illegal actions, and a saved state that plays on.
// [RU] ФАЙЛ: казино-правила безлимитного холдема на заданных раскладах: кто говорит первым вдвоём и втроём,
//      минимальный рейз, короткий олл-ин, который не открывает торговлю заново, побочные банки и возврат
//      неуравненной ставки, делёж банка с лишней фишкой слева от баттона, победа без вскрытия, донесение доски при
//      олл-ине, следующая раздача (баттон, вылетевший игрок, рост блайндов), неверные ходы и сохранённое состояние,
//      которое играется дальше.
import assert from 'node:assert/strict';
import test from 'node:test';
// [EN] A relative path on purpose: Node runs the tests directly and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает тесты напрямую и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';
import { parseCards } from '../engine/cards.ts';
import { DEFAULT_RULES, applyAction, buildPots, legalActions, newTable, nextHand, potSize, type HandState, type TableRules } from '../engine/holdem.ts';

const random = () => createRandom(42);
const act = (state: HandState, type: 'fold' | 'check' | 'call' | 'allIn', seat = state.turn as number) => applyAction(state, { type, seat });
const raise = (state: HandState, to: number, seat = state.turn as number) => applyAction(state, { type: 'raise', seat, to });
const checkDown = (start: HandState) => {
  let state = start;
  for (let guard = 0; state.phase === 'betting' && guard < 40; guard += 1) state = legalActions(state)?.check ? act(state, 'check') : act(state, 'call');
  return state;
};

test('heads-up: the button is the small blind, speaks first before the flop and last after it', () => {
  let state = newTable(2, random(), { button: 0 });
  assert.equal(state.smallBlindSeat, 0);
  assert.equal(state.bigBlindSeat, 1);
  assert.equal(state.turn, 0);
  assert.deepEqual([state.seats[0].bet, state.seats[1].bet], [10, 20]);
  state = act(state, 'call');
  assert.equal(state.turn, 1, 'the big blind has the option');
  state = act(state, 'check');
  assert.equal(state.street, 'flop');
  assert.equal(state.board.length, 3);
  assert.equal(state.turn, 1, 'after the flop the big blind speaks first');
});

test('three-handed: the button opens the betting, the small blind opens after the flop', () => {
  let state = newTable(3, random(), { button: 0 });
  assert.deepEqual([state.smallBlindSeat, state.bigBlindSeat, state.turn], [1, 2, 0]);
  state = act(state, 'call');
  state = act(state, 'call');
  state = act(state, 'check');
  assert.equal(state.street, 'flop');
  assert.equal(state.turn, 1);
});

test('a raise is at least the last full raise', () => {
  let state = newTable(4, random(), { button: 0 });
  assert.equal(state.turn, 3);
  assert.deepEqual(legalActions(state)?.raise, { min: 40, max: 1500 });
  state = raise(state, 60);
  assert.equal(legalActions(state)?.raise?.min, 100, 'the next raise adds at least 40 more');
  assert.throws(() => raise(state, 90), /must reach 100/);
});

test('a short all-in does not reopen the betting for those who have acted', () => {
  let state = newTable(3, random(), { button: 0, stacks: [1000, 1000, 130] });
  state = raise(state, 100); // the button raises by 80
  state = act(state, 'call'); // the small blind calls
  state = act(state, 'allIn'); // the big blind: all-in to 130, only 30 more
  assert.equal(state.turn, 0);
  const legal = legalActions(state);
  assert.equal(legal?.call, 30);
  assert.equal(legal?.raise, null, 'no re-raise after a short all-in');
  assert.equal(legal?.allIn, null, 'all-in would be a raise: closed');
  assert.throws(() => act(state, 'allIn'), /not open/);
  state = act(state, 'call');
  state = act(state, 'call');
  assert.equal(state.street, 'flop');
});

test('side pots and an uncalled bet coming back', () => {
  // Seat 0 holds aces, seat 1 kings, seat 2 a seven-deuce; nothing on the board helps.
  const holes = [parseCards('As Ad'), parseCards('Ks Kd'), parseCards('7c 2d')];
  let state = newTable(3, random(), { button: 2, stacks: [100, 300, 1000], holes, board: parseCards('2h 5s 9c Jd 3h') });
  assert.equal(state.turn, 2);
  state = raise(state, 500); // the button raises big
  state = act(state, 'allIn'); // seat 0: all-in 100
  state = act(state, 'allIn'); // seat 1: all-in 300 (a call for less)
  assert.equal(state.phase, 'done');
  assert.equal(state.board.length, 5, 'the board was dealt out');
  const pots = state.result?.pots ?? [];
  assert.deepEqual(pots.map(pot => [pot.amount, pot.eligible.join(''), pot.winners.join('')]), [[300, '012', '0'], [400, '12', '1'], [200, '2', '2']]);
  assert.deepEqual(state.seats.map(seat => seat.stack), [300, 400, 700]);
  assert.equal(state.seats.reduce((sum, seat) => sum + seat.stack, 0), 1400, 'no chip is lost or made');
});

test('a split pot gives the odd chip to the first winner left of the button', () => {
  const rules: TableRules = { ...DEFAULT_RULES, levels: [{ small: 15, big: 30, ante: 0 }] };
  // The board is a straight: both players who stay play the board.
  let state = newTable(3, random(), { button: 0, rules, holes: [parseCards('2c 2d'), parseCards('3c 3d'), parseCards('4c 4d')], board: parseCards('5c 6d 7h 8s 9c') });
  state = act(state, 'call'); // seat 0 calls 30
  state = act(state, 'fold'); // seat 1 (small blind) folds 15
  state = act(state, 'check'); // seat 2 (big blind) checks
  state = checkDown(state);
  const pot = state.result?.pots[0];
  assert.equal(pot?.amount, 75);
  assert.deepEqual(pot?.winners, [2, 0], 'seat 2 sits first left of the button among the winners');
  assert.deepEqual(pot?.shares, [38, 37]);
});

test('a walk: everybody folds to the big blind', () => {
  let state = newTable(3, random(), { button: 0 });
  state = act(state, 'fold');
  state = act(state, 'fold');
  assert.equal(state.phase, 'done');
  assert.equal(state.result?.showdown, false);
  assert.equal(state.seats[2].stack, 1510);
});

test('the next hand: the button moves, a busted player sits out, the blinds rise', () => {
  const holes = [parseCards('As Ad'), parseCards('7c 2d'), parseCards('8h 3s')];
  let state = newTable(3, random(), { button: 0, stacks: [1500, 40, 1500], holes, board: parseCards('Ac Kd 9h 4s 2h') });
  state = act(state, 'call'); // seat 0
  state = act(state, 'allIn'); // seat 1, the small blind, all-in for 40
  state = act(state, 'fold'); // seat 2
  state = act(state, 'call'); // seat 0 calls the rest
  assert.equal(state.phase, 'done');
  assert.equal(state.seats[1].stack, 0, 'seat 1 is busted');
  let next = nextHand(state, random());
  assert.ok(next);
  assert.equal(next.seats[1].out, true);
  assert.equal(next.button, 2);
  assert.equal(next.smallBlindSeat, 2, 'heads-up now: the button posts the small blind');
  // Ten hands later the blinds rise.
  for (let hand = 0; hand < 9 && next; hand += 1) next = nextHand(checkDown(next), random());
  assert.equal(next?.handNumber, 11);
  assert.deepEqual(next?.level, { small: 15, big: 30, ante: 0 });
});

test('the deal checks every action and a saved state plays on', () => {
  const state = newTable(3, random(), { button: 0 });
  assert.throws(() => act(state, 'check'), /bet to call/);
  assert.throws(() => applyAction(state, { type: 'call', seat: 1 }), /turn/);
  const copy = JSON.parse(JSON.stringify(state)) as HandState;
  assert.deepEqual(checkDown(copy).seats.map(seat => seat.stack), checkDown(state).seats.map(seat => seat.stack));
  assert.equal(potSize(state), 30);
  // [EN] Pots are split at the end of the hand, when every contribution is final. [RU] Банки делятся в конце раздачи, когда все вклады окончательны.
  const end = checkDown(state);
  assert.deepEqual(buildPots(end.seats), [{ amount: 60, eligible: [0, 1, 2] }]);
  assert.equal(end.result?.pots[0].amount, 60);
});

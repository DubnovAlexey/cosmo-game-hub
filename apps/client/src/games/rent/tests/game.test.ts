// [EN] FILE: games/rent/tests/game.test.ts — the rules of «Blood Rent»: the board, moving and the salary, doubles,
//      buying and rent, whole sectors, even building, pawning, Cryo, the Solar Flare, the two decks, auctions, debts
//      and bankruptcy, the Drift's cup and the end by rounds.
// [RU] ФАЙЛ: правила «Кровной ренты»: поле, ходы и жалованье, дубли, покупка и рента, целые секторы, ровная стройка,
//      заклад, Криокамера, Вспышка звезды, две колоды, аукционы, долги и банкротство, кубок Дрейфа и конец по кругам.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BEACON, BOARD, CRYO, DECKS, DEFAULT_OPTIONS, DRIFT, FLARE, GATE_SQUARES, SECTORS, SECTOR_SQUARES, act, canBuild, canPawn,
  createRandom, modulePrice, newRentGame, priceOf, rentOf, rentTable, type RentAction, type RentState,
} from '../engine/index.ts';

const random = createRandom(11);
const go = (state: RentState, ...actions: RentAction[]): RentState => actions.reduce((current, action) => act(current, action, random), state);
const roll = (a: number, b: number): RentAction => ({ type: 'roll', dice: [a, b] });
/** A game with some squares already owned (square → player) and some cash. */
function setUp(owned: Record<number, number> = {}, cash: number[] = [1200, 1200, 1200]): RentState {
  const game = newRentGame(cash.length, createRandom(5));
  const owner = [...game.owner];
  for (const [square, player] of Object.entries(owned)) owner[Number(square)] = player;
  return { ...game, owner, players: game.players.map((player, index) => ({ ...player, cash: cash[index] })) };
}
const at = (state: RentState, player: number, position: number): RentState => ({ ...state, players: state.players.map((p, index) => (index === player ? { ...p, position } : p)) });

test('the board: 32 squares, 19 estates in 7 sectors, 4 gates, 2 bays of each deck, prices growing round the ring', () => {
  assert.equal(BOARD.length, 32);
  assert.equal(BOARD.filter(square => square.kind === 'estate').length, 19);
  assert.equal(GATE_SQUARES.length, 4);
  assert.deepEqual([BOARD[BEACON], BOARD[CRYO], BOARD[DRIFT], BOARD[FLARE]].map(square => square.kind === 'corner' && square.id), ['beacon', 'cryo', 'drift', 'flare']);
  for (const deck of ['chance', 'infection'] as const) {
    assert.equal(BOARD.filter(square => square.kind === 'card' && square.deck === deck).length, 2);
    assert.equal(new Set(DECKS[deck].map(card => card.id)).size, DECKS[deck].length, `${deck}: two cards share an id`);
  }
  const prices = SECTORS.map(sector => Math.max(...SECTOR_SQUARES[sector].map(priceOf)));
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  for (const sector of SECTORS) assert.ok(SECTOR_SQUARES[sector].length >= 2 && SECTOR_SQUARES[sector].length <= 3, sector);
  // [EN] Every level of buildings brings more rent. [RU] Каждый уровень построек приносит больше ренты.
  for (const price of [50, 190, 380]) {
    const table = rentTable(price);
    assert.equal(table.length, 6);
    table.forEach((rent, index) => index > 0 && assert.ok(rent > table[index - 1]));
  }
});

test('moving: the dice take the player round the ring, passing the Beacon pays the salary, a double rolls again', () => {
  let game = go(setUp(), roll(3, 4));
  assert.equal(game.players[0].position, 7);
  assert.equal(game.phase.kind, 'buy');
  game = go(game, { type: 'decline' }, { type: 'pass' }, { type: 'pass' }, { type: 'pass' });
  assert.equal(game.phase.kind, 'end');
  game = go(at(newRentGame(2, random), 0, 30), roll(1, 1));
  assert.equal(game.players[0].position, 0);
  assert.equal(game.players[0].cash, DEFAULT_OPTIONS.startCash + DEFAULT_OPTIONS.salary);
  assert.equal(game.phase.kind, 'roll', 'a double rolls again');
});

test('three doubles in a row put the player into Cryo', () => {
  const game = go(setUp({ 2: 1 }), roll(1, 1), { type: 'decline' }, { type: 'pass' }, { type: 'pass' }, { type: 'pass' });
  assert.equal(game.phase.kind, 'roll');
  const second = go(game, roll(2, 2));
  const third = go(second.phase.kind === 'buy' ? go(second, { type: 'decline' }, { type: 'pass' }, { type: 'pass' }, { type: 'pass' }) : second, roll(3, 3));
  assert.equal(third.players[0].position, CRYO);
  assert.equal(third.players[0].cryo, 0);
  assert.equal(third.phase.kind, 'end');
});

test('rent: a bare estate, a whole sector pays double, modules raise it, a pawned estate pays nothing', () => {
  const [a, b] = SECTOR_SQUARES.scrapyard;
  let game = setUp({ [a]: 1 });
  const bare = rentTable(priceOf(a))[0];
  assert.equal(rentOf(game, a), bare);
  game = setUp({ [a]: 1, [b]: 1 });
  assert.equal(rentOf(game, a), bare * 2);
  game = { ...game, turn: 1 };
  assert.ok(canBuild(game, a));
  game = go(game, { type: 'build', square: a });
  assert.equal(rentOf(game, a), rentTable(priceOf(a))[1]);
  assert.equal(game.players[1].cash, 1200 - modulePrice(a));
  // [EN] Evenly: no second module on the same estate before the other gets one. [RU] Ровно: второй модуль не встаёт, пока у соседа нет первого.
  assert.equal(canBuild(game, a), false);
  assert.ok(canBuild(game, b));
  assert.equal(canPawn(game, b), false, 'no pawning while a module stands in the sector');
  game = setUp({ [a]: 1 });
  game = go({ ...game, turn: 1, phase: { kind: 'end' } }, { type: 'pawn', square: a });
  assert.equal(game.players[1].cash, 1200 + priceOf(a) / 2);
  assert.equal(rentOf(game, a), 0);
});

test('a visitor pays the rent to the owner, and the gates count together', () => {
  const [g1, g2] = GATE_SQUARES;
  let game = go(setUp({ [g1]: 1, [g2]: 1 }), roll(2, 3));
  assert.equal(game.players[0].position, g1);
  assert.equal(game.players[0].cash, 1200 - 45);
  assert.equal(game.players[1].cash, 1200 + 45);
  game = go(game, { type: 'end' });
  assert.equal(game.turn, 1);
});

test('Cryo: a miss waits, a double walks out without a second roll, the third miss pays the bail', () => {
  let game: RentState = { ...setUp(), phase: { kind: 'cryo' }, players: setUp().players.map((p, i) => (i === 0 ? { ...p, position: CRYO, cryo: 0 } : p)) };
  const missed = go(game, roll(1, 2));
  assert.equal(missed.players[0].cryo, 1);
  assert.equal(missed.players[0].position, CRYO);
  const free = go(game, roll(2, 2));
  assert.equal(free.players[0].cryo, null);
  assert.equal(free.players[0].position, CRYO + 4);
  assert.notEqual(free.phase.kind, 'roll', 'no second roll after leaving');
  game = { ...game, players: game.players.map((p, i) => (i === 0 ? { ...p, cryo: 2 } : p)) };
  const served = go(game, roll(1, 3));
  assert.equal(served.players[0].cryo, null);
  assert.equal(served.players[0].position, CRYO + 4);
  assert.equal(served.cup, DEFAULT_OPTIONS.bail);
  const bailed = go(game, { type: 'bail' });
  assert.equal(bailed.phase.kind, 'roll');
  assert.throws(() => go(game, { type: 'code' }), /no thaw code/);
});

test('the Solar Flare: pay the bail into the cup, or go into Cryo; the Drift takes the cup', () => {
  const game = go(at(setUp(), 0, FLARE - 3), roll(1, 2));
  assert.equal(game.phase.kind, 'flare');
  const paid = go(game, { type: 'flare', choice: 'pay' });
  assert.equal(paid.cup, DEFAULT_OPTIONS.bail);
  assert.equal(paid.players[0].cash, 1200 - DEFAULT_OPTIONS.bail);
  const frozen = go(game, { type: 'flare', choice: 'cryo' });
  assert.equal(frozen.players[0].position, CRYO);
  const drifting = go({ ...at(setUp(), 0, DRIFT - 3), cup: 140 }, roll(1, 2));
  assert.equal(drifting.cup, 0);
  assert.equal(drifting.players[0].cash, 1200 + 140);
});

test('the decks: each card does what it says', () => {
  const deckWith = (state: RentState, deck: 'chance' | 'infection', id: string): RentState => ({
    ...state, decks: { ...state.decks, [deck]: [DECKS[deck].findIndex(card => card.id === id)] }, drawn: { chance: 0, infection: 0 },
  });
  // [EN] Square 2 is a «Bloody Chance» bay, square 11 an «Infection» bay. [RU] Клетка 2 — отсек «Кровавого шанса», клетка 11 — «Заражения».
  const toBeacon = go(deckWith(setUp(), 'chance', 'toBeacon'), roll(1, 1));
  assert.equal(toBeacon.players[0].position, BEACON);
  assert.equal(toBeacon.players[0].cash, 1200 + DEFAULT_OPTIONS.salary);
  assert.deepEqual(toBeacon.lastCard, { deck: 'chance', id: 'toBeacon' });
  const frozen = go(deckWith(setUp(), 'chance', 'frozen'), roll(1, 1));
  assert.equal(frozen.players[0].position, CRYO);
  assert.equal(frozen.phase.kind, 'end', 'no second roll from Cryo');
  const toast = go(deckWith(setUp(), 'chance', 'toast'), roll(1, 1));
  assert.equal(toast.players[0].cash, 1200 + 40);
  const gate = go(deckWith(setUp({ 5: 1 }), 'chance', 'nearestGate'), roll(1, 1));
  assert.equal(gate.players[0].position, 5);
  assert.equal(gate.players[0].cash, 1200 - 2 * 20, 'the nearest gate takes double');
  const carrier = go(deckWith(at(setUp(), 0, 9), 'infection', 'carrier'), roll(1, 1));
  assert.equal(carrier.players[0].cash, 1200 - 50);
  assert.equal(carrier.players[1].cash, 1200 + 25);
  const code = go(deckWith(at(setUp(), 0, 9), 'infection', 'antidote'), roll(1, 1));
  assert.equal(code.players[0].codes, 1);
});

test('an auction: whoever bids most gets the estate; nobody bidding leaves it to the bank', () => {
  let game = go(setUp(), roll(3, 4), { type: 'decline' });
  assert.equal(game.phase.kind, 'auction');
  game = go(game, { type: 'pass' }, { type: 'bid', amount: 40 }, { type: 'bid', amount: 60 }, { type: 'pass' });
  assert.equal(game.owner[7], 2);
  assert.equal(game.players[2].cash, 1200 - 60);
  assert.throws(() => go(go(setUp(), roll(3, 4), { type: 'decline' }), { type: 'bid', amount: 5 }), /bad bid/);
  const nobody = go(setUp(), roll(3, 4), { type: 'decline' }, { type: 'pass' }, { type: 'pass' }, { type: 'pass' });
  assert.equal(nobody.owner[7], null);
});

test('a debt waits until the money is raised; a player who cannot pay goes bankrupt and the creditor takes all', () => {
  const lake = SECTOR_SQUARES.cryoprison[2];
  let game: RentState = { ...setUp({ [lake]: 1, 1: 0 }, [30, 1200, 1200]), level: setUp().level.map((level, square) => (square === lake ? 3 : level)) };
  game = go(at(game, 0, lake - 4), roll(1, 3));
  assert.equal(game.phase.kind, 'debt');
  assert.throws(() => go(game, { type: 'pay' }), /not enough/);
  // [EN] With the flagship throne to pawn, the same debt could be paid: no bankruptcy then. [RU] С троном флагмана в закладе тот же долг можно оплатить: банкротства тогда нет.
  const rich = { ...game, owner: game.owner.map((owner, square) => (square === 31 ? 0 : owner)), players: game.players.map((p, i) => (i === 0 ? { ...p, cash: 400 } : p)) };
  assert.throws(() => go(rich, { type: 'bankrupt' }), /can still be paid/);
  game = go(game, { type: 'pawn', square: 1 });
  assert.equal(game.players[0].cash, 30 + priceOf(1) / 2);
  game = go(game, { type: 'bankrupt' });
  assert.equal(game.players[0].bankrupt, true);
  assert.equal(game.owner[1], 1, 'the creditor takes the estate');
  assert.equal(game.players[1].cash, 1200 + 30 + priceOf(1) / 2);
  assert.equal(game.turn, 1);
});

test('a raid (takeover): the owner of the rest of a sector may buy the last estate out at twice its price', () => {
  const [a, b] = SECTOR_SQUARES.scrapyard;
  // [EN] Player 0 owns square 1, player 1 owns square 3; player 0 lands on 3, pays the rent and may take it over.
  // [RU] Игроку 0 принадлежит клетка 1, игроку 1 — клетка 3; игрок 0 встаёт на 3, платит ренту и может её захватить.
  const game = go(setUp({ [a]: 0, [b]: 1 }), roll(1, 2));
  assert.equal(game.phase.kind, 'takeover');
  const rent = rentTable(priceOf(b))[0];
  const taken = go(game, { type: 'takeover' });
  assert.equal(taken.owner[b], 0);
  assert.equal(taken.players[0].cash, 1200 - rent - 2 * priceOf(b));
  assert.equal(taken.players[1].cash, 1200 + rent + 2 * priceOf(b));
  assert.equal(go(game, { type: 'skip' }).owner[b], 1);
  const off = go({ ...setUp({ [a]: 0, [b]: 1 }), options: { ...DEFAULT_OPTIONS, takeover: false } }, roll(1, 2));
  assert.notEqual(off.phase.kind, 'takeover');
});

test('the end: the last one standing, or the richest after the round limit', () => {
  const two = newRentGame(2, createRandom(3), { ...DEFAULT_OPTIONS, roundLimit: 1 });
  let game = go(two, roll(1, 2));
  game = go(game.phase.kind === 'buy' ? go(game, { type: 'buy' }) : game, { type: 'end' });
  game = go(game, roll(1, 2));
  game = go(game.phase.kind === 'buy' ? go(game, { type: 'decline' }, { type: 'pass' }, { type: 'pass' }) : game, { type: 'end' });
  assert.equal(game.phase.kind, 'over');
  assert.equal(game.winner, 0, 'the one with an estate is richer');
});

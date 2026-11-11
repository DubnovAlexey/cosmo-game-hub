// [EN] FILE: games/rent/tests/game.test.ts — the rules of «Blood Rent»: the board, moving with the salary and the
//      radiation, doubles, buying and rent, whole sectors, even building and the citadel's capsule, pawning, the
//      Quarantine Ward, infected sectors and the Debtor-Corpse, bio-labs and bio-alimony, the Black Market, the
//      Abandoned Cruiser, the Abyss Spaceport, the Inquisition Court, the two decks, auctions, raids, debts and the
//      end of the game.
// [RU] ФАЙЛ: правила «Кровной ренты»: поле, ходы с жалованьем и радиацией, дубли, покупка и рента, целые секторы,
//      ровная стройка и капсула цитадели, заклад, Карантинный изолятор, заражённые секторы и Труп-должник,
//      биолаборатории и био-алименты, Чёрный рынок, Заброшенный крейсер, Космопорт Бездны, Суд инквизиции, две
//      колоды, аукционы, рейды, долги и конец партии.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AIRLOCK, BOARD, COLLAPSE, COURT, CRUISER, DECKS, DEFAULT_OPTIONS, FLESH_PRICE, GATE_SQUARES, HEAL, MARKET, QUARANTINE,
  RADIATION, RANSOM, SECTORS, SECTOR_SQUARES, SPACEPORT, act, buyPlasmaPrice, canBuild, canPawn, courtToll, createRandom,
  infectedRent, modulePrice, newRentGame, plasmaRate, priceOf, rentOf, rentTable, sellPlasmaPrice,
  type PlayerState, type RentAction, type RentState,
} from '../engine/index.ts';

const random = createRandom(11);
const go = (state: RentState, ...actions: RentAction[]): RentState => actions.reduce((current, action) => act(current, action, random), state);
const roll = (a: number, b: number): RentAction => ({ type: 'roll', dice: [a, b] });
/** A game of three with some squares owned (square → player) and some cash. */
function setUp(owned: Record<number, number> = {}, cash: number[] = [1200, 1200, 1200]): RentState {
  const game = newRentGame(cash.length, createRandom(5));
  const owner = game.owner.map((_, square) => (square in owned ? owned[square] : null));
  return { ...game, owner, players: game.players.map((player, index) => ({ ...player, cash: cash[index] })) };
}
const withPlayer = (state: RentState, index: number, change: Partial<PlayerState>): RentState =>
  ({ ...state, players: state.players.map((player, i) => (i === index ? { ...player, ...change } : player)) });
const at = (state: RentState, index: number, position: number): RentState => withPlayer(state, index, { position });
const deckWith = (state: RentState, deck: 'chance' | 'infection', id: string): RentState => ({
  ...state, decks: { ...state.decks, [deck]: [DECKS[deck].findIndex(card => card.id === id)] }, drawn: { chance: 0, infection: 0 },
});
const everybodyPasses = (state: RentState): RentState => go(state, { type: 'decline' }, { type: 'pass' }, { type: 'pass' }, { type: 'pass' });

test('the board: 32 squares, 19 estates in 7 sectors, 3 gates, the corners and the special squares in place', () => {
  assert.equal(BOARD.length, 32);
  assert.equal(BOARD.filter(square => square.kind === 'estate').length, 19);
  assert.equal(GATE_SQUARES.length, 3);
  assert.deepEqual([0, QUARANTINE, MARKET, COURT].map(square => { const cell = BOARD[square]; return cell.kind === 'corner' && cell.id; }), ['airlock', 'quarantine', 'market', 'court']);
  assert.equal(BOARD[CRUISER].kind, 'cruiser');
  assert.equal(BOARD[SPACEPORT].kind, 'spaceport');
  assert.equal(BOARD.filter(square => square.kind === 'card' && square.deck === 'chance').length, 1);
  assert.equal(BOARD.filter(square => square.kind === 'card' && square.deck === 'infection').length, 2);
  for (const deck of ['chance', 'infection'] as const) assert.equal(new Set(DECKS[deck].map(card => card.id)).size, DECKS[deck].length, deck);
  const prices = SECTORS.map(sector => Math.max(...SECTOR_SQUARES[sector].map(priceOf)));
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  for (const price of [50, 190, 380]) rentTable(price).forEach((rent, index, table) => index > 0 && assert.ok(rent > table[index - 1]));
  assert.ok(plasmaRate(80) > plasmaRate(10), 'plasma is dearer on a sick station');
  assert.ok(buyPlasmaPrice(10) > sellPlasmaPrice(10));
});

test('moving: the dice, passing the Airlock pays the salary and costs the radiation, a double rolls again', () => {
  let game = go(setUp(), roll(3, 4));
  assert.equal(game.players[0].position, 7);
  assert.equal(game.phase.kind, 'buy');
  game = everybodyPasses(game);
  assert.equal(game.phase.kind, 'end');
  game = go(at(newRentGame(2, random), 0, 30), roll(1, 1));
  assert.equal(game.players[0].position, AIRLOCK);
  assert.equal(game.players[0].cash, DEFAULT_OPTIONS.startCash + DEFAULT_OPTIONS.salary);
  assert.equal(game.players[0].bio, 100 - RADIATION);
  assert.equal(game.phase.kind, 'roll', 'a double rolls again');
});

test('three doubles in a row put the player into the Quarantine Ward', () => {
  let game = everybodyPasses(go(setUp(), roll(1, 2 - 1)));
  assert.equal(game.phase.kind, 'roll');
  game = go(game, roll(2, 2));
  if (game.phase.kind === 'buy') game = everybodyPasses(game);
  game = go(game, roll(3, 3));
  assert.equal(game.players[0].position, QUARANTINE);
  assert.equal(game.players[0].quarantine, 0);
  assert.equal(game.phase.kind, 'end');
});

test('rent: a whole sector pays double, modules raise it, a citadel takes a capsule, a pawned estate pays nothing', () => {
  const [a, b] = SECTOR_SQUARES.scrapyard;
  const bare = rentTable(priceOf(a))[0];
  assert.equal(rentOf(setUp({ [a]: 1 }), a), bare);
  let game: RentState = { ...setUp({ [a]: 1, [b]: 1 }), turn: 1 };
  assert.equal(rentOf(game, a), bare * 2);
  game = go(game, { type: 'build', square: a });
  assert.equal(rentOf(game, a), rentTable(priceOf(a))[1]);
  assert.equal(canBuild(game, a), false, 'evenly: the neighbour first');
  assert.equal(canPawn(game, b), false, 'no pawning while a module stands in the sector');
  game = { ...game, level: game.level.map((level, square) => (square === a || square === b ? 4 : level)) };
  assert.ok(canBuild(game, a), 'one capsule at the start is enough for a citadel');
  game = go(game, { type: 'build', square: a });
  assert.equal(game.players[1].plasma, 0);
  assert.equal(canBuild(game, b), false, 'no second citadel without a capsule');
  const pawned = go({ ...setUp({ [a]: 1 }), turn: 1, phase: { kind: 'end' } }, { type: 'pawn', square: a });
  assert.equal(pawned.players[1].cash, 1200 + priceOf(a) / 2);
  assert.equal(rentOf(pawned, a), 0);
  assert.ok(modulePrice(a) > 0);
});

test('a visitor pays the rent to the owner, and the gates count together', () => {
  const [g1, g2] = GATE_SQUARES;
  const game = go(setUp({ [g1]: 1, [g2]: 1 }), roll(2, 3));
  assert.equal(game.players[0].position, g1);
  assert.equal(game.players[0].cash, 1200 - 60);
  assert.equal(game.players[1].cash, 1200 + 60);
});

test('the Quarantine Ward: a miss waits, a double walks out, the third miss pays the bail; credits, a capsule, flesh or a pass let one out', () => {
  const ward = { ...withPlayer(setUp(), 0, { position: QUARANTINE, quarantine: 0 }), phase: { kind: 'quarantine' as const } };
  assert.equal(go(ward, roll(1, 2)).players[0].quarantine, 1);
  const free = go(ward, roll(2, 2));
  assert.equal(free.players[0].quarantine, null);
  assert.equal(free.players[0].position, QUARANTINE + 4);
  assert.notEqual(free.phase.kind, 'roll', 'no second roll after leaving');
  const served = go(withPlayer(ward, 0, { quarantine: 2 }), roll(1, 3));
  assert.equal(served.players[0].position, QUARANTINE + 4);
  assert.ok(served.players[0].cash <= 1200 - 50);
  assert.equal(go(ward, { type: 'leave', how: 'credits' }).players[0].cash, 1150);
  assert.equal(go(ward, { type: 'leave', how: 'capsule' }).players[0].plasma, 0);
  assert.equal(go(ward, { type: 'leave', how: 'flesh' }).players[0].bio, 85);
  assert.throws(() => go(ward, { type: 'leave', how: 'card' }), /no pass/);
  assert.equal(go(ward, { type: 'leave', how: 'credits' }).phase.kind, 'roll');
});

test('an infected sector takes flesh instead of credits; drained to 0 % the visitor becomes the owner\'s Debtor-Corpse', () => {
  const [a, b] = SECTOR_SQUARES.scrapyard;
  let game = go({ ...setUp({ [a]: 1, [b]: 1 }), turn: 1 }, { type: 'infect', square: a });
  assert.ok(game.infected[a] && game.infected[b]);
  assert.equal(game.players[1].plasma, 0);
  assert.ok(game.infection > newRentGame(3, random).infection);
  game = { ...game, turn: 0, phase: { kind: 'roll' } };
  const percent = infectedRent(rentOf(game, b));
  const bitten = go(game, roll(1, 2));
  assert.equal(bitten.players[0].bio, 100 - percent);
  assert.equal(bitten.players[0].cash, 1200, 'no credits change hands');
  const drained = go(withPlayer(game, 0, { bio: percent }), roll(1, 2));
  assert.equal(drained.players[0].corpse, 1);
  assert.equal(drained.players[0].bio, 0);
  // [EN] A corpse's income goes to the master; the ransom buys freedom back. [RU] Доход трупа уходит хозяину; выкуп возвращает свободу.
  const salaried = go(at({ ...drained, turn: 0, phase: { kind: 'roll' }, players: drained.players.map((p, i) => (i === 0 ? { ...p, position: 30 } : p)) }, 0, 30), roll(1, 1));
  assert.equal(salaried.players[0].cash, 1200);
  assert.equal(salaried.players[1].cash, drained.players[1].cash + DEFAULT_OPTIONS.salary);
  const ransomed = go({ ...withPlayer(drained, 0, { cash: RANSOM }), phase: { kind: 'end' } }, { type: 'ransom' });
  assert.equal(ransomed.players[0].corpse, null);
  assert.ok(ransomed.players[0].bio > 0);
  assert.equal(ransomed.players[1].cash, drained.players[1].cash + RANSOM);
});

test('a bio-lab heals; somebody else\'s lab takes bio-alimony from every income until the code is bought out', () => {
  const [lab] = SECTOR_SQUARES.biolab;
  let game = go(withPlayer(at(setUp({ [lab]: 1 }), 0, lab - 3), 0, { bio: 50 }), roll(1, 2));
  assert.equal(game.phase.kind, 'lab');
  game = go(game, { type: 'heal' });
  assert.equal(game.players[0].bio, 50 + HEAL);
  assert.deepEqual(game.players[0].liens, [1]);
  const before = game.players[1].cash;
  const paid = go(at({ ...game, phase: { kind: 'roll' } }, 0, 30), roll(1, 2));
  assert.equal(paid.players[1].cash, before + DEFAULT_OPTIONS.salary * 0.1, 'a tenth of the salary to the lab owner');
  const bought = go({ ...game, phase: { kind: 'end' } }, { type: 'buyout', owner: 1 });
  assert.deepEqual(bought.players[0].liens, []);
});

test('the Black Market, the Abandoned Cruiser, the Abyss Spaceport and the Inquisition Court', () => {
  const market = go(at(setUp(), 0, MARKET - 3), roll(1, 2));
  assert.equal(market.phase.kind, 'market');
  const sold = go(market, { type: 'flesh' });
  assert.equal(sold.players[0].cash, 1200 + FLESH_PRICE);
  assert.equal(sold.players[0].bio, 90);
  assert.equal(go(market, { type: 'buyPlasma' }).players[0].plasma, 2);
  assert.equal(go(market, { type: 'sellPlasma' }).players[0].cash, 1200 + sellPlasmaPrice(market.infection));
  const cruiser = go(at(setUp(), 0, CRUISER - 3), roll(1, 2));
  assert.equal(go(cruiser, { type: 'risk', die: 5 }).players[0].plasma, 3);
  assert.equal(go(cruiser, { type: 'risk', die: 2 }).players[0].bio, 75);
  const port = go(at(setUp(), 0, SPACEPORT - 3), roll(1, 2));
  const flown = go(port, { type: 'teleport', square: 31 });
  assert.equal(flown.players[0].position, 31);
  assert.equal(flown.phase.kind, 'buy');
  assert.equal(flown.players[0].cash, 1100);
  const court = go(at(setUp(), 0, COURT - 3), roll(1, 2));
  assert.equal(court.phase.kind, 'court');
  assert.equal(go(court, { type: 'court', choice: 'credits' }).players[0].cash, 1200 - courtToll(court, 0));
  assert.equal(go(court, { type: 'court', choice: 'flesh' }).players[0].bio, 85);
});

test('the decks: each card does what it says, and every «Infection» card makes the station sicker', () => {
  const toAirlock = go(deckWith(setUp(), 'chance', 'toAirlock'), roll(1, 1));
  assert.equal(toAirlock.players[0].position, AIRLOCK);
  assert.equal(toAirlock.players[0].cash, 1200 + DEFAULT_OPTIONS.salary);
  assert.equal(toAirlock.players[0].bio, 100 - RADIATION);
  const detained = go(deckWith(setUp(), 'chance', 'detained'), roll(1, 1));
  assert.equal(detained.players[0].position, QUARANTINE);
  assert.equal(detained.phase.kind, 'end');
  assert.equal(go(deckWith(setUp(), 'chance', 'salvage'), roll(1, 1)).players[0].plasma, 2);
  const start = setUp();
  const sick = go(deckWith(at(start, 0, 9), 'infection', 'insurance'), roll(1, 1));
  assert.ok(sick.infection > start.infection);
  const cured = go(deckWith(at(start, 0, 9), 'infection', 'vaccinePatent'), roll(1, 1));
  assert.ok(cured.infection < start.infection);
  assert.equal(cured.players[0].cash, 1200 + 100);
  const carrier = go(deckWith(at(start, 0, 9), 'infection', 'carrier'), roll(1, 1));
  assert.equal(carrier.players[0].cash, 1200 - 50);
});

test('an auction: whoever bids most gets the estate; nobody bidding leaves it to the bank', () => {
  let game = go(setUp(), roll(3, 4), { type: 'decline' });
  assert.equal(game.phase.kind, 'auction');
  game = go(game, { type: 'pass' }, { type: 'bid', amount: 40 }, { type: 'bid', amount: 60 }, { type: 'pass' });
  assert.equal(game.owner[7], 2);
  assert.equal(game.players[2].cash, 1200 - 60);
  assert.throws(() => go(go(setUp(), roll(3, 4), { type: 'decline' }), { type: 'bid', amount: 5 }), /bad bid/);
  assert.equal(everybodyPasses(go(setUp(), roll(3, 4))).owner[7], null);
});

test('a raid: the owner of the rest of a sector may buy the last estate out at twice its price', () => {
  const [a, b] = SECTOR_SQUARES.scrapyard;
  const game = go(setUp({ [a]: 0, [b]: 1 }), roll(1, 2));
  assert.equal(game.phase.kind, 'takeover');
  const rent = rentTable(priceOf(b))[0];
  const taken = go(game, { type: 'takeover' });
  assert.equal(taken.owner[b], 0);
  assert.equal(taken.players[0].cash, 1200 - rent - 2 * priceOf(b));
  assert.equal(go(game, { type: 'skip' }).owner[b], 1);
  const off = go({ ...setUp({ [a]: 0, [b]: 1 }), options: { ...DEFAULT_OPTIONS, takeover: false } }, roll(1, 2));
  assert.notEqual(off.phase.kind, 'takeover');
});

test('a debt waits for the money; the first fall before a player makes a Debtor-Corpse, the second one is the end', () => {
  const lake = SECTOR_SQUARES.cryoprison[2];
  let game: RentState = { ...setUp({ [lake]: 1, 1: 0 }, [30, 1200, 1200]), level: setUp().level.map((level, square) => (square === lake ? 3 : level)) };
  game = withPlayer(go(at(game, 0, lake - 4), roll(1, 3)), 0, { plasma: 0, bio: 5 });
  assert.equal(game.phase.kind, 'debt');
  assert.throws(() => go(game, { type: 'pay' }), /not enough/);
  assert.throws(() => go(withPlayer(game, 0, { bio: 100 }), { type: 'bankrupt' }), /can still be paid/, 'flesh is still there to pay with');
  game = go(game, { type: 'pawn', square: 1 }, { type: 'bankrupt' });
  assert.equal(game.players[0].corpse, 1);
  assert.equal(game.players[0].bankrupt, false);
  assert.equal(game.players[1].cash, 1200 + 30 + priceOf(1) / 2);
  assert.equal(game.turn, 1);
  // [EN] As a corpse, the same debt again: now the player leaves the game. [RU] Уже трупом, тот же долг снова: теперь игрок выходит из игры.
  let again: RentState = { ...game, turn: 0, phase: { kind: 'roll' }, players: game.players.map((p, i) => (i === 0 ? { ...p, position: lake - 4, cash: 0 } : p)) };
  again = go(again, roll(1, 3));
  assert.equal(again.phase.kind, 'debt');
  again = go(again, { type: 'bankrupt' });
  assert.equal(again.players[0].bankrupt, true);
  assert.equal(again.owner[1], 1);
});

test('the end: the station collapses at full infection and the richest free player wins; or one free player is left', () => {
  const sick = { ...newRentGame(2, createRandom(3)), infection: COLLAPSE - 1, phase: { kind: 'end' as const }, turn: 1 };
  const rich = withPlayer(sick, 1, { cash: 5000 });
  const collapsed = go(rich, { type: 'end' });
  assert.equal(collapsed.phase.kind, 'over');
  assert.equal(collapsed.winner, 1);
  assert.ok(collapsed.log.some(entry => entry.kind === 'collapse'));
  const lonely = withPlayer({ ...newRentGame(3, createRandom(3)), phase: { kind: 'end' as const } }, 1, { bankrupt: true });
  const last = go(withPlayer(lonely, 2, { corpse: 0, bio: 0 }), { type: 'end' });
  assert.equal(last.phase.kind, 'over');
  assert.equal(last.winner, 0);
});

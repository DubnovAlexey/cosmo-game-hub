// =====================================================================
// FILE: apps/client/src/games/rent/engine/ai/bot.ts
// PURPOSE: the opponents of «Blood Rent»: heroes of the lair who trade like people. A bot sees what a person at
//   the table sees (the board, the cash of everybody, the decks face down) and decides with a few honest rules:
//   keep a reserve against the rents on the board, buy what one can afford above it, pay more for an estate that
//   completes one's own sector or breaks somebody else's, build evenly where a sector is whole, redeem when rich,
//   get out of Cryo early in the game and sit there late, raise money for a debt from the least useful things first.
//   A manner (greed, building, caution) gives each hero a character.
// [RU] Соперники «Кровной ренты»: герои логова, которые торгуются как люди. Бот видит то же, что человек за столом
//   (поле, деньги всех, колоды рубашкой вверх), и решает по нескольким честным правилам: держать запас на ренты,
//   что лежат на поле; покупать то, что по карману сверх запаса; платить больше за владение, которое закрывает свой
//   сектор или ломает чужой; строить ровно там, где сектор целый; выкупать заклад, когда богат; выходить из
//   Криокамеры рано в партии и сидеть в ней поздно; на долг добывать деньги сначала из самого ненужного. Манера
//   (жадность, стройка, осторожность) даёт каждому герою характер.
// =====================================================================
import { BOARD, GATE_SQUARES, SECTOR_SQUARES } from '../rules.ts';
import {
  BID_STEP, canBuild, canPawn, canRedeem, canSell, isOwnable, modulePrice, ownsSector, priceOf, redeemPrice, rentOf,
  sectorOf, takeoverPrice, totalOf, type RentAction, type RentState,
} from '../game.ts';

export interface RentManner {
  /** 0–1: how eagerly the hero buys and bids. */
  readonly greed: number;
  /** 0–1: how eagerly the hero builds. */
  readonly building: number;
  /** 0–1: how large a reserve the hero keeps. */
  readonly caution: number;
}
export const PLAIN_MANNER: RentManner = Object.freeze({ greed: 0.5, building: 0.5, caution: 0.5 });

/** The credits a player keeps against what the board may take from them. */
export function reserveOf(state: RentState, player: number, manner: RentManner): number {
  let danger = 0;
  state.owner.forEach((owner, square) => {
    if (owner !== null && owner !== player) danger = Math.max(danger, rentOf(state, square));
  });
  return Math.round(80 + manner.caution * 220 + Math.min(danger, 1500) * (0.35 + manner.caution * 0.4));
}

/** How much an estate is worth to this player: its price, more if it completes or blocks a sector. */
export function worthTo(state: RentState, player: number, square: number, manner: RentManner): number {
  const price = priceOf(square);
  let factor = 0.8 + manner.greed * 0.5;
  const cell = BOARD[square];
  if (cell.kind === 'estate') {
    const others = SECTOR_SQUARES[cell.sector].filter(other => other !== square);
    if (others.every(other => state.owner[other] === player)) factor += 0.9;
    else {
      const owners = new Set(others.map(other => state.owner[other]).filter(owner => owner !== null));
      if (owners.size === 1 && !owners.has(player) && others.every(other => state.owner[other] !== null)) factor += 0.45;
    }
  } else if (cell.kind === 'gate') {
    factor += 0.15 * GATE_SQUARES.filter(other => state.owner[other] === player).length;
  }
  return Math.round(price * factor);
}

/** One step to raise money: pawn a lone estate, then a gate, sell a module, then pawn the rest. */
function raise(state: RentState, me: number): RentAction | null {
  const mine = state.owner.flatMap((owner, square) => (owner === me ? [square] : []));
  const lone = mine.filter(square => BOARD[square].kind === 'estate' && !ownsSector(state, square) && canPawn(state, square, me));
  if (lone.length > 0) return { type: 'pawn', square: lone.sort((a, b) => priceOf(a) - priceOf(b))[0] };
  const gates = mine.filter(square => BOARD[square].kind === 'gate' && canPawn(state, square, me));
  if (gates.length > 0) return { type: 'pawn', square: gates[0] };
  const sellable = mine.filter(square => canSell(state, square, me));
  if (sellable.length > 0) return { type: 'sell', square: sellable.sort((a, b) => modulePrice(a) - modulePrice(b))[0] };
  const rest = mine.filter(square => canPawn(state, square, me));
  if (rest.length > 0) return { type: 'pawn', square: rest.sort((a, b) => priceOf(a) - priceOf(b))[0] };
  return null;
}

/** Building and redeeming before the roll and at the end of the turn, while the reserve allows. */
function manage(state: RentState, me: number, manner: RentManner): RentAction | null {
  const cash = state.players[me].cash;
  const reserve = reserveOf(state, me, manner);
  const pawned = state.owner.flatMap((owner, square) => (owner === me && state.pawned[square] && canRedeem(state, square, me) ? [square] : []));
  const redeem = pawned.find(square => cash - redeemPrice(square) >= reserve * 1.4);
  if (redeem !== undefined) return { type: 'redeem', square: redeem };
  const buildable = state.owner.flatMap((owner, square) => (owner === me && canBuild(state, square, me) ? [square] : []));
  // [EN] The dearest sector first: its rent grows most. [RU] Сначала самый дорогой сектор: его рента растёт сильнее всего.
  buildable.sort((a, b) => priceOf(b) - priceOf(a));
  const margin = reserve * (1.25 - manner.building * 0.6);
  const build = buildable.find(square => cash - modulePrice(square) >= margin);
  return build === undefined ? null : { type: 'build', square: build };
}

/** The decision of the bot whose decision the game waits for. */
export function chooseRentAction(state: RentState, manner: RentManner = PLAIN_MANNER): RentAction {
  const phase = state.phase;
  const me = phase.kind === 'auction' ? phase.bidders[phase.at] : state.turn;
  const cash = state.players[me].cash;
  const reserve = reserveOf(state, me, manner);
  switch (phase.kind) {
    case 'debt': {
      if (cash >= totalOf(phase.debts)) return { type: 'pay' };
      return raise(state, me) ?? { type: 'bankrupt' };
    }
    case 'auction': {
      const ceiling = Math.min(worthTo(state, me, phase.square, manner), cash - Math.round(reserve / 2));
      const next = phase.bid + BID_STEP;
      if (next > ceiling) return { type: 'pass' };
      // [EN] Far below its worth the bot jumps; near it, it creeps. [RU] Далеко от цены бот прыгает, вблизи — крадётся.
      const jump = ceiling - phase.bid > 150 ? Math.max(next, Math.round((phase.bid + (ceiling - phase.bid) / 3) / BID_STEP) * BID_STEP) : next;
      return { type: 'bid', amount: Math.min(jump, ceiling) };
    }
    case 'buy': {
      const price = priceOf(phase.square);
      const worth = worthTo(state, me, phase.square, manner);
      const keep = worth > price * 1.6 ? reserve * 0.3 : reserve;
      return cash - price >= keep ? { type: 'buy' } : { type: 'decline' };
    }
    case 'takeover':
      // [EN] A whole sector is worth paying twice for, while the reserve holds. [RU] Целый сектор стоит двойной цены, пока держится запас.
      return cash - takeoverPrice(phase.square) >= reserve * (0.9 - manner.greed * 0.5) ? { type: 'takeover' } : { type: 'skip' };
    case 'flare':
      return cash - state.options.bail >= reserve * 0.5 ? { type: 'flare', choice: 'pay' } : { type: 'flare', choice: 'cryo' };
    case 'cryo': {
      // [EN] While much is still for sale, walking matters; later Cryo is a safe place to wait.
      // [RU] Пока многое ещё продаётся, важно ходить; позже Криокамера — безопасное место, чтобы переждать.
      const forSale = state.owner.filter((owner, square) => owner === null && isOwnable(square)).length;
      if (forSale >= 6) {
        if (state.players[me].codes > 0) return { type: 'code' };
        if (cash - state.options.bail >= reserve) return { type: 'bail' };
      }
      return manage(state, me, manner) ?? { type: 'roll' };
    }
    case 'roll':
      return manage(state, me, manner) ?? { type: 'roll' };
    case 'end':
      return manage(state, me, manner) ?? { type: 'end' };
    case 'over':
      throw new Error('the game is over');
  }
}

/** For the tests and the screen: the estates of a sector that a player still lacks. */
export const missingOf = (state: RentState, player: number, square: number): number[] =>
  sectorOf(square).filter(other => state.owner[other] !== player);

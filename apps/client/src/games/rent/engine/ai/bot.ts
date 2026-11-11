// =====================================================================
// FILE: apps/client/src/games/rent/engine/ai/bot.ts
// PURPOSE: the opponents of «Blood Rent»: heroes of the lair who trade like people. A bot sees what a person at
//   the table sees (the board, everybody's credits, capsules and flesh, the decks face down) and decides by a few
//   honest rules: keep a reserve against the rents on the board; buy what one can afford above it; pay more for an
//   estate that completes one's own sector or breaks somebody else's; raid when a sector is one estate short; build
//   evenly where a sector is whole; infect a sector when a capsule is spare; heal when the flesh runs low (in
//   somebody else's lab only when it is bad); buy freedom back as soon as possible; raise money for a debt from the
//   least useful things first and pay in flesh last. A manner (greed, building, caution) gives each hero a character.
// [RU] Соперники «Кровной ренты»: герои логова, которые торгуются как люди. Бот видит то же, что человек за столом
//   (поле, у всех кредиты, капсулы и плоть, колоды рубашкой вверх), и решает по нескольким честным правилам: держать
//   запас на ренты, что лежат на поле; покупать то, что по карману сверх запаса; платить больше за владение, которое
//   закрывает свой сектор или ломает чужой; устраивать рейд, когда сектору не хватает одного владения; строить ровно
//   там, где сектор целый; заражать сектор, когда есть лишняя капсула; лечиться, когда плоти мало (в чужой
//   лаборатории — только когда совсем плохо); выкупать свободу при первой возможности; на долг добывать деньги
//   сначала из самого ненужного, а плотью платить в последнюю очередь. Манера (жадность, стройка, осторожность) даёт
//   каждому герою характер.
// =====================================================================
import { ALIMONY_BUYOUT, BOARD, GATE_SQUARES, OWN_LAB_FEE, QUARANTINE_BAIL, RANSOM, SECTOR_SQUARES, TELEPORT_PRICE, buyPlasmaPrice } from '../rules.ts';
import {
  BID_STEP, canBuild, canInfect, canPawn, canRedeem, canSell, courtToll, isOwnable, modulePrice, ownsSector, priceOf, redeemPrice,
  rentOf, takeoverPrice, totalOf, type RentAction, type RentState,
} from '../game.ts';

export interface RentManner {
  /** 0–1: how eagerly the hero buys, bids and infects. */
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
    if (owner !== null && owner !== player && !state.infected[square]) danger = Math.max(danger, rentOf(state, square));
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

const mine = (state: RentState, me: number): number[] => state.owner.flatMap((owner, square) => (owner === me ? [square] : []));

/** One step to raise money: pawn a lone estate, then a gate, sell a capsule, sell a module, pawn the rest, then flesh. */
function raise(state: RentState, me: number): RentAction | null {
  const squares = mine(state, me);
  const cheapest = (list: number[]) => list.sort((a, b) => priceOf(a) - priceOf(b))[0];
  const lone = squares.filter(square => BOARD[square].kind === 'estate' && !ownsSector(state, square) && canPawn(state, square, me));
  if (lone.length > 0) return { type: 'pawn', square: cheapest(lone) };
  const gates = squares.filter(square => BOARD[square].kind === 'gate' && canPawn(state, square, me));
  if (gates.length > 0) return { type: 'pawn', square: gates[0] };
  if (state.players[me].plasma > 0) return { type: 'sellPlasma' };
  const sellable = squares.filter(square => canSell(state, square, me));
  if (sellable.length > 0) return { type: 'sell', square: sellable.sort((a, b) => modulePrice(a) - modulePrice(b))[0] };
  const rest = squares.filter(square => canPawn(state, square, me));
  if (rest.length > 0) return { type: 'pawn', square: cheapest(rest) };
  const player = state.players[me];
  if (player.corpse === null && player.bio > 10) return { type: 'flesh' };
  return null;
}

/** Freedom, alimony, redeeming, infecting and building — before the roll and at the end of the turn. */
function manage(state: RentState, me: number, manner: RentManner): RentAction | null {
  const player = state.players[me];
  const cash = player.cash;
  if (player.corpse !== null) return cash >= RANSOM ? { type: 'ransom' } : null;
  const reserve = reserveOf(state, me, manner);
  const lien = player.liens.find(() => cash - ALIMONY_BUYOUT >= reserve);
  if (lien !== undefined) return { type: 'buyout', owner: lien };
  const squares = mine(state, me);
  const redeem = squares.find(square => state.pawned[square] && canRedeem(state, square, me) && cash - redeemPrice(square) >= reserve * 1.4);
  if (redeem !== undefined) return { type: 'redeem', square: redeem };
  // [EN] A greedy hero infects a whole sector as soon as a capsule is spare (one is kept for a citadel when building is near).
  // [RU] Жадный герой заражает целый сектор, как только есть лишняя капсула (одну держит для цитадели, когда стройка близко).
  const infect = squares.find(square => canInfect(state, square, me));
  const nearCitadel = squares.some(square => state.level[square] >= 3);
  if (infect !== undefined && manner.greed >= 0.35 && (player.plasma >= 2 || !nearCitadel)) return { type: 'infect', square: infect };
  const buildable = squares.filter(square => canBuild(state, square, me));
  // [EN] The dearest sector first: its rent grows most. [RU] Сначала самый дорогой сектор: его рента растёт сильнее всего.
  buildable.sort((a, b) => priceOf(b) - priceOf(a));
  const margin = reserve * (1.25 - manner.building * 0.6);
  const build = buildable.find(square => cash - modulePrice(square) >= margin);
  return build === undefined ? null : { type: 'build', square: build };
}

/** The unowned estate that would complete one of the player's sectors, if any (for the spaceport). */
function completingSquare(state: RentState, me: number): number | null {
  for (const squares of Object.values(SECTOR_SQUARES)) {
    const open = squares.filter(square => state.owner[square] === null);
    if (open.length === 1 && squares.every(square => square === open[0] || state.owner[square] === me)) return open[0];
  }
  return null;
}

/** The decision of the bot whose decision the game waits for. */
export function chooseRentAction(state: RentState, manner: RentManner = PLAIN_MANNER): RentAction {
  const phase = state.phase;
  const me = phase.kind === 'auction' ? phase.bidders[phase.at] : state.turn;
  const player = state.players[me];
  const cash = player.cash;
  const corpse = player.corpse !== null;
  const reserve = reserveOf(state, me, manner);
  switch (phase.kind) {
    case 'debt':
      if (cash >= totalOf(phase.debts)) return { type: 'pay' };
      return raise(state, me) ?? { type: 'bankrupt' };
    case 'auction': {
      const ceiling = Math.min(worthTo(state, me, phase.square, manner), cash - Math.round(reserve / 2));
      const next = phase.bid + BID_STEP;
      if (next > ceiling) return { type: 'pass' };
      // [EN] Far below its worth the bot jumps; near it, it creeps. [RU] Далеко от цены бот прыгает, вблизи — крадётся.
      const jump = ceiling - phase.bid > 150 ? Math.max(next, Math.round((phase.bid + (ceiling - phase.bid) / 3) / BID_STEP) * BID_STEP) : next;
      return { type: 'bid', amount: Math.min(jump, ceiling) };
    }
    case 'buy': {
      if (corpse) return { type: 'decline' };
      const price = priceOf(phase.square);
      const keep = worthTo(state, me, phase.square, manner) > price * 1.6 ? reserve * 0.3 : reserve;
      return cash - price >= keep ? { type: 'buy' } : { type: 'decline' };
    }
    case 'takeover':
      // [EN] A whole sector is worth paying twice for, while the reserve holds. [RU] Целый сектор стоит двойной цены, пока держится запас.
      return cash - takeoverPrice(phase.square) >= reserve * (0.9 - manner.greed * 0.5) ? { type: 'takeover' } : { type: 'skip' };
    case 'lab': {
      const own = state.owner[phase.square] === me;
      if (own) return player.bio <= 75 && cash >= OWN_LAB_FEE ? { type: 'heal' } : { type: 'skip' };
      return player.bio <= 40 || (player.bio <= 60 && player.liens.includes(state.owner[phase.square] as number)) ? { type: 'heal' } : { type: 'skip' };
    }
    case 'market': {
      if (cash < reserve * 0.5 && player.plasma > 0) return { type: 'sellPlasma' };
      const wanted = 1 + (mine(state, me).some(square => canInfect(state, square, me) || state.level[square] >= 3) ? 1 : 0);
      if (!corpse && player.plasma < wanted && cash - buyPlasmaPrice(state.infection) >= reserve * 1.2) return { type: 'buyPlasma' };
      return { type: 'skip' };
    }
    case 'cruiser':
      return corpse || player.bio > 45 + manner.caution * 20 ? { type: 'risk' } : { type: 'skip' };
    case 'spaceport': {
      const target = completingSquare(state, me);
      if (!corpse && target !== null && cash - TELEPORT_PRICE - priceOf(target) >= reserve * 0.5) return { type: 'teleport', square: target };
      return { type: 'skip' };
    }
    case 'court':
      return !corpse && player.bio > 40 && courtToll(state, me) > 150 ? { type: 'court', choice: 'flesh' } : { type: 'court', choice: 'credits' };
    case 'quarantine': {
      // [EN] While much is still for sale, walking matters; later the ward is a safe place to wait.
      // [RU] Пока многое ещё продаётся, важно ходить; позже изолятор — безопасное место, чтобы переждать.
      const forSale = state.owner.filter((owner, square) => owner === null && isOwnable(square)).length;
      if (forSale >= 6) {
        if (player.passes > 0) return { type: 'leave', how: 'card' };
        if (player.plasma >= 2) return { type: 'leave', how: 'capsule' };
        if (cash - QUARANTINE_BAIL >= reserve) return { type: 'leave', how: 'credits' };
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

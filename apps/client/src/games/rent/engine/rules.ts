// =====================================================================
// FILE: apps/client/src/games/rent/engine/rules.ts
// PURPOSE: «Blood Rent» («Кровная рента») — our own trading board game in a cosmic horror: a derelict star sector
//   after a bio-infection, where the lair's company buys up dead stations and wrecks for credits. The board, the
//   sectors and their estates, the jump gates, the two decks («Bloody Chance» and «Infection») and the table
//   options, as plain data. The genre (dice, buying, rent, buildings) is old and free; the board, the names, the
//   numbers and the cards are ours — this is not a copy of any boxed game. The look follows Alexey's prompts of
//   11.11.2026 (a tactical holographic panel of a starship with the traces of an infection).
//   The board is a ring of 32 squares. Four corners: the Beacon (the start: a salary for every pass), Cryo (you are
//   frozen), the Drift (it takes the cup of fines) and the Solar Flare (hide behind the shield: pay, or go into cryo
//   — the vampires of the lair fear starlight). Between them seven sectors of estates (19 in all), four jump gates,
//   four card bays (two of each deck) and the port fee.
//   Prices grow around the ring; the rent of an estate comes from its price by one formula (rentTable), so every
//   number is explained and nothing is copied.
// [RU] «Кровная рента» — наша собственная торговая настольная игра в космическом хорроре: заброшенный звёздный
//   сектор после биозаражения, где компания логова скупает за кредиты мёртвые станции и разбитые корабли. Поле,
//   секторы и их владения, врата прыжка, две колоды («Кровавый шанс» и «Заражение») и опции стола — обычные данные.
//   Жанр (кубики, покупка, рента, постройки) старый и свободный; поле, названия, числа и карточки — наши, это не
//   копия чьей-либо коробочной игры. Вид — по промптам Алексея от 11.11.2026 (тактическая голографическая панель
//   звездолёта со следами заражения).
//   Поле — кольцо из 32 клеток. Четыре угла: Маяк (старт: жалованье за каждый проход), Криокамера (вас заморозили),
//   Дрейф (забирает кубок штрафов) и Вспышка звезды (спрячьтесь за щитом: заплатите или ложитесь в криокамеру —
//   вампиры логова боятся звёздного света). Между ними семь секторов владений (всего 19), четверо врат прыжка, четыре
//   отсека карт (по два каждой колоды) и портовый сбор.
//   Цены растут по кругу; рента владения выводится из цены одной формулой (rentTable), поэтому каждое число
//   объяснено и ничего не скопировано.
// SECTIONS: 1 squares; 2 the board; 3 rents; 4 the decks; 5 options.
// =====================================================================

// BEGIN 1. Squares
export type SectorId = 'scrapyard' | 'cryoprison' | 'wrecks' | 'plasma' | 'biolab' | 'pleasure' | 'flagship';
export type CornerId = 'beacon' | 'cryo' | 'drift' | 'flare';
export type DeckId = 'chance' | 'infection';

export type Square =
  | { readonly kind: 'corner'; readonly id: CornerId }
  | { readonly kind: 'estate'; readonly id: string; readonly sector: SectorId; readonly price: number }
  | { readonly kind: 'gate'; readonly id: string; readonly price: number }
  | { readonly kind: 'card'; readonly deck: DeckId }
  | { readonly kind: 'due'; readonly id: 'portFee'; readonly amount: number };
// END 1

// BEGIN 2. The board
const estate = (id: string, sector: SectorId, price: number): Square => ({ kind: 'estate', id, sector, price });
const gate = (id: string): Square => ({ kind: 'gate', id, price: 180 });
const CHANCE: Square = Object.freeze({ kind: 'card', deck: 'chance' });
const INFECTION: Square = Object.freeze({ kind: 'card', deck: 'infection' });

/** The 32 squares, clockwise from the Beacon. */
export const BOARD: readonly Square[] = Object.freeze([
  { kind: 'corner', id: 'beacon' },
  estate('rustyBuoy', 'scrapyard', 50),
  CHANCE,
  estate('watchProbe', 'scrapyard', 70),
  { kind: 'due', id: 'portFee', amount: 100 },
  gate('orionGate'),
  estate('freezeBlock', 'cryoprison', 110),
  estate('podGallery', 'cryoprison', 110),
  { kind: 'corner', id: 'cryo' },
  estate('iceCell', 'cryoprison', 130),
  estate('ghostShip', 'wrecks', 150),
  INFECTION,
  estate('brokenCruiser', 'wrecks', 150),
  estate('blackBox', 'wrecks', 170),
  gate('cassiopeiaGate'),
  estate('plasmaFurnace', 'plasma', 190),
  { kind: 'corner', id: 'drift' },
  estate('reactorHall', 'plasma', 190),
  estate('coolingTower', 'plasma', 210),
  CHANCE,
  estate('incubator', 'biolab', 230),
  estate('sporeGarden', 'biolab', 230),
  gate('andromedaGate'),
  estate('parasiteHive', 'biolab', 250),
  { kind: 'corner', id: 'flare' },
  estate('nebulaCasino', 'pleasure', 270),
  estate('airlockBar', 'pleasure', 270),
  INFECTION,
  estate('holoTheatre', 'pleasure', 290),
  gate('lyraGate'),
  estate('admiralBridge', 'flagship', 340),
  estate('flagshipThrone', 'flagship', 380),
] as Square[]);

export const BOARD_SIZE = BOARD.length;
export const BEACON = 0;
export const CRYO = 8;
export const DRIFT = 16;
export const FLARE = 24;

export const SECTORS: readonly SectorId[] = Object.freeze(['scrapyard', 'cryoprison', 'wrecks', 'plasma', 'biolab', 'pleasure', 'flagship']);
/** The squares of each sector. */
export const SECTOR_SQUARES: Readonly<Record<SectorId, readonly number[]>> = Object.freeze(
  Object.fromEntries(SECTORS.map(sector => [sector, BOARD.flatMap((square, index) => (square.kind === 'estate' && square.sector === sector ? [index] : []))])) as Record<SectorId, number[]>,
);
export const GATE_SQUARES: readonly number[] = Object.freeze(BOARD.flatMap((square, index) => (square.kind === 'gate' ? [index] : [])));
/** The price of a module (a building) by the sector. */
export const MODULE_PRICE: Readonly<Record<SectorId, number>> = Object.freeze({
  scrapyard: 40, cryoprison: 60, wrecks: 90, plasma: 110, biolab: 140, pleasure: 160, flagship: 190,
});
/** Four modules, then the fifth level: a citadel. */
export const CITADEL = 5;
// END 2

// BEGIN 3. Rents
const roundTo5 = (value: number): number => Math.max(5, Math.round(value / 5) * 5);
/**
 * The rent of an estate at each level: [bare, 1–4 modules, citadel]. A bare estate of a whole sector (all of it
 * owned by one player) takes double. Our own formula: a tenth of the price for a bare estate, then the buildings
 * multiply it (×5, ×15, ×40, ×55, ×70).
 */
export function rentTable(price: number): readonly number[] {
  const base = Math.max(2, Math.round(price / 10));
  return [base, ...[5, 15, 40, 55, 70].map(factor => roundTo5(base * factor))];
}
/** The rent of the jump gates by how many of them one player owns. */
export const GATE_RENT: readonly number[] = Object.freeze([0, 20, 45, 90, 180]);
// END 3

// BEGIN 4. The decks
export type CardEffect =
  | { readonly kind: 'moveTo'; readonly square: number }
  | { readonly kind: 'moveBy'; readonly steps: number }
  | { readonly kind: 'nearestGate' }
  | { readonly kind: 'cryo' }
  | { readonly kind: 'key' }
  | { readonly kind: 'gain'; readonly amount: number }
  | { readonly kind: 'pay'; readonly amount: number }
  | { readonly kind: 'fromEach'; readonly amount: number }
  | { readonly kind: 'toEach'; readonly amount: number }
  | { readonly kind: 'repairs'; readonly perModule: number; readonly perCitadel: number };

export interface Card { readonly id: string; readonly effect: CardEffect }

/** «Bloody Chance»: jumps across the sector and sudden money. */
const CHANCE_CARDS: readonly Card[] = [
  { id: 'toBeacon', effect: { kind: 'moveTo', square: BEACON } },
  { id: 'frozen', effect: { kind: 'cryo' } },
  { id: 'thawCode', effect: { kind: 'key' } },
  { id: 'back3', effect: { kind: 'moveBy', steps: -3 } },
  { id: 'nearestGate', effect: { kind: 'nearestGate' } },
  { id: 'toThrone', effect: { kind: 'moveTo', square: 31 } },
  { id: 'toGhostShip', effect: { kind: 'moveTo', square: 10 } },
  { id: 'casinoWin', effect: { kind: 'gain', amount: 50 } },
  { id: 'salvage', effect: { kind: 'gain', amount: 150 } },
  { id: 'toast', effect: { kind: 'fromEach', amount: 20 } },
];
/** «Infection»: the plague of the sector — treatment, quarantine, decontamination, and a rare cure. */
const INFECTION_CARDS: readonly Card[] = [
  { id: 'decontamination', effect: { kind: 'repairs', perModule: 25, perCitadel: 100 } },
  { id: 'medbay', effect: { kind: 'pay', amount: 50 } },
  { id: 'quarantineFine', effect: { kind: 'pay', amount: 15 } },
  { id: 'vaccinePatent', effect: { kind: 'gain', amount: 100 } },
  { id: 'insurance', effect: { kind: 'gain', amount: 40 } },
  { id: 'carrier', effect: { kind: 'toEach', amount: 25 } },
  { id: 'outbreak', effect: { kind: 'cryo' } },
  { id: 'antidote', effect: { kind: 'key' } },
  { id: 'evacuation', effect: { kind: 'moveTo', square: BEACON } },
  { id: 'mutation', effect: { kind: 'moveBy', steps: -2 } },
];
export const DECKS: Readonly<Record<DeckId, readonly Card[]>> = Object.freeze({ chance: CHANCE_CARDS, infection: INFECTION_CARDS });
// END 4

// BEGIN 5. Options
export interface RentOptions {
  readonly startCash: number;
  /** Paid at every pass of the Beacon. */
  readonly salary: number;
  /** The port fee, fines and the Flare's price go into the cup, and the Drift takes it; off — they go to the bank. */
  readonly cup: boolean;
  /** An estate nobody buys goes to auction. */
  readonly auction: boolean;
  /** After this many rounds the richest wins; 0 — until one is left. */
  readonly roundLimit: number;
  /** The price of leaving cryo, and of hiding from the Flare. */
  readonly bail: number;
  /**
   * A takeover: who owns all of a sector but one estate and stands on that estate (after paying the rent) may buy it
   * out of its owner at twice its price. Our own rule: without trading at the table a whole sector would rarely form.
   */
  readonly takeover: boolean;
}
export const DEFAULT_OPTIONS: RentOptions = Object.freeze({ startCash: 1200, salary: 150, cup: true, auction: true, roundLimit: 0, bail: 50, takeover: true });
/** The takeover costs this many prices of the estate. */
export const TAKEOVER_FACTOR = 2;
// END 5

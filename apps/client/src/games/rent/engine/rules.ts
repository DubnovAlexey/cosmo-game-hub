// =====================================================================
// FILE: apps/client/src/games/rent/engine/rules.ts
// PURPOSE: «Blood Rent» («Кровная рента») — our own trading board game in a cosmic horror: a derelict star sector
//   after a bio-infection, where the lair's company buys up dead stations and wrecks. The economy follows Alexey's
//   design of 11.11.2026 with three resources:
//   - credits — the money of the Syndicate: buying, rent, fees;
//   - plasma capsules — the elite bio-resource: a citadel needs one, infecting a sector needs one; their price in
//     credits floats with the infection of the station;
//   - bio-integrity — the player's own body, 100% at the start: paid in flesh when the money is gone, healed in the
//     bio-labs; at 0% the player becomes a Debtor-Corpse, the puppet of the one who drained them.
//   The station's infection (0–100) rises by itself every round and with every «Infection» card and infected
//   sector; at 100 the station collapses and the richest wins.
//   The board, the names, the numbers and the cards are ours — the genre (dice, buying, rent, buildings) is old
//   and free; this is not a copy of any boxed game.
//   The ring has 32 squares. Corners: the Survival Airlock (the start: a salary and a dose of radiation for every
//   pass), the Quarantine Ward, the Black Market of Organs and the Inquisition Court. Special squares: the
//   Abandoned Cruiser (an anomaly: a gamble), the Abyss Spaceport (a teleport for credits), the Oxygen Tax. Seven
//   sectors of estates (19 in all), three jump gates, three card bays («Bloody Chance» and «Infection» twice).
// [RU] «Кровная рента» — наша собственная торговая настольная игра в космическом хорроре: заброшенный звёздный
//   сектор после биозаражения, где компания логова скупает мёртвые станции и разбитые корабли. Экономика — по
//   замыслу Алексея от 11.11.2026, с тремя ресурсами:
//   - кредиты — деньги Синдиката: покупка, рента, сборы;
//   - капсулы плазмы — элитный биоресурс: цитадели нужна капсула, заражению сектора — капсула; их цена в кредитах
//     плавает вместе с заражением станции;
//   - биоцелостность — собственное тело игрока, 100% на старте: когда кончились деньги, платят плотью, лечатся в
//     биолабораториях; при 0% игрок становится Трупом-должником, марионеткой того, кто его иссушил.
//   Заражение станции (0–100) растёт само каждый круг и с каждой картой «Заражения» и каждым заражённым сектором;
//   при 100 станция рушится, и побеждает самый богатый.
//   Поле, названия, числа и карточки — наши; жанр (кубики, покупка, рента, постройки) старый и свободный; это не
//   копия чьей-либо коробочной игры.
//   Кольцо из 32 клеток. Углы: Шлюз выживания (старт: жалованье и доза радиации за каждый проход), Карантинный
//   изолятор, Чёрный рынок органов и Суд инквизиции. Особые клетки: Заброшенный крейсер (аномалия: риск), Космопорт
//   Бездны (телепорт за кредиты), Налог на кислород. Семь секторов владений (всего 19), трое врат прыжка, три отсека
//   карт («Кровавый шанс» и дважды «Заражение»).
// SECTIONS: 1 squares; 2 the board; 3 rents and prices; 4 the three resources; 5 the decks; 6 options.
// =====================================================================

// BEGIN 1. Squares
export type SectorId = 'scrapyard' | 'cryoprison' | 'wrecks' | 'plasma' | 'biolab' | 'pleasure' | 'flagship';
export type CornerId = 'airlock' | 'quarantine' | 'market' | 'court';
export type DeckId = 'chance' | 'infection';

export type Square =
  | { readonly kind: 'corner'; readonly id: CornerId }
  | { readonly kind: 'estate'; readonly id: string; readonly sector: SectorId; readonly price: number }
  | { readonly kind: 'gate'; readonly id: string; readonly price: number }
  | { readonly kind: 'card'; readonly deck: DeckId }
  | { readonly kind: 'due'; readonly id: 'oxygenTax'; readonly amount: number }
  | { readonly kind: 'cruiser' }
  | { readonly kind: 'spaceport' };
// END 1

// BEGIN 2. The board
const estate = (id: string, sector: SectorId, price: number): Square => ({ kind: 'estate', id, sector, price });
const gate = (id: string): Square => ({ kind: 'gate', id, price: 180 });

/** The 32 squares, clockwise from the Survival Airlock. */
export const BOARD: readonly Square[] = Object.freeze([
  { kind: 'corner', id: 'airlock' },
  estate('rustyBuoy', 'scrapyard', 50),
  { kind: 'card', deck: 'chance' },
  estate('watchProbe', 'scrapyard', 70),
  { kind: 'due', id: 'oxygenTax', amount: 100 },
  gate('orionGate'),
  estate('freezeBlock', 'cryoprison', 110),
  estate('podGallery', 'cryoprison', 110),
  { kind: 'corner', id: 'quarantine' },
  estate('iceCell', 'cryoprison', 130),
  estate('ghostShip', 'wrecks', 150),
  { kind: 'card', deck: 'infection' },
  estate('brokenCruiser', 'wrecks', 150),
  estate('blackBox', 'wrecks', 170),
  gate('cassiopeiaGate'),
  estate('plasmaFurnace', 'plasma', 190),
  { kind: 'corner', id: 'market' },
  estate('reactorHall', 'plasma', 190),
  estate('coolingTower', 'plasma', 210),
  { kind: 'cruiser' },
  estate('incubator', 'biolab', 230),
  estate('sporeGarden', 'biolab', 230),
  { kind: 'spaceport' },
  estate('parasiteHive', 'biolab', 250),
  { kind: 'corner', id: 'court' },
  estate('nebulaCasino', 'pleasure', 270),
  estate('airlockBar', 'pleasure', 270),
  { kind: 'card', deck: 'infection' },
  estate('holoTheatre', 'pleasure', 290),
  gate('lyraGate'),
  estate('admiralBridge', 'flagship', 340),
  estate('flagshipThrone', 'flagship', 380),
] as Square[]);

export const BOARD_SIZE = BOARD.length;
export const AIRLOCK = 0;
export const QUARANTINE = 8;
export const MARKET = 16;
export const CRUISER = 19;
export const SPACEPORT = 22;
export const COURT = 24;

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
/** Four modules, then the fifth level: a citadel (it needs a plasma capsule besides the credits). */
export const CITADEL = 5;
// END 2

// BEGIN 3. Rents and prices
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
export const GATE_RENT: readonly number[] = Object.freeze([0, 25, 60, 140]);
/** A raid: who owns all of a sector but one estate and stands on it may buy it out at this many prices. */
export const TAKEOVER_FACTOR = 2;
/** The price of the Abyss Spaceport's teleport, and of the Oxygen Tax is on the board. */
export const TELEPORT_PRICE = 100;
/** The Inquisition Court takes a tenth of a player's worth in credits — or this much bio-integrity. */
export const COURT_SHARE = 0.1;
export const COURT_FLESH = 15;
// END 3

// BEGIN 4. The three resources
export const START_PLASMA = 1;
export const START_BIO = 100;
/** Every pass of the Airlock costs this much bio-integrity: the radiation of the open space. */
export const RADIATION = 5;
/** Paying in flesh: this many percent of bio-integrity bring this many credits. */
export const FLESH_STEP = 10;
export const FLESH_PRICE = 150;
/** A bio-lab heals this much; one's own lab takes a fee, somebody else's lab takes bio-alimony. */
export const HEAL = 25;
export const OWN_LAB_FEE = 40;
/** Bio-alimony: this share of every income goes to the owner of the lab, until the genetic code is bought out. */
export const ALIMONY_SHARE = 0.1;
export const ALIMONY_BUYOUT = 200;
/** A Debtor-Corpse buys freedom back for this many credits and wakes with this much bio-integrity. */
export const RANSOM = 600;
export const REVIVED_BIO = 25;
/** The ways out of the Quarantine Ward besides a double and a pass: credits, a capsule, or flesh. */
export const QUARANTINE_BAIL = 50;
export const QUARANTINE_FLESH = 15;
/** The Abandoned Cruiser: a die of 4–6 finds capsules, 1–3 costs flesh. */
export const CRUISER_FIND = 2;
export const CRUISER_WOUND = 25;
/** The station's infection: where it starts, how it grows, where the station collapses. */
export const INFECTION_START = 5;
export const INFECTION_PER_ROUND = 1;
export const INFECTION_PER_CARD = 2;
export const INFECTION_PER_SECTOR = 4;
export const INFECTION_CURE = 10;
export const COLLAPSE = 100;
/** A capsule of plasma in credits: dearer as the station sickens. The market buys a tenth cheaper and sells a tenth dearer. */
export const plasmaRate = (infection: number): number => 250 + 5 * Math.max(0, Math.min(COLLAPSE, infection));
export const buyPlasmaPrice = (infection: number): number => Math.ceil(plasmaRate(infection) * 1.1);
export const sellPlasmaPrice = (infection: number): number => Math.floor(plasmaRate(infection) * 0.9);
/** The rent of an infected estate in percent of the visitor's bio-integrity: its rent in credits at the flesh rate. */
export const infectedRent = (credits: number): number => Math.max(5, Math.min(30, Math.round((credits * FLESH_STEP) / FLESH_PRICE)));
// END 4

// BEGIN 5. The decks
export type CardEffect =
  | { readonly kind: 'moveTo'; readonly square: number }
  | { readonly kind: 'moveBy'; readonly steps: number }
  | { readonly kind: 'nearestGate' }
  | { readonly kind: 'quarantine' }
  | { readonly kind: 'pass' }
  | { readonly kind: 'gain'; readonly amount: number }
  | { readonly kind: 'pay'; readonly amount: number }
  | { readonly kind: 'fromEach'; readonly amount: number }
  | { readonly kind: 'toEach'; readonly amount: number }
  | { readonly kind: 'repairs'; readonly perModule: number; readonly perCitadel: number }
  | { readonly kind: 'plasma'; readonly amount: number }
  | { readonly kind: 'wound'; readonly percent: number }
  | { readonly kind: 'cure'; readonly amount: number };

export interface Card { readonly id: string; readonly effect: CardEffect }

/** «Bloody Chance»: jumps across the sector and sudden fortunes. */
const CHANCE_CARDS: readonly Card[] = [
  { id: 'toAirlock', effect: { kind: 'moveTo', square: AIRLOCK } },
  { id: 'detained', effect: { kind: 'quarantine' } },
  { id: 'pass', effect: { kind: 'pass' } },
  { id: 'back3', effect: { kind: 'moveBy', steps: -3 } },
  { id: 'nearestGate', effect: { kind: 'nearestGate' } },
  { id: 'toThrone', effect: { kind: 'moveTo', square: 31 } },
  { id: 'toGhostShip', effect: { kind: 'moveTo', square: 10 } },
  { id: 'casinoWin', effect: { kind: 'gain', amount: 50 } },
  { id: 'salvage', effect: { kind: 'plasma', amount: 1 } },
  { id: 'toast', effect: { kind: 'fromEach', amount: 20 } },
];
/** «Infection»: the plague of the sector — treatment, quarantine, decontamination, and a rare cure. Each one drawn makes the station sicker. */
const INFECTION_CARDS: readonly Card[] = [
  { id: 'decontamination', effect: { kind: 'repairs', perModule: 25, perCitadel: 100 } },
  { id: 'medbay', effect: { kind: 'pay', amount: 50 } },
  { id: 'quarantineFine', effect: { kind: 'pay', amount: 15 } },
  { id: 'vaccinePatent', effect: { kind: 'cure', amount: 100 } },
  { id: 'insurance', effect: { kind: 'gain', amount: 40 } },
  { id: 'carrier', effect: { kind: 'toEach', amount: 25 } },
  { id: 'outbreak', effect: { kind: 'quarantine' } },
  { id: 'antidote', effect: { kind: 'pass' } },
  { id: 'flare', effect: { kind: 'wound', percent: 10 } },
  { id: 'mutation', effect: { kind: 'moveBy', steps: -2 } },
];
export const DECKS: Readonly<Record<DeckId, readonly Card[]>> = Object.freeze({ chance: CHANCE_CARDS, infection: INFECTION_CARDS });
// END 5

// BEGIN 6. Options
export interface RentOptions {
  readonly startCash: number;
  /** Paid at every pass of the Airlock. */
  readonly salary: number;
  /** An estate nobody buys goes to auction. */
  readonly auction: boolean;
  /** Raids: see TAKEOVER_FACTOR. Our own rule: without trading at the table a whole sector would rarely form. */
  readonly takeover: boolean;
  /** After this many rounds the richest wins; 0 — until the station collapses or one free player is left. */
  readonly roundLimit: number;
}
export const DEFAULT_OPTIONS: RentOptions = Object.freeze({ startCash: 1200, salary: 150, auction: true, takeover: true, roundLimit: 0 });
// END 6

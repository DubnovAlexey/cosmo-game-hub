// =====================================================================
// FILE: apps/client/src/games/preferans/characters/roster.ts
// PURPOSE: how the company of the lair plays preferans, and who sits at the table against you. Who the characters
//   are (dweller or guest, gender, picture) is shared by all the games of the hub — shared/characters/roster.ts;
//   their names and biographies — shared/characters/texts. Here is only the manner at the preferans table: how
//   boldly each one bids, how eagerly it whists, how it loves misère, how long it thinks. Every new pool seats a
//   different company. Pure data without React and without pictures, so the Node tests use it too.
// =====================================================================

import type { BotStyle } from '../engine/index.ts';
// [EN] A relative path on purpose: Node runs the tests directly and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает тесты напрямую и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { characterFacts, portraitFocus, portraitPath, type CharacterId } from '../../../shared/characters/roster.ts';

export { portraitFocus, portraitPath, type CharacterId };

// BEGIN 1. The company
export interface CharacterInfo {
  readonly id: CharacterId;
  /** Grammatical gender of the sentences about this character (Russian and Hebrew verbs agree with it). */
  readonly female: boolean;
  /** A guest from a neighbouring world rather than a dweller of the lair (the orange pictures). */
  readonly guest: boolean;
  /** Manner at the table: how boldly it bids, how eagerly it whists, how it loves misère (engine/ai/bot.ts). */
  readonly style: BotStyle;
  /** How long it thinks over a card: samples and time of the bot strength are multiplied by this (0.7…1.4). */
  readonly effort: number;
}

/** [boldness, whistCaution, misereNerve, effort] — see CharacterInfo. */
type Manner = readonly [number, number, number, number];
const manner = (id: CharacterId, [boldness, whistCaution, misereNerve, effort]: Manner): CharacterInfo =>
  Object.freeze({ id, ...characterFacts(id), style: Object.freeze({ boldness, whistCaution, misereNerve }), effort });

// [EN] Each manner follows the biography: impatient Carmilla bids high, deathless Koschei thinks for ages, the
//      accountant Mortimer whists only by calculation, Count Vlad and Georges love misère, Snezhana is cold in all.
// [RU] Каждая манера следует биографии: нетерпеливая Кармилла заявляет высоко, бессмертный Кощей думает вечность,
//      бухгалтер Мортимер вистует только по расчёту, Граф Влад и Жорж обожают мизер, Снежана холодна во всём.
export const ROSTER: readonly CharacterInfo[] = Object.freeze([
  manner('upyr', [-0.2, 1.1, 0, 1]),
  manner('sebastian', [0, 0.95, 0, 1.1]),
  manner('rosalind', [0.1, 0.85, 0, 1]),
  manner('ada', [0, 0.9, 1, 1]),
  manner('vlad', [-0.1, 1, 2, 1.2]),
  manner('lucretia', [0.2, 0.8, 0, 1]),
  manner('isolde', [-0.1, 1, 0, 1.2]),
  manner('tadeusz', [0, 1.05, 1, 0.9]),
  manner('gunther', [0.45, 0.9, 1, 0.8]),
  manner('koschei', [-0.2, 1.1, 0, 1.4]),
  manner('vurdalak', [0.1, 0.85, 0, 0.9]),
  manner('mortimer', [-0.15, 1.15, 0, 1.3]),
  manner('abraxas', [0, 1, 1, 1.4]),
  manner('netopyr', [0.35, 0.8, 0, 0.7]),
  manner('greta', [-0.1, 1.05, 0, 1]),
  manner('morana', [0, 0.85, 0, 1.1]),
  manner('snezhana', [-0.3, 1.2, 0, 1.1]),
  manner('carmilla', [0.5, 0.9, 1, 0.8]),
  manner('balthazar', [0.25, 1, 1, 1]),
  manner('lorenzo', [0.1, 0.95, 0, 1.1]),
  manner('vual', [0.3, 0.95, 0, 1.1]),
  manner('beatrice', [0, 1.0, 1, 1.0]),
  manner('morwenna', [-0.15, 1.05, 0, 1.25]),
  manner('irma', [0.2, 0.82, 0, 1.0]),
  manner('ivy', [-0.25, 1.1, 0, 1.4]),
  manner('lamplighter', [0.4, 0.9, 1, 1.0]),
  manner('albina', [0.25, 0.85, 0, 0.9]),
  manner('lacrima', [-0.1, 1.05, 0, 1.1]),
  manner('sangria', [0.3, 0.9, 1, 0.9]),
  manner('selena', [0, 1.0, 0, 1.2]),
  manner('skuka', [-0.05, 1.0, 2, 1.0]),
  manner('mgla', [0.35, 0.85, 1, 0.8]),
  manner('valentin', [0.3, 0.9, 0, 0.8]),
  manner('pietro', [0.4, 0.8, 1, 0.75]),
  manner('kenji', [0, 1.0, 0, 1.3]),
  manner('octavian', [-0.1, 1.05, 2, 1.2]),
  manner('benedict', [0.25, 0.9, 1, 0.9]),
  manner('akvarella', [0.15, 0.9, 0, 1.0]),
  manner('skvoznyak', [-0.15, 1.1, 0, 1.2]),
  manner('melisande', [-0.05, 1.0, 0, 1.1]),
  manner('belladonna', [0.15, 0.85, 0, 1.0]),
  manner('cassandra', [0.1, 0.9, 1, 1.0]),
  manner('tobias', [0.2, 0.95, 1, 0.85]),
  manner('aurelia', [0, 1.05, 0, 1.1]),
  manner('morrigan', [0.35, 0.85, 1, 0.85]),
  manner('elza', [-0.15, 1.1, 0, 1.2]),
  manner('polunoch', [0.25, 0.9, 1, 0.8]),
  manner('shadow', [-0.2, 1.05, 0, 1.0]),
  manner('gadyuka', [0.4, 0.8, 0, 0.8]),
  manner('sobor', [-0.1, 1.05, 0, 1.4]),
  manner('crystal', [0, 1.0, 0, 1.1]),
  manner('stilet', [0.15, 0.9, 0, 1.0]),
  manner('rosa', [0.2, 0.85, 1, 1.0]),
  manner('berta', [0.3, 1, 0, 1]),
  manner('zhorzh', [0, 1, 2, 0.8]),
  manner('mortus', [-0.2, 1.1, 0, 1.4]),
  manner('lyuska', [0.4, 0.8, 1, 0.8]),
  manner('mara', [-0.1, 1, 1, 1.2]),
  manner('oktaedr', [0, 0.95, 0, 1.3]),
  manner('helga', [0.1, 1, 0, 1.2]),
  manner('morg', [0, 0.85, 0, 1]),
  manner('agrippina', [0.2, 0.85, 1, 0.9]),
  manner('sergeant', [-0.1, 1.1, 0, 1]),
  manner('klyuv', [0.15, 0.95, 0, 1.1]),
  manner('dlan', [0.3, 0.9, 1, 0.9]),
  manner('edgar', [-0.25, 1.15, 0, 1]),
  manner('lilith', [0.35, 0.85, 1, 1]),
  manner('xenon', [0.4, 1, 0, 1.1]),
  manner('chuzhak', [0.1, 0.8, 0, 0.9]),
  manner('khitin', [-0.1, 1.1, 0, 1.3]),
  manner('semyonych', [0.15, 0.9, 2, 0.8]),
  manner('kage', [0.1, 1.0, 0, 1.2]),
  manner('florian', [0.05, 0.95, 1, 1.1]),
  manner('neon', [0.45, 0.85, 0, 0.7]),
  manner('glyuk', [0.3, 0.9, 0, 0.7]),
  manner('astral', [-0.1, 1.05, 1, 1.4]),
  manner('herbarium', [-0.3, 1.15, 0, 1.1]),
  manner('deco', [0.2, 0.95, 1, 1.0]),
  manner('bes', [0.5, 0.85, 0, 0.7]),
  manner('banshee', [0.3, 0.9, 0, 0.8]),
  manner('miko', [-0.05, 1.0, 1, 1.2]),
  manner('tryasina', [0.3, 0.85, 1, 0.9]),
  manner('agafon', [0.1, 0.95, 0, 1.3]),
  manner('plakalshchitsa', [-0.2, 1.1, 0, 1.2]),
  manner('fantom', [0.1, 0.95, 1, 1.0]),
  manner('nebula', [0.35, 0.9, 2, 0.9]),
  manner('undina', [-0.1, 1.0, 0, 1.1]),
  manner('okun', [0.2, 0.8, 0, 0.8]),
  manner('gora', [-0.3, 1.15, 0, 1.4]),
  manner('kaznachey', [0.1, 1.0, 0, 1.2]),
  manner('galeon', [0.45, 0.9, 0, 0.8]),
  // [EN] The crew of the sea battle (11.11.2026): Redeye squints at the talon for ages, Strongbox hoards and risks
  //      nothing, Tide comes and goes (and loves a misère), Old Grapnel boards every auction.
  // [RU] Команда морского боя (11.11.2026): Красноглаз вечно щурится на прикуп, Сундук копит и ничем не рискует,
  //      Прилив приходит и уходит (и любит мизер), Старик Абордаж берёт на абордаж любую торговлю.
  manner('krasnoglaz', [0.25, 0.9, 0, 1.3]),
  manner('sunduk', [-0.25, 1.15, 0, 1.2]),
  manner('priliv', [0.1, 0.95, 1, 1.0]),
  manner('abordazh', [0.45, 0.85, 0, 0.8]),
  // [EN] The necromancers of the catacombs (11.11.2026): Anselm argues every whist, Mordecai remembers every card
  //      for ages, Ulrich obeys his crow and bids too high, Queen Ingrid plays only to win, the Lady of the Churchyard
  //      reads out the rules and loves a misère.
  // [RU] Некроманты катакомб (11.11.2026): Ансельм спорит из-за каждого виста, Мордехай вечно помнит каждую карту,
  //      Ульрих слушается ворона и заказывает лишнее, королева Ингрид играет только на победу, Госпожа Погоста читает
  //      правила вслух и любит мизер.
  manner('anselm', [0.05, 1.05, 0, 1.1]),
  manner('mordecai', [-0.1, 1.1, 0, 1.4]),
  manner('ulrich', [0.35, 0.85, 0, 0.9]),
  manner('ingrid', [0.3, 1.0, 0, 1.0]),
  manner('pogost', [0.1, 0.95, 2, 1.0]),
  // [EN] The players of the draughts scenes (11.11.2026): Velmira and Grandpa Prokhor think for ages, Bonebreaker and
  //      Queen Bagryana attack, Doctor Morok prescribes caution, Scarlett and the Quartet love a misère, Grandma
  //      Letitia plays without looking.
  // [RU] Игроки со сцен шашек (11.11.2026): Вельмира и Дед Прохор думают вечность, Костолом и королева Багряна
  //      нападают, Доктор Морок прописывает осторожность, Скарлетт и Квартет любят мизер, Бабушка Летиция играет не
  //      глядя.
  manner('velmira', [0.0, 1.1, 0, 1.4]),
  manner('kostolom', [0.35, 0.9, 0, 0.9]),
  manner('strelyany', [0.2, 1.0, 0, 1.0]),
  manner('violet', [0.3, 0.9, 1, 0.9]),
  manner('prokhor', [-0.2, 1.1, 0, 1.4]),
  manner('kvartet', [0.1, 1.0, 1, 1.2]),
  manner('morok', [-0.1, 1.15, 0, 1.2]),
  manner('bagryana', [0.45, 0.85, 0, 0.8]),
  manner('rogach', [0.25, 0.95, 0, 1.0]),
  manner('agata', [0.2, 1.0, 1, 1.0]),
  manner('serebryana', [0.0, 1.05, 0, 1.1]),
  manner('scarlett', [0.3, 0.9, 2, 0.8]),
  manner('letitia', [0.1, 1.1, 0, 0.8]),
  manner('ogneslava', [0.35, 0.9, 1, 0.9]),
  manner('celestine', [0.15, 1.0, 1, 0.9]),
  manner('vivien', [0.25, 0.95, 0, 1.0]),
  // [EN] The space guests (12.11.2026): the manner follows the biography. [RU] Космические гости: манера следует биографии.
  manner('markus', [-0.1, 1.05, 0, 1.2]),
  manner('vera', [0.2, 0.9, 1, 0.9]),
  manner('grob', [-0.2, 1.15, 0, 1.3]),
  manner('nekro', [0.1, 0.9, 1, 1]),
  manner('brut', [0.5, 0.8, 0, 0.7]),
  manner('eva', [0, 1.1, 0, 1.3]),
  manner('vakuum', [0.3, 0.85, 1, 0.9]),
  manner('xavier', [-0.15, 1.2, 0, 1.3]),
  manner('ksi', [0.2, 0.95, 0, 1]),
  manner('sporus', [0, 1, 1, 1.1]),
  manner('torgovets', [0.25, 0.9, 1, 1]),
  manner('vivisector', [0.05, 1.05, 0, 1.1]),
  manner('globb', [0.3, 0.85, 0, 0.9]),
  manner('gorizont', [0.15, 0.95, 2, 1]),
  manner('klony', [0.1, 1, 1, 1.4]),
  manner('kraken', [0.2, 0.9, 0, 0.9]),
  manner('malakor', [0.4, 0.85, 0, 0.9]),
  manner('kurtizanka', [0.35, 0.9, 1, 0.9]),
  manner('skeleton', [0, 1, 1, 1.1]),
  manner('vudu', [0.1, 0.95, 2, 1]),
  manner('obzhorin', [0.45, 0.8, 0, 0.8]),
  manner('zero', [0.2, 0.9, 0, 0.8]),
  manner('drednout', [0.5, 0.95, 0, 1]),
  manner('kollektor', [0.1, 1.1, 0, 0.9]),
  manner('zazerkal', [0, 1, 1, 1]),
  manner('zhrets', [-0.1, 1, 2, 1.2]),
  manner('sshivatel', [0.3, 0.85, 1, 1]),
  manner('krik', [-0.2, 1.1, 0, 1]),
  manner('pozhiratel', [0.35, 0.95, 0, 1.2]),
  manner('smert', [0, 1.15, 1, 1.4]),
]);
/** The dummy («болван») of a game for two: a scarecrow skeleton drawn for the game (shared/characters/dummy.svg). */
export const DUMMY: CharacterInfo = manner('dummy', [0, 1, 0, 1]);
const BY_ID = new Map<CharacterId, CharacterInfo>([...ROSTER, DUMMY].map(entry => [entry.id, entry]));

/** A character who can sit at the table as an opponent (the dummy is not one). */
export const isCharacterId = (value: unknown): value is CharacterId => typeof value === 'string' && value !== 'dummy' && BY_ID.has(value as CharacterId);
export const characterInfo = (id: CharacterId): CharacterInfo => BY_ID.get(id) ?? ROSTER[0];
export const isFemale = (id: CharacterId): boolean => characterInfo(id).female;
// END 1

// BEGIN 2. Who plays this pool
/** The opponents of one pool in seat order (seat 1, seat 2, …); seat 0 is always you. */
export type Cast = readonly CharacterId[];
/** A count Vlad and Carmilla: the company of the very first table and of old saves without a cast. */
export const DEFAULT_CAST: Cast = Object.freeze(['vlad', 'carmilla']);

/**
 * A new company of `count` different characters. Dwellers come twice as often as guests, so a guest is a treat;
 * nobody from the previous company sits down again, so every pool brings new faces.
 */
export function pickCast(count: number, random: () => number, previous: Cast = []): Cast {
  const pool = ROSTER.filter(character => !previous.includes(character.id));
  const chosen: CharacterId[] = [];
  while (chosen.length < count && pool.length > 0) {
    const weights = pool.map(character => (character.guest ? 1 : 2));
    let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    while (index < pool.length - 1 && roll >= weights[index]) { roll -= weights[index]; index += 1; }
    chosen.push(pool[index].id);
    pool.splice(index, 1);
  }
  return Object.freeze(chosen);
}

/**
 * The company of a new pool. `chosen` are the opponents picked on the menu, seat by seat (null = let the lair
 * decide). A free seat goes first to the `champion` — whoever won the last pool stays at the table — then to a
 * random character who did not sit at the previous table.
 */
export function castForNewPool(chosen: readonly (CharacterId | null)[], count: number, random: () => number, previous: Cast, champion: CharacterId | null): Cast {
  const seats: (CharacterId | null)[] = Array.from({ length: count }, (_, index) => {
    const id = chosen[index] ?? null;
    return id !== null && isCharacterId(id) ? id : null;
  });
  const taken = (id: CharacterId) => seats.includes(id);
  if (champion && !taken(champion)) {
    const free = seats.indexOf(null);
    if (free >= 0) seats[free] = champion;
  }
  const missing = seats.filter(id => id === null).length;
  const fresh = [...pickCast(missing, random, [...previous, ...seats.filter((id): id is CharacterId => id !== null)])];
  return normalizeCast(seats.map(id => id ?? fresh.shift() ?? null), count);
}

/** A cast from a save or a server made safe: unknown or repeated names replaced, the right length. */
export function normalizeCast(value: unknown, count: number): Cast {
  const ids = Array.isArray(value) ? value.filter(isCharacterId) : [];
  const unique = ids.filter((id, index) => ids.indexOf(id) === index).slice(0, count);
  for (const fallback of [...DEFAULT_CAST, ...ROSTER.map(character => character.id)]) {
    if (unique.length >= count) break;
    if (!unique.includes(fallback)) unique.push(fallback);
  }
  return Object.freeze(unique);
}
// END 2

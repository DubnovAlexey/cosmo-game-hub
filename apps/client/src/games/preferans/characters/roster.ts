// =====================================================================
// FILE: apps/client/src/games/preferans/characters/roster.ts
// PURPOSE: who sits at the table against you. The lair has forty-three dwellers (vampires, ghouls, necromancers, a
//   masked empress, a weeping queen…) and twenty-six guests from the neighbouring worlds (an alchemist, a zombie from
//   Marseille, aliens, a raccoon, a ronin from an old print, a neon vampire…); every new pool seats a different
//   company. Pictures: Alexey's own collection (Desktop «Favicon», 08–09.11.2026; some from StockCake, free to use),
//   whole, with their backgrounds, only scaled down, in public/games/preferans/portraits.
//   Names and biographies live in the languages (i18n/characters/*.ts); here only what does not depend on language.
//   Pure data without React and without pictures, so the Node tests use it too.
// =====================================================================

import type { BotStyle } from '../engine/index.ts';

// BEGIN 1. The company
export type CharacterId =
  | 'upyr' | 'sebastian' | 'rosalind' | 'ada' | 'vlad' | 'lucretia' | 'isolde' | 'tadeusz' | 'gunther' | 'koschei'
  | 'vurdalak' | 'mortimer' | 'abraxas' | 'netopyr' | 'greta' | 'morana' | 'snezhana' | 'carmilla' | 'balthazar' | 'lorenzo'
  | 'berta' | 'zhorzh' | 'mortus' | 'lyuska' | 'mara' | 'oktaedr' | 'helga' | 'morg'
  | 'agrippina' | 'sergeant' | 'klyuv' | 'dlan' | 'edgar' | 'lilith' | 'xenon' | 'chuzhak' | 'khitin' | 'semyonych'
  /** The second company (09.11.2026): 23 dwellers and 8 guests. */
  | 'vual' | 'beatrice' | 'morwenna' | 'irma' | 'ivy' | 'lamplighter' | 'albina' | 'lacrima' | 'sangria' | 'selena'
  | 'skuka' | 'mgla' | 'valentin' | 'pietro' | 'kenji' | 'octavian' | 'benedict' | 'akvarella' | 'skvoznyak' | 'melisande'
  | 'belladonna' | 'cassandra' | 'tobias' | 'kage' | 'florian' | 'neon' | 'glyuk' | 'astral' | 'herbarium' | 'deco'
  | 'bes'
  /** The dummy of a game for two: never picked as an opponent, it sits in the third seat. */
  | 'dummy';

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
const character = (id: CharacterId, female: boolean, guestFlag: boolean, [boldness, whistCaution, misereNerve, effort]: Manner): CharacterInfo =>
  Object.freeze({ id, female, guest: guestFlag, style: Object.freeze({ boldness, whistCaution, misereNerve }), effort });
const dweller = (id: CharacterId, female: boolean, manner: Manner): CharacterInfo => character(id, female, false, manner);
const guest = (id: CharacterId, female: boolean, manner: Manner): CharacterInfo => character(id, female, true, manner);

// [EN] Each manner follows the biography: impatient Carmilla bids high, deathless Koschei thinks for ages, the
//      accountant Mortimer whists only by calculation, Count Vlad and Georges love misère, Snezhana is cold in all.
// [RU] Каждая манера следует биографии: нетерпеливая Кармилла заявляет высоко, бессмертный Кощей думает вечность,
//      бухгалтер Мортимер вистует только по расчёту, Граф Влад и Жорж обожают мизер, Снежана холодна во всём.
export const ROSTER: readonly CharacterInfo[] = Object.freeze([
  dweller('upyr', false, [-0.2, 1.1, 0, 1]),
  dweller('sebastian', false, [0, 0.95, 0, 1.1]),
  dweller('rosalind', true, [0.1, 0.85, 0, 1]),
  dweller('ada', true, [0, 0.9, 1, 1]),
  dweller('vlad', false, [-0.1, 1, 2, 1.2]),
  dweller('lucretia', true, [0.2, 0.8, 0, 1]),
  dweller('isolde', true, [-0.1, 1, 0, 1.2]),
  dweller('tadeusz', false, [0, 1.05, 1, 0.9]),
  dweller('gunther', false, [0.45, 0.9, 1, 0.8]),
  dweller('koschei', false, [-0.2, 1.1, 0, 1.4]),
  dweller('vurdalak', false, [0.1, 0.85, 0, 0.9]),
  dweller('mortimer', false, [-0.15, 1.15, 0, 1.3]),
  dweller('abraxas', false, [0, 1, 1, 1.4]),
  dweller('netopyr', false, [0.35, 0.8, 0, 0.7]),
  dweller('greta', true, [-0.1, 1.05, 0, 1]),
  dweller('morana', true, [0, 0.85, 0, 1.1]),
  dweller('snezhana', true, [-0.3, 1.2, 0, 1.1]),
  dweller('carmilla', true, [0.5, 0.9, 1, 0.8]),
  dweller('balthazar', false, [0.25, 1, 1, 1]),
  dweller('lorenzo', false, [0.1, 0.95, 0, 1.1]),
  dweller('vual', true, [0.3, 0.95, 0, 1.1]),
  dweller('beatrice', true, [0, 1.0, 1, 1.0]),
  dweller('morwenna', true, [-0.15, 1.05, 0, 1.25]),
  dweller('irma', true, [0.2, 0.82, 0, 1.0]),
  dweller('ivy', false, [-0.25, 1.1, 0, 1.4]),
  dweller('lamplighter', false, [0.4, 0.9, 1, 1.0]),
  dweller('albina', true, [0.25, 0.85, 0, 0.9]),
  dweller('lacrima', true, [-0.1, 1.05, 0, 1.1]),
  dweller('sangria', true, [0.3, 0.9, 1, 0.9]),
  dweller('selena', true, [0, 1.0, 0, 1.2]),
  dweller('skuka', true, [-0.05, 1.0, 2, 1.0]),
  dweller('mgla', true, [0.35, 0.85, 1, 0.8]),
  dweller('valentin', false, [0.3, 0.9, 0, 0.8]),
  dweller('pietro', false, [0.4, 0.8, 1, 0.75]),
  dweller('kenji', false, [0, 1.0, 0, 1.3]),
  dweller('octavian', false, [-0.1, 1.05, 2, 1.2]),
  dweller('benedict', false, [0.25, 0.9, 1, 0.9]),
  dweller('akvarella', true, [0.15, 0.9, 0, 1.0]),
  dweller('skvoznyak', false, [-0.15, 1.1, 0, 1.2]),
  dweller('melisande', true, [-0.05, 1.0, 0, 1.1]),
  dweller('belladonna', true, [0.15, 0.85, 0, 1.0]),
  dweller('cassandra', true, [0.1, 0.9, 1, 1.0]),
  dweller('tobias', false, [0.2, 0.95, 1, 0.85]),
  guest('berta', true, [0.3, 1, 0, 1]),
  guest('zhorzh', false, [0, 1, 2, 0.8]),
  guest('mortus', false, [-0.2, 1.1, 0, 1.4]),
  guest('lyuska', true, [0.4, 0.8, 1, 0.8]),
  guest('mara', true, [-0.1, 1, 1, 1.2]),
  guest('oktaedr', false, [0, 0.95, 0, 1.3]),
  guest('helga', true, [0.1, 1, 0, 1.2]),
  guest('morg', false, [0, 0.85, 0, 1]),
  guest('agrippina', true, [0.2, 0.85, 1, 0.9]),
  guest('sergeant', false, [-0.1, 1.1, 0, 1]),
  guest('klyuv', false, [0.15, 0.95, 0, 1.1]),
  guest('dlan', true, [0.3, 0.9, 1, 0.9]),
  guest('edgar', false, [-0.25, 1.15, 0, 1]),
  guest('lilith', true, [0.35, 0.85, 1, 1]),
  guest('xenon', false, [0.4, 1, 0, 1.1]),
  guest('chuzhak', false, [0.1, 0.8, 0, 0.9]),
  guest('khitin', false, [-0.1, 1.1, 0, 1.3]),
  guest('semyonych', false, [0.15, 0.9, 2, 0.8]),
  guest('kage', false, [0.1, 1.0, 0, 1.2]),
  guest('florian', false, [0.05, 0.95, 1, 1.1]),
  guest('neon', false, [0.45, 0.85, 0, 0.7]),
  guest('glyuk', false, [0.3, 0.9, 0, 0.7]),
  guest('astral', false, [-0.1, 1.05, 1, 1.4]),
  guest('herbarium', false, [-0.3, 1.15, 0, 1.1]),
  guest('deco', false, [0.2, 0.95, 1, 1.0]),
  guest('bes', false, [0.5, 0.85, 0, 0.7]),
]);
/** The dummy («болван») of a game for two: a scarecrow skeleton drawn for the game (portraits/dummy.svg). */
export const DUMMY: CharacterInfo = character('dummy', false, true, [0, 1, 0, 1]);
const BY_ID = new Map<CharacterId, CharacterInfo>([...ROSTER, DUMMY].map(entry => [entry.id, entry]));

/** A character who can sit at the table as an opponent (the dummy is not one). */
export const isCharacterId = (value: unknown): value is CharacterId => typeof value === 'string' && value !== 'dummy' && BY_ID.has(value as CharacterId);
export const characterInfo = (id: CharacterId): CharacterInfo => BY_ID.get(id) ?? ROSTER[0];
export const isFemale = (id: CharacterId): boolean => characterInfo(id).female;
/** Where the picture lies in the site (relative to the base URL). */
export const portraitPath = (id: CharacterId): string => (id === 'dummy' ? 'games/preferans/portraits/dummy.svg' : `games/preferans/portraits/${id}.webp`);
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

// [EN] FILE: games/poker/characters.ts — the regulars of the lair's poker table: ten dwellers of the crypt (the same
//      pictures as at the preferans table, copied into public/games/poker/portraits), each with a poker manner that
//      shows in the play: the Count's tight aggression, Carmilla's bluffs, Koschei's stone-cold patience, the
//      Treasurer who pays to see every card. Names and taglines live in i18n/*.ts.
// [RU] ФАЙЛ: завсегдатаи покерного стола логова: десять обитателей склепа (те же картинки, что за столом преферанса,
//      копии в public/games/poker/portraits), у каждого своя покерная манера, которую видно в игре: плотная агрессия
//      Графа, блеф Кармиллы, ледяное терпение Кощея, Казначей, который платит, чтобы увидеть каждую карту. Имена и
//      подписи — в i18n/*.ts.
import type { PokerStyle } from './engine/ai/bot.ts';

export type PokerCharacterId =
  | 'vlad' | 'carmilla' | 'koschei' | 'stilet' | 'kaznachey' | 'lilith' | 'crystal' | 'galeon' | 'shadow' | 'semyonych';

export interface PokerCharacter {
  readonly id: PokerCharacterId;
  readonly female: boolean;
  readonly style: PokerStyle;
}

const regular = (id: PokerCharacterId, female: boolean, tightness: number, aggression: number, bluff: number): PokerCharacter =>
  Object.freeze({ id, female, style: Object.freeze({ tightness, aggression, bluff }) });

export const CAST: readonly PokerCharacter[] = Object.freeze([
  regular('vlad', false, 0.08, 0.75, 0.12), // a tight-aggressive shark
  regular('carmilla', true, -0.08, 0.85, 0.25), // loose, aggressive, bluffs with a smile
  regular('koschei', false, 0.15, 0.2, 0.02), // the rock: only the nuts, and he can wait for ever
  regular('stilet', false, 0, 0.9, 0.3), // pressure: big bets, big bluffs
  regular('kaznachey', false, -0.1, 0.15, 0.03), // the calling station: pays to see every card
  regular('lilith', true, 0.03, 0.6, 0.15), // a balanced professional
  regular('crystal', false, 0.05, 0.55, 0.08), // the calculator: pot odds and nothing else
  regular('galeon', false, -0.15, 0.95, 0.32), // the gambler of the seven seas
  regular('shadow', true, 0.06, 0.35, 0.18), // the trap: checks the monsters, bets the air
  regular('semyonych', false, -0.02, 0.5, 0.2), // the old hustler of kitchen games
]);

export const characterOf = (id: PokerCharacterId): PokerCharacter => CAST.find(character => character.id === id) ?? CAST[0];
export const isCharacterId = (value: unknown): value is PokerCharacterId => CAST.some(character => character.id === value);
/** The picture of a character (whole, as Alexey gave it). */
export const portraitPath = (id: PokerCharacterId): string => `/games/poker/portraits/${id}.webp`;

/** A company for a new tournament: `count` different regulars in a random order. */
export function pickCompany(count: number, random: () => number): PokerCharacterId[] {
  const ids = CAST.map(character => character.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count);
}

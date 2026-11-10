// [EN] FILE: games/poker/characters.ts — the regulars of the lair's poker table: ten of the lair's company (who they
//      are, their names, biographies and pictures are shared by all the games — shared/characters), each with a
//      poker manner that shows in the play: the Count's tight aggression, Carmilla's bluffs, Koschei's stone-cold
//      patience, the Treasurer who pays to see every card. Their poker lines live in i18n/*.ts.
// [RU] ФАЙЛ: завсегдатаи покерного стола логова: десять героев из компании логова (кто они, их имена, биографии и
//      картинки — общие для всех игр, shared/characters), у каждого своя покерная манера, которую видно в игре:
//      плотная агрессия Графа, блеф Кармиллы, ледяное терпение Кощея, Казначей, который платит, чтобы увидеть каждую
//      карту. Их покерные реплики — в i18n/*.ts.
// [EN] A relative path on purpose: Node runs the tests directly and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает тесты напрямую и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { characterFacts, portraitPath as sharedPortraitPath } from '../../shared/characters/roster.ts';
import type { PokerStyle } from './engine/ai/bot.ts';

export type PokerCharacterId =
  | 'vlad' | 'carmilla' | 'koschei' | 'stilet' | 'kaznachey' | 'lilith' | 'crystal' | 'galeon' | 'shadow' | 'semyonych';

export interface PokerCharacter {
  readonly id: PokerCharacterId;
  readonly female: boolean;
  readonly style: PokerStyle;
}

const regular = (id: PokerCharacterId, tightness: number, aggression: number, bluff: number): PokerCharacter =>
  Object.freeze({ id, female: characterFacts(id).female, style: Object.freeze({ tightness, aggression, bluff }) });

export const CAST: readonly PokerCharacter[] = Object.freeze([
  regular('vlad', 0.08, 0.75, 0.12), // a tight-aggressive shark
  regular('carmilla', -0.08, 0.85, 0.25), // loose, aggressive, bluffs with a smile
  regular('koschei', 0.15, 0.2, 0.02), // the rock: only the nuts, and he can wait for ever
  regular('stilet', 0, 0.9, 0.3), // pressure: big bets, big bluffs
  regular('kaznachey', -0.1, 0.15, 0.03), // the calling station: pays to see every card
  regular('lilith', 0.03, 0.6, 0.15), // a balanced professional
  regular('crystal', 0.05, 0.55, 0.08), // the calculator: pot odds and nothing else
  regular('galeon', -0.15, 0.95, 0.32), // the gambler of the seven seas
  regular('shadow', 0.06, 0.35, 0.18), // the trap: checks the monsters, bets the air
  regular('semyonych', -0.02, 0.5, 0.2), // the old hustler of kitchen games
]);

export const characterOf = (id: PokerCharacterId): PokerCharacter => CAST.find(character => character.id === id) ?? CAST[0];
export const isCharacterId = (value: unknown): value is PokerCharacterId => CAST.some(character => character.id === value);
/** The picture of a character (whole, as Alexey gave it): one copy for all the games. */
export const portraitPath = (id: PokerCharacterId): string => sharedPortraitPath(id);

/** A company for a new tournament: `count` different regulars in a random order. */
export function pickCompany(count: number, random: () => number): PokerCharacterId[] {
  const ids = CAST.map(character => character.id);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count);
}

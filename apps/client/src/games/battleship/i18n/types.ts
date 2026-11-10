// [EN] FILE: games/battleship/i18n/types.ts — every text of the sea battle in one contract, filled in five languages
//      (ru, en, he, es, fr). A sentence about the opponent takes the hero's name and gender, so Russian, Hebrew,
//      Spanish and French verbs agree («Кармилла потопила», «Капитан Галеон потопил»). The letters of the columns
//      follow the language too: А–К without Ё and Й in Russian (as in the notebook game), A–J in Latin, א–י in Hebrew.
// [RU] ФАЙЛ: все тексты морского боя в одном договоре, заполненном на пяти языках (ru, en, he, es, fr). Фраза о
//      сопернике получает имя и род героя, поэтому глаголы в русском, иврите, испанском и французском согласуются
//      («Кармилла потопила», «Капитан Галеон потопил»). Буквы колонок тоже идут за языком: А–К без Ё и Й по-русски
//      (как в тетрадной игре), A–J латиницей, א–י на иврите.
import type { Language } from '@shared/i18n/languages';

export interface Who {
  readonly name: string;
  readonly female: boolean;
}

export interface BattleTexts {
  readonly language: Language;
  readonly gameTitle: string;
  readonly tagline: string;
  /** Ten letters of the columns, left to right. */
  readonly columns: readonly string[];
  readonly header: {
    readonly language: string;
    readonly save: string;
    readonly savedAt: (time: string) => string;
    readonly menu: string;
  };
  readonly setup: {
    readonly title: string;
    readonly intro: string;
    readonly rules: string;
    readonly classic: string;
    readonly classicHint: string;
    readonly western: string;
    readonly westernHint: string;
    readonly touching: string;
    readonly touchingHint: string;
    readonly shootAgain: string;
    readonly shootAgainHint: string;
    readonly level: string;
    readonly levels: { readonly easy: string; readonly normal: string; readonly hard: string };
    readonly levelHints: { readonly easy: string; readonly normal: string; readonly hard: string };
    readonly first: string;
    readonly firstMoves: { readonly you: string; readonly opponent: string; readonly random: string };
    readonly opponent: string;
    readonly another: string;
    readonly start: string;
    readonly continue: string;
    readonly savedLine: (when: string) => string;
    readonly close: string;
  };
  readonly placing: {
    readonly title: string;
    readonly hint: string;
    readonly rotate: string;
    readonly across: string;
    readonly down: string;
    readonly random: string;
    readonly clear: string;
    readonly start: string;
    readonly ready: string;
    /** «Крейсер ×2»: a ship of the dock with how many of them are still to place. */
    readonly dock: (ship: string, count: number) => string;
    readonly problems: { readonly outside: string; readonly overlap: string; readonly touching: string };
  };
  /** Ship names by length, index 1 … 5. */
  readonly ships: readonly string[];
  readonly battle: {
    readonly yourSea: string;
    readonly enemySea: string;
    readonly yourTurn: string;
    readonly theirTurn: (who: Who) => string;
    readonly yourFleet: string;
    readonly enemyFleet: string;
    readonly afloat: (ship: string, count: number) => string;
    readonly noneAfloat: string;
    readonly logTitle: string;
    readonly you: string;
    readonly miss: (name: string, cell: string) => string;
    readonly hit: (name: string, cell: string) => string;
    readonly sunk: (name: string, cell: string, ship: string) => string;
  };
  /** What a cell of a sea is, for a screen reader: «Б4, мимо». */
  readonly cell: {
    readonly unknown: string;
    readonly miss: string;
    readonly hit: string;
    readonly sunk: string;
    readonly empty: string;
    readonly ship: string;
    readonly water: string;
    readonly label: (cell: string, state: string) => string;
  };
  readonly result: {
    readonly won: string;
    readonly lost: (who: Who) => string;
    readonly stats: (shots: number, hits: number) => string;
    readonly again: string;
  };
  readonly hero: {
    readonly about: (name: string) => string;
    readonly close: string;
    readonly dweller: string;
    readonly guest: string;
  };
}

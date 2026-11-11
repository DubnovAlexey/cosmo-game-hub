// [EN] FILE: games/checkers/i18n/types.ts — the shape of the texts of draughts, the same for all five languages
//      (Russian is the master). Sentences that need a name, a number or a square are functions, so every language
//      builds them in its own word order and agrees them with the gender of the opponent.
// [RU] ФАЙЛ: форма текстов шашек, одна для всех пяти языков (основной — русский). Фразы, которым нужны имя, число
//      или поле, — функции: каждый язык строит их в своём порядке слов и согласует с родом соперника.
import type { Language } from '@shared/i18n/languages';

/** [EN] The opponent in a sentence: a name and the grammatical gender. [RU] Соперник во фразе: имя и грамматический род. */
export interface Who {
  readonly name: string;
  readonly female: boolean;
}

type Levels<T> = { readonly easy: T; readonly normal: T; readonly hard: T };

export interface CheckersTexts {
  readonly language: Language;
  readonly gameTitle: string;
  readonly tagline: string;
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
    readonly russian: string;
    readonly russianHint: string;
    readonly english: string;
    readonly englishHint: string;
    readonly level: string;
    readonly levels: Levels<string>;
    readonly levelHints: Levels<string>;
    readonly colour: string;
    readonly colours: { readonly white: string; readonly black: string; readonly random: string };
    /** [EN] Who moves first under these rules. [RU] Кто ходит первым по этим правилам. */
    readonly firstHint: (whiteFirst: boolean) => string;
    readonly opponent: string;
    readonly another: string;
    readonly start: string;
    readonly continue: string;
    readonly savedLine: (when: string) => string;
    readonly close: string;
  };
  readonly play: {
    readonly yourMove: string;
    readonly mustCapture: string;
    /** [EN] In the middle of a series of captures. [RU] Посреди серии взятий. */
    readonly goOn: string;
    readonly theirMove: (who: Who) => string;
    readonly hint: string;
    readonly you: string;
    readonly white: string;
    readonly black: string;
    readonly yourSide: (side: string) => string;
    readonly count: (men: number, kings: number) => string;
    readonly logTitle: string;
    readonly noMoves: string;
    readonly takeBack: string;
    readonly resign: string;
    readonly resignSure: string;
    readonly cancel: string;
  };
  readonly square: {
    readonly label: (name: string, state: string) => string;
    readonly empty: string;
    readonly whiteMan: string;
    readonly whiteKing: string;
    readonly blackMan: string;
    readonly blackKing: string;
    readonly target: string;
    readonly chosen: string;
  };
  readonly result: {
    readonly won: string;
    readonly lost: (who: Who) => string;
    readonly draw: string;
    readonly drawQuiet: string;
    readonly drawRepetition: string;
    readonly youResigned: string;
    readonly blocked: string;
    readonly moves: (count: number) => string;
    readonly again: string;
  };
  readonly hero: {
    readonly about: (name: string) => string;
    readonly close: string;
    readonly dweller: string;
    readonly guest: string;
  };
}

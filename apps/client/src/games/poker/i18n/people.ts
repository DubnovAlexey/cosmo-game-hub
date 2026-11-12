// [EN] FILE: games/poker/i18n/people.ts — joins the poker dictionary of a language with the names and biographies of
//      the regulars, which are shared by all the games of the hub (shared/characters/texts). Pure, with relative
//      paths, so the Node tests use it too.
// [RU] ФАЙЛ: соединяет словарь покера на одном языке с именами и биографиями завсегдатаев, общими для всех игр хаба
//      (shared/characters/texts). Чистая функция с относительными путями, поэтому её используют и тесты Node.
// noinspection ES6PreferShortImport
import type { CharacterId } from '../../../shared/characters/roster.ts';
import { CAST } from '../characters.ts';
import type { PokerDictionary, PokerTexts } from './types.ts';

export function withCharacters(dictionary: PokerDictionary, people: Readonly<Record<CharacterId, { readonly name: string; readonly bio: string; readonly quote?: string }>>): PokerTexts {
    const characters = Object.fromEntries(CAST.map(({ id }) => [id, { name: people[id].name, bio: people[id].bio, quote: people[id].quote, tagline: dictionary.characters[id].tagline }])) as PokerTexts['characters'];
    return { ...dictionary, characters };
}

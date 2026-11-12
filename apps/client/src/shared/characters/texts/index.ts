// [EN] FILE: shared/characters/texts/index.ts — the names and biographies of the lair's company for any game: only
//      the language in use is downloaded (each language is a separate chunk of the build). A language file may know
//      more than a name and a biography (Russian keeps the cases its sentences need); a game that needs only these
//      two reads them here.
// [RU] ФАЙЛ: имена и биографии компании логова для любой игры: скачивается только нужный язык (каждый язык —
//      отдельный кусок сборки). Языковой файл может знать больше, чем имя и биографию (русский хранит падежи для
//      своих фраз); игра, которой нужны только эти два текста, читает их здесь.
import type { Language } from '../../i18n/languages.ts';
import type { CharacterId } from '../roster.ts';

export interface CharacterText { readonly name: string; readonly bio: string; readonly quote?: string }
export type CharacterTexts = Readonly<Record<CharacterId, CharacterText>>;

export function loadCharacterTexts(language: Language): Promise<CharacterTexts> {
    switch (language) {
        case 'ru': return import('./ru.ts').then(module => module.CHARACTERS_RU);
        case 'he': return import('./he.ts').then(module => module.CHARACTERS_HE);
        case 'es': return import('./es.ts').then(module => module.CHARACTERS_ES);
        case 'fr': return import('./fr.ts').then(module => module.CHARACTERS_FR);
        default: return import('./en.ts').then(module => module.CHARACTERS_EN);
    }
}

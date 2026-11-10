// [EN] FILE: games/poker/i18n/index.ts — the poker texts: only the language in use is downloaded (each dictionary is a
//      separate chunk), and the table reads it through a React context.
// [RU] ФАЙЛ: тексты покера: скачивается только нужный язык (каждый словарь — отдельный кусок сборки), а стол читает
//      его через контекст React.
import { createContext, useContext } from 'react';
import type { Language } from '@shared/i18n/languages';
import { loadCharacterTexts } from '@shared/characters/texts';
import type { PokerCharacterId } from '../characters';
import { withCharacters } from './people';
import type { PokerDictionary, PokerTexts } from './types';

export type { PokerTexts, Who } from './types';

function loadDictionary(language: Language): Promise<PokerDictionary> {
    switch (language) {
        case 'ru': return import('./ru.ts').then(module => module.default);
        case 'he': return import('./he.ts').then(module => module.default);
        case 'es': return import('./es.ts').then(module => module.default);
        case 'fr': return import('./fr.ts').then(module => module.default);
        default: return import('./en.ts').then(module => module.default);
    }
}

export async function loadPokerTexts(language: Language): Promise<PokerTexts> {
    const [dictionary, people] = await Promise.all([loadDictionary(language), loadCharacterTexts(language)]);
    return withCharacters(dictionary, people);
}

export type { PokerCharacterId };

export const PokerTextsContext = createContext<PokerTexts | null>(null);

export function usePokerTexts(): PokerTexts {
    const texts = useContext(PokerTextsContext);
    if (!texts) throw new Error('usePokerTexts outside PokerTextsContext');
    return texts;
}

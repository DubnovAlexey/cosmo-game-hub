// [EN] FILE: games/checkers/i18n/index.ts — the texts of draughts: only the language in use is downloaded (each
//      dictionary is a separate chunk), and the room reads it through a React context.
// [RU] ФАЙЛ: тексты шашек: скачивается только нужный язык (каждый словарь — отдельный кусок сборки), а комната
//      читает его через контекст React.
import { createContext, useContext } from 'react';
import type { Language } from '@shared/i18n/languages';
import type { CheckersTexts } from './types';

export type { CheckersTexts, Who } from './types';

export function loadCheckersTexts(language: Language): Promise<CheckersTexts> {
    switch (language) {
        case 'ru': return import('./ru.ts').then(module => module.default);
        case 'he': return import('./he.ts').then(module => module.default);
        case 'es': return import('./es.ts').then(module => module.default);
        case 'fr': return import('./fr.ts').then(module => module.default);
        default: return import('./en.ts').then(module => module.default);
    }
}

export const CheckersTextsContext = createContext<CheckersTexts | null>(null);

export function useCheckersTexts(): CheckersTexts {
    const texts = useContext(CheckersTextsContext);
    if (!texts) throw new Error('useCheckersTexts outside CheckersTextsContext');
    return texts;
}

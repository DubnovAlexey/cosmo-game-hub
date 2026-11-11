// [EN] FILE: games/battleship/i18n/index.ts — the texts of the sea battle: only the language in use is downloaded (each
//      dictionary is a separate chunk), and the room reads it through a React context.
// [RU] ФАЙЛ: тексты морского боя: скачивается только нужный язык (каждый словарь — отдельный кусок сборки), а комната
//      читает его через контекст React.
import { createContext, useContext } from 'react';
import type { Language } from '@shared/i18n/languages';
import type { BattleTexts } from './types';

export type { BattleTexts, Who } from './types';

export function loadBattleTexts(language: Language): Promise<BattleTexts> {
    switch (language) {
        case 'ru': return import('./ru.ts').then(module => module.default);
        case 'he': return import('./he.ts').then(module => module.default);
        case 'es': return import('./es.ts').then(module => module.default);
        case 'fr': return import('./fr.ts').then(module => module.default);
        default: return import('./en.ts').then(module => module.default);
    }
}

export const BattleTextsContext = createContext<BattleTexts | null>(null);

export function useBattleTexts(): BattleTexts {
    const texts = useContext(BattleTextsContext);
    if (!texts) throw new Error('useBattleTexts outside BattleTextsContext');
    return texts;
}

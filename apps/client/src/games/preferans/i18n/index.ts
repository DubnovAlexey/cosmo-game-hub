// [EN] FILE: games/preferans/i18n/index.ts — the language of the preferans table. Each language is its own small
//      file loaded on demand, so the table carries only the texts it shows. The island provides the loaded texts
//      through React context; components read them with useTexts().
// [RU] ФАЙЛ: язык стола преферанса. Каждый язык — свой маленький файл, загружается по требованию: стол несёт
//      только те тексты, которые показывает. Остров передаёт загруженные тексты через контекст React,
//      компоненты читают их через useTexts().
import { createContext, useContext } from 'react';
import type { Language } from '../../../shared/i18n/languages.ts';
import type { Dictionary } from './types.ts';

export type { Dictionary, Explained } from './types.ts';

const LOADERS: Readonly<Record<Language, () => Promise<{ default: Dictionary }>>> = {
    ru: () => import('./ru.ts'),
    en: () => import('./en.ts'),
    he: () => import('./he.ts'),
    es: () => import('./es.ts'),
    fr: () => import('./fr.ts'),
};

const cache = new Map<Language, Promise<Dictionary>>();

/** [EN] The texts of one language; each file is fetched once. [RU] Тексты одного языка; каждый файл грузится один раз. */
export function loadDictionary(language: Language): Promise<Dictionary> {
    let pending = cache.get(language);
    if (!pending) {
        pending = LOADERS[language]().then(module => module.default);
        cache.set(language, pending);
    }
    return pending;
}

export const TextsContext = createContext<Dictionary | null>(null);

export function useTexts(): Dictionary {
    const texts = useContext(TextsContext);
    if (!texts) throw new Error('Preferans texts are not loaded yet');
    return texts;
}

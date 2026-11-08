// [EN] FILE: shared/i18n/useLanguage.ts — the current interface language for a React island: detected once,
//      remembered on change and shared with the other islands on the page through one window event.
// [RU] ФАЙЛ: текущий язык интерфейса для React-острова: определяется один раз, запоминается при смене и
//      передаётся другим островам страницы одним событием окна.
import { useCallback, useEffect, useState } from 'react';
import { LANGUAGE_EVENT, detectLanguage, isLanguage, rememberLanguage, type Language } from './languages.ts';

export function useLanguage(): readonly [Language, (next: Language) => void] {
    const [language, setLanguage] = useState<Language>(detectLanguage);
    useEffect(() => {
        const onChange = (event: Event) => {
            const next = (event as CustomEvent<unknown>).detail;
            if (isLanguage(next)) setLanguage(next);
        };
        window.addEventListener(LANGUAGE_EVENT, onChange);
        return () => window.removeEventListener(LANGUAGE_EVENT, onChange);
    }, []);
    const choose = useCallback((next: Language) => {
        rememberLanguage(next);
        setLanguage(next);
        window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: next }));
    }, []);
    return [language, choose] as const;
}

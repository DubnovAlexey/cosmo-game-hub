// =====================================================================
// FILE: apps/client/src/shell/i18n/applyLanguage.ts
// PURPOSE: puts the hub's pages into the chosen language in the browser. Elements marked data-i18n get their text,
//   data-i18n-title / data-i18n-aria-label / data-i18n-alt their attribute, <html> its lang and direction (Hebrew is
//   right to left), the tab its title. The choice is the one saved for the whole site: the header's switch and the
//   switches inside the games share it through one window event, so changing it anywhere changes it everywhere.
// [RU] Переводит страницы хаба на выбранный язык в браузере. Элементы с data-i18n получают текст, с
//   data-i18n-title / data-i18n-aria-label / data-i18n-alt — атрибут, <html> — язык и направление (иврит справа
//   налево), вкладка — заголовок. Выбор один на весь сайт: переключатель в шапке и переключатели в играх делят его
//   через одно событие окна, поэтому смена в одном месте меняет язык везде.
// =====================================================================
import { LANGUAGE_EVENT, LANGUAGE_KEY, detectLanguage, directionOf, isLanguage, rememberLanguage, type Language } from '@shared/i18n/languages';
import { shellText } from './shellTexts';

const ATTRIBUTES = ['title', 'aria-label', 'alt'] as const;

export function applyShellLanguage(language: Language): void {
    const html = document.documentElement;
    html.lang = language;
    html.dir = directionOf(language);
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(element => {
        const text = shellText(element.dataset.i18n ?? '', language);
        if (text !== null) element.textContent = text;
    });
    for (const attribute of ATTRIBUTES) {
        document.querySelectorAll<HTMLElement>(`[data-i18n-${attribute}]`).forEach(element => {
            const text = shellText(element.getAttribute(`data-i18n-${attribute}`) ?? '', language);
            if (text !== null) element.setAttribute(attribute, text);
        });
    }
    const title = shellText(html.dataset.titleKey ?? '', language);
    if (title !== null) document.title = `${title} | Cosmo Game Hub`;
    document.querySelectorAll<HTMLSelectElement>('select[data-language-switch]').forEach(select => { select.value = language; });
}

/** Applies the saved choice now and follows every later change: the header's switch, a game's switch, another tab. */
export function startShellLanguage(): void {
    applyShellLanguage(detectLanguage());
    document.querySelectorAll<HTMLSelectElement>('select[data-language-switch]').forEach(select => {
        select.addEventListener('change', () => {
            if (!isLanguage(select.value)) return;
            rememberLanguage(select.value);
            applyShellLanguage(select.value);
            window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: select.value }));
        });
    });
    window.addEventListener(LANGUAGE_EVENT, event => {
        const next = (event as CustomEvent<unknown>).detail;
        if (isLanguage(next)) applyShellLanguage(next);
    });
    window.addEventListener('storage', event => {
        if (event.key === LANGUAGE_KEY && isLanguage(event.newValue)) applyShellLanguage(event.newValue);
    });
}

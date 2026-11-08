// =====================================================================
// FILE: apps/client/src/shared/i18n/languages.ts
// PURPOSE: the five interface languages of every project (decision of 08.11.2026) and how the choice is found
//   and remembered: a saved choice first, then the browser languages, then English. Hebrew is right-to-left.
//   Pure and safe without a browser, so Node tests run it and nothing breaks in private mode.
// =====================================================================

export type Language = 'ru' | 'en' | 'he' | 'es' | 'fr';

export interface LanguageInfo {
  readonly code: Language;
  /** The language's own name, as its speakers write it. */
  readonly name: string;
  readonly dir: 'ltr' | 'rtl';
}

export const LANGUAGES: readonly LanguageInfo[] = Object.freeze([
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'he', name: 'עברית', dir: 'rtl' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
]);

export const LANGUAGE_KEY = 'cosmo-game-hub:language';
export const LANGUAGE_EVENT = 'cosmo-game-hub:language';
const CODES = new Set<string>(LANGUAGES.map(language => language.code));

export const isLanguage = (value: unknown): value is Language => typeof value === 'string' && CODES.has(value);
export const directionOf = (language: Language): 'ltr' | 'rtl' => (language === 'he' ? 'rtl' : 'ltr');

interface Environment {
  readonly saved?: string | null;
  readonly browser?: readonly string[];
}

/** The saved choice, else the first browser language we speak ('ru-IL' → 'ru', 'iw' → 'he'), else English. */
export function pickLanguage({ saved, browser = [] }: Environment): Language {
  if (isLanguage(saved)) return saved;
  for (const tag of browser) {
    const base = tag.toLowerCase().split('-')[0];
    const code = base === 'iw' ? 'he' : base;
    if (isLanguage(code)) return code;
  }
  return 'en';
}

/** Reads the browser; every access is guarded (no window, blocked storage). */
export function detectLanguage(): Language {
  let saved: string | null = null;
  let browser: readonly string[] = [];
  try { saved = globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null; } catch { saved = null; }
  try { browser = globalThis.navigator?.languages ?? (globalThis.navigator?.language ? [globalThis.navigator.language] : []); } catch { browser = []; }
  return pickLanguage({ saved, browser });
}

export function rememberLanguage(language: Language): void {
  try { globalThis.localStorage?.setItem(LANGUAGE_KEY, language); } catch { /* private mode: the choice lives until the page closes */ }
}

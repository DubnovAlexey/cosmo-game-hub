// [EN] FILE: shared/components/LanguageSwitch.tsx — the language switch every game puts in its header: the five
//      languages under their own names. A native select: one tap on a phone, arrow keys on a computer.
// [RU] ФАЙЛ: переключатель языка, который каждая игра ставит в свою шапку: пять языков под их собственными
//      названиями. Обычный select: одно касание на телефоне, стрелки на компьютере.
import React from 'react';
import { LANGUAGES, type Language } from '../i18n/languages.ts';

interface LanguageSwitchProps {
    value: Language;
    onChange: (language: Language) => void;
    /** [EN] The word "Language" in the current language. [RU] Слово «Язык» на текущем языке. */
    label: string;
    className?: string;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ value, onChange, label, className = '' }) => (
    <label className={className}>
        <span aria-hidden="true">🌐</span>
        <select value={value} aria-label={label} onChange={event => onChange(event.target.value as Language)}>
            {LANGUAGES.map(language => (
                <option key={language.code} value={language.code} lang={language.code} dir={language.dir}>{language.name}</option>
            ))}
        </select>
    </label>
);

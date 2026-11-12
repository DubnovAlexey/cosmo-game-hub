// [EN] FILE: games/preferans/components/PreferansGame.tsx — the preferans island: it picks the interface language
//      (saved choice → browser → English), loads only that language's texts, sets the text direction (Hebrew is
//      right-to-left) and renders the table. Switching the language reloads only the texts: the pool continues.
// [RU] ФАЙЛ: остров преферанса — выбирает язык интерфейса (сохранённый выбор → браузер → английский), загружает
//      тексты только этого языка, ставит направление текста (иврит — справа налево) и рисует стол. Смена языка
//      меняет только тексты: пуля продолжается.
import React, { useEffect, useState } from 'react';
// [EN] The lair's two fonts, bundled with the game (no font service): the club scribe's quill «Marck Script» — a slanted
//      calligraphic hand — for the title, names, questions, notes and the score sheet, «Cormorant Garamond» of a gothic
//      novel for the small print and the engraved plaques. Each file is a per-alphabet subset; the browser loads only
//      those it needs. (The dripping «Rubik Wet Paint» left on 09.11.2026 — DESIGN_CONCEPT_RU.md bans cheap horror
//      letters; the Church Slavonic «Ponomar» left the same evening — it read like a children's fairy tale, Alexey.)
// [RU] Два шрифта логова, в сборке игры (без сервиса шрифтов): перо писаря клуба «Marck Script» — наклонный
//      каллиграфический почерк — для заголовка, имён, вопросов, заметок и листа пули, «Cormorant Garamond» готического
//      романа для мелкого текста и гравированных табличек. Каждый файл — подмножество одного алфавита; браузер грузит
//      только нужные. (Стекающий «Rubik Wet Paint» ушёл 09.11.2026 — DESIGN_CONCEPT_RU.md запрещает дешёвые «страшные»
//      буквы; церковнославянский «Ponomar» ушёл тем же вечером — читался как детская сказка, Алексей.)
import '@fontsource/marck-script/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import { directionOf } from '@shared/i18n/languages';
import { useLanguage } from '@shared/i18n/useLanguage';
import { Surprises } from '@shared/surprises/Surprises';
import { loadDictionary, type DictionaryFactory } from '../i18n/index.ts';
import { PreferansTable } from './PreferansTable';
import styles from './Preferans.module.css';

export const PreferansGame: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    // [EN] A language is a function of the company at the table; the table applies it to its current cast.
    // [RU] Язык — функция от компании за столом; стол применяет её к своему составу.
    const [factory, setFactory] = useState<{ language: string; make: DictionaryFactory } | null>(null);
    useEffect(() => {
        let alive = true;
        loadDictionary(language).then(make => { if (alive) setFactory({ language, make }); });
        return () => { alive = false; };
    }, [language]);
    // [EN] The first texts arrive in a few milliseconds; until then an empty room keeps the layout.
    // [RU] Первые тексты приходят за несколько миллисекунд; до тех пор пустая комната держит раскладку.
    if (!factory) return <div className={styles.room} aria-busy="true" />;
    return (
        <div lang={factory.language} dir={directionOf(language)}>
            <PreferansTable language={language} onLanguage={setLanguage} texts={factory.make} />
            <Surprises set="preferans" />
        </div>
    );
};

export default PreferansGame;

// [EN] FILE: games/preferans/components/PreferansGame.tsx — the preferans island: it picks the interface language
//      (saved choice → browser → English), loads only that language's texts, sets the text direction (Hebrew is
//      right-to-left) and renders the table. Switching the language reloads only the texts: the pool continues.
// [RU] ФАЙЛ: остров преферанса — выбирает язык интерфейса (сохранённый выбор → браузер → английский), загружает
//      тексты только этого языка, ставит направление текста (иврит — справа налево) и рисует стол. Смена языка
//      меняет только тексты: пуля продолжается.
import React, { useEffect, useState } from 'react';
import { directionOf } from '@shared/i18n/languages';
import { useLanguage } from '@shared/i18n/useLanguage';
import { TextsContext, loadDictionary, type Dictionary } from '../i18n/index.ts';
import { PreferansTable } from './PreferansTable';
import styles from './Preferans.module.css';

export const PreferansGame: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    const [texts, setTexts] = useState<Dictionary | null>(null);
    useEffect(() => {
        let alive = true;
        loadDictionary(language).then(loaded => { if (alive) setTexts(loaded); });
        return () => { alive = false; };
    }, [language]);
    // [EN] The first texts arrive in a few milliseconds; until then an empty room keeps the layout.
    // [RU] Первые тексты приходят за несколько миллисекунд; до тех пор пустая комната держит раскладку.
    if (!texts) return <div className={styles.room} aria-busy="true" />;
    return (
        <TextsContext.Provider value={texts}>
            <div lang={texts.language} dir={directionOf(texts.language)}>
                <PreferansTable language={language} onLanguage={setLanguage} />
            </div>
        </TextsContext.Provider>
    );
};

export default PreferansGame;

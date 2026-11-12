// [EN] FILE: games/poker/components/PokerGame.tsx — the poker island: it picks the interface language (saved choice →
//      browser → English, shared with the hub and the other games), loads only that language's texts, sets the text
//      direction (Hebrew is right-to-left) and renders the table. The fonts are the lair's: the scribe's quill and the
//      gothic-novel serif, bundled with the game.
// [RU] ФАЙЛ: остров покера: выбирает язык интерфейса (сохранённый выбор → браузер → английский, общий с хабом и
//      другими играми), загружает тексты только этого языка, ставит направление текста (иврит — справа налево) и
//      рисует стол. Шрифты — логова: перо писаря и антиква готического романа, в сборке игры.
import React, { useEffect, useState } from 'react';
import '@fontsource/marck-script/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import { directionOf } from '@shared/i18n/languages';
import { useLanguage } from '@shared/i18n/useLanguage';
import { Surprises } from '@shared/surprises/Surprises';
import { loadPokerTexts, type PokerTexts } from '../i18n';
import { PokerTable } from './PokerTable';
import styles from './Poker.module.css';

export const PokerGame: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    const [texts, setTexts] = useState<PokerTexts | null>(null);
    useEffect(() => {
        let alive = true;
        loadPokerTexts(language).then(next => { if (alive) setTexts(next); });
        return () => { alive = false; };
    }, [language]);
    if (!texts) return <div className={styles.room} aria-busy="true" />;
    return (
        <div lang={texts.language} dir={directionOf(language)}>
            <PokerTable language={language} onLanguage={setLanguage} texts={texts} />
            <Surprises set="poker" />
        </div>
    );
};

export default PokerGame;

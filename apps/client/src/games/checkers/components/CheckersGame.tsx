// [EN] FILE: games/checkers/components/CheckersGame.tsx — the door of draughts: it loads the texts of the game and
//      the names and biographies of the lair's heroes in the reader's language (only that language is downloaded),
//      sets the direction of the page for Hebrew and shows the room.
// [RU] ФАЙЛ: вход в шашки: загружает тексты игры и имена с биографиями героев логова на языке читателя (скачивается
//      только этот язык), задаёт направление страницы для иврита и показывает комнату.
import React, { useEffect, useState } from 'react';
import '@fontsource/marck-script/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import { loadCharacterTexts, type CharacterTexts } from '@shared/characters/texts';
import { directionOf } from '@shared/i18n/languages';
import { useLanguage } from '@shared/i18n/useLanguage';
import { Surprises } from '@shared/surprises/Surprises';
import { loadCheckersTexts, type CheckersTexts } from '../i18n';
import { CheckersRoom } from './CheckersRoom';
import styles from './Checkers.module.css';

export const CheckersGame: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    const [loaded, setLoaded] = useState<{ texts: CheckersTexts; people: CharacterTexts } | null>(null);
    useEffect(() => {
        let alive = true;
        void Promise.all([loadCheckersTexts(language), loadCharacterTexts(language)]).then(([texts, people]) => { if (alive) setLoaded({ texts, people }); });
        return () => { alive = false; };
    }, [language]);
    if (!loaded) return <div className={styles.room} aria-busy="true" />;
    return (
        <div lang={loaded.texts.language} dir={directionOf(language)}>
            <CheckersRoom language={language} onLanguage={setLanguage} texts={loaded.texts} people={loaded.people} />
            <Surprises set="checkers" />
        </div>
    );
};

export default CheckersGame;

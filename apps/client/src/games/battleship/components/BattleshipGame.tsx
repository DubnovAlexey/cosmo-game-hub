// [EN] FILE: games/battleship/components/BattleshipGame.tsx — the door of the sea battle: it loads the texts of the
//      game and the names and biographies of the lair's heroes in the reader's language (only that language is
//      downloaded), sets the direction of the page for Hebrew and shows the room.
// [RU] ФАЙЛ: вход в морской бой: загружает тексты игры и имена с биографиями героев логова на языке читателя
//      (скачивается только этот язык), задаёт направление страницы для иврита и показывает комнату.
import React, { useEffect, useState } from 'react';
import '@fontsource/marck-script/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import { loadCharacterTexts, type CharacterTexts } from '@shared/characters/texts';
import { directionOf } from '@shared/i18n/languages';
import { useLanguage } from '@shared/i18n/useLanguage';
import { loadBattleTexts, type BattleTexts } from '../i18n';
import { BattleRoom } from './BattleRoom';
import styles from './Battleship.module.css';

export const BattleshipGame: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    const [loaded, setLoaded] = useState<{ texts: BattleTexts; people: CharacterTexts } | null>(null);
    useEffect(() => {
        let alive = true;
        void Promise.all([loadBattleTexts(language), loadCharacterTexts(language)]).then(([texts, people]) => { if (alive) setLoaded({ texts, people }); });
        return () => { alive = false; };
    }, [language]);
    if (!loaded) return <div className={styles.room} aria-busy="true" />;
    return (
        <div lang={loaded.texts.language} dir={directionOf(language)}>
            <BattleRoom language={language} onLanguage={setLanguage} texts={loaded.texts} people={loaded.people} />
        </div>
    );
};

export default BattleshipGame;

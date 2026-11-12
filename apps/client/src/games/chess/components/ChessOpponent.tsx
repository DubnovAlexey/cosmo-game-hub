// [EN] FILE: games/chess/components/ChessOpponent.tsx — who sits across the board: one of the lair's company (the same
//      heroes as at the card tables — shared/characters), a new one for every game. The small portrait grows two
//      and a half times under the mouse, a press opens the hero's card with the biography
//      (shared/components/CharacterCard); «Another opponent» seats somebody else. The strength of the play is set
//      separately (DifficultySelector): the hero is the face of the engine, not its level.
// [RU] ФАЙЛ: кто сидит по ту сторону доски: один из компании логова (те же герои, что за карточными столами, —
//      shared/characters), на каждую партию новый. Маленький портрет под мышью вырастает в два с половиной раза,
//      нажатие раскрывает карточку героя с биографией (shared/components/CharacterCard); «Другой соперник» сажает
//      кого-то ещё. Сила игры задаётся отдельно (DifficultySelector): герой — лицо движка, а не его уровень.
import React, { useEffect, useState } from 'react';
import { CHARACTER_IDS, characterFacts, type CharacterId } from '@shared/characters/roster';
import { loadCharacterTexts, type CharacterTexts } from '@shared/characters/texts';
import { CharacterFace } from '@shared/components/CharacterCard';
import type { Language } from '@shared/i18n/languages';
import { useLanguage } from '@shared/i18n/useLanguage';
import styles from './Chess.module.css';

export type OpponentId = Exclude<CharacterId, 'dummy'>;

interface Words {
    readonly opponent: string;
    readonly about: (name: string) => string;
    readonly close: string;
    readonly another: string;
    readonly dweller: string;
    readonly guest: string;
    readonly thinking: string;
}
const WORDS: Readonly<Record<Language, Words>> = {
    ru: { opponent: 'Ваш соперник', about: name => `О герое: ${name}`, close: 'Закрыть', another: 'Другой соперник', dweller: 'обитатель склепа', guest: 'гость склепа', thinking: 'думает…' },
    en: { opponent: 'Your opponent', about: name => `About ${name}`, close: 'Close', another: 'Another opponent', dweller: 'dweller of the crypt', guest: 'guest of the crypt', thinking: 'thinking…' },
    he: { opponent: 'היריב שלך', about: name => `על ${name}`, close: 'סגירה', another: 'יריב אחר', dweller: 'דייר הקריפטה', guest: 'אורח הקריפטה', thinking: 'חושב…' },
    es: { opponent: 'Tu rival', about: name => `Sobre ${name}`, close: 'Cerrar', another: 'Otro rival', dweller: 'habitante de la cripta', guest: 'invitado de la cripta', thinking: 'piensa…' },
    fr: { opponent: 'Votre adversaire', about: name => `À propos de ${name}`, close: 'Fermer', another: 'Un autre adversaire', dweller: 'habitant de la crypte', guest: 'invité de la crypte', thinking: 'réfléchit…' },
};

/** [EN] Somebody of the lair at random, not the one who sat here before. [RU] Кто-то из логова наугад, но не тот, кто сидел здесь только что. */
export function pickOpponent(previous: OpponentId | null = null, random: () => number = Math.random): OpponentId {
    const others = CHARACTER_IDS.filter(id => id !== previous);
    return others[Math.floor(random() * others.length)] ?? CHARACTER_IDS[0];
}

export const ChessOpponent: React.FC<{ id: OpponentId; thinking: boolean; onAnother: () => void }> = ({ id, thinking, onAnother }) => {
    const [language] = useLanguage();
    const [texts, setTexts] = useState<CharacterTexts | null>(null);
    useEffect(() => {
        let alive = true;
        void loadCharacterTexts(language).then(loaded => { if (alive) setTexts(loaded); });
        return () => { alive = false; };
    }, [language]);
    const words = WORDS[language];
    if (!texts) return <div className={styles['opponent']} aria-busy="true" />;
    const { name, bio } = texts[id];
    return (
        <div className={styles['opponent']} dir={language === 'he' ? 'rtl' : 'ltr'}>
            <CharacterFace className={styles['opponent-face']} faceClassName={styles['opponent-portrait']} side="start" label={words.about(name)} closeLabel={words.close}
                story={{ id, name, bio, quote: texts[id].quote, tag: characterFacts(id).guest ? words.guest : words.dweller }} />
            <div className={styles['opponent-text']}>
                <span className={styles['opponent-label']}>{words.opponent}</span>
                <span className={styles['opponent-name']}>{name}{thinking && <em> · {words.thinking}</em>}</span>
            </div>
            <button type="button" className={styles['opponent-another']} onClick={onAnother}>{words.another}</button>
        </div>
    );
};

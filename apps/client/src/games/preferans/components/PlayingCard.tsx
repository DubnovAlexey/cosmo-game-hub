// [EN] FILE: games/preferans/components/PlayingCard.tsx — one card drawn in CSS: face (rank, suit) or back. Corner
//      labels and the spoken name follow the language (Т/Д/К/В in Russian decks, A/Q/K/J in English ones).
//      When poker arrives this component moves to shared/components (it is the second card game).
// [RU] ФАЙЛ: одна карта, нарисованная на CSS: лицо (достоинство, масть) или рубашка. Значки в углах и название
//      для экранного диктора — на языке игрока (Т/Д/К/В в русской колоде, A/Q/K/J в английской).
//      Когда появится покер (вторая карточная игра), компонент переедет в shared/components.
import React from 'react';
import { SUIT_SYMBOLS, rankOf, suitOf, type Card } from '../engine/index.ts';
import { useTexts } from '../i18n/index.ts';
import styles from './Preferans.module.css';

export type CardLook = 'normal' | 'playable' | 'blocked' | 'selected';

interface PlayingCardProps {
    /** [EN] null = face down. [RU] null — рубашкой вверх. */
    card: Card | null;
    small?: boolean;
    look?: CardLook;
    onClick?: () => void;
    className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, small = false, look = 'normal', onClick, className = '' }) => {
    const t = useTexts();
    const classes = [styles.card, small ? styles.cardSmall : '', look !== 'normal' ? styles[`card-${look}`] : '', className];
    if (card === null) return <div className={[...classes, styles.cardBack].join(' ')} aria-hidden="true" />;
    const suit = suitOf(card);
    const rank = t.cards.corners[rankOf(card)];
    const symbol = SUIT_SYMBOLS[suit];
    const name = t.cards.name(rankOf(card), suit);
    const colour = suit === 2 || suit === 3 ? styles.cardRed : styles.cardBlack;
    const face = (
        <>
            <span className={styles.cardCorner}>{rank}<br />{symbol}</span>
            <span className={styles.cardCenter} aria-hidden="true">{symbol}</span>
            <span className={`${styles.cardCorner} ${styles.cardCornerBottom}`} aria-hidden="true">{rank}<br />{symbol}</span>
        </>
    );
    const faceClass = [...classes, colour].join(' ');
    if (onClick) {
        return (
            <button type="button" className={faceClass} onClick={onClick} disabled={look === 'blocked'}
                aria-label={name} aria-pressed={look === 'selected' ? true : undefined}>
                {face}
            </button>
        );
    }
    return <div className={faceClass} role="img" aria-label={name}>{face}</div>;
};

// [EN] FILE: games/preferans/components/PlayerSeat.tsx — a player at the table: name, role, tricks, last word
//      and the hand (face up for you and for open hands, card backs otherwise).
// [RU] ФАЙЛ: игрок за столом — имя, роль, взятки, последнее слово и рука (лицом для вас и открытых рук,
//      иначе рубашкой).
import React from 'react';
import { countCards, type Card, type CardSet } from '../engine/index.ts';
import { useTexts } from '../i18n/index.ts';
import { PlayingCard, type CardLook } from './PlayingCard';
import { sortForHand } from './format';
import styles from './Preferans.module.css';

interface PlayerSeatProps {
    name: string;
    position: 'bottom' | 'left' | 'right';
    hand: CardSet;
    visible: boolean;
    isTurn: boolean;
    thinking: boolean;
    role: string | null;
    isDeclarer: boolean;
    tricks: number | null;
    bubble: string | null;
    /** [EN] Cards you may click now (play or discard). [RU] Карты, по которым сейчас можно щёлкнуть. */
    clickable: ReadonlySet<Card> | null;
    selected: readonly Card[];
    onCard: (card: Card) => void;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
    name, position, hand, visible, isTurn, thinking, role, isDeclarer, tricks, bubble, clickable, selected, onCard,
}) => {
    const t = useTexts();
    const area = position === 'bottom' ? styles.seatBottom : position === 'left' ? styles.seatLeft : styles.seatRight;
    const handClass = position === 'bottom' ? styles.hand : visible ? `${styles.hand} ${styles.handOpenBot}` : `${styles.hand} ${styles.handBots}`;
    const cards = visible ? sortForHand(hand) : Array.from({ length: countCards(hand) }, () => null);
    const lookOf = (card: Card): CardLook => {
        if (selected.includes(card)) return 'selected';
        if (!clickable) return 'normal';
        return clickable.has(card) ? 'playable' : 'blocked';
    };
    return (
        <section className={`${styles.seat} ${area} ${isTurn ? styles.seatTurn : ''}`} aria-label={`${name}${role ? `, ${role}` : ''}`}>
            {position === 'bottom' && <Hand className={handClass} cards={cards} small={false} lookOf={lookOf} clickable={clickable} onCard={onCard} />}
            <div className={styles.seatHeader}>
                <span className={styles.seatName}>{name}</span>
                {role && <span className={`${styles.badge} ${isDeclarer ? styles.badgeDeclarer : ''}`}>{role}</span>}
                {tricks !== null && <span className={styles.tricks}>{t.seat.tricks(tricks)}</span>}
                {bubble && <span className={styles.bubble}>{bubble}</span>}
                {thinking && <span className={styles.thinking}>{t.seat.thinking}</span>}
            </div>
            {position !== 'bottom' && <Hand className={handClass} cards={cards} small={!visible} lookOf={lookOf} clickable={clickable} onCard={onCard} />}
        </section>
    );
};

interface HandProps {
    className: string;
    cards: (Card | null)[];
    small: boolean;
    lookOf: (card: Card) => CardLook;
    clickable: ReadonlySet<Card> | null;
    onCard: (card: Card) => void;
}

const Hand: React.FC<HandProps> = ({ className, cards, small, lookOf, clickable, onCard }) => (
    <div className={className}>
        {cards.map((card, index) => (card === null
            ? <PlayingCard key={`back-${index}`} card={null} small={small} />
            : <PlayingCard key={card} card={card} small={small} look={lookOf(card)} onClick={clickable ? () => onCard(card) : undefined} />))}
    </div>
);

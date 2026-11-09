// [EN] FILE: games/preferans/components/PlayerSeat.tsx — a player at the table: the portrait of a dweller of the lair
//      in a gothic frame (a click opens the biography), name plaque, role, last word, the won tricks lying in a snake
//      of small stacks, and the hand (face up for you and for open hands, card backs otherwise).
// [RU] ФАЙЛ: игрок за столом — портрет обитателя логова в готической рамке (по нажатию — биография), табличка с
//      именем, роль, последнее слово, взятые взятки змейкой маленьких стопок и рука (лицом для вас и открытых рук,
//      иначе рубашкой).
import React, { useEffect, useId, useState } from 'react';
import { withBase } from '@shell/utils/withBase';
import { countCards, type Card, type CardSet } from '../engine/index.ts';
import { characterInfo, portraitPath, type CharacterId, type CharacterInfo } from '../characters/roster.ts';
import { useTexts, type Dictionary } from '../i18n/index.ts';
import { PlayingCard, type CardLook } from './PlayingCard';
import { sortForHand } from './format';
import styles from './Preferans.module.css';

interface PlayerSeatProps {
    name: string;
    position: 'bottom' | 'left' | 'right';
    /** [EN] Who sits here (null for you). [RU] Кто здесь сидит (null — вы). */
    character: CharacterId | null;
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
    name, position, character, hand, visible, isTurn, thinking, role, isDeclarer, tricks, bubble, clickable, selected, onCard,
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
    const header = (
        <div className={styles.seatInfo}>
            <div className={styles.seatHeader}>
                <span className={styles.seatName}>{name}</span>
                {role && <span className={`${styles.badge} ${isDeclarer ? styles.badgeDeclarer : ''}`}>{role}</span>}
                {bubble && <span className={styles.bubble}>{bubble}</span>}
                {thinking && <span className={styles.thinking}>{t.seat.thinking}</span>}
            </div>
            {tricks !== null && <TrickPile count={tricks} label={t.seat.tricks(tricks)} />}
        </div>
    );
    return (
        <section className={`${styles.seat} ${area} ${isTurn ? styles.seatTurn : ''}`} aria-label={`${name}${role ? `, ${role}` : ''}`}>
            {position === 'bottom' && <Hand className={handClass} cards={cards} small={false} lookOf={lookOf} clickable={clickable} onCard={onCard} />}
            {character ? (
                <div className={`${styles.seatTop} ${position === 'right' ? styles.seatTopRight : ''}`}>
                    <Portrait id={character} name={name} thinking={thinking} alignRight={position === 'right'} />
                    {header}
                </div>
            ) : header}
            {position !== 'bottom' && <Hand className={handClass} cards={cards} small={!visible} lookOf={lookOf} clickable={clickable} onCard={onCard} />}
        </section>
    );
};

// [EN] The portrait in a gothic frame: bat wings above, a skull below; it glows like a candle while its owner
//      thinks. A click opens the biography on a scrap of parchment; Escape or a second click closes it.
// [RU] Портрет в готической рамке: сверху крылья летучей мыши, снизу череп; пока хозяин думает, рамка светится,
//      как свеча. Нажатие открывает биографию на клочке пергамента; Escape или повторное нажатие закрывают.
const Portrait: React.FC<{ id: CharacterId; name: string; thinking: boolean; alignRight: boolean }> = ({ id, name, thinking, alignRight }) => {
    const t = useTexts();
    const [open, setOpen] = useState(false);
    const bioId = useId();
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);
    useEffect(() => { setOpen(false); }, [id]);
    const text = t.characters[id];
    return (
        <div className={styles.portraitWrap}>
            <button type="button" className={`${styles.portrait} ${thinking ? styles.portraitThinking : ''}`}
                aria-expanded={open} aria-controls={bioId} aria-label={t.portrait.about(name)} onClick={() => setOpen(value => !value)}>
                <img src={withBase(portraitPath(id))} alt="" loading="lazy" decoding="async" draggable={false} />
            </button>
            {open && (
                <div id={bioId} className={`${styles.bio} ${alignRight ? styles.bioRight : ''}`} role="dialog" aria-label={t.portrait.about(name)}>
                    <p className={styles.bioName}>{text.name}</p>
                    <p className={styles.bioTag}>{characterInfo(id).guest ? t.portrait.guest : t.portrait.dweller}</p>
                    <p className={styles.bioText}>{text.bio}</p>
                    <ul className={styles.bioManner}>
                        {mannerOf(characterInfo(id), t).map(([label, value]) => <li key={label}><b>{label}:</b> {value}</li>)}
                    </ul>
                    <button type="button" className={styles.button} onClick={() => setOpen(false)}>{t.portrait.close}</button>
                </div>
            )}
        </div>
    );
};

/** [EN] The character's manner in four short words, read from its play style. [RU] Манера персонажа в четырёх словах — из его стиля игры. */
export function mannerOf(info: CharacterInfo, t: Dictionary): (readonly [string, string])[] {
    const words = t.portrait.manner;
    const { boldness, whistCaution, misereNerve } = info.style;
    return [
        [words.bidding, boldness >= 0.25 ? words.bold : boldness <= -0.15 ? words.careful : words.even],
        [words.whist, whistCaution <= 0.88 ? words.eager : whistCaution >= 1.1 ? words.cautious : words.calculated],
        [words.misere, misereNerve >= 2 ? words.loves : misereNerve >= 1 ? words.sometimes : words.cleanOnly],
        [words.pace, info.effort >= 1.25 ? words.slow : info.effort <= 0.85 ? words.fast : words.moderate],
    ];
}

// [EN] Won tricks: one small squared stack per trick, each across the one before, and the number in a wax seal.
// [RU] Взятые взятки: по маленькой стопке на взятку, каждая поперёк предыдущей, и число в сургучной печати.
const TrickPile: React.FC<{ count: number; label: string }> = ({ count, label }) => (
    <span className={styles.pile} role="img" aria-label={label}>
        <span className={styles.pileCards}>
            {Array.from({ length: count }, (_, index) => <span key={index} className={`${styles.pileTrick} ${index % 2 === 1 ? styles.pileAcross : ''}`} />)}
        </span>
        <span className={`${styles.pileCount} ${count === 0 ? styles.pileEmpty : ''}`} aria-hidden="true">{count}</span>
    </span>
);

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

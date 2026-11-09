// [EN] FILE: games/preferans/components/PlayerSeat.tsx — a player at the table: the portrait of a dweller of the lair
//      in a cast silver frame (a click opens the biography), name plaque, role, last word, the hand (face up for you
//      and for open hands, card backs otherwise) and the won tricks on the cloth, each its own stack face down.
// [RU] ФАЙЛ: игрок за столом — портрет обитателя логова в литой серебряной рамке (по нажатию — биография), табличка
//      с именем, роль, последнее слово, рука (лицом для вас и открытых рук, иначе рубашкой) и взятые взятки на
//      сукне, каждая — отдельной стопкой рубашкой вверх.
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
    /** [EN] Where the player sits; four at the table one sits on top. [RU] Где сидит игрок; вчетвером один сидит сверху. */
    position: 'bottom' | 'left' | 'top' | 'right';
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
    /** [EN] Bombs of this player (Classic): his next game costs ×2 for each. [RU] Бомбы игрока (Классика): каждая удваивает его следующую игру. */
    bombs?: number;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
    name, position, character, hand, visible, isTurn, thinking, role, isDeclarer, tricks, bubble, clickable, selected, onCard, bombs = 0,
}) => {
    const t = useTexts();
    const area = { bottom: styles.seatBottom, left: styles.seatLeft, top: styles.seatNorth, right: styles.seatRight }[position];
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
                {bombs > 0 && (
                    <span className={styles.bombs} role="img" aria-label={t.extra.bombs(bombs)} title={t.extra.bombs(bombs)}>
                        {Array.from({ length: bombs }, (_, index) => <Bomb key={index} />)}
                    </span>
                )}
                {bubble && <span className={styles.bubble}>{bubble}</span>}
                {thinking && <span className={styles.thinking}>{t.seat.thinking}</span>}
            </div>
        </div>
    );
    const pile = tricks !== null ? <TrickPile count={tricks} label={t.seat.tricks(tricks)} /> : null;
    return (
        <section className={`${styles.seat} ${area} ${isTurn ? styles.seatTurn : ''}`} aria-label={`${name}${role ? `, ${role}` : ''}`}>
            {position === 'bottom' && <Hand className={handClass} cards={cards} small={false} lookOf={lookOf} clickable={clickable} onCard={onCard} />}
            {character ? (
                <div className={styles.seatTop}>
                    <Portrait id={character} name={name} thinking={thinking} alignRight={position === 'right'} />
                    {header}
                </div>
            ) : (
                // [EN] Your plaque under the middle of the hand, your tricks to its left. [RU] Ваша табличка под серединой руки, взятки слева от неё.
                <div className={styles.seatFoot}>{pile ?? <span />}{header}<span /></div>
            )}
            {position !== 'bottom' && <Hand className={handClass} cards={cards} small={!visible} lookOf={lookOf} clickable={clickable} onCard={onCard} />}
            {character && pile}
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

// [EN] Won tricks on the cloth: every trick its own stack face down, alternately along and across, five to a row, so
//      they are counted at a glance; a silver coin says the number.
// [RU] Взятые взятки на сукне: каждая взятка — отдельная стопка рубашкой вверх, по очереди вдоль и поперёк, по пять в
//      ряд, чтобы считать одним взглядом; серебряная монета говорит число.
const TrickPile: React.FC<{ count: number; label: string }> = ({ count, label }) => (
    <span className={styles.tricks} role="img" aria-label={label}>
        {count > 0 && (
            <span className={styles.trickRow}>
                {Array.from({ length: count }, (_, index) => <span key={index} className={`${styles.trickStack} ${index % 2 === 1 ? styles.trickAcross : ''}`} />)}
            </span>
        )}
        <span className={`${styles.trickCount} ${count === 0 ? styles.trickCountEmpty : ''}`} aria-hidden="true">{count}</span>
    </span>
);

// [EN] A bomb: a black iron ball with a silver glint and a fuse that sparks. [RU] Бомба: чёрное чугунное ядро с серебряным бликом и искрящим фитилём.
const Bomb: React.FC = () => (
    <svg className={styles.bomb} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="14" r="8" fill="#16181c" stroke="#9097a1" strokeWidth="1" />
        <circle cx="7.8" cy="11.2" r="2.2" fill="#d8dbe0" opacity="0.55" />
        <path d="M15 8.5l2.5-2.5" stroke="#9097a1" strokeWidth="2" strokeLinecap="round" />
        <path d="M17.5 6c1-1.6 2.6-1.4 3.4-2.8" fill="none" stroke="#c9a35f" strokeWidth="1.2" strokeLinecap="round" />
        <circle className={styles.spark} cx="21" cy="3" r="1.8" fill="#ffcf7a" />
    </svg>
);

interface HandProps {
    className: string;
    cards: (Card | null)[];
    small: boolean;
    lookOf: (card: Card) => CardLook;
    clickable: ReadonlySet<Card> | null;
    onCard: (card: Card) => void;
}

// [EN] Every card sits in a slot as wide as the visible step of the fan; slots shrink when the column is narrow, so a
//      hand never spills over the middle of the table (where it would be hard to tap) on any screen.
// [RU] Каждая карта лежит в ячейке шириной с видимый шаг веера; на узкой колонке ячейки сжимаются, и рука никогда не
//      заходит на середину стола (где по ней трудно попасть пальцем или мышью) ни на каком экране.
const Hand: React.FC<HandProps> = ({ className, cards, small, lookOf, clickable, onCard }) => (
    <div className={className}>
        {cards.map((card, index) => (
            <span key={card === null ? `back-${index}` : card} className={styles.slot}>
                {card === null
                    ? <PlayingCard card={null} small={small} />
                    : <PlayingCard card={card} small={small} look={lookOf(card)} onClick={clickable ? () => onCard(card) : undefined} />}
            </span>
        ))}
    </div>
);

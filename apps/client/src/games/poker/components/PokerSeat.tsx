// [EN] FILE: games/poker/components/PokerSeat.tsx — one place at the poker table: the portrait (a press opens the
//      regular's line), the plaque with the name and the stack, the dealer button and the blinds, the two cards and
//      the bet in front of them. «Fold», «all-in», «thinking» and «out» are written across the cards, and the bet
//      keeps its own line even when there is none — so the place never changes size during a hand and cannot push
//      its neighbours. The portrait that grows and opens the hero's card is shared by all the games
//      (shared/components/CharacterCard).
// [RU] ФАЙЛ: одно место за покерным столом: портрет (нажатие раскрывает реплику завсегдатая), табличка с именем и
//      стеком, баттон и блайнды, две карты и ставка перед ними. «Фолд», «олл-ин», «думает» и «выбыл» пишутся поверх
//      карт, а у ставки своя строка, даже когда ставки нет, — поэтому место не меняет размер во время раздачи и не
//      толкает соседей. Портрет с увеличением и карточкой героя — общий для всех игр (shared/components/CharacterCard).
import React from 'react';
import { CharacterFace } from '@shared/components/CharacterCard';
import type { Card, SeatState } from '../engine/index.ts';
import type { PokerCharacterId } from '../characters';
import { usePokerTexts } from '../i18n';
import { PokerCard } from './PokerCard';
import type { SeatPlace } from './seating';
import styles from './Poker.module.css';

export type SeatStatus = 'out' | 'folded' | 'allIn' | 'thinking';

interface PokerSeatProps {
    readonly seat: SeatState;
    readonly place: SeatPlace;
    /** [EN] null — your own place: no portrait. [RU] null — ваше место: без портрета. */
    readonly character: PokerCharacterId | null;
    /** [EN] The stack and the bet, already written the way the language writes numbers. [RU] Стек и ставка, уже записанные так, как язык пишет числа. */
    readonly stack: string;
    readonly bet: string | null;
    /** [EN] Cards face up: yours always, the others' at the showdown. [RU] Карты лицом вверх: ваши всегда, чужие — на вскрытии. */
    readonly reveal: boolean;
    readonly winning: ReadonlySet<Card>;
    readonly status: SeatStatus | null;
    readonly onTurn: boolean;
    readonly dealer: boolean;
    readonly smallBlind: boolean;
    readonly bigBlind: boolean;
}

export const PokerSeat: React.FC<PokerSeatProps> = ({
    seat, place, character, stack, bet, reveal, winning, status, onTurn, dealer, smallBlind, bigBlind,
}) => {
    const t = usePokerTexts();
    const yours = character === null;
    // [EN] The large picture and the card grow toward the middle of the table: from the left corner on the left
    //      side, from the right corner on the right side.
    // [RU] Крупная картинка и карточка растут к середине стола: из левого угла на левой стороне, из правого — на правой.
    const rightSide = place.wide === 'e' || place.wide === 'ne';
    const side = place.wide === 'n' ? 'center' : rightSide ? 'end' : 'start';
    const name = character ? t.characters[character].name : t.seat.you;
    const classes = [
        styles.seat, yours ? styles.seatYours : '', onTurn ? styles.seatTurn : '',
        seat.folded ? styles.seatFolded : '', seat.out ? styles.seatOut : '',
    ].filter(Boolean).join(' ');
    const statusText = status === null ? null : status === 'out' ? t.seat.out : status === 'folded' ? t.seat.folded : status === 'allIn' ? t.seat.allIn : t.seat.thinking;
    const statusClasses = [styles.status, status === 'allIn' ? styles.statusAllIn : '', status === 'thinking' ? styles.statusThinking : ''].filter(Boolean).join(' ');
    return (
        <div className={classes} data-wide={place.wide} data-phone={place.phone}>
            <div className={styles.who}>
                {/* [EN] Under the mouse the whole picture grows two and a half times; a press opens the hero's card with
                         the biography and the poker line (shared/components/CharacterCard).
                    [RU] Под мышью вся картинка вырастает в два с половиной раза; нажатие раскрывает карточку героя с
                         биографией и покерной репликой (shared/components/CharacterCard). */}
                {character && (
                    <CharacterFace className={styles.face} faceClassName={styles.portrait} side={side} label={t.seat.about(name)} closeLabel={t.seat.closeAbout}
                        story={{ id: character, name, bio: t.characters[character].bio, note: t.characters[character].tagline }} />
                )}
                {/* [EN] The button and the blinds sit on the frame, outside the round picture that would clip them.
                    [RU] Баттон и блайнды сидят на рамке, вне круглой картинки, которая бы их обрезала. */}
                <span className={styles.badges} aria-hidden="true">
                    {dealer && <span className={styles.dealer} title={t.seat.dealer}>D</span>}
                    {smallBlind && <span className={styles.blind} title={t.seat.smallBlind}>{t.seat.smallBlind}</span>}
                    {bigBlind && <span className={styles.blind} title={t.seat.bigBlind}>{t.seat.bigBlind}</span>}
                </span>
                <div className={styles.plaque}>
                    <span className={styles.seatName}>{name}</span>
                    {/* [EN] A phone shows the chips as a number beside a chip: «1 500 в стеке» in some languages is
                             wider than the whole place. A screen reader hears the full phrase everywhere.
                        [RU] Телефон показывает фишки числом рядом с фишкой: «1 500 в стеке» на некоторых языках шире
                             всего места. Экранный диктор везде слышит полную фразу. */}
                    <span className={styles.seatStack}>
                        <span className={styles.stackWords}>{t.seat.stack(stack)}</span>
                        <span className={styles.stackNumber} aria-hidden="true"><i className={styles.chip} />{stack}</span>
                    </span>
                </div>
            </div>
            <div className={styles.hand}>
                <div className={styles.hole}>
                    {!seat.out && seat.hole.map(card => (
                        <PokerCard key={card} card={reveal ? card : null} size={yours ? 'hand' : 'small'} winning={reveal && winning.has(card)} />
                    ))}
                    {statusText && <span className={statusClasses}>{statusText}</span>}
                </div>
                <div className={styles.betSlot}>
                    {bet !== null && <span className={styles.bet}><span className={styles.chips} aria-hidden="true"><i /><i /><i /></span>{bet}</span>}
                </div>
            </div>
        </div>
    );
};

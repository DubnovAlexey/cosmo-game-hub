// [EN] FILE: games/poker/components/PokerSeat.tsx — one place at the poker table: the portrait (a press opens the
//      regular's line), the plaque with the name and the stack, the dealer button and the blinds, the two cards and
//      the bet in front of them. «Fold», «all-in», «thinking» and «out» are written across the cards, and the bet
//      keeps its own line even when there is none — so the place never changes size during a hand and cannot push
//      its neighbours. The line under the portrait is kept inside the screen by shared/hooks/useKeepOnScreen.
// [RU] ФАЙЛ: одно место за покерным столом: портрет (нажатие раскрывает реплику завсегдатая), табличка с именем и
//      стеком, баттон и блайнды, две карты и ставка перед ними. «Фолд», «олл-ин», «думает» и «выбыл» пишутся поверх
//      карт, а у ставки своя строка, даже когда ставки нет, — поэтому место не меняет размер во время раздачи и не
//      толкает соседей. Реплику под портретом держит внутри экрана shared/hooks/useKeepOnScreen.
import React, { useRef } from 'react';
import { useKeepOnScreen } from '@shared/hooks/useKeepOnScreen';
import { withBase } from '@shell/utils/withBase';
import type { Card, SeatState } from '../engine/index.ts';
import { portraitPath, type PokerCharacterId } from '../characters';
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
    readonly open: boolean;
    readonly onToggle: () => void;
}

export const PokerSeat: React.FC<PokerSeatProps> = ({
    seat, place, character, stack, bet, reveal, winning, status, onTurn, dealer, smallBlind, bigBlind, open, onToggle,
}) => {
    const t = usePokerTexts();
    const pod = useRef<HTMLDivElement>(null);
    const caption = useRef<HTMLParagraphElement>(null);
    useKeepOnScreen(caption, pod, open && character !== null, character);
    const yours = character === null;
    const name = character ? t.characters[character].name : t.seat.you;
    const classes = [
        styles.seat, yours ? styles.seatYours : '', onTurn ? styles.seatTurn : '',
        seat.folded ? styles.seatFolded : '', seat.out ? styles.seatOut : '', open ? styles.seatOpen : '',
    ].filter(Boolean).join(' ');
    const statusText = status === null ? null : status === 'out' ? t.seat.out : status === 'folded' ? t.seat.folded : status === 'allIn' ? t.seat.allIn : t.seat.thinking;
    const statusClasses = [styles.status, status === 'allIn' ? styles.statusAllIn : '', status === 'thinking' ? styles.statusThinking : ''].filter(Boolean).join(' ');
    return (
        <div ref={pod} className={classes} data-wide={place.wide} data-phone={place.phone}>
            <div className={styles.who}>
                {character && (
                    <button type="button" className={styles.portrait} aria-label={t.seat.about(name)} aria-expanded={open} onClick={onToggle}>
                        <img src={withBase(portraitPath(character))} alt="" loading="lazy" decoding="async" draggable={false} />
                    </button>
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
            {/* [EN] The line opens under the whole pod, centred; shared/hooks/useKeepOnScreen keeps it on the screen.
                [RU] Реплика раскрывается под всей группой, по центру; shared/hooks/useKeepOnScreen держит её на экране. */}
            {open && character && <p ref={caption} className={styles.bubble} role="note">{t.characters[character].tagline}</p>}
        </div>
    );
};

// [EN] FILE: games/preferans/components/TrickArea.tsx — the middle of the table: the current trick, or the last finished
//      one with its winner glowing, which then slides away by itself to the winner's pile; and the talon.
// [RU] ФАЙЛ: середина стола — текущая взятка или последняя сыгранная с подсвеченным победителем, которая потом сама
//      уезжает в стопку победителя; и прикуп.
import React from 'react';
import type { DealState, PlayedCard, Seat } from '../engine/index.ts';
import { useTexts } from '../i18n/index.ts';
import { PlayingCard } from './PlayingCard';
import styles from './Preferans.module.css';

// [EN] Where each seat's card lands: you at the bottom, the opponents left and right.
// [RU] Куда ложится карта каждого места: вы внизу, соперники слева и справа.
const SLOT: Record<Seat, string> = { 0: styles.slotBottom, 1: styles.slotLeft, 2: styles.slotRight };
// [EN] Where a finished trick goes: to its winner's pile. [RU] Куда уезжает сыгранная взятка: в стопку победителя.
const COLLECT: Record<Seat, string> = { 0: styles.collectBottom, 1: styles.collectLeft, 2: styles.collectRight };

export const TrickArea: React.FC<{ deal: DealState }> = ({ deal }) => {
    const t = useTexts();
    const live = deal.trick.length > 0;
    const finished = !live && deal.tricks.length > 0 ? deal.tricks[deal.tricks.length - 1] : null;
    const cards: readonly PlayedCard[] = live ? deal.trick : finished?.cards ?? [];
    // [EN] The same trick keeps the same keys from its first card to its collection, so cards do not jump again.
    // [RU] У одной взятки одни и те же ключи от первой карты до сбора, поэтому карты не прыгают заново.
    const trickIndex = live ? deal.tricks.length : deal.tricks.length - 1;
    const winner: Seat | null = finished?.winner ?? null;
    // [EN] All-pass: the talon card leading this trick (or the one that led the finished trick).
    // [RU] Распасы: карта прикупа, которая ведёт эту взятку (или вела сыгранную).
    const talonLead = live || !finished ? deal.trickLead : finished.lead;
    const showTalon = deal.phase === 'bidding' || deal.phase === 'declare' || deal.phase === 'whist' || deal.phase === 'whistReturn' || deal.phase === 'whistMode';
    const talonOpen = deal.phase !== 'bidding';
    const collecting = finished && deal.phase === 'play' ? `${styles.trickCollect} ${COLLECT[finished.winner]}` : '';
    return (
        <div className={styles.trickZone} aria-label={t.table.centre} aria-live="polite">
            {showTalon && (
                // [EN] No trick yet: the talon rests in the middle, clear of the hint line above it.
                // [RU] Взятки ещё нет: прикуп лежит по центру и не закрывает строку подсказки над ним.
                <div className={`${styles.trickSlot} ${styles.slotTalonRest}`}>
                    <div className={styles.talon} aria-label={talonOpen ? t.table.talonOpen : t.table.talonClosed}>
                        {deal.talon.map(card => <PlayingCard key={card} card={talonOpen ? card : null} />)}
                    </div>
                </div>
            )}
            {(cards.length > 0 || (talonLead !== null && deal.phase === 'play')) && (
                <div key={`trick-${trickIndex}`} className={`${styles.trickCards} ${collecting}`}>
                    {talonLead !== null && deal.phase === 'play' && (
                        <div className={`${styles.trickSlot} ${styles.slotTalon}`} aria-label={t.table.talonLeads}>
                            <PlayingCard card={talonLead} />
                        </div>
                    )}
                    {cards.map(({ seat, card }) => (
                        <div key={`${trickIndex}-${card}`} className={`${styles.trickSlot} ${SLOT[seat]} ${winner === seat ? styles.trickWinner : ''}`}>
                            <PlayingCard card={card} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

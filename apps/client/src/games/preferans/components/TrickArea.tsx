// [EN] FILE: games/preferans/components/TrickArea.tsx — the middle of the table: the current trick (or the
//      last finished one, with its winner glowing) and the talon.
// [RU] ФАЙЛ: середина стола — текущая взятка (или последняя сыгранная, победитель подсвечен) и прикуп.
import React from 'react';
import type { DealState, PlayedCard, Seat } from '../engine/index.ts';
import { useTexts } from '../i18n/index.ts';
import { PlayingCard } from './PlayingCard';
import styles from './Preferans.module.css';

// [EN] Where each seat's card lands: you at the bottom, the bots left and right.
// [RU] Куда ложится карта каждого места: вы внизу, боты слева и справа.
const SLOT: Record<Seat, string> = { 0: styles.slotBottom, 1: styles.slotLeft, 2: styles.slotRight };

export const TrickArea: React.FC<{ deal: DealState }> = ({ deal }) => {
    const t = useTexts();
    const finished = deal.trick.length === 0 && deal.tricks.length > 0 ? deal.tricks[deal.tricks.length - 1] : null;
    const cards: readonly PlayedCard[] = deal.trick.length > 0 ? deal.trick : finished?.cards ?? [];
    const winner: Seat | null = finished?.winner ?? null;
    // [EN] All-pass: the talon card leading this trick (or the one that led the finished trick).
    // [RU] Распасы: карта прикупа, которая ведёт эту взятку (или вела сыгранную).
    const talonLead = deal.trick.length > 0 || !finished ? deal.trickLead : finished.lead;
    const showTalon = deal.phase === 'bidding' || deal.phase === 'discard' || deal.phase === 'declare' || deal.phase === 'whist' || deal.phase === 'whistReturn' || deal.phase === 'whistMode';
    const talonOpen = deal.phase !== 'bidding';
    return (
        <div className={styles.trickZone} aria-label={t.table.centre} aria-live="polite">
            {showTalon && deal.phase !== 'discard' && (
                // [EN] No trick yet: the talon rests in the middle, clear of the hint line above it.
                // [RU] Взятки ещё нет: прикуп лежит по центру и не закрывает строку подсказки над ним.
                <div className={`${styles.trickSlot} ${styles.slotTalonRest}`}>
                    <div className={styles.talon} aria-label={talonOpen ? t.table.talonOpen : t.table.talonClosed}>
                        {deal.talon.map(card => <PlayingCard key={card} card={talonOpen ? card : null} />)}
                    </div>
                </div>
            )}
            {talonLead !== null && deal.phase === 'play' && (
                <div className={`${styles.trickSlot} ${styles.slotTalon}`} aria-label={t.table.talonLeads}>
                    <PlayingCard card={talonLead} />
                </div>
            )}
            {cards.map(({ seat, card }) => (
                <div key={`${deal.tricks.length}-${card}`} className={`${styles.trickSlot} ${SLOT[seat]} ${winner === seat ? styles.trickWinner : ''}`}>
                    <PlayingCard card={card} />
                </div>
            ))}
        </div>
    );
};

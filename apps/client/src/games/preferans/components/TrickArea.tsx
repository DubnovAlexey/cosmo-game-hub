// [EN] FILE: games/preferans/components/TrickArea.tsx — the middle of the table: the current trick, or the last finished
//      one with its winner glowing, which then slides away by itself to the winner's pile; and the talon. At a table
//      of four the talon card of an all-pass trick lies on the dealer's side, and a trick it takes goes to him.
// [RU] ФАЙЛ: середина стола — текущая взятка или последняя сыгранная с подсвеченным победителем, которая потом сама
//      уезжает в стопку победителя; и прикуп. Вчетвером карта прикупа на распасах лежит со стороны сдающего, а
//      взятая ею взятка уезжает к нему.
import React from 'react';
import type { DealState, PlayedCard, Seat } from '../engine/index.ts';
import { useTexts } from '../i18n/index.ts';
import { PlayingCard } from './PlayingCard';
import styles from './Preferans.module.css';

export type TablePosition = 'bottom' | 'left' | 'top' | 'right';

// [EN] Where a card lands and where a finished trick goes, by the table position of its player.
// [RU] Куда ложится карта и куда уезжает сыгранная взятка — по положению игрока за столом.
const SLOT: Record<TablePosition, string> = { bottom: styles.slotBottom, left: styles.slotLeft, top: styles.slotTop, right: styles.slotRight };
const COLLECT: Record<TablePosition, string> = { bottom: styles.collectBottom, left: styles.collectLeft, top: styles.collectTop, right: styles.collectRight };

interface TrickAreaProps {
    deal: DealState;
    /** [EN] The table position of each deal seat. [RU] Положение за столом каждого места раздачи. */
    positionOf: (seat: Seat) => TablePosition;
    /** [EN] Four at the table: where the dealer sits (his talon plays on all-pass). [RU] Вчетвером: где сидит сдающий. */
    dealerPosition: TablePosition | null;
}

export const TrickArea: React.FC<TrickAreaProps> = ({ deal, positionOf, dealerPosition }) => {
    const t = useTexts();
    const live = deal.trick.length > 0;
    const finished = !live && deal.tricks.length > 0 ? deal.tricks[deal.tricks.length - 1] : null;
    const cards: readonly PlayedCard[] = live ? deal.trick : finished?.cards ?? [];
    // [EN] The same trick keeps the same keys from its first card to its collection, so cards do not jump again.
    // [RU] У одной взятки одни и те же ключи от первой карты до сбора, поэтому карты не прыгают заново.
    const trickIndex = live ? deal.tricks.length : deal.tricks.length - 1;
    // [EN] All-pass: the talon card leading this trick (or the one that led the finished trick).
    // [RU] Распасы: карта прикупа, которая ведёт эту взятку (или вела сыгранную).
    const talonLead = live || !finished ? deal.trickLead : finished.lead;
    const talonWon = finished !== null && finished.winner === null;
    const showTalon = deal.phase === 'bidding' || deal.phase === 'declare' || deal.phase === 'whist' || deal.phase === 'whistReturn' || deal.phase === 'whistMode';
    const talonOpen = deal.phase !== 'bidding';
    const collectTo: TablePosition | null = finished ? (finished.winner === null ? dealerPosition ?? 'top' : positionOf(finished.winner)) : null;
    const collecting = collectTo && deal.phase === 'play' ? `${styles.trickCollect} ${COLLECT[collectTo]}` : '';
    // [EN] Three at the table the talon card only sets the suit and lies above the trick; four — it is the dealer's card.
    // [RU] Втроём карта прикупа только задаёт масть и лежит над взяткой; вчетвером это карта сдающего.
    const talonSlot = dealerPosition ? SLOT[dealerPosition] : styles.slotTalon;
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
                        <div className={`${styles.trickSlot} ${talonSlot} ${talonWon ? styles.trickWinner : ''}`} aria-label={t.table.talonLeads}>
                            <PlayingCard card={talonLead} />
                        </div>
                    )}
                    {cards.map(({ seat, card }) => (
                        <div key={`${trickIndex}-${card}`} className={`${styles.trickSlot} ${SLOT[positionOf(seat)]} ${finished?.winner === seat ? styles.trickWinner : ''}`}>
                            <PlayingCard card={card} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

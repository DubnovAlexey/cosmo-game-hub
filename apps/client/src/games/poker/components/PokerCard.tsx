// [EN] FILE: games/poker/components/PokerCard.tsx — one of the 52 cards drawn in CSS (the club's cream paper, ruby
//      and blackened-silver suits) or the club's back. The ranks are the international A K Q J 10; the spoken name
//      follows the language.
// [RU] ФАЙЛ: одна из 52 карт, нарисованная на CSS (кремовая бумага клуба, масти — рубин и черненое серебро), или
//      рубашка клуба. Достоинства — международные A K Q J 10; название для экранного диктора — на языке игрока.
import React from 'react';
import { SUIT_SYMBOLS, isRed, rankLabel, rankOf, suitOf, type Card } from '../engine/index.ts';
import { usePokerTexts } from '../i18n';
import styles from './Poker.module.css';

interface PokerCardProps {
    /** null = face down. */
    readonly card: Card | null;
    readonly size?: 'board' | 'hand' | 'small';
    readonly winning?: boolean;
    readonly dim?: boolean;
}

export const PokerCard: React.FC<PokerCardProps> = ({ card, size = 'board', winning = false, dim = false }) => {
    const t = usePokerTexts();
    const classes = [styles.card, size === 'hand' ? styles.cardHand : size === 'small' ? styles.cardSmall : '', winning ? styles.cardWinning : '', dim ? styles.cardDim : ''];
    if (card === null) return <div className={[...classes, styles.cardBack].join(' ')} role="img" aria-label={t.cards.back} />;
    const rank = rankLabel(rankOf(card));
    const symbol = SUIT_SYMBOLS[suitOf(card)];
    return (
        <div className={[...classes, isRed(card) ? styles.cardRed : styles.cardBlack].join(' ')} role="img" aria-label={t.cards.name(rankOf(card), suitOf(card))}>
            {/* [EN] A small card of another player shows only its rank and suit, as large as the card allows: at
                     the showdown they must be readable on a phone.
                [RU] Маленькая карта другого игрока показывает только достоинство и масть — так крупно, как
                     позволяет карта: на вскрытии их нужно прочитать и с телефона. */}
            {size === 'small'
                ? <span className={styles.cardMini} aria-hidden="true">{rank}<br />{symbol}</span>
                : <><span className={styles.cardCorner} aria-hidden="true">{rank}<br />{symbol}</span><span className={styles.cardCenter} aria-hidden="true">{symbol}</span></>}
        </div>
    );
};

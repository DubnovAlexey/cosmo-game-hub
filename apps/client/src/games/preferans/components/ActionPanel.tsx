// [EN] FILE: games/preferans/components/ActionPanel.tsx — your decisions at the table: bid, discard, final
//      contract (or conceding, where the table allows it), whist, open/closed whist and the card to play.
//      Only legal choices are enabled; every text comes from the current language.
// [RU] ФАЙЛ: ваши решения за столом — заявка, снос, окончательная игра (или уход, если стол это разрешает), вист,
//      вист в светлую или втёмную и ход. Доступны только разрешённые правилами варианты; все тексты — на текущем языке.
import React from 'react';
import {
    MISERE, MISERE_NO_TALON, NO_TRUMP, SUIT_SYMBOLS, bidOf, gameBid, isDarkBid, legalActions,
    type Action, type Bid, type Card, type DealSeating, type DealState, type Level, type Seat, type Strain, type WhistCall,
} from '../engine/index.ts';
import { useTexts, type Dictionary } from '../i18n/index.ts';
import { bidName } from './format';
import styles from './Preferans.module.css';

const LEVELS: readonly Level[] = [6, 7, 8, 9, 10];
const STRAINS: readonly Strain[] = [0, 1, 2, 3, NO_TRUMP];

interface ActionPanelProps {
    deal: DealState;
    /** [EN] Your deal seat; null while you sit on the talon (four at the table). [RU] Ваше место в раздаче; null, пока вы на прикупе. */
    humanSeat: Seat | null;
    /** [EN] Who sits in which deal seat: the texts speak of table players. [RU] Кто на каком месте раздачи: тексты говорят об игроках стола. */
    seating: DealSeating;
    isHumanTurn: boolean;
    selected: readonly Card[];
    act: (action: Action) => void;
    /** [EN] The table player who decides now (the dealer on the talon when he whists). [RU] Игрок стола, который решает сейчас. */
    actor: number | null;
    /** [EN] Your cards are open to you (false while they stay closed for dark calls). [RU] Ваши карты открыты вам (false, пока они закрыты ради тёмных заявок). */
    looked: boolean;
    onLook: () => void;
}

// [EN] The ladder as a grid: levels by rows, suits by columns; misère between eight and nine.
// [RU] Лестница заявок сеткой: уровни по строкам, масти по столбцам; мизер между восьмёркой и девяткой.
const BidGrid: React.FC<{ legal: ReadonlySet<Bid>; hold: Bid | null; onBid: (bid: Bid) => void; showMisere: boolean; showNoTalon?: boolean; t: Dictionary }> = ({ legal, hold, onBid, showMisere, showNoTalon = false, t }) => (
    <div className={styles.bidGrid} role="group" aria-label={t.bids.gridLabel} dir="ltr">
        {LEVELS.map(level => (
            <React.Fragment key={level}>
                {level === 9 && showMisere && (
                    <button type="button" className={styles.button} style={{ gridColumn: '1 / -1' }} disabled={!legal.has(MISERE)} onClick={() => onBid(MISERE)}>
                        {t.bids.misereButton}
                    </button>
                )}
                {level === 10 && showNoTalon && (
                    // [EN] Misère without the talon sits between the nines and the tens. [RU] Мизер без прикупа — между девятерными и десятерными.
                    <button type="button" className={styles.button} style={{ gridColumn: '1 / -1' }} disabled={!legal.has(MISERE_NO_TALON)} onClick={() => onBid(MISERE_NO_TALON)}>
                        {t.extra.misereNoTalonButton}
                    </button>
                )}
                {STRAINS.map(strain => {
                    const bid = gameBid(level, strain);
                    const name = bidName(bid, t);
                    return (
                        <button key={bid} type="button" className={`${styles.button} ${strain === 2 || strain === 3 ? styles.buttonRed : ''} ${bid === hold ? styles.buttonPrimary : ''}`}
                            disabled={!legal.has(bid)} onClick={() => onBid(bid)} aria-label={bid === hold ? t.bids.hold(name) : name}>
                            {level}{strain === NO_TRUMP ? t.bids.noTrump : SUIT_SYMBOLS[strain]}
                        </button>
                    );
                })}
            </React.Fragment>
        ))}
    </div>
);

export const ActionPanel: React.FC<ActionPanelProps> = ({ deal, humanSeat, seating, isHumanTurn, selected, act, actor, looked, onLook }) => {
    const t = useTexts();
    const seat = deal.turn;
    if (seat === null) return null;
    const player = (dealSeat: Seat): number => seating.players[dealSeat];
    // [EN] While bots speak, your closed cards can still be opened. [RU] Пока говорят боты, закрытые карты всё равно можно открыть.
    const lookButton = !looked && humanSeat !== null && !isDarkBid(deal.bidding.lastBid[humanSeat]) && (
        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={onLook}>{t.extra.lookAtCards}</button>
    );
    if (!isHumanTurn) {
        return (
            <div className={styles.panel}>
                <p className={styles.panelTitle}><span className={styles.thinking}>{t.actions.thinking(actor ?? 1)}</span></p>
                {lookButton && <div className={styles.row}>{lookButton}</div>}
            </div>
        );
    }
    const actions = legalActions(deal);
    const title = (text: string) => <p className={styles.panelTitle}>{text}</p>;
    const whistText: Record<WhistCall, string> = { whist: t.actions.whist, pass: t.actions.pass, half: t.actions.halfWhist };

    if (deal.phase === 'bidding') {
        const bids = actions.flatMap(action => (action.type === 'bid' ? [action.bid] : []));
        const legal = new Set(bids);
        const highest = deal.bidding.highest;
        const hold = highest !== null && legal.has(highest) ? highest : null;
        const ownDark = isDarkBid(deal.bidding.lastBid[seat]);
        if (!looked || ownDark) {
            // [EN] Cards still closed: only the dark words, or a look. After a dark bid: raise in the dark or pass.
            // [RU] Карты ещё закрыты: только тёмные слова или взгляд. После тёмной заявки — выше втёмную или пас.
            const darkPass = actions.some(action => action.type === 'pass' && action.dark);
            return (
                <div className={styles.panel}>
                    {title(ownDark ? t.extra.darkOnly : t.extra.darkQuestion)}
                    <div className={styles.row} role="group" aria-label={t.extra.darkRow}>
                        {bids.filter(isDarkBid).map(bid => (
                            <button key={bid} type="button" className={styles.button} onClick={() => act({ type: 'bid', seat, bid })}>{bidName(bid, t)}</button>
                        ))}
                        {darkPass && <button type="button" className={styles.button} onClick={() => act({ type: 'pass', seat, dark: true })}>{t.extra.darkPass}</button>}
                        {ownDark && <button type="button" className={styles.button} onClick={() => act({ type: 'pass', seat })}>{t.actions.pass}</button>}
                        {lookButton}
                    </div>
                </div>
            );
        }
        return (
            <div className={styles.panel}>
                {title(highest === null ? t.actions.yourBid : t.actions.someoneBids(player(deal.bidding.holder ?? 0), bidName(highest, t), hold !== null))}
                <BidGrid legal={legal} hold={hold} showMisere showNoTalon={deal.rules.misereNoTalon} t={t} onBid={bid => act({ type: 'bid', seat, bid })} />
                <div className={styles.row} style={{ marginTop: 10 }}>
                    <button type="button" className={styles.button} onClick={() => act({ type: 'pass', seat })}>{t.actions.pass}</button>
                </div>
            </div>
        );
    }
    if (deal.phase === 'misereShare') {
        return (
            <div className={styles.panel}>
                {title(t.extra.shareQuestion)}
                <div className={styles.row}>
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => act({ type: 'shareMisere', seat, share: true })}>{t.extra.share}</button>
                    <button type="button" className={styles.button} onClick={() => act({ type: 'shareMisere', seat, share: false })}>{t.extra.playAlone}</button>
                </div>
            </div>
        );
    }
    if (deal.phase === 'dealerWhist' && deal.whist) {
        const whist = deal.whist;
        const look = whist.dealerLook ?? null;
        return (
            <div className={styles.panel}>
                {title(look === null ? t.extra.dealerQuestion : t.extra.dealerWhistQuestion(player(look)))}
                <div className={styles.row}>
                    {look === null
                        ? whist.order.map(defender => (
                            <button key={defender} type="button" className={styles.button} onClick={() => act({ type: 'dealerLook', seat, defender })}>{t.extra.dealerHand(player(defender))}</button>
                        ))
                        : <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => act({ type: 'dealerWhist', seat, whist: true })}>{t.actions.whist}</button>}
                    <button type="button" className={styles.button} onClick={() => act({ type: 'dealerWhist', seat, whist: false })}>{t.actions.pass}</button>
                </div>
            </div>
        );
    }
    if (deal.phase === 'discard') {
        return (
            <div className={styles.panel}>
                {title(deal.winningBid === MISERE ? t.actions.discardMisere : t.actions.discardGame)}
                <div className={styles.row}>
                    <span className={styles.hint}>{t.actions.selected(selected.length)}</span>
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} disabled={selected.length !== 2}
                        onClick={() => act({ type: 'discard', seat, cards: [selected[0], selected[1]] })}>
                        {t.actions.discard}
                    </button>
                </div>
            </div>
        );
    }
    if (deal.phase === 'declare') {
        const legal = new Set(actions.flatMap(action => (action.type === 'declare' ? [action.bid] : [])));
        const canConcede = actions.some(action => action.type === 'concede');
        return (
            <div className={styles.panel}>
                {title(t.actions.nameGame(bidName(deal.winningBid ?? 0, t)))}
                <BidGrid legal={legal} hold={null} showMisere={false} t={t} onBid={bid => act({ type: 'declare', seat, bid })} />
                {canConcede && (
                    // [EN] The table allows giving up a hopeless game. [RU] Стол разрешает отказаться от безнадёжной игры.
                    <div className={styles.row} style={{ marginTop: 10 }}>
                        <button type="button" className={`${styles.button} ${styles.buttonRed}`} onClick={() => act({ type: 'concede', seat })} title={t.actions.concedeHint}>
                            {t.actions.concede(deal.rules.concedeTricks)}
                        </button>
                    </div>
                )}
            </div>
        );
    }
    if (deal.phase === 'whist') {
        const calls = actions.flatMap(action => (action.type === 'whist' ? [action.call] : []));
        const contract = deal.contract ? bidName(bidOf(deal.contract), t) : '';
        return (
            <div className={styles.panel}>
                {title(t.actions.whistQuestion(player(deal.declarer ?? 0), contract))}
                <div className={styles.row}>
                    {calls.map(call => (
                        <button key={call} type="button" className={`${styles.button} ${call === 'whist' ? styles.buttonPrimary : ''}`} onClick={() => act({ type: 'whist', seat, call })}>
                            {whistText[call]}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    if (deal.phase === 'whistReturn') {
        return (
            <div className={styles.panel}>
                {title(t.actions.returnQuestion(player(deal.whist?.order[1] ?? 0)))}
                <div className={styles.row}>
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => act({ type: 'returnWhist', seat, accept: true })}>{t.actions.takeBack}</button>
                    <button type="button" className={styles.button} onClick={() => act({ type: 'returnWhist', seat, accept: false })}>{t.actions.leaveHalf}</button>
                </div>
            </div>
        );
    }
    if (deal.phase === 'whistMode') {
        return (
            <div className={styles.panel}>
                {title(t.actions.modeQuestion)}
                <div className={styles.row}>
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => act({ type: 'whistMode', seat, open: true })}>{t.actions.open}</button>
                    <button type="button" className={styles.button} onClick={() => act({ type: 'whistMode', seat, open: false })}>{t.actions.closed}</button>
                    {actions.some(action => action.type === 'takeHalf') && (
                        // [EN] Whist–pass–half: a sure half instead of playing alone. [RU] Вист — пас — полвиста: верные полвиста вместо игры одному.
                        <button type="button" className={styles.button} onClick={() => act({ type: 'takeHalf', seat })}>{t.actions.halfWhist}</button>
                    )}
                </div>
            </div>
        );
    }
    if (deal.phase === 'play') {
        return (
            <div className={styles.panel}>
                {title(seat !== humanSeat ? t.actions.yourTurnFor(player(seat)) : t.actions.yourTurn)}
            </div>
        );
    }
    return null;
};

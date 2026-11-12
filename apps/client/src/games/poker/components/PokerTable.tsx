// [EN] FILE: games/poker/components/PokerTable.tsx — the poker room of the lair: the header with the blinds, the oval
//      table with the regulars around it (portraits, plaques, cards, bets on the cloth, the button and the blinds),
//      the board and the pot in the middle, the result of a hand with the winning five lit up, your decision tray,
//      the log of the hand, the tournament menu and its end. Who sits where is decided in seating.ts, one place is
//      drawn by PokerSeat.tsx.
// [RU] ФАЙЛ: покерная комната логова: шапка с блайндами, овальный стол с завсегдатаями вокруг (портреты, таблички,
//      карты, ставки на сукне, баттон и блайнды), доска и банк посередине, итог раздачи с подсвеченной выигравшей
//      пятёркой, ваш лоток решений, ход раздачи, меню турнира и его конец. Кто где сидит, решает seating.ts, одно
//      место рисует PokerSeat.tsx.
import React, { useMemo, useState } from 'react';
import { Finale } from '@shared/finale/Finale';
import { LanguageSwitch } from '@shared/components/LanguageSwitch';
import type { Language } from '@shared/i18n/languages';
import {
    SUIT_SYMBOLS, STRAIGHT_FLUSH, bestFive, categoryOf, describe, legalActions, potSize, rankLabel, rankOf, suitOf,
    type Card, type HandState, type HandValue, type LogEntry,
} from '../engine/index.ts';
import { characterOf } from '../characters';
import { HUMAN_SEAT, loadPokerSave, usePoker, type PokerSave } from '../hooks/usePoker';
import { PokerTextsContext, type PokerTexts, type Who } from '../i18n';
import { ActionTray } from './ActionTray';
import { PokerCard } from './PokerCard';
import { PokerSeat, type SeatStatus } from './PokerSeat';
import { seating } from './seating';
import { SetupMenu } from './SetupMenu';
import styles from './Poker.module.css';

interface PokerTableProps {
    readonly language: Language;
    readonly onLanguage: (language: Language) => void;
    readonly texts: PokerTexts;
}

const NO_CARDS: ReadonlySet<Card> = new Set<Card>();

const cardText = (card: Card): string => `${rankLabel(rankOf(card))}${SUIT_SYMBOLS[suitOf(card)]}`;

export const PokerTable: React.FC<PokerTableProps> = ({ language, onLanguage, texts: t }) => {
    const [menuOpen, setMenuOpen] = useState(true);
    const [saved, setSaved] = useState(() => loadPokerSave());
    const game = usePoker(!menuOpen);
    const { table, cast } = game;
    const format = (chips: number): string => chips.toLocaleString(language);
    const who = (seat: number): Who => (seat === HUMAN_SEAT
        ? { name: t.seat.you, female: false, you: true }
        : { name: t.characters[cast[seat - 1]].name, female: characterOf(cast[seat - 1]).female, you: false });
    const handName = (value: HandValue): string => {
        const category = categoryOf(value);
        return category === STRAIGHT_FLUSH && describe(value).ranks[0] === 12 ? t.hands[9] : t.hands[category];
    };

    const logLines = (state: HandState): { text: string; street: boolean }[] => state.log.map((entry: LogEntry) => {
        if (entry.kind === 'blinds') return { text: t.log.blinds(format(entry.small), format(entry.big), entry.ante > 0 ? format(entry.ante) : null), street: true };
        if (entry.kind === 'street') return { text: t.log.street(t.streets[entry.street], entry.cards.map(cardText).join(' ')), street: true };
        const player = who(entry.seat);
        const to = format(entry.to);
        switch (entry.action) {
            case 'fold': return { text: t.log.fold(player), street: false };
            case 'check': return { text: t.log.check(player), street: false };
            case 'call': return { text: t.log.call(player, to, entry.allIn), street: false };
            case 'bet': return { text: t.log.bet(player, to, entry.allIn), street: false };
            default: return { text: t.log.raise(player, to, entry.allIn), street: false };
        }
    });

    const resultLines = (state: HandState): string[] => {
        const result = state.result;
        if (!result) return [];
        if (!result.showdown) {
            const winner = result.pots[0]?.winners[0] ?? 0;
            const total = result.pots.reduce((sum, pot) => sum + pot.amount, 0);
            return [t.results.uncontested(who(winner), format(total))];
        }
        return result.pots.map(pot => {
            if (pot.eligible.length === 1) return t.results.returned(who(pot.eligible[0]), format(pot.amount));
            const value = result.values[pot.winners[0]] ?? 0;
            if (pot.winners.length === 1) return t.results.wins(who(pot.winners[0]), format(pot.amount), handName(value));
            return t.results.split(pot.winners.map(seat => who(seat).name).join(', '), format(pot.amount), handName(value));
        });
    };

    const winningCards = useMemo(() => {
        const result = table?.result;
        if (!table || !result?.showdown) return new Set<Card>();
        const winner = result.pots.find(pot => pot.eligible.length > 1)?.winners[0];
        if (winner === undefined) return new Set<Card>();
        return new Set(bestFive([...table.seats[winner].hole, ...table.board]));
    }, [table]);

    const startTournament = (settings: PokerSave['settings']) => { game.start(settings); setMenuOpen(false); };
    const continueTournament = (save: PokerSave) => { game.resume(save); setMenuOpen(false); };
    const openMenu = () => { setSaved(loadPokerSave()); setMenuOpen(true); };

    const legal = table && table.turn === HUMAN_SEAT ? legalActions(table) : null;
    const places = table ? seating(table.seats.length) : [];
    const showdown = table?.result?.showdown ?? false;
    const savedTime = game.savedAt !== null ? new Date(game.savedAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <PokerTextsContext.Provider value={t}>
            <div id="poker-room" className={styles.room}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}><span className={styles.titleInitial}>{t.gameTitle.slice(0, 1)}</span>{t.gameTitle.slice(1)}</h1>
                        <p className={styles.subtitle}>{t.tagline}</p>
                        {table && <p className={styles.level}>{t.header.level(table.level.small, table.level.big, table.level.ante, table.handNumber)}</p>}
                    </div>
                    <div className={styles.settings}>
                        <LanguageSwitch value={language} onChange={onLanguage} label={t.header.language} className={styles.language} />
                        {table && <button type="button" className={styles.button} onClick={game.saveNow}>{t.header.save}</button>}
                        {table && savedTime && <span className={styles.savedAt} aria-live="polite">{t.header.savedAt(savedTime)}</span>}
                        <button type="button" className={styles.button} onClick={openMenu}>{t.header.menu}</button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={styles.tableArea}>
                        <div className={styles.felt}>
                            {table && (
                                <div className={styles.center}>
                                    <div className={styles.board}>
                                        {Array.from({ length: 5 }, (_, index) => {
                                            const card = table.board[index];
                                            return card === undefined
                                                ? <div key={index} className={styles.slot} aria-hidden="true" />
                                                : <PokerCard key={card} card={card} winning={winningCards.has(card)} dim={showdown && winningCards.size > 0 && !winningCards.has(card)} />;
                                        })}
                                    </div>
                                    <span className={styles.pot} aria-live="polite">
                                        <span className={styles.street}>{showdown ? t.streets.showdown : t.streets[table.street]}</span> · {t.pot(format(potSize(table)))}
                                    </span>
                                </div>
                            )}
                            {table && table.seats.map((seat, index) => {
                                const yours = index === HUMAN_SEAT;
                                const shown = showdown && table.result?.values[index] !== null && table.result?.values[index] !== undefined;
                                const onTurn = table.turn === index && table.phase === 'betting';
                                // [EN] At the showdown the cards speak for themselves: nothing is written across them.
                                // [RU] На вскрытии карты говорят сами за себя: поверх них ничего не пишется.
                                const status: SeatStatus | null = seat.out ? 'out' : seat.folded ? 'folded' : shown && !yours ? null
                                    : seat.allIn ? 'allIn' : onTurn && game.thinking && !yours ? 'thinking' : null;
                                return (
                                    <PokerSeat key={index} seat={seat} place={places[index]} character={yours ? null : cast[index - 1]}
                                        stack={format(seat.stack)} bet={seat.bet > 0 && table.phase !== 'done' ? format(seat.bet) : null}
                                        reveal={yours || shown} winning={showdown ? winningCards : NO_CARDS} status={status} onTurn={onTurn}
                                        dealer={table.button === index} smallBlind={table.smallBlindSeat === index} bigBlind={table.bigBlindSeat === index} />
                                );
                            })}
                        </div>
                            {table && table.phase === 'done' && (
                                <section className={`${styles.tray} ${styles.result}`} role="status">
                                    {resultLines(table).map((line, index) => <p key={index} className={styles.resultLine}>{line}</p>)}
                                    {game.over ? (
                                        <>
                                            <p className={styles.resultLine}>{game.over.place === 1 ? t.results.youWon : t.results.youOut(game.over.place, game.over.players)}</p>
                                            {game.over.place !== 1 && game.over.winner > 0 && table.seats.filter(seat => seat.stack > 0).length === 1 && <p className={styles.tagline}>{t.results.botWon(who(game.over.winner))}</p>}
                                            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={openMenu}>{t.results.newTournament}</button>
                                        </>
                                    ) : (
                                        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={game.next}>{t.results.nextHand}</button>
                                    )}
                                </section>
                            )}
                        {table && legal && !menuOpen && <ActionTray state={table} legal={legal} seat={HUMAN_SEAT} format={format} onAct={game.act} />}
                        {table && !legal && table.phase === 'betting' && table.turn !== null && (
                            <section className={styles.tray}><p className={styles.waiting}>{t.actions.waiting(who(table.turn))}</p></section>
                        )}
                    </div>
                    <aside className={styles.side}>
                        <section className={styles.panel} aria-label={t.log.title}>
                            <h2 className={styles.panelTitle}>{t.log.title}</h2>
                            <ol className={styles.log}>
                                {table && logLines(table).map((line, index) => <li key={index} className={line.street ? styles.logStreet : ''}>{line.text}</li>)}
                                {table && table.phase === 'done' && resultLines(table).map((line, index) => <li key={`r-${index}`}>{line}</li>)}
                            </ol>
                        </section>
                    </aside>
                </div>

                {/* [EN] The end of the tournament: mockery from the one who took your chips, or honour (shared/finale). [RU] Конец турнира: издёвка того, кто забрал ваши фишки, или почёт (shared/finale). */}
                <Finale game="poker" outcome={game.over ? (game.over.place === 1 ? 'win' : 'lose') : null}
                    hero={game.over ? cast[Math.max(1, game.over.winner) - 1] ?? null : null} />

                {menuOpen && (
                    <SetupMenu settings={game.settings} saved={saved} language={language}
                        onStart={startTournament} onContinue={continueTournament} onClose={table && !game.over ? () => setMenuOpen(false) : null} />
                )}
            </div>
        </PokerTextsContext.Provider>
    );
};

// [EN] FILE: games/poker/components/PokerTable.tsx — the poker room of the lair: the header with the blinds, the oval
//      table with the regulars around it (portraits, plaques, cards, bets on the cloth, the button and the blinds),
//      the board and the pot in the middle, the result of a hand with the winning five lit up, your decision tray,
//      the log of the hand, the tournament menu and its end. Seats go round the oval clockwise from you at the bottom.
// [RU] ФАЙЛ: покерная комната логова: шапка с блайндами, овальный стол с завсегдатаями вокруг (портреты, таблички,
//      карты, ставки на сукне, баттон и блайнды), доска и банк посередине, итог раздачи с подсвеченной выигравшей
//      пятёркой, ваш лоток решений, ход раздачи, меню турнира и его конец. Места идут по овалу по часовой стрелке от
//      вас внизу.
import React, { useEffect, useMemo, useState } from 'react';
import { LanguageSwitch } from '@shared/components/LanguageSwitch';
import type { Language } from '@shared/i18n/languages';
import { withBase } from '@shell/utils/withBase';
import {
    SUIT_SYMBOLS, STRAIGHT_FLUSH, bestFive, categoryOf, describe, legalActions, potSize, rankLabel, rankOf, suitOf,
    type Card, type HandState, type HandValue, type LogEntry,
} from '../engine/index.ts';
import { characterOf, portraitPath, type PokerCharacterId } from '../characters';
import { HUMAN_SEAT, loadPokerSave, usePoker, type PokerSave } from '../hooks/usePoker';
import { PokerTextsContext, type PokerTexts, type Who } from '../i18n';
import { ActionTray } from './ActionTray';
import { PokerCard } from './PokerCard';
import { SetupMenu } from './SetupMenu';
import styles from './Poker.module.css';

interface PokerTableProps {
    readonly language: Language;
    readonly onLanguage: (language: Language) => void;
    readonly texts: PokerTexts;
}

/** Seats round an ellipse, clockwise from you at the bottom; bets lie on the way to the middle. */
function positions(count: number, tall: boolean): { x: number; y: number; bx: number; by: number }[] {
    // [EN] A phone's oval is narrow: the side seats move in, so their plaques stay on the screen.
    // [RU] Овал телефона узкий: боковые места сдвигаются внутрь, чтобы их таблички оставались на экране.
    const rx = tall ? 33 : 45;
    const ry = tall ? 43 : 41;
    return Array.from({ length: count }, (_, index) => {
        const angle = ((90 + (index * 360) / count) * Math.PI) / 180;
        const x = 50 + rx * Math.cos(angle);
        const y = 50 + ry * Math.sin(angle);
        return { x, y, bx: 50 + (x - 50) * 0.56, by: 47 + (y - 50) * 0.56 };
    });
}

const cardText = (card: Card): string => `${rankLabel(rankOf(card))}${SUIT_SYMBOLS[suitOf(card)]}`;

function useTall(): boolean {
    const [tall, setTall] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
    useEffect(() => {
        const query = window.matchMedia('(max-width: 700px)');
        const update = () => setTall(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return tall;
}

export const PokerTable: React.FC<PokerTableProps> = ({ language, onLanguage, texts: t }) => {
    const [menuOpen, setMenuOpen] = useState(true);
    const [saved, setSaved] = useState(() => loadPokerSave());
    const [openSeat, setOpenSeat] = useState<number | null>(null);
    const game = usePoker(!menuOpen);
    const { table, cast } = game;
    const tall = useTall();
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
    const spots = table ? positions(table.seats.length, tall) : [];
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
                        {/* [EN] On a phone the oval grows taller with the company, so the side seats keep clear of the board.
                            [RU] На телефоне овал вытягивается вместе с компанией, и боковые места не налезают на доску. */}
                        <div className={styles.felt} style={{ '--phone-ratio': String(!table || table.seats.length <= 2 ? 0.9 : table.seats.length <= 4 ? 0.74 : 0.6) } as React.CSSProperties}>
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
                                if (seat.bet <= 0 || table.phase === 'done') return null;
                                const spot = spots[index];
                                return (
                                    <div key={`bet-${index}`} className={styles.bet} style={{ '--bx': `${spot.bx}%`, '--by': `${spot.by}%` } as React.CSSProperties}>
                                        <span className={styles.chips} aria-hidden="true"><i /><i /><i /></span>{format(seat.bet)}
                                    </div>
                                );
                            })}
                            {table && table.seats.map((seat, index) => {
                                const spot = spots[index];
                                const id: PokerCharacterId | null = index === HUMAN_SEAT ? null : cast[index - 1];
                                const reveal = index === HUMAN_SEAT || (showdown && table.result?.values[index] !== null && table.result?.values[index] !== undefined);
                                const onTurn = table.turn === index && table.phase === 'betting';
                                const side = index === HUMAN_SEAT ? styles.seatSouth : spot.x < 35 ? styles.seatWest : spot.x > 65 ? styles.seatEast : spot.y < 50 ? styles.seatNorth : styles.seatSouth;
                                const classes = [styles.seat, side, onTurn ? styles.seatTurn : '', seat.folded ? styles.seatFolded : '', seat.out ? styles.seatOut : ''].join(' ');
                                const status = seat.out ? t.seat.out : seat.folded ? t.seat.folded : seat.allIn ? t.seat.allIn : onTurn && game.thinking && index !== HUMAN_SEAT ? t.seat.thinking : null;
                                return (
                                    <div key={`seat-${index}`} className={classes} style={{ '--x': `${spot.x}%`, '--y': `${spot.y}%` } as React.CSSProperties}>
                                        <div className={styles.who}>
                                        {id && (
                                            <button type="button" className={styles.portrait} aria-label={t.seat.about(t.characters[id].name)} aria-expanded={openSeat === index}
                                                onClick={() => setOpenSeat(current => (current === index ? null : index))}>
                                                <img src={withBase(portraitPath(id))} alt="" loading="lazy" decoding="async" draggable={false} />
                                            </button>
                                        )}
                                        {/* [EN] The button and the blinds sit on the frame, outside the round picture that would clip them.
                                            [RU] Баттон и блайнды сидят на рамке, вне круглой картинки, которая бы их обрезала. */}
                                        <span className={`${styles.badges} ${id ? '' : styles.badgesYours}`} aria-hidden="true">
                                            {table.button === index && <span className={styles.dealer} title={t.seat.dealer}>D</span>}
                                            {table.smallBlindSeat === index && <span className={styles.blind} title={t.seat.smallBlind}>{t.seat.smallBlind}</span>}
                                            {table.bigBlindSeat === index && <span className={styles.blind} title={t.seat.bigBlind}>{t.seat.bigBlind}</span>}
                                        </span>
                                        <div className={styles.plaque}>
                                            <span className={styles.seatName}>
                                                {id ? t.characters[id].name : t.seat.you}
                                            </span>
                                            <span className={styles.seatStack}>{t.seat.stack(format(seat.stack))}</span>
                                        </div>
                                        {status && <span className={`${styles.status} ${seat.allIn ? styles.statusAllIn : ''} ${status === t.seat.thinking ? styles.statusThinking : ''}`}>{status}</span>}
                                        {openSeat === index && id && <p className={styles.bubble}>{t.characters[id].tagline}</p>}
                                        </div>
                                        {!seat.out && seat.hole.length > 0 && (
                                            <div className={styles.hole}>
                                                {seat.hole.map(card => (
                                                    <PokerCard key={`${index}-${card}`} card={reveal ? card : null} size={index === HUMAN_SEAT ? 'hand' : 'small'} winning={showdown && winningCards.has(card)} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
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

                {menuOpen && (
                    <SetupMenu settings={game.settings} saved={saved} language={language}
                        onStart={startTournament} onContinue={continueTournament} onClose={table && !game.over ? () => setMenuOpen(false) : null} />
                )}
            </div>
        </PokerTextsContext.Provider>
    );
};

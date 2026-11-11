// [EN] FILE: games/battleship/components/BattleRoom.tsx — the room of the sea battle: the header, the opponent (a hero
//      of the lair) with the line that says whose shot it is, the dock where the fleet is set out, the two seas, the
//      fleets still afloat, the log of the battle and its end.
//      Setting out works the same by finger and by mouse: pick a ship in the dock, press a cell of your sea; press
//      a ship on the sea to take it back into the hand; «Turn» (or the key R) changes its direction. A mouse also
//      sees where the ship would stand before the press.
// [RU] ФАЙЛ: комната морского боя: шапка, соперник (герой логова) со строкой о том, чей сейчас выстрел, док, где
//      расставляется флот, два моря, флоты на плаву, ход боя и его конец.
//      Расстановка одинакова для пальца и мыши: выберите корабль в доке и нажмите клетку своего моря; нажатие на
//      корабль в море берёт его обратно «в руку»; «Повернуть» (или клавиша R) меняет его направление. Мышь ещё и
//      видит, где встанет корабль, до нажатия.
import React, { useEffect, useMemo, useState } from 'react';
import { characterFacts } from '@shared/characters/roster';
import type { CharacterTexts } from '@shared/characters/texts';
import { CharacterFace } from '@shared/components/CharacterCard';
import { LanguageSwitch } from '@shared/components/LanguageSwitch';
import type { Language } from '@shared/i18n/languages';
import {
    UNKNOWN, accuracy, afloat, cellsOfPlacement, columnOf, isHorizontal, isSunk, placementProblem, rowOf,
    type PlacementProblem, type Ship, type ShotRecord,
} from '../engine/index.ts';
import { OPPONENT, YOU, loadBattleSave, pickOpponent, useBattleship, type BattleSave, type BattleSettings, type OpponentId } from '../hooks/useBattleship';
import { BattleTextsContext, type BattleTexts, type Who } from '../i18n';
import { BattleMenu } from './BattleMenu';
import { SeaBoard, type SeaPreview } from './SeaBoard';
import styles from './Battleship.module.css';

interface BattleRoomProps {
    readonly language: Language;
    readonly onLanguage: (language: Language) => void;
    readonly texts: BattleTexts;
    readonly people: CharacterTexts;
}

/** [EN] «Крейсер ×2» for every kind of ship in a list of lengths. [RU] «Крейсер ×2» для каждого вида корабля в списке длин. */
function grouped(lengths: readonly number[]): [number, number][] {
    const counts = new Map<number, number>();
    for (const length of lengths) counts.set(length, (counts.get(length) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[0] - a[0]);
}

export const BattleRoom: React.FC<BattleRoomProps> = ({ language, onLanguage, texts: t, people }) => {
    const [menuOpen, setMenuOpen] = useState(true);
    const [saved, setSaved] = useState(() => loadBattleSave());
    const game = useBattleship(!menuOpen);
    const { rules, battle, fleet, toPlace, stage } = game;
    const size = rules.size;
    // [EN] The opponent offered on the menu; a battle keeps the one it began with. [RU] Соперник, предложенный в меню; бой держит того, с кем начался.
    const [offered, setOffered] = useState<OpponentId>(() => saved?.save.opponent ?? pickOpponent());
    const opponent = stage === 'idle' ? offered : game.opponent;
    const hero = people[opponent];
    const who: Who = { name: hero.name, female: characterFacts(opponent).female };
    const cellName = (cell: number): string => `${t.columns[columnOf(cell, size)]}${rowOf(cell, size) + 1}`;

    // ----- setting the fleet out -----
    const [inHand, setInHand] = useState<number | null>(null);
    const [across, setAcross] = useState(true);
    const [hover, setHover] = useState<number | null>(null);
    const [problem, setProblem] = useState<PlacementProblem | null>(null);
    useEffect(() => {
        // [EN] The hand always holds a ship that still has to be placed. [RU] В руке всегда корабль, который ещё нужно поставить.
        if (inHand === null || !toPlace.includes(inHand)) setInHand(toPlace[0] ?? null);
    }, [toPlace, inHand]);
    useEffect(() => {
        if (stage !== 'placing' || menuOpen) return;
        const onKey = (event: KeyboardEvent) => { if (event.key === 'r' || event.key === 'R' || event.key === 'к' || event.key === 'К') setAcross(value => !value); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [stage, menuOpen]);
    const shipAt = (cell: number): Ship | null => fleet.find(ship => ship.cells.includes(cell)) ?? null;
    const preview = useMemo((): SeaPreview | null => {
        if (stage !== 'placing' || inHand === null || hover === null || fleet.some(ship => ship.cells.includes(hover))) return null;
        const placement = { length: inHand, row: rowOf(hover, size), column: columnOf(hover, size), horizontal: across };
        const cells = cellsOfPlacement(placement, size);
        if (!cells) {
            // [EN] A ship that sticks out: the part inside the sea is shown in red. [RU] Корабль не помещается: красным показана часть внутри моря.
            const inside = Array.from({ length: inHand }, (_, index) => (across ? [placement.row, placement.column + index] : [placement.row + index, placement.column]))
                .filter(([row, column]) => row < size && column < size).map(([row, column]) => row * size + column);
            return { cells: inside, ok: false };
        }
        return { cells, ok: placementProblem(fleet, placement, rules) === null };
    }, [stage, inHand, hover, across, fleet, rules, size]);
    const pressOwnSea = (cell: number) => {
        const standing = shipAt(cell);
        if (standing) {
            game.lift(cell);
            setInHand(standing.cells.length);
            setAcross(isHorizontal(standing, size));
            setProblem(null);
            return;
        }
        if (inHand === null) return;
        setProblem(game.place({ length: inHand, row: rowOf(cell, size), column: columnOf(cell, size), horizontal: across }));
    };

    // ----- the battle -----
    const winner = battle?.winner ?? null;
    const yourTurn = Boolean(battle && winner === null && battle.turn === YOU);
    const lastBy = (seat: 0 | 1): number | null => {
        if (!battle) return null;
        for (let index = battle.log.length - 1; index >= 0; index -= 1) if (battle.log[index].by === seat) return battle.log[index].cell;
        return null;
    };
    const logLine = (record: ShotRecord): string => {
        const name = record.by === YOU ? t.battle.you : hero.name;
        const cell = cellName(record.cell);
        if (record.outcome === 'miss') return t.battle.miss(name, cell);
        if (record.outcome === 'hit') return t.battle.hit(name, cell);
        return t.battle.sunk(name, cell, t.ships[record.sunkLength ?? 1]);
    };
    const markWord = (mark: number): string => (mark === 1 ? t.cell.miss : mark === 2 ? t.cell.hit : mark === 3 ? t.cell.sunk : mark === 4 ? t.cell.empty : t.cell.unknown);
    const status = winner !== null ? (winner === YOU ? t.result.won : t.result.lost(who))
        : stage === 'placing' ? (toPlace.length === 0 ? t.placing.ready : t.placing.title)
        : battle ? (yourTurn ? t.battle.yourTurn : t.battle.theirTurn(who)) : '';

    const start = (settings: BattleSettings) => { game.begin(settings, offered); setMenuOpen(false); setProblem(null); };
    const resume = (save: BattleSave) => { game.resume(save); setOffered(save.opponent); setMenuOpen(false); };
    const openMenu = () => { setSaved(loadBattleSave()); if (winner !== null) setOffered(pickOpponent(game.opponent)); setMenuOpen(true); };
    const savedTime = game.savedAt !== null ? new Date(game.savedAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }) : null;
    const yours = battle?.sides[YOU] ?? null;
    const theirs = battle?.sides[OPPONENT] ?? null;
    const stats = battle ? accuracy(battle, YOU) : { shots: 0, hits: 0 };

    return (
        <BattleTextsContext.Provider value={t}>
            <div id="battleship-room" className={styles.room}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}><span className={styles.titleInitial}>{t.gameTitle.slice(0, 1)}</span>{t.gameTitle.slice(1)}</h1>
                        <p className={styles.subtitle}>{t.tagline}</p>
                    </div>
                    <div className={styles.settings}>
                        <LanguageSwitch value={language} onChange={onLanguage} label={t.header.language} className={styles.language} />
                        {stage !== 'idle' && winner === null && <button type="button" className={styles.button} onClick={game.saveNow}>{t.header.save}</button>}
                        <button type="button" className={styles.button} onClick={openMenu}>{t.header.menu}</button>
                        {stage !== 'idle' && winner === null && savedTime && <span className={styles.savedAt} aria-live="polite">{t.header.savedAt(savedTime)}</span>}
                    </div>
                </header>

                {stage !== 'idle' && (
                    <main className={`${styles.deck} ${stage === 'placing' ? styles.deckPlacing : ''}`}>
                        <div className={styles.captain}>
                            <CharacterFace className={styles.face} faceClassName={`${styles.portrait} ${game.thinking ? styles.portraitAiming : ''}`} side="start"
                                label={t.hero.about(hero.name)} closeLabel={t.hero.close}
                                story={{ id: opponent, name: hero.name, bio: hero.bio, tag: characterFacts(opponent).guest ? t.hero.guest : t.hero.dweller }} />
                            <div className={styles.captainText}>
                                <span className={styles.captainLabel}>{t.setup.opponent}</span>
                                <span className={styles.captainName}>{hero.name}</span>
                            </div>
                            <p className={`${styles.status} ${yourTurn ? styles.statusYours : ''}`} role="status" aria-live="polite">{status}</p>
                        </div>

                        {stage === 'placing' && (
                            <section className={styles.dock} aria-label={t.placing.title}>
                                {/* [EN] One line of a fixed height for the hint and for what is wrong with the last
                                         press: the sea never jumps under the finger when the words change.
                                    [RU] Одна строка постоянной высоты и для подсказки, и для ошибки последнего нажатия:
                                         море не прыгает под пальцем, когда меняются слова. */}
                                <p className={`${styles.dockNote} ${problem ? styles.problem : styles.hint}`} role={problem ? 'alert' : undefined}>{problem ? t.placing.problems[problem] : t.placing.hint}</p>
                                <div className={styles.dockShips}>
                                    {grouped(toPlace).map(([length, count]) => (
                                        <button key={length} type="button" className={`${styles.button} ${styles.dockShip} ${inHand === length ? styles.choiceOn : ''}`}
                                            aria-pressed={inHand === length} onClick={() => setInHand(length)}>
                                            <span className={styles.dockHull} style={{ '--decks': length } as React.CSSProperties} aria-hidden="true" />
                                            {t.placing.dock(t.ships[length], count)}
                                        </button>
                                    ))}
                                    {toPlace.length === 0 && <span className={styles.ready}>{t.placing.ready}</span>}
                                </div>
                                <div className={styles.dockActions}>
                                    <button type="button" className={styles.button} onClick={() => setAcross(value => !value)}>{t.placing.rotate}: {across ? t.placing.across : t.placing.down}</button>
                                    <button type="button" className={styles.button} onClick={() => { game.randomize(); setProblem(null); }}>{t.placing.random}</button>
                                    <button type="button" className={styles.button} disabled={fleet.length === 0} onClick={() => { game.clear(); setProblem(null); }}>{t.placing.clear}</button>
                                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} disabled={toPlace.length > 0} onClick={game.startBattle}>{t.placing.start}</button>
                                </div>
                            </section>
                        )}

                        {winner !== null && (
                            <section className={styles.result} role="status">
                                <p className={styles.resultLine}>{winner === YOU ? t.result.won : t.result.lost(who)}</p>
                                <p className={styles.hint}>{t.result.stats(stats.shots, stats.hits)}</p>
                                <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={openMenu}>{t.result.again}</button>
                            </section>
                        )}

                        <div className={`${styles.seas} ${stage === 'placing' ? styles.seasOne : styles.seasBattle}`}>
                            {stage === 'placing' && (
                                <SeaBoard size={size} columns={t.columns} title={t.battle.yourSea} marks={null} ships={fleet} active
                                    pressable={() => true} onPress={pressOwnSea} onHover={setHover} preview={preview}
                                    cellLabel={cell => t.cell.label(cellName(cell), shipAt(cell) ? t.cell.ship : t.cell.water)} />
                            )}
                            {stage === 'battle' && yours && theirs && (
                                <>
                                    <SeaBoard size={size} columns={t.columns} title={t.battle.enemySea} marks={theirs.marks} enemy active={yourTurn}
                                        ships={winner === OPPONENT ? theirs.ships.filter(ship => !isSunk(theirs, ship)) : []}
                                        wrecks={theirs.ships.filter(ship => isSunk(theirs, ship))}
                                        pressable={cell => yourTurn && theirs.marks[cell] === UNKNOWN} onPress={game.shoot} last={lastBy(YOU)}
                                        cellLabel={cell => t.cell.label(cellName(cell), markWord(theirs.marks[cell]))} />
                                    <SeaBoard size={size} columns={t.columns} title={t.battle.yourSea} marks={yours.marks} active={!yourTurn && winner === null}
                                        ships={yours.ships.filter(ship => !isSunk(yours, ship))} wrecks={yours.ships.filter(ship => isSunk(yours, ship))} last={lastBy(OPPONENT)}
                                        cellLabel={cell => t.cell.label(cellName(cell), yours.marks[cell] === UNKNOWN ? (yours.ships.some(ship => ship.cells.includes(cell)) ? t.cell.ship : t.cell.water) : markWord(yours.marks[cell]))} />
                                </>
                            )}
                        </div>

                        {stage === 'battle' && yours && theirs && battle && (
                            <div className={styles.panels}>
                                <section className={styles.panel} aria-label={t.battle.enemyFleet}>
                                    <h2 className={styles.panelTitle}>{t.battle.enemyFleet}</h2>
                                    <ul className={styles.fleetList}>
                                        {grouped(afloat(theirs)).map(([length, count]) => <li key={length}><span className={styles.dockHull} style={{ '--decks': length } as React.CSSProperties} aria-hidden="true" />{t.battle.afloat(t.ships[length], count)}</li>)}
                                        {afloat(theirs).length === 0 && <li>{t.battle.noneAfloat}</li>}
                                    </ul>
                                </section>
                                <section className={styles.panel} aria-label={t.battle.yourFleet}>
                                    <h2 className={styles.panelTitle}>{t.battle.yourFleet}</h2>
                                    <ul className={styles.fleetList}>
                                        {grouped(afloat(yours)).map(([length, count]) => <li key={length}><span className={styles.dockHull} style={{ '--decks': length } as React.CSSProperties} aria-hidden="true" />{t.battle.afloat(t.ships[length], count)}</li>)}
                                        {afloat(yours).length === 0 && <li>{t.battle.noneAfloat}</li>}
                                    </ul>
                                </section>
                                <section className={`${styles.panel} ${styles.logPanel}`} aria-label={t.battle.logTitle}>
                                    <h2 className={styles.panelTitle}>{t.battle.logTitle}</h2>
                                    <ol className={styles.log}>
                                        {battle.log.slice(-14).reverse().map((record, index) => (
                                            <li key={battle.log.length - index} className={record.outcome === 'miss' ? '' : record.outcome === 'sunk' ? styles.logSunk : styles.logHit}>{logLine(record)}</li>
                                        ))}
                                    </ol>
                                </section>
                            </div>
                        )}
                    </main>
                )}

                {menuOpen && (
                    <BattleMenu settings={game.settings} saved={saved} language={language} people={people} opponent={offered}
                        onAnother={() => setOffered(current => pickOpponent(current))} onStart={start} onContinue={resume}
                        onClose={stage !== 'idle' && winner === null ? () => setMenuOpen(false) : null} />
                )}
            </div>
        </BattleTextsContext.Provider>
    );
};

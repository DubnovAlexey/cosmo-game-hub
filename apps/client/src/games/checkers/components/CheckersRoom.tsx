// [EN] FILE: games/checkers/components/CheckersRoom.tsx — the room of draughts: the header, the opponent (a hero of
//      the lair) with the line that says whose move it is, the board, the men left on both sides, the log of the
//      game, taking a move back, resigning and the end of the game.
//      A move is entered the same by finger and by mouse: press one of your men (the ones that may move glow),
//      then the square it goes to. A capture of several pieces is entered square by square — or by pressing its last
//      square at once, when only one way leads there; pressing the man again takes the last step back.
// [RU] ФАЙЛ: комната шашек: шапка, соперник (герой логова) со строкой о том, чей ход, доска, оставшиеся шашки обеих
//      сторон, ход партии, возврат хода, сдача и конец партии.
//      Ход вводится одинаково пальцем и мышью: нажмите свою шашку (те, что могут ходить, светятся), затем поле, куда
//      она пойдёт. Взятие нескольких шашек вводится поле за полем — или сразу последним полем, если туда ведёт
//      только один путь; повторное нажатие на шашку отменяет последний шаг.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { characterFacts } from '@shared/characters/roster';
import type { CharacterTexts } from '@shared/characters/texts';
import { CharacterFace } from '@shared/components/CharacterCard';
import { LanguageSwitch } from '@shared/components/LanguageSwitch';
import type { Language } from '@shared/i18n/languages';
import { withBase } from '@shell/utils/withBase';
import {
    EMPTY, countPieces, isKing, moveText, movesOf, sideOf, squareName, takeBack as replayWithout,
    type CheckersState, type Move, type Piece, type Side,
} from '../engine/index.ts';
import { loadCheckersSave, pickOpponent, useCheckers, type CheckersSave, type CheckersSettings, type OpponentId } from '../hooks/useCheckers';
import { CheckersTextsContext, type CheckersTexts, type Who } from '../i18n';
import { CheckersBoard, PieceMark, type LastMoveMarks } from './CheckersBoard';
import { CheckersMenu } from './CheckersMenu';
import { SCENE_HEIGHT, SCENE_WIDTH, scenePath } from './scenes';
import styles from './Checkers.module.css';

interface CheckersRoomProps {
    readonly language: Language;
    readonly onLanguage: (language: Language) => void;
    readonly texts: CheckersTexts;
    readonly people: CharacterTexts;
}

/** [EN] The piece being moved, and the squares it has already landed on in this move. [RU] Шашка, которой ходят, и поля, на которые она уже встала в этом ходе. */
interface Selection {
    readonly from: number;
    readonly trail: readonly number[];
}

const startsWith = (path: readonly number[], trail: readonly number[]) => trail.every((square, index) => path[index] === square);

/** [EN] The last move with the pieces it took (read from the position before it). [RU] Последний ход с битыми шашками (их видно в позиции до него). */
function lastMarks(game: CheckersState): LastMoveMarks | null {
    const record = game.log[game.log.length - 1];
    if (!record) return null;
    const before = record.move.captured.length > 0 ? replayWithout(game, 1).board : null;
    return {
        from: record.move.from,
        path: record.move.path,
        captured: record.move.captured.map(square => [square, (before?.[square] ?? EMPTY) as Piece] as const),
    };
}

export const CheckersRoom: React.FC<CheckersRoomProps> = ({ language, onLanguage, texts: t, people }) => {
    const [menuOpen, setMenuOpen] = useState(true);
    const [saved, setSaved] = useState(() => loadCheckersSave());
    const play = useCheckers(!menuOpen);
    const { game, you } = play;
    const [offered, setOffered] = useState<OpponentId>(() => saved?.save.opponent ?? pickOpponent());
    const opponent = game ? play.opponent : offered;
    const hero = people[opponent];
    const who: Who = { name: hero.name, female: characterFacts(opponent).female };
    const size = game?.rules.size ?? 8;
    const sideName = (side: Side) => (side === 'white' ? t.play.white : t.play.black);

    // ----- entering a move -----
    const [selection, setSelection] = useState<Selection | null>(null);
    const yourTurn = Boolean(game && game.winner === null && game.turn === you && !menuOpen);
    const moves = useMemo<Move[]>(() => (game && yourTurn ? movesOf(game) : []), [game, yourTurn]);
    const movable = useMemo(() => new Set(moves.map(move => move.from)), [moves]);
    const candidates = useMemo(
        () => (selection ? moves.filter(move => move.from === selection.from && startsWith(move.path, selection.trail)) : []),
        [moves, selection],
    );
    const step = selection?.trail.length ?? 0;
    const targets = useMemo(() => new Set(candidates.map(move => move.path[step]).filter(square => square !== undefined)), [candidates, step]);
    // [EN] A new position forgets the half-entered move; a single man that may move is picked up at once.
    // [RU] Новая позиция забывает недовведённый ход; если ходить может одна-единственная шашка, она берётся сразу.
    useEffect(() => { setSelection(null); }, [game]);
    useEffect(() => {
        if (selection === null && movable.size === 1) setSelection({ from: [...movable][0], trail: [] });
    }, [selection, movable]);

    const finishOrGo = (from: number, trail: readonly number[], left: readonly Move[]) => {
        const done = left.find(move => move.path.length === trail.length);
        if (done) { play.move(done); setSelection(null); return; }
        setSelection({ from, trail });
    };
    const press = (square: number) => {
        if (!game || !yourTurn) return;
        if (selection) {
            const standing = selection.trail.length > 0 ? selection.trail[selection.trail.length - 1] : selection.from;
            if (square === standing) {
                // [EN] The man itself: one step back, or put it down. [RU] Сама шашка: шаг назад или положить её.
                setSelection(selection.trail.length > 0 ? { from: selection.from, trail: selection.trail.slice(0, -1) } : movable.size === 1 ? selection : null);
                return;
            }
            // [EN] A square further along the way: it counts when every way there is the same. [RU] Поле дальше по пути: годится, если все пути туда одинаковы.
            const along = candidates.filter(move => move.path.indexOf(square, step) >= 0);
            if (along.length > 0) {
                const index = along[0].path.indexOf(square, step);
                const prefix = along[0].path.slice(0, index + 1);
                if (along.every(move => startsWith(move.path, prefix))) {
                    finishOrGo(selection.from, prefix, along);
                    return;
                }
                // [EN] Two ways meet on that square: go one step and let the next press choose. [RU] Два пути сходятся на этом поле: шаг вперёд, дальше выберет следующее нажатие.
                if (targets.has(square)) { finishOrGo(selection.from, [...selection.trail, square], along.filter(move => move.path[step] === square)); return; }
            }
        }
        if (movable.has(square) && (!selection || selection.trail.length === 0)) {
            setSelection({ from: square, trail: [] });
            return;
        }
        if (selection && selection.trail.length === 0 && movable.size > 1) setSelection(null);
    };

    // [EN] What the board shows: during a capture series the man stands on its last landing, the jumped pieces are marked.
    // [RU] Что показывает доска: посреди серии взятий шашка стоит на последнем поле приземления, перепрыгнутые шашки помечены.
    const shown = useMemo(() => {
        if (!game) return null;
        if (!selection || selection.trail.length === 0) return { board: game.board, selected: selection?.from ?? null, left: null, taking: new Set<number>() };
        const board = [...game.board];
        const standing = selection.trail[selection.trail.length - 1];
        board[standing] = board[selection.from];
        board[selection.from] = EMPTY;
        const taking = new Set(candidates[0]?.captured.slice(0, selection.trail.length) ?? []);
        return { board, selected: standing, left: selection.from, taking };
    }, [game, selection, candidates]);
    const last = useMemo(() => (game ? lastMarks(game) : null), [game]);

    const squareLabel = (square: number): string => {
        const piece = shown?.board[square] ?? EMPTY;
        const state = piece === EMPTY ? t.square.empty
            : sideOf(piece) === 'white' ? (isKing(piece) ? t.square.whiteKing : t.square.whiteMan)
            : (isKing(piece) ? t.square.blackKing : t.square.blackMan);
        const extra = targets.has(square) ? `, ${t.square.target}` : square === shown?.selected ? `, ${t.square.chosen}` : '';
        return t.square.label(squareName(square, size), state + extra);
    };

    // ----- resigning takes two presses -----
    const [resignAsked, setResignAsked] = useState(false);
    const resignTimer = useRef<number | null>(null);
    useEffect(() => () => { if (resignTimer.current !== null) window.clearTimeout(resignTimer.current); }, []);
    const askResign = () => {
        setResignAsked(true);
        if (resignTimer.current !== null) window.clearTimeout(resignTimer.current);
        resignTimer.current = window.setTimeout(() => setResignAsked(false), 6000);
    };

    // ----- the log: moves in pairs, as on a score sheet -----
    const logRef = useRef<HTMLOListElement | null>(null);
    const pairs = useMemo(() => {
        if (!game) return [];
        const rows: { number: number; first: string; second: string }[] = [];
        game.log.forEach((record, index) => {
            const text = moveText(record.move, size);
            if (index % 2 === 0) rows.push({ number: rows.length + 1, first: text, second: '' });
            else rows[rows.length - 1].second = text;
        });
        return rows;
    }, [game, size]);
    useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [pairs.length]);

    const winner = game?.winner ?? null;
    // [EN] The end of a game lies above the board: the screen comes up to it, wherever the last press was (on a phone
    //      the board fills the screen). [RU] Конец партии лежит над доской: экран сам поднимается к нему, где бы ни было
    //      последнее нажатие (на телефоне доска занимает весь экран).
    const resultRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (winner !== null) resultRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [winner]);
    const mustCapture = moves.length > 0 && moves[0].captured.length > 0;
    const status = !game ? ''
        : winner !== null ? (winner === 'draw' ? t.result.draw : winner === you ? t.result.won : t.result.lost(who))
        : yourTurn ? (step > 0 ? t.play.goOn : mustCapture ? t.play.mustCapture : t.play.yourMove)
        : t.play.theirMove(who);
    const reason = !game || winner === null ? ''
        : winner === 'draw' ? (game.drawReason === 'quiet' ? t.result.drawQuiet : t.result.drawRepetition)
        : game.resigned === you ? t.result.youResigned
        : (() => {
            const loser = winner === 'white' ? 'black' : 'white';
            const left = countPieces(game.board, loser);
            return left.men + left.kings > 0 ? t.result.blocked : '';
        })();

    const start = (settings: CheckersSettings) => { play.begin(settings, offered); setMenuOpen(false); setResignAsked(false); };
    const resume = (save: CheckersSave) => { play.resume(save); setOffered(save.opponent); setMenuOpen(false); setResignAsked(false); };
    const openMenu = () => { setSaved(loadCheckersSave()); if (winner !== null) setOffered(pickOpponent(play.opponent)); setMenuOpen(true); };
    const savedTime = play.savedAt !== null ? new Date(play.savedAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <CheckersTextsContext.Provider value={t}>
            <div id="checkers-room" className={styles.room}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}><span className={styles.titleInitial}>{t.gameTitle.slice(0, 1)}</span>{t.gameTitle.slice(1)}</h1>
                        <p className={styles.subtitle}>{t.tagline}</p>
                    </div>
                    <div className={styles.settings}>
                        <LanguageSwitch value={language} onChange={onLanguage} label={t.header.language} className={styles.language} />
                        {game && winner === null && <button type="button" className={styles.button} onClick={play.saveNow}>{t.header.save}</button>}
                        <button type="button" className={styles.button} onClick={openMenu}>{t.header.menu}</button>
                        {game && winner === null && savedTime && <span className={styles.savedAt} aria-live="polite">{t.header.savedAt(savedTime)}</span>}
                    </div>
                </header>

                {game && shown && (
                    <main className={`${styles.deck} ${winner === null ? styles.deckPlaying : ''}`}>
                        <div className={styles.captain}>
                            <CharacterFace className={styles.face} faceClassName={`${styles.portrait} ${play.thinking ? styles.portraitThinking : ''}`} side="start"
                                label={t.hero.about(hero.name)} closeLabel={t.hero.close}
                                story={{ id: opponent, name: hero.name, bio: hero.bio, quote: hero.quote, tag: characterFacts(opponent).guest ? t.hero.guest : t.hero.dweller }} />
                            <div className={styles.captainText}>
                                <span className={styles.captainLabel}>{t.setup.opponent}</span>
                                <span className={styles.captainName}>{hero.name}</span>
                            </div>
                            <p className={`${styles.status} ${yourTurn ? styles.statusYours : ''}`} role="status" aria-live="polite">{status}</p>
                        </div>

                        {winner !== null && (
                            <section ref={resultRef} className={styles.result} role="status">
                                {/* [EN] A scene of the end, whole (Alexey's folder «Шашки», see scenes.ts). [RU] Сцена конца, целиком (папка Алексея «Шашки», см. scenes.ts). */}
                                <img className={styles.resultArt} alt="" decoding="async" draggable={false} width={SCENE_WIDTH} height={SCENE_HEIGHT}
                                    src={withBase(scenePath(winner === 'draw' ? 'draw' : winner === you ? 'won' : 'lost', play.seed, opponent))} />
                                <div className={styles.resultText}>
                                    <p className={styles.resultLine}>{status}</p>
                                    {reason && <p className={styles.hint}>{reason}</p>}
                                    <p className={styles.hint}>{t.result.moves(Math.ceil(game.log.length / 2))}</p>
                                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={openMenu}>{t.result.again}</button>
                                </div>
                            </section>
                        )}

                        <div className={styles.boardColumn}>
                            <CheckersBoard size={size} board={shown.board} flipped={you === 'black'} active={yourTurn} movable={movable}
                                selected={shown.selected} left={shown.left} targets={targets} taking={shown.taking} last={last}
                                columns="abcdefgh" label={squareLabel} onPress={press} />
                        </div>

                        <aside className={styles.side}>
                            <section className={styles.panel} aria-label={t.play.yourSide(sideName(you))}>
                                <h2 className={styles.panelTitle}>{t.play.yourSide(sideName(you))}</h2>
                                <ul className={styles.counts}>
                                    {(['white', 'black'] as const).map(side => {
                                        const count = countPieces(game.board, side);
                                        return (
                                            <li key={side} className={styles.countRow}>
                                                <PieceMark piece={side === 'white' ? 1 : -1} className={styles.pieceSmall} />
                                                <span className={styles.countName}>{side === you ? `${sideName(side)} · ${t.play.you}` : `${sideName(side)} · ${hero.name}`}</span>
                                                <span className={styles.countNumber}>{t.play.count(count.men, count.kings)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {winner === null && <p className={styles.hint}>{t.play.hint}</p>}
                                {winner === null && (
                                    <div className={styles.actions}>
                                        <button type="button" className={styles.button} disabled={!play.canTakeBack} onClick={() => { play.takeBack(); setResignAsked(false); }}>{t.play.takeBack}</button>
                                        {resignAsked ? (
                                            <>
                                                <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => { play.resign(); setResignAsked(false); }}>{t.play.resignSure}</button>
                                                <button type="button" className={styles.button} onClick={() => setResignAsked(false)}>{t.play.cancel}</button>
                                            </>
                                        ) : (
                                            <button type="button" className={styles.button} onClick={askResign}>{t.play.resign}</button>
                                        )}
                                    </div>
                                )}
                            </section>
                            <section className={styles.panel} aria-label={t.play.logTitle}>
                                <h2 className={styles.panelTitle}>{t.play.logTitle}</h2>
                                {pairs.length === 0 ? <p className={styles.hint}>{t.play.noMoves}</p> : (
                                    <ol ref={logRef} className={styles.log}>
                                        {pairs.map(row => (
                                            <li key={row.number} className={styles.logRow}>
                                                <span className={styles.logNumber}>{row.number}.</span>
                                                <span className={styles.logMove}>{row.first}</span>
                                                <span className={styles.logMove}>{row.second}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>
                        </aside>
                    </main>
                )}

                {menuOpen && (
                    <CheckersMenu settings={play.settings} saved={saved} language={language} people={people} opponent={offered}
                        onAnother={() => setOffered(current => pickOpponent(current))} onStart={start} onContinue={resume}
                        onClose={game && winner === null ? () => setMenuOpen(false) : null} />
                )}
            </div>
        </CheckersTextsContext.Provider>
    );
};

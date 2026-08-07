// [EN] Import React and hooks
// [RU] Импортируем React и хуки
import React, { useState, useCallback } from 'react';

// [EN] Import UI components according to the project architecture
// [RU] Импортируем UI-компоненты согласно архитектуре проекта
import { ChessBoard } from './ChessBoard';
import { DifficultySelector } from './DifficultySelector';
import { PromotionModal } from './PromotionModal';
import { TimerPanel } from './TimerPanel';
import { MoveHistory } from './MoveHistory';
import { Graveyard } from './Graveyard';
import { GameOverOverlay } from '../shared/GameOverOverlay';

// [EN] Import logic hooks and parser utility using Aliases
// [RU] Импортируем хуки логики и утилиту парсинга, используя Алиасы
import { useChessLogic } from '@hooks/useChessLogic';
import type { PgnResult } from '@hooks/useChessLogic';
import type { TimerPlayer } from '@hooks/useChessTimer';
import { parseFenToBoard } from '@utils/engine/fenParser';

// [EN] Import CSS module stylesheet
// [RU] Импортируем таблицу стилей CSS-модуля
import styles from './Chess.module.css';

export const ChessGame: React.FC = () => {
    // [EN] Local state for engine difficulty (default is 3)
    // [RU] Локальное состояние для сложности движка (по умолчанию 3)
    const [difficulty, setDifficulty] = useState<number>(3);

    // [EN] Tracks which side ran out on the clock, if any. Lives here (not in useChessLogic) because
    // it's a wall-clock concern, not a chess-rules concern. Typed with TimerPlayer (from
    // useChessTimer) instead of a fresh 'White'|'Black' literal, so it matches TimerPanel exactly.
    // [RU] Отслеживает, у какой стороны закончилось время на часах, если закончилось. Живёт здесь
    // (не в useChessLogic), потому что это про настенное время, а не про правила шахмат. Типизирован
    // через TimerPlayer (из useChessTimer), а не через свежий литерал 'White'|'Black', чтобы точно
    // совпадать с TimerPanel.
    const [timeoutLoser, setTimeoutLoser] = useState<TimerPlayer | null>(null);

    // [EN] Extract live state and methods from our custom chess logic hook. Passing timeoutLoser !== null
    // back in as isExternallyOver stops the engine from moving and blocks further input once time is up.
    // getLegalDestinations / checkedSquare are new (Feature 4) — wired into ChessBoard below.
    // [RU] Извлекаем живое состояние и методы из нашего кастомного хука шахматной логики. Передача
    // timeoutLoser !== null обратно как isExternallyOver останавливает движок и блокирует ввод,
    // когда время истекло. getLegalDestinations / checkedSquare — новые (Фича 4), подключены к
    // ChessBoard ниже.
    const {
        fen,
        turn,
        isGameOver,
        isCheckmate,
        hasStarted,
        isEngineThinking,
        pendingPromotion,
        moveHistory,
        capturedPieces,
        checkedSquare,
        handleUserMove,
        getLegalDestinations,
        confirmPromotion,
        cancelPromotion,
        generatePgn
    } = useChessLogic(difficulty, timeoutLoser !== null);

    // [EN] Compute the 2D array matrix on the fly from the current FEN string
    // [RU] Вычисляем матрицу двумерного массива на лету из текущей FEN-строки
    const boardMatrix = parseFenToBoard(fen);

    // [EN] FIX (TS2322): a bare ternary between two string literals widens to plain `string` by
    // default — TimerPanelProps.activePlayer ('White'|'Black'|null) correctly rejected that. The
    // explicit `: TimerPlayer` annotation keeps the literal union narrow.
    // [RU] ИСПРАВЛЕНИЕ (TS2322): обычный тернарник между двумя строковыми литералами по умолчанию
    // расширяется до простого `string` — TimerPanelProps.activePlayer ('White'|'Black'|null)
    // справедливо это отвергал. Явная аннотация `: TimerPlayer` удерживает узкий литеральный union.
    const mappedPlayer: TimerPlayer = turn === 'w' ? 'White' : 'Black';

    // [EN] Neither clock should tick until the first move is made, or once the match is over
    // [RU] Часы не должны идти, пока не сделан первый ход, и после окончания партии
    const activeTimerPlayer: TimerPlayer | null = (!hasStarted || isGameOver) ? null : mappedPlayer;

    // [EN] Called by TimerPanel exactly once when a clock reaches zero
    // [RU] Вызывается TimerPanel ровно один раз, когда часы дошли до нуля
    const handleTimeOut = useCallback((player: TimerPlayer) => {
        setTimeoutLoser((prev) => (isGameOver || prev ? prev : player));
    }, [isGameOver]);

    // [EN] Combine every way the match can end into one result: timeout first, then chess.js's own
    // checkmate/draw detection
    // [RU] Объединяем все способы завершения партии в один результат: сначала просрочка времени,
    // затем собственное определение chess.js мата/ничьей
    let gameStatus: 'win' | 'lose' | 'draw' | null = null;
    if (timeoutLoser) {
        gameStatus = timeoutLoser === 'White' ? 'lose' : 'win';
    } else if (isGameOver) {
        gameStatus = isCheckmate ? (turn === 'w' ? 'lose' : 'win') : 'draw';
    }

    // [EN] Builds and downloads the current game as a .pgn file
    // [RU] Собирает и скачивает текущую партию как файл .pgn
    const handleDownloadPgn = useCallback(() => {
        const resultTag: PgnResult =
            gameStatus === 'win' ? '1-0' :
                gameStatus === 'lose' ? '0-1' :
                    gameStatus === 'draw' ? '1/2-1/2' : '*';

        const pgnText = generatePgn(resultTag);
        const blob = new Blob([pgnText], { type: 'application/x-chess-pgn' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `cosmo-chess-${Date.now()}.pgn`;
        link.click();

        URL.revokeObjectURL(url);
    }, [generatePgn, gameStatus]);

    return (
        <div className={styles['chess-container']}>
            <h1 className={styles['chess-title']}>Cosmo Game Hub</h1>

            {/* [EN] Pass real state and setter to the DifficultySelector */}
            {/* [RU] Передаем реальное состояние и функцию обновления в DifficultySelector */}
            <DifficultySelector
                currentDifficulty={difficulty}
                onSelect={(level: number) => setDifficulty(level)}
            />

            <div className={styles['game-zone']}>
                <div className={styles['board-area-wrapper']}>
                    {/* [EN] Left slot shows White's trophies — pieces captured FROM Black */}
                    {/* [RU] Левый слот — трофеи белых, фигуры, взятые У чёрных */}
                    <Graveyard pieces={capturedPieces.b} color="b" />

                    <div className={styles['board-wrapper']}>
                        {/* [EN] NEW (Feature 4): getLegalDestinations + checkedSquare wired through so
                        ChessBoard can light up legal moves and the king in check */}
                        {/* [RU] НОВОЕ (Фича 4): getLegalDestinations + checkedSquare подключены, чтобы
                        ChessBoard мог подсвечивать легальные ходы и короля под шахом */}
                        <ChessBoard
                            board={boardMatrix}
                            onMove={handleUserMove}
                            isBlackOriented={false}
                            getLegalDestinations={getLegalDestinations}
                            checkedSquare={checkedSquare}
                        />

                        {/* [EN] Optional: visual indicator when engine is thinking */}
                        {/* [RU] Опционально: визуальный индикатор, когда движок думает */}
                        {isEngineThinking && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded text-amber-400 text-sm font-bold z-10">
                                <span className="animate-pulse">Engine is thinking...</span>
                            </div>
                        )}
                    </div>

                    {/* [EN] Right slot shows Black's trophies — pieces captured FROM White */}
                    {/* [RU] Правый слот — трофеи чёрных, фигуры, взятые У белых */}
                    <Graveyard pieces={capturedPieces.w} color="w" />
                </div>
            </div>

            <div className={styles['control-panel']}>
                <TimerPanel
                    activePlayer={activeTimerPlayer}
                    onTimeOut={handleTimeOut}
                />

                <MoveHistory moves={moveHistory} onDownloadPgn={handleDownloadPgn} />
            </div>

            <PromotionModal
                pendingPromotion={pendingPromotion}
                onSelect={confirmPromotion}
                onCancel={cancelPromotion}
            />

            {/* [EN] CONDITIONAL RENDERING: Render overlay if the match is actually over */}
            {/* [RU] УСЛОВНЫЙ РЕНДЕРИНГ: Рендерим оверлей, если партия действительно окончена */}
            {isGameOver && gameStatus !== null && (
                <GameOverOverlay status={gameStatus as "win" | "lose" | "draw"}>
                    <div className="text-center">
                        <p className="text-xl mb-4 text-slate-200">
                            {timeoutLoser ? 'Time is up!' : 'The game has ended!'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                </GameOverOverlay>
            )}
        </div>
    );
};

export default ChessGame;
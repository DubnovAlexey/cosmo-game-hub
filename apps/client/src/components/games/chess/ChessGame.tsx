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
import { GameSetupModal } from './GameSetupModal';

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

    // [EN] Tracks which side ran out on the clock, if any.
    // [RU] Отслеживает, у какой стороны закончилось время на часах, если закончилось.
    const [timeoutLoser, setTimeoutLoser] = useState<TimerPlayer | null>(null);

    // [EN] State for the setup phase and game parameters
    // [RU] Состояние для фазы настройки и параметров игры
    const [isSetupPhase, setIsSetupPhase] = useState<boolean>(true);
    const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
    const [initialTime, setInitialTime] = useState<number>(600);

    // [EN] Extract live state and methods from our custom chess logic hook.
    // [EN] FIX: Pass playerColor to the hook so the engine knows who the human is.
    // [RU] Извлекаем живое состояние и методы из нашего кастомного хука шахматной логики.
    // [RU] ИСПРАВЛЕНИЕ: Передаем playerColor в хук, чтобы движок знал, за кого играет человек.
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
    } = useChessLogic(difficulty, timeoutLoser !== null, playerColor);

    // [EN] Compute the 2D array matrix on the fly from the current FEN string
    // [RU] Вычисляем матрицу двумерного массива на лету из текущей FEN-строки
    const boardMatrix = parseFenToBoard(fen);

    const mappedPlayer: TimerPlayer = turn === 'w' ? 'White' : 'Black';

    // [EN] Neither clock should tick until the first move is made, or once the match is over, or during setup
    // [RU] Часы не должны идти, пока не сделан первый ход, после окончания партии, или во время настройки
    const activeTimerPlayer: TimerPlayer | null = (!hasStarted || isGameOver || isSetupPhase) ? null : mappedPlayer;

    // [EN] Called by TimerPanel exactly once when a clock reaches zero
    // [RU] Вызывается TimerPanel ровно один раз, когда часы дошли до нуля
    const handleTimeOut = useCallback((player: TimerPlayer) => {
        setTimeoutLoser((prev) => (isGameOver || prev ? prev : player));
    }, [isGameOver]);

    // [EN] Combine every way the match can end into one result
    // [RU] Объединяем все способы завершения партии в один результат
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

    // [EN] Handle completing the setup phase
    // [RU] Обработка завершения фазы настройки
    const handleSetupComplete = (color: 'w' | 'b', time: number) => {
        setPlayerColor(color);
        setInitialTime(time);
        setIsSetupPhase(false);
    };

    return (
        <div className={styles['chess-container']}>

            {/* [EN] Render Setup Modal if in setup phase */}
            {/* [RU] Рендерим модальное окно настроек, если мы в фазе настройки */}
            {isSetupPhase && <GameSetupModal onStart={handleSetupComplete} />}

            <h1 className={styles['chess-title']}>Cosmo Game Hub</h1>

            <DifficultySelector
                currentDifficulty={difficulty}
                onSelect={(level: number) => setDifficulty(level)}
            />

            <div className={styles['game-zone']}>
                <div className={styles['board-area-wrapper']}>
                    {/* [EN] Trophies display */}
                    {/* [RU] Отображение трофеев */}
                    <Graveyard pieces={capturedPieces.b} color="b" />

                    <div className={styles['board-wrapper']}>
                        <ChessBoard
                            board={boardMatrix}
                            onMove={handleUserMove}
                            isBlackOriented={playerColor === 'b'}
                            getLegalDestinations={getLegalDestinations}
                            checkedSquare={checkedSquare}
                        />

                        {isEngineThinking && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded text-amber-400 text-sm font-bold z-10">
                                <span className="animate-pulse">Engine is thinking...</span>
                            </div>
                        )}
                    </div>

                    <Graveyard pieces={capturedPieces.w} color="w" />
                </div>
            </div>

            <div className={styles['control-panel']}>
                <TimerPanel
                    activePlayer={activeTimerPlayer}
                    onTimeOut={handleTimeOut}
                    initialSeconds={initialTime}
                />

                <MoveHistory moves={moveHistory} onDownloadPgn={handleDownloadPgn} />
            </div>

            <PromotionModal
                pendingPromotion={pendingPromotion}
                onSelect={confirmPromotion}
                onCancel={cancelPromotion}
            />

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
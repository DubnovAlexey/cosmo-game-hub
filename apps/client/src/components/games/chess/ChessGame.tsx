import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './Chess.module.css';
import { INITIAL_BOARD } from './chessConstants';
import ChessBoard from './ChessBoard';

export const ChessGame: React.FC = () => {
    // [EN] State array for highlighted squares
    // [RU] State-массив для подсвеченных клеток
    const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);

    const handleSquareClick = (index: number) => {
        // [EN] If square is already highlighted, deselect it. Otherwise, select it.
        // [RU] Если клетка уже подсвечена, снимаем выделение. Иначе выделяем ее.
        if (highlightedSquares.includes(index)) {
            setHighlightedSquares([]);
        } else {
            setHighlightedSquares([index]);
        }
    };

    return (
        <div className={clsx(styles['chess-container'])}>
            <h1 className={clsx(styles['chess-title'])}>Cosmo Chess</h1>

            <div className={clsx(styles['game-zone'])}>
                <div className={clsx(styles['control-panel'])}>
                    <div className={clsx(styles['timers-container'])}>
                        <div className={clsx(styles['timer-card'], styles['timer-white'], styles['active-turn'])}>
                            10:00
                        </div>
                        <div className={clsx(styles['timer-card'], styles['timer-black'])}>
                            10:00
                        </div>
                    </div>
                </div>

                <div className={clsx(styles['board-area-wrapper'])}>
                    <div className={clsx(styles['graveyard'])}></div>

                    <div className={clsx(styles['board-wrapper'])}>
                        <ChessBoard
                            boardState={INITIAL_BOARD}
                            isBlackOriented={false}
                            onSquareClick={handleSquareClick}
                            // [EN] Pass the array down to the Board component
                            // [RU] Передаем массив вниз в компонент доски
                            highlightedSquares={highlightedSquares}
                        />
                    </div>

                    <div className={clsx(styles['graveyard'])}></div>
                </div>

                <div className={clsx(styles['controls-container'])}>
                    <button className={clsx(styles['btn'], styles['btn-start'])}>
                        Start Game
                    </button>
                    <button className={clsx(styles['btn'])}>
                        Settings
                    </button>
                    <button className={clsx(styles['btn'])}>
                        Resign
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChessGame;
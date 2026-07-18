import React, { useState, useEffect } from 'react';
// Import legacy CSS [ɪmˈpɔrt ˈlɛgəsi si-ɛs-ɛs]
// Импорт старых стилей
import './ChessStyles.css';

export default function ChessGame() {
    // Game initialization state [geɪm ɪˌnɪʃəlaɪˈzeɪʃən steɪt]
    // Состояние инициализации игры
    const [isGameActive, setIsGameActive] = useState<boolean>(false);

    // Player color state (w or b) [ˈpleɪər ˈkʌlər steɪt]
    // Состояние цвета игрока (белые или черные)
    const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

    // Mount effect [maʊnt ɪˈfɛkt]
    // Эффект при монтировании (загрузке) компонента
    useEffect(() => {
        console.log("Chess Game Mounted!");
        // Here we will initialize Stockfish Web Worker later
        // Здесь мы позже инициализируем фоновый поток Stockfish
    }, []);

    return (
        <div className="chess-container">
            <h1 className="chess-title">Cosmo Chess</h1>

            <div className="game-zone">
                {/* Timers and UI will go here */}
                {/* Таймеры и интерфейс будут здесь */}
                <div className="timers-container">
                    <div className="timer-card timer-white">
                        10:00
                    </div>
                    <div className="timer-card timer-black">
                        10:00
                    </div>
                </div>

                <div className="board-area-wrapper">
                    {/* Placeholder for the Board Component */}
                    {/* Заглушка для компонента доски */}
                    <div className="board-wrapper">
                        <div style={{ color: 'white', margin: 'auto' }}>
                            Board rendering in progress...
                        </div>
                    </div>
                </div>

                <div className="controls-container">
                    <button
                        className="btn btn-start"
                        onClick={() => setIsGameActive(true)}
                        disabled={isGameActive}
                    >
                        Start Game
                    </button>
                    <button className="btn" id="btn-pause">
                        Pause
                    </button>
                    <button className="btn" id="btn-open-settings-modal">
                        Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
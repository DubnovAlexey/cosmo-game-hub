// [EN] Import React and the useState hook for managing local form state
// [RU] Импортируем React и хук useState для управления локальным состоянием формы
import React, { useState } from 'react';

// [EN] Import our CSS module for themed styling
// [RU] Импортируем наш CSS-модуль для тематической стилизации
import styles from './Chess.module.css';

// [EN] Define the properties this component expects from its parent
// [RU] Определяем свойства, которые этот компонент ожидает от родителя
export interface GameSetupModalProps {
    onStart: (color: 'w' | 'b', timeSeconds: number) => void;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({ onStart }) => {
    // [EN] Local state for selected time (default: 10 minutes = 600 seconds)
    // [RU] Локальное состояние для выбранного времени (по умолчанию: 10 минут = 600 секунд)
    const [time, setTime] = useState<number>(600);

    // [EN] Local state for selected color (default: white)
    // [RU] Локальное состояние для выбранного цвета (по умолчанию: белый)
    const [color, setColor] = useState<'w' | 'b'>('w');

    // [EN] Handle form submission to pass data back to the parent component
    // [RU] Обработка отправки формы для передачи данных обратно в родительский компонент
    const handleStart = () => {
        onStart(color, time);
    };

    return (
        // [EN] Full-screen backdrop with blur effect
        // [RU] Полноэкранная подложка с эффектом размытия
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className={styles['cyber-modal']}>
                <div className={styles['modal-content']}>
                    <h2>Match Setup</h2>

                    {/* [EN] Color Selection */}
                    {/* [RU] Выбор цвета */}
                    <div className={styles['settings-row']}>
                        <label>Play As</label>
                        <select
                            className={styles['ai-select']}
                            value={color}
                            onChange={(e) => setColor(e.target.value as 'w' | 'b')}
                        >
                            <option value="w">White Pieces</option>
                            <option value="b">Black Pieces</option>
                        </select>
                    </div>

                    {/* [EN] Time Selection */}
                    {/* [RU] Выбор времени */}
                    <div className={styles['settings-row']}>
                        <label>Time Control</label>
                        <select
                            className={styles['ai-select']}
                            value={time}
                            onChange={(e) => setTime(Number(e.target.value))}
                        >
                            <option value={180}>3 Minutes (Blitz)</option>
                            <option value={300}>5 Minutes (Blitz)</option>
                            <option value={600}>10 Minutes (Rapid)</option>
                            <option value={1800}>30 Minutes (Classical)</option>
                        </select>
                    </div>

                    {/* [EN] Action Button */}
                    {/* [RU] Кнопка действия */}
                    <div className={styles['modal-actions']}>
                        <button
                            className={`${styles['btn']} ${styles['btn-start']}`}
                            onClick={handleStart}
                        >
                            Start Game
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
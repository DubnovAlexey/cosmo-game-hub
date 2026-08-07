// [EN] Import React, the timer hook, and the presentational timer component
// [RU] Импортируем React, хук таймера и презентационный компонент часов
import React from 'react';
import { useChessTimer } from '@hooks/useChessTimer';
import { ChessTimer } from './ChessTimer';

// [EN] Import CSS module for the horizontal side-by-side timer layout
// [RU] Импортируем CSS-модуль для горизонтальной раскладки часов рядом друг с другом
import styles from './Chess.module.css';

// [EN] Interface defining the props expected by the TimerPanel.
// activePlayer replaces the old currentPlayer — it's nullable: null means neither clock should be
// running (before the first move, or once the match is over). initialSeconds is now optional and
// defaults to a standard 10-minute game.
// [RU] Интерфейс, определяющий пропсы, ожидаемые компонентом TimerPanel.
// activePlayer заменяет старый currentPlayer — он nullable: null означает, что ни один таймер не должен
// идти (до первого хода или после конца партии). initialSeconds теперь опционален и по умолчанию
// равен стандартным 10 минутам.
export interface TimerPanelProps {
    activePlayer: 'White' | 'Black' | null;
    onTimeOut: (player: 'White' | 'Black') => void;
    initialSeconds?: number;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({ activePlayer, onTimeOut, initialSeconds = 600 }) => {
    // [EN] The actual ticking lives in useChessTimer, called once here. Its per-second state updates
    // only re-render this component's own subtree — ChessGame and ChessBoard above it are untouched.
    // [RU] Само тиканье живёт в useChessTimer, вызываемом один раз здесь. Обновления состояния раз
    // в секунду перерендерят только поддерево этого компонента — ChessGame и ChessBoard выше не затронуты.
    const { whiteSeconds, blackSeconds } = useChessTimer({ activePlayer, initialSeconds, onTimeOut });

    return (
        <div className={styles['timers-container']}>
            <ChessTimer player="Black" isActive={activePlayer === 'Black'} seconds={blackSeconds} />
            <ChessTimer player="White" isActive={activePlayer === 'White'} seconds={whiteSeconds} />
        </div>
    );
};
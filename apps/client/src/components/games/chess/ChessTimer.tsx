// [EN] Import React
// [RU] Импортируем React
import React from 'react';

// [EN] Import CSS module for the themed timer card styles
// [RU] Импортируем CSS-модуль для тематических стилей карточки таймера
import styles from './Chess.module.css';

// [EN] Purely presentational now — no internal ticking state. The countdown itself lives in
// useChessTimer (called once from TimerPanel for both clocks); this component only displays a value
// [RU] Теперь чисто презентационный — без внутреннего состояния тиканья. Сам отсчёт живёт в
// useChessTimer (вызывается один раз из TimerPanel для обоих часов); этот компонент только отображает значение
export interface ChessTimerProps {
    player: 'White' | 'Black';
    isActive: boolean;
    seconds: number;
}

const ChessTimerComponent: React.FC<ChessTimerProps> = ({ player, isActive, seconds }) => {
    // [EN] Format total seconds into MM:SS format
    // [RU] Форматируем общее количество секунд в формат MM:SS
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedTime = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

    // [EN] Left-border accent color differs by side, matching the theme already defined in Chess.module.css
    // [RU] Цвет акцентной левой рамки различается по стороне, по уже готовой теме из Chess.module.css
    const colorClass = player === 'White' ? styles['timer-white'] : styles['timer-black'];

    return (
        <div
            className={`${styles['timer-card']} ${colorClass} ${isActive ? styles['active-turn'] : ''} flex justify-between items-center`}
        >
            <span className="font-bold uppercase tracking-wider">{player}</span>
            <span>{formattedTime}</span>
        </div>
    );
};

// [EN] Memoized: with two instances mounted side by side, only the one whose `seconds` actually
// changed this tick needs to re-render — the inactive clock's props stay identical and it's skipped
// [RU] Мемоизирован: при двух смонтированных рядом экземплярах перерендериться должен только тот,
// у кого `seconds` реально изменился в этот тик — у неактивных часов пропсы не меняются, ре-рендер пропускается
export const ChessTimer = React.memo(ChessTimerComponent);
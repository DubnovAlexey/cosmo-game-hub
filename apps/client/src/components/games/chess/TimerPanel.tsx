// [EN] Import React and the individual timer component
// [RU] Импортируем React и отдельный компонент таймера
import React from 'react';
import { ChessTimer } from '@components/games/chess/ChessTimer';

// [EN] Interface defining the props expected by the TimerPanel
// [RU] Интерфейс, определяющий пропсы, ожидаемые компонентом TimerPanel
export interface TimerPanelProps {
    currentPlayer: 'White' | 'Black';
    onTimeOut: (player: 'White' | 'Black') => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({ currentPlayer, onTimeOut }) => {
    return (
        // [EN] Wrapper container with dark styling and vertical layout
        // [RU] Контейнер-обертка с темной стилизацией и вертикальной компоновкой
        <div className="flex flex-col gap-4 bg-slate-800 p-5 rounded-xl border-2 border-slate-700 shadow-inner">
            <h3 className="text-slate-400 text-sm uppercase tracking-wider font-semibold text-center pb-2 border-b border-slate-700">
                Time Control
            </h3>

            {/* [EN] Black player timer. Active only if currentPlayer is Black */}
            {/* [RU] Таймер черного игрока. Активен только если текущий игрок - Black */}
            <ChessTimer
                player="Black"
                isActive={currentPlayer === 'Black'}
                initialSeconds={600} // 10 minutes
                onTimeOut={onTimeOut}
            />

            {/* [EN] White player timer. Active only if currentPlayer is White */}
            {/* [RU] Таймер белого игрока. Активен только если текущий игрок - White */}
            <ChessTimer
                player="White"
                isActive={currentPlayer === 'White'}
                initialSeconds={600} // 10 minutes
                onTimeOut={onTimeOut}
            />
        </div>
    );
};
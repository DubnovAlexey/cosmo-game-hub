// [EN] Import React hooks and our custom sound utility
// [RU] Импортируем хуки React и нашу кастомную утилиту для звука
import React, { useRef } from 'react';
import { playSnapSound } from '@utils/soundUtils';

// [EN] Update interface to support numeric levels 1-10 for the Goldfish engines
// [RU] Обновляем интерфейс для поддержки числовых уровней от 1 до 10 для движка Goldfish
export interface DifficultySelectorProps {
    currentDifficulty: number;
    onSelect: (level: number) => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ currentDifficulty, onSelect }) => {
    // [EN] useRef to track the previous integer value without causing re-renders
    // [RU] useRef для отслеживания предыдущего целого значения без вызова повторных рендеров
    const prevValueRef = useRef<number>(currentDifficulty);

    // [EN] Handler for slider movement
    // [RU] Обработчик движения ползунка
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // [EN] Parse the string value from the input to an integer
        // [RU] Преобразуем строковое значение из инпута в целое число
        const newValue = parseInt(e.target.value, 10);

        // [EN] Only trigger sound and update if the integer value actually changed
        // [RU] Вызываем звук и обновление только если целое значение действительно изменилось
        if (newValue !== prevValueRef.current) {
            playSnapSound();
            prevValueRef.current = newValue;
            onSelect(newValue);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <h3 className="text-slate-400 text-sm uppercase tracking-wider font-semibold">
                    Engine Level
                </h3>
                {/* [EN] Display current level dynamically */}
                {/* [RU] Динамически отображаем текущий уровень */}
                <span className="text-amber-500 font-bold font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700 shadow-inner">
                    {currentDifficulty}
                </span>
            </div>

            {/* [EN] Range slider input with min 1 and max 10 */}
            {/* [RU] Инпут в виде ползунка с минимумом 1 и максимумом 10 */}
            <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={currentDifficulty}
                onChange={handleChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>1 (Novice)</span>
                <span>10 (Grandmaster)</span>
            </div>
        </div>
    );
};
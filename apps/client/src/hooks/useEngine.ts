// [EN] Import necessary React hooks and the EngineManager class
// [RU] Импортируем необходимые хуки React и класс EngineManager
import { useRef, useEffect, useCallback } from 'react';
import { EngineManager } from '@utils/engine/EngineManager';

export const useEngine = () => {
    // [EN] Use a ref to store the engine instance without causing re-renders
    // [RU] Используем ref для хранения экземпляра движка без вызова перерисовок
    const engineRef = useRef<EngineManager | null>(null);

    // [EN] Initialize the engine on mount and destroy it on unmount
    // [RU] Инициализируем движок при монтировании и уничтожаем при размонтировании
    useEffect(() => {
        engineRef.current = new EngineManager();

        // [EN] Cleanup function to prevent memory leaks
        // [RU] Функция очистки для предотвращения утечек памяти
        return () => {
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
        };
    }, []);

    // [EN] Memoized function to get the best move from the engine
    // [RU] Мемоизированная функция для получения лучшего хода от движка
    const getBestMove = useCallback(async (fen: string, level: number) => {
        if (!engineRef.current) return null;
        return await engineRef.current.getBestMove(fen, level);
    }, []);

    return { getBestMove };
};
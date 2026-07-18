// [EN] Import React and explicitly import ReactNode as a type
// [RU] Импортируем React и явно импортируем ReactNode как тип
import React, { type ReactNode } from 'react';

// [EN] Define the props for our hybrid overlay
// [RU] Определяем свойства для нашей гибридной обертки
interface GameOverOverlayProps {
    status: 'win' | 'lose' | 'draw';
    children: ReactNode;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ status, children }) => {
    // [EN] Base dark humor / grim atmosphere classes
    // [RU] Базовые классы для мрачной атмосферы / черного юмора
    const baseOverlay = "absolute inset-0 z-50 flex items-center justify-center overflow-hidden";

    // [EN] Dynamic background based on game result
    // [RU] Динамический фон в зависимости от результата игры
    const bgEffect = status === 'lose'
        ? "bg-black/90"
        : status === 'win'
            ? "bg-slate-900/80"
            : "bg-slate-800/80";

    return (
        <div className={`${baseOverlay} ${bgEffect} backdrop-blur-md`}>

            {/* [EN] Injecting CSS Keyframes directly for MVP encapsulation */}
            {/* [RU] Внедряем ключевые кадры CSS напрямую для инкапсуляции MVP */}
            <style>
                {`
                    @keyframes bloodMist {
                        0% { opacity: 0; transform: scale(1); }
                        100% { opacity: 0.6; transform: scale(1.1); }
                    }
                    @keyframes dripDown {
                        0% { top: -20%; opacity: 0; }
                        10% { opacity: 1; }
                        100% { top: 100%; opacity: 0.8; }
                    }
                `}
            </style>

            {/* [EN] VFX Layer: Global atmospheric effects */}
            {/* [RU] Слой визуальных эффектов: Глобальные атмосферные эффекты */}
            <div className="absolute inset-0 pointer-events-none" id="vfx-layer">
                {status === 'lose' && (
                    <>
                        {/* [EN] Blood mist effect */}
                        {/* [RU] Эффект кровавого тумана */}
                        <div
                            className="absolute inset-0 bg-red-900 mix-blend-multiply"
                            style={{ animation: 'bloodMist 5s ease-out forwards' }}
                        />
                        {/* [EN] Slow dripping blood effect */}
                        {/* [RU] Эффект медленно стекающей крови */}
                        <div
                            className="absolute left-1/3 w-8 bg-red-800 blur-sm rounded-b-full drop-shadow-2xl"
                            style={{ height: '40vh', animation: 'dripDown 4s ease-in forwards 1s' }}
                        />
                    </>
                )}
            </div>

            {/* [EN] Content Slot: Game-specific UI with dark humor styling */}
            {/* [RU] Слот контента: Специфичный для игры UI в стиле черного юмора */}
            <div className="relative z-10 p-8 border-2 shadow-2xl bg-slate-950/90 rounded-2xl border-slate-700 flex flex-col items-center text-center">

                {/* [EN] Dynamic Header based on status */}
                {/* [RU] Динамический заголовок в зависимости от статуса */}
                <h2 className={`text-4xl font-black uppercase tracking-widest mb-4 drop-shadow-lg ${status === 'lose' ? 'text-red-600' : 'text-amber-400'}`}>
                    {status === 'lose' ? 'Fatality' : status === 'win' ? 'Victory' : 'Draw'}
                </h2>

                <div className="text-slate-300 mb-8">
                    {children}
                </div>

                {/* [EN] Action Buttons */}
                {/* [RU] Кнопки действий */}
                <div className="flex gap-4 mt-4">
                    <button className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 border border-slate-600 transition-all hover:scale-105 uppercase tracking-wide">
                        Try Again
                    </button>
                    {status === 'lose' && (
                        <button className="px-6 py-3 bg-red-950 text-red-500 font-bold rounded-lg hover:bg-red-900 border border-red-900 transition-all hover:scale-105 uppercase tracking-wide">
                            Accept Defeat
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
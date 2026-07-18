// [EN] Import React
// [RU] Импортируем React
import React from 'react';

// [EN] Import our strict type for squares
// [RU] Импортируем наш строгий тип для клеток
import type { ChessSquare } from './chessConstants';

// [EN] Interface for component props
// [RU] Интерфейс для свойств компонента
interface PromotionModalProps {
    pendingPromotion: { from: ChessSquare; to: ChessSquare } | null;
    onSelect: (pieceType: string) => void;
}

// [EN] Array of piece types available for promotion (engine standard)
// [RU] Массив типов фигур, доступных для превращения (стандарт движка)
const PROMOTION_PIECES = ['q', 'r', 'b', 'n'];

export const PromotionModal: React.FC<PromotionModalProps> = ({ pendingPromotion, onSelect }) => {
    // [EN] State-driven UI: If there is no promotion pending, render nothing
    // [RU] UI, управляемый состоянием: Если нет ожидающего превращения, ничего не рендерим
    if (!pendingPromotion) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-600 text-center">
                <h2 className="text-white text-xl font-bold mb-6">Choose Promotion</h2>
                <div className="flex gap-4 justify-center">
                    {PROMOTION_PIECES.map((piece) => (
                        <button
                            key={piece}
                            onClick={() => onSelect(piece)}
                            className="w-16 h-16 bg-slate-700 hover:bg-slate-500 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                        >
                            {/* [EN] Placeholder for piece image. Using text for now. */}
                            {/* [RU] Заглушка для картинки фигуры. Пока используем текст. */}
                            <span className="text-white text-3xl uppercase">{piece}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
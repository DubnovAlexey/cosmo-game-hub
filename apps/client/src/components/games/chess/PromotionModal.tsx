// [EN] Import React
// [RU] Импортируем React
import React from 'react';

// [EN] Reuse the exact pending-promotion shape and piece-choice type from the logic hook —
// single source of truth instead of a parallel local type
// [RU] Переиспользуем точную форму pendingPromotion и тип выбора фигуры из хука логики —
// единый источник истины вместо параллельного локального типа
import type { PendingPromotion, PromotionPieceSymbol } from '@hooks/useChessLogic';

// [EN] Shared piece image map — same source ChessBoard uses, avoids a second copy of the assets
// [RU] Общая карта изображений фигур — тот же источник, что использует ChessBoard, без второй копии ассетов
import { PIECE_IMAGES } from '@assets/chessPieces';

// [EN] Reuse the existing themed modal styles (cyber-modal, promo-btn, ...) instead of inventing new ones —
// this stylesheet is already wired into Chess.module.css but wasn't used by this component yet
// [RU] Переиспользуем уже готовую тематическую стилизацию модалки (cyber-modal, promo-btn, ...) —
// эти классы уже есть в Chess.module.css, но раньше этот компонент их не использовал
import styles from './Chess.module.css';

interface PromotionModalProps {
    pendingPromotion: PendingPromotion | null;
    onSelect: (piece: PromotionPieceSymbol) => void;
    onCancel?: () => void;
}

// [EN] Piece choices in a conventional visual order
// [RU] Варианты фигур в привычном визуальном порядке
const PROMOTION_PIECES: PromotionPieceSymbol[] = ['q', 'r', 'b', 'n'];

export const PromotionModal: React.FC<PromotionModalProps> = ({ pendingPromotion, onSelect, onCancel }) => {
    // [EN] State-driven UI: if there is no promotion pending, render nothing
    // [RU] UI, управляемый состоянием: если нет ожидающего превращения, ничего не рендерим
    if (!pendingPromotion) return null;

    const { color } = pendingPromotion;

    return (
        // [EN] Backdrop mirrors GameOverOverlay's overlay pattern; clicking it cancels the pending move
        // [RU] Подложка повторяет паттерн оверлея из GameOverOverlay; клик по ней отменяет отложенный ход
        <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className={styles['cyber-modal']}
                // [EN] Stop the click from bubbling to the backdrop so picking a piece can't also cancel it
                // [RU] Останавливаем всплытие клика к подложке, чтобы выбор фигуры не отменял его же
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles['modal-content']}>
                    <h2>Choose Promotion</h2>
                    <div className={styles['promotion-options']}>
                        {PROMOTION_PIECES.map((piece) => (
                            <button
                                key={piece}
                                type="button"
                                onClick={() => onSelect(piece)}
                                className={styles['promo-btn']}
                                style={{ backgroundImage: `url(${PIECE_IMAGES[`${color}-${piece}`]})` }}
                                aria-label={`Promote to ${piece}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
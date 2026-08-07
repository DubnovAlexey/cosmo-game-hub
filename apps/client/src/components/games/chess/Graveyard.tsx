// [EN] Import React and chess.js's piece/color types
// [RU] Импортируем React и типы фигуры/цвета из chess.js
import React from 'react';
import type { PieceSymbol, Color } from 'chess.js';

// [EN] Shared piece image map — same source ChessBoard and PromotionModal use
// [RU] Общая карта изображений фигур — тот же источник, что используют ChessBoard и PromotionModal
import { PIECE_IMAGES } from '@assets/chessPieces';

// [EN] Import CSS module for the themed graveyard slot styling
// [RU] Импортируем CSS-модуль для тематической стилизации слотов кладбища
import styles from './Chess.module.css';

interface GraveyardProps {
    // [EN] The color the captured pieces themselves belonged to (not who captured them) —
    // determines which piece image to show for each icon
    // [RU] Цвет, которому принадлежали захваченные фигуры (не тот, кто их взял) —
    // определяет, какую картинку фигуры показать для каждой иконки
    pieces: PieceSymbol[];
    color: Color;
}

export const Graveyard: React.FC<GraveyardProps> = ({ pieces, color }) => {
    return (
        <div className={styles['graveyard']}>
            {pieces.map((piece, index) => (
                <div
                    // [EN] index is safe here — this list only ever grows, items are never reordered or removed
                    // [RU] index здесь безопасен — этот список только растёт, элементы не переупорядочиваются и не удаляются
                    key={`${color}-${piece}-${index}`}
                    className={styles['graveyard-piece']}
                    style={{ backgroundImage: `url(${PIECE_IMAGES[`${color}-${piece}`]})` }}
                    aria-label={`Captured ${color === 'w' ? 'white' : 'black'} ${piece}`}
                />
            ))}
        </div>
    );
};
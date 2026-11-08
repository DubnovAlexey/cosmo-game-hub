// [EN] Import the main class and types from chess.js
// [RU] Импортируем главный класс и типы из chess.js
import { Chess, PieceSymbol, Color, Square } from 'chess.js';

// [EN] Define the strict interface for a board square to match ChessBoard props
// [RU] Определяем строгий интерфейс для клетки доски, чтобы соответствовать пропсам ChessBoard
export interface BoardPiece {
    square: Square;
    type: PieceSymbol;
    color: Color;
}

// [EN] Utility function to convert a FEN string into a 2D matrix
// [RU] Утилитарная функция для конвертации FEN-строки в двумерную матрицу
export const parseFenToBoard = (fen: string): (BoardPiece | null)[][] => {
    try {
        // [EN] Create a new engine instance with the provided FEN
        // [RU] Создаем новый экземпляр движка с предоставленным FEN
        const chess = new Chess(fen);

        // [EN] Return the built-in board representation
        // [RU] Возвращаем встроенное представление доски
        return chess.board() as (BoardPiece | null)[][];
    } catch (error) {
        // [EN] Fallback to standard starting position if FEN is invalid
        // [RU] Откат к стандартной начальной позиции, если FEN невалиден
        console.error('Invalid FEN string provided:', error);
        return new Chess().board() as (BoardPiece | null)[][];
    }
};
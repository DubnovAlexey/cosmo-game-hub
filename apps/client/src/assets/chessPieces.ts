// [EN] Static imports of all piece images from the assets folder — single source of truth,
// reused by both ChessBoard and PromotionModal (previously this map only lived inside ChessBoard.tsx)
// [RU] Статические импорты всех изображений фигур — единый источник истины,
// переиспользуется и ChessBoard, и PromotionModal (раньше эта карта жила только в ChessBoard.tsx)
import w_p from '@assets/images/chess/w_pawn.svg.webp';
import w_n from '@assets/images/chess/w_knight.svg.webp';
import w_b from '@assets/images/chess/w_bishop.svg.webp';
import w_r from '@assets/images/chess/w_rook.svg.webp';
import w_q from '@assets/images/chess/w_queen.svg.webp';
import w_k from '@assets/images/chess/w_king.svg.webp';

import b_p from '@assets/images/chess/b_pawn.svg.webp';
import b_n from '@assets/images/chess/b_knight.svg.webp';
import b_b from '@assets/images/chess/b_bishop.svg.webp';
import b_r from '@assets/images/chess/b_rook.svg.webp';
import b_q from '@assets/images/chess/b_queen.svg.webp';
import b_k from '@assets/images/chess/b_king.svg.webp';

// [EN] Mapping dictionary connecting "${color}-${type}" shortcodes to imported image URLs
// [RU] Словарь маппинга, связывающий короткие коды "${color}-${type}" с URL импортированных изображений
export const PIECE_IMAGES: Record<string, string> = {
    'w-p': w_p, 'w-n': w_n, 'w-b': w_b, 'w-r': w_r, 'w-q': w_q, 'w-k': w_k,
    'b-p': b_p, 'b-n': b_n, 'b-b': b_b, 'b-r': b_r, 'b-q': b_q, 'b-k': b_k,
};
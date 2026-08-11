// [EN] Static imports of all piece images from the assets folder.
// [EN] The '?url' suffix forces Vite to return a raw string URL, preventing 404 errors and matching TypeScript expectations.
// [RU] Статические импорты всех изображений фигур из папки ассетов.
// [RU] Суффикс '?url' заставляет Vite вернуть чистую строку URL, предотвращая ошибку 404 и соответствуя ожиданиям TypeScript.
import w_p from '@assets/images/chess/w_pawn.svg.webp?url';
import w_n from '@assets/images/chess/w_knight.svg.webp?url';
import w_b from '@assets/images/chess/w_bishop.svg.webp?url';
import w_r from '@assets/images/chess/w_rook.svg.webp?url';
import w_q from '@assets/images/chess/w_queen.svg.webp?url';
import w_k from '@assets/images/chess/w_king.svg.webp?url';

import b_p from '@assets/images/chess/b_pawn.svg.webp?url';
import b_n from '@assets/images/chess/b_knight.svg.webp?url';
import b_b from '@assets/images/chess/b_bishop.svg.webp?url';
import b_r from '@assets/images/chess/b_rook.svg.webp?url';
import b_q from '@assets/images/chess/b_queen.svg.webp?url';
import b_k from '@assets/images/chess/b_king.svg.webp?url';

// [EN] Mapping dictionary connecting "${color}-${type}" shortcodes to the resolved image string URLs.
// [RU] Словарь маппинга, связывающий короткие коды "${color}-${type}" с разрешенными строковыми URL изображений.
export const PIECE_IMAGES: Record<string, string> = {
    'w-p': w_p, 'w-n': w_n, 'w-b': w_b, 'w-r': w_r, 'w-q': w_q, 'w-k': w_k,
    'b-p': b_p, 'b-n': b_n, 'b-b': b_b, 'b-r': b_r, 'b-q': b_q, 'b-k': b_k,
};
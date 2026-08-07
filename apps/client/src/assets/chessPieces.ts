// [EN] Static imports of all piece images from the assets folder — single source of truth,
// reused by both ChessBoard and PromotionModal.
// [EN] FIX: appended the Vite `?url` suffix to every import. Without it, Astro's own image pipeline
// intercepts any image imported from inside `src/` and returns an ImageMetadata OBJECT
// ({ src, width, height, format, ... }) instead of a plain string. React then rendered that object
// straight into <img src={...}>, which stringified to the literal text "[object Object]" and the
// browser tried (and failed, 404) to fetch a resource literally named that. `?url` tells Vite/Astro
// "give me the resolved string URL, skip the image-optimization step" — exactly what an <img src>
// or CSS background-image needs here.
// [RU] Статические импорты всех изображений фигур — единый источник истины,
// переиспользуется и ChessBoard, и PromotionModal.
// [RU] ИСПРАВЛЕНИЕ: к каждому импорту добавлен суффикс Vite `?url`. Без него собственный конвейер
// изображений Astro перехватывает любую картинку, импортированную из `src/`, и возвращает ОБЪЕКТ
// ImageMetadata ({ src, width, height, format, ... }) вместо простой строки. React рендерил этот
// объект прямо в <img src={...}>, что превращалось в буквальный текст "[object Object]", и браузер
// пытался (и не мог, 404) получить ресурс с буквально таким именем. `?url` говорит Vite/Astro
// "дай мне готовую строку URL, без шага оптимизации изображения" — именно это нужно здесь
// для <img src> и background-image в CSS.
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

// [EN] Mapping dictionary connecting "${color}-${type}" shortcodes to imported image URLs
// [RU] Словарь маппинга, связывающий короткие коды "${color}-${type}" с URL импортированных изображений
export const PIECE_IMAGES: Record<string, string> = {
    'w-p': w_p, 'w-n': w_n, 'w-b': w_b, 'w-r': w_r, 'w-q': w_q, 'w-k': w_k,
    'b-p': b_p, 'b-n': b_n, 'b-b': b_b, 'b-r': b_r, 'b-q': b_q, 'b-k': b_k,
};
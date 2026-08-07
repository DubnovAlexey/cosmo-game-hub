// [EN] Import React and the ref/effect hooks used for auto-scroll
// [RU] Импортируем React и хуки ref/effect, используемые для авто-прокрутки
import React, { useEffect, useRef } from 'react';

// [EN] chess.js's own verbose move type — no need to redeclare the shape ourselves
// [RU] Собственный детальный тип хода из chess.js — не нужно заново описывать эту форму
import type { Move } from 'chess.js';

// [EN] Import CSS module for the themed history panel styles
// [RU] Импортируем CSS-модуль для тематических стилей панели истории
import styles from './Chess.module.css';

interface MoveHistoryProps {
    moves: Move[];
    onDownloadPgn: () => void;
}

// [EN] A single White/Black move pair for the classic "1. e4 e5" display format
// [RU] Одна пара ходов Белые/Чёрные для классического формата отображения "1. e4 e5"
interface MovePair {
    number: number;
    white?: string;
    black?: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, onDownloadPgn }) => {
    const listRef = useRef<HTMLDivElement>(null);

    // [EN] Group the flat move list into White/Black pairs
    // [RU] Группируем плоский список ходов в пары Белые/Чёрные
    const movePairs: MovePair[] = [];
    moves.forEach((move, index) => {
        const pairIndex = Math.floor(index / 2);
        if (!movePairs[pairIndex]) {
            movePairs[pairIndex] = { number: pairIndex + 1 };
        }
        if (move.color === 'w') {
            movePairs[pairIndex].white = move.san;
        } else {
            movePairs[pairIndex].black = move.san;
        }
    });

    // [EN] Auto-scroll to the latest move whenever the list grows
    // [RU] Автопрокрутка к последнему ходу при каждом росте списка
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [moves.length]);

    return (
        <div className={styles['history-panel']}>
            <div ref={listRef} className={styles['history-list']}>
                {movePairs.length === 0 && (
                    <span className="text-slate-500 text-sm italic">No moves yet</span>
                )}
                {movePairs.map((pair) => (
                    <div key={pair.number} className={styles['history-move-row']}>
                        <span className={styles['history-move-number']}>{pair.number}.</span>
                        <span className={styles['history-san']}>{pair.white ?? ''}</span>
                        <span className={styles['history-san']}>{pair.black ?? ''}</span>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onDownloadPgn}
                disabled={moves.length === 0}
                className={styles['btn']}
            >
                Download PGN
            </button>
        </div>
    );
};
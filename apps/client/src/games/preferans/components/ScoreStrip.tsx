// [EN] FILE: games/preferans/components/ScoreStrip.tsx — the score always in sight on phones and tablets, where the
//      paper sheet does not fit next to the table: a paper note with every player's balance in whists, pool (of the
//      target) and mountain, written by hand. A player whose numbers the last deal changed flashes once. A tap opens
//      the full sheet.
// [RU] ФАЙЛ: счёт всегда перед глазами на телефоне и планшете, где бумажный лист не помещается рядом со столом:
//      бумажная записка, где у каждого игрока от руки итог в вистах, пуля (из цели) и гора. Игрок, чьи числа
//      изменила последняя раздача, вспыхивает один раз. Нажатие открывает весь лист.
import React from 'react';
import { useTexts } from '../i18n/index.ts';
import { signed } from './format';
import { bandTotal, playerChanged, type SheetHistory } from './sheetHistory';
import styles from './ScoreSheet.module.css';

interface ScoreStripProps {
    history: SheetHistory;
    balance: readonly number[];
    names: readonly string[];
    poolTarget: number;
    onOpen: () => void;
}

const tone =(value: number): string => (value > 0.05 ? styles.plus : value < -0.05 ? styles.minus : '');

export const ScoreStrip: React.FC<ScoreStripProps> = ({ history, balance, names, poolTarget, onOpen }) => {
    const t = useTexts();
    const spoken = names
        .map((name, seat) => t.sheet.stripPlayer(name, bandTotal(history.pool[seat]), poolTarget, bandTotal(history.mountain[seat]), signed(balance[seat])))
        .join('; ');
    return (
        <button type="button" className={styles.strip} onClick={onOpen} aria-label={t.sheet.strip(spoken)}>
            {names.map((name, seat) => (
                // [EN] Keyed by the deal number, so the flash replays after every deal. [RU] Ключ — номер раздачи: вспышка повторяется после каждой.
                <span key={`${name}-${history.lastDeal}`} className={`${styles.chip} ${playerChanged(history, seat) ? styles.chipFresh : ''}`} aria-hidden="true">
                    <span className={styles.chipTop}>
                        <b>{name}</b> <span className={tone(balance[seat])}>{signed(balance[seat])}</span>
                    </span>
                    <span className={styles.chipBottom}>
                        <i className={styles.dotPool} />{bandTotal(history.pool[seat])}/{poolTarget}
                        <i className={styles.dotMountain} />{bandTotal(history.mountain[seat])}
                    </span>
                </span>
            ))}
            <span className={styles.stripOpen} aria-hidden="true">▦</span>
        </button>
    );
};

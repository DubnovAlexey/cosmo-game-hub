// [EN] FILE: games/preferans/components/ScoreSheet.tsx — the score sheet panel: the paper sheet (pool, mountain,
//      whists written by hand), a legend, the balance if the pool closed now, the list of deals and the rules in
//      short. On a computer it lies next to the table all the time; anywhere it also opens large in a window.
// [RU] ФАЙЛ: панель пули — бумажный лист (пуля, гора, висты от руки), легенда, итог, если бы пуля закрылась
//      сейчас, список раздач и коротко правила. На компьютере всё время лежит рядом со столом; на любом экране
//      ещё и открывается крупно в окне.
import React from 'react';
import type { DealLogEntry } from '../hooks/usePreferans';
import { useTexts } from '../i18n/index.ts';
import { resultText, signed } from './format';
import { Pulka } from './Pulka';
import type { SheetHistory } from './sheetHistory';
import gameStyles from './Preferans.module.css';
import styles from './ScoreSheet.module.css';

interface ScoreSheetProps {
    history: SheetHistory;
    balance: readonly number[];
    log: readonly DealLogEntry[];
    names: readonly string[];
    poolTarget: number;
    poolTotal: number;
    titleId: string;
    large?: boolean;
    onExpand?: () => void;
    onClose?: () => void;
}

const tone =(value: number): string => (value > 0.05 ? styles.plus : value < -0.05 ? styles.minus : '');

export const ScoreSheet: React.FC<ScoreSheetProps> = ({ history, balance, log, names, poolTarget, poolTotal, titleId, large = false, onExpand, onClose }) => {
    const t = useTexts();
    return (
        <section className={`${styles.sheet} ${large ? styles.sheetLarge : ''}`} aria-labelledby={titleId}>
            <header className={styles.sheetHeader}>
                <h2 id={titleId}>{t.sheet.title}</h2>
                <span className={styles.sheetMeta}>{t.sheet.meta(poolTarget, poolTotal)}</span>
                {onClose && <button type="button" className={styles.iconButton} onClick={onClose} aria-label={t.sheet.close} title={t.sheet.close}>✕</button>}
                {onExpand && <button type="button" className={styles.iconButton} onClick={onExpand} aria-label={t.sheet.openLarge} title={t.sheet.openLarge}>⤢</button>}
            </header>

            <Pulka history={history} names={names} poolTarget={poolTarget} balance={balance} large={large} />

            <p className={styles.legend}>
                <span><i className={styles.dotMountain} /> {t.sheet.legend.mountain}</span>
                <span><i className={styles.dotPool} /> {t.sheet.legend.pool}</span>
                <span><i className={styles.dotWhists} /> {t.sheet.legend.whists}</span>
            </p>
            <p className={styles.balance}>
                {t.sheet.ifClosedNow}{' '}
                {names.map((name, seat) => <span key={name} className={tone(balance[seat])}>{name} {signed(balance[seat])}</span>)}
                <span className={styles.balanceUnit}>{t.sheet.sumsToZero}</span>
            </p>

            {log.length > 0 && (
                <details className={styles.deals} open={large}>
                    <summary>{t.sheet.deals(log.length)}</summary>
                    <ol reversed className={gameStyles.log}>
                        {[...log].reverse().map(entry => <li key={entry.number}>{t.sheet.deal(entry.number)} · {resultText(entry.result, names, t)}</li>)}
                    </ol>
                </details>
            )}

            <details className={gameStyles.rules}>
                <summary>{t.sheet.rulesTitle}</summary>
                <ul>{t.sheet.rules.map(rule => <li key={rule}>{rule}</li>)}</ul>
            </details>
        </section>
    );
};

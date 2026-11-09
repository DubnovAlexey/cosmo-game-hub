// [EN] FILE: games/preferans/components/PreferansTable.tsx — the table itself: the menu, you against two bots, and
//      the score sheet always in sight (lying next to the table on a computer, a paper strip above it on smaller
//      screens, large in a window on demand). It wires the game hook to the table parts; all rules live in ../engine,
//      all texts come from the current language.
// [RU] ФАЙЛ: сам стол — меню, вы против двух ботов и пуля всегда перед глазами (лежит рядом со столом на
//      компьютере, бумажной полосой над ним на экранах поменьше, крупно в окне по нажатию). Связывает хук игры с
//      частями стола; все правила — в ../engine, все тексты — на текущем языке.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GameOverOverlay } from '@shared/components/GameOverOverlay';
import { LanguageSwitch } from '@shared/components/LanguageSwitch';
import type { Language } from '@shared/i18n/languages';
import { loadGame, loadGameResults } from '@shared/utils/storageEngine';
import { OPTIONS, cardsOf, isHandVisible, isOn, legalPlays, type Card, type DealState, type Seat } from '../engine/index.ts';
import {
    HUMAN_SEAT, SAVE_ID, SAVE_VERSION, usePreferans,
    type PreferansResultSummary, type PreferansSave, type PreferansSettings,
} from '../hooks/usePreferans';
import { TextsContext, type Dictionary, type DictionaryFactory } from '../i18n/index.ts';
import { Lair } from './Lair';
import { ActionPanel } from './ActionPanel';
import { PlayerSeat } from './PlayerSeat';
import { ScoreSheet } from './ScoreSheet';
import { ScoreSheetDialog } from './ScoreSheetDialog';
import { ScoreStrip } from './ScoreStrip';
import { SetupPanel } from './SetupPanel';
import { TrickArea } from './TrickArea';
import { contractLabel, lastCall, resultText, roleOf, signed } from './format';
import { buildSheetHistory } from './sheetHistory';
import styles from './Preferans.module.css';
import sheetStyles from './ScoreSheet.module.css';

const POSITIONS: Record<Seat, 'bottom' | 'left' | 'right'> = { 0: 'bottom', 1: 'left', 2: 'right' };

// [EN] One line in the middle of the table: what is being played and what matters now.
// [RU] Одна строка в середине стола: что играется и что сейчас важно.
function tableInfo(deal: DealState, t: Dictionary): { headline: string; hint: string } {
    if (deal.phase === 'bidding') return { headline: t.info.auction, hint: t.info.speaksFirst(deal.firstHand) };
    if (deal.mode === 'raspasy' || deal.declarer === null) return { headline: t.info.allPass, hint: deal.rules.raspasyTalonLeads ? t.info.allPassTalonHint : t.info.allPassHint };
    const declarer = deal.declarer;
    if (deal.mode === 'misere') return { headline: t.info.misere(declarer), hint: t.info.misereHint(declarer) };
    if (deal.phase === 'discard') return { headline: t.info.takesTalon(declarer), hint: t.info.discardHint };
    const level = deal.contract?.kind === 'game' ? deal.contract.level : 0;
    return { headline: `${t.seatNames[declarer]} · ${contractLabel(deal, t) ?? ''}`, hint: deal.phase === 'play' ? t.info.needs(declarer, level) : t.info.defendersDecide };
}

interface PreferansTableProps {
    language: Language;
    onLanguage: (language: Language) => void;
    /** [EN] The current language, applied to the company at this table. [RU] Текущий язык, применяемый к компании за столом. */
    texts: DictionaryFactory;
}

export const PreferansTable: React.FC<PreferansTableProps> = ({ language, onLanguage, texts }) => {
    const [setupOpen, setSetupOpen] = useState(true);
    const [tableStarted, setTableStarted] = useState(false);
    const [saved, setSaved] = useState(() => loadGame<PreferansSave>(SAVE_ID, SAVE_VERSION));
    const [results, setResults] = useState(() => loadGameResults<PreferansResultSummary>(SAVE_ID));
    const [sheetOpen, setSheetOpen] = useState(false);
    // [EN] The bots wait while the menu or the large sheet covers the table. [RU] Боты ждут, пока стол закрыт меню или крупной пулей.
    const game = usePreferans(!setupOpen && !sheetOpen);
    const { deal } = game;
    // [EN] The sentences agree with the opponents of this pool. [RU] Фразы согласуются с соперниками этой пули.
    const t = useMemo(() => texts(game.cast), [texts, game.cast]);
    const names = t.seatNames;
    const [selected, setSelected] = useState<Card[]>([]);
    const history = useMemo(() => buildSheetHistory(game.log), [game.log]);
    const openSheet = useCallback(() => setSheetOpen(true), []);
    const closeSheet = useCallback(() => setSheetOpen(false), []);
    const poolTarget = game.settings.table.poolTarget;
    const extras = OPTIONS.filter(spec => spec.kind === 'extra' && isOn(game.settings.table, spec.id)).map(spec => t.explain.options[spec.id].name);

    // [EN] A new phase or deal clears the discard selection. [RU] Новая фаза или раздача сбрасывает выбор сноса.
    useEffect(() => { setSelected([]); }, [deal.phase, deal.dealer]);

    const openSetup = () => {
        setSaved(loadGame<PreferansSave>(SAVE_ID, SAVE_VERSION));
        setResults(loadGameResults<PreferansResultSummary>(SAVE_ID));
        setSetupOpen(true);
    };
    // [EN] Starting or continuing brings the table to the top of the screen: on a phone the site header scrolls away
    //      and the whole table fits one screen. [RU] Старт или продолжение поднимают стол к верху экрана: на телефоне
    //      шапка сайта уезжает, и весь стол помещается на один экран.
    const showTable = () => requestAnimationFrame(() => document.getElementById('preferans-room')?.scrollIntoView({ block: 'start' }));
    const startPool = (settings: PreferansSettings) => { game.restart(settings); setTableStarted(true); setSetupOpen(false); showTable(); };
    const continuePool = (save: PreferansSave) => { game.load(save); setTableStarted(true); setSetupOpen(false); showTable(); };

    const controlledSeat: Seat | null = game.isHumanTurn ? deal.turn : null;
    const clickableFor = (seat: Seat): ReadonlySet<Card> | null => {
        if (setupOpen) return null;
        if (deal.phase === 'discard' && controlledSeat === seat) return new Set(cardsOf(deal.hands[seat]));
        if (deal.phase === 'play' && controlledSeat === seat) return new Set(legalPlays(deal));
        return null;
    };
    const onCard = (seat: Seat) => (card: Card) => {
        if (deal.phase === 'discard') {
            setSelected(current => (current.includes(card) ? current.filter(item => item !== card) : current.length < 2 ? [...current, card] : current));
        } else if (deal.phase === 'play') {
            game.act({ type: 'play', seat, card });
        }
    };
    const info = tableInfo(deal, t);
    const humanBalance = game.balance[HUMAN_SEAT];

    const seatView = (seat: Seat) => (
        <PlayerSeat
            key={seat}
            name={names[seat]}
            character={seat === HUMAN_SEAT ? null : game.cast[seat - 1] ?? null}
            position={POSITIONS[seat]}
            hand={deal.hands[seat]}
            visible={isHandVisible(deal, seat, HUMAN_SEAT) || controlledSeat === seat}
            isTurn={deal.turn === seat}
            thinking={game.thinking && deal.turn === seat}
            role={roleOf(deal, seat, t)}
            isDeclarer={deal.declarer === seat && deal.mode !== 'raspasy'}
            tricks={deal.phase === 'play' || deal.phase === 'done' ? deal.tricksWon[seat] : null}
            bubble={lastCall(deal, seat, t)}
            clickable={clickableFor(seat)}
            selected={seat === HUMAN_SEAT ? selected : []}
            onCard={onCard(seat)}
        />
    );

    return (
        <TextsContext.Provider value={t}>
        <div id="preferans-room" className={styles.room}>
            <Lair />
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t.gameTitle}</h1>
                    <p className={styles.subtitle}>
                        {[t.header.rules(t.explain.variants[game.settings.table.variant].name), t.header.pool(poolTarget), ...extras].join(' · ')} · {t.header.tagline}
                    </p>
                </div>
                <div className={styles.settings}>
                    <LanguageSwitch value={language} onChange={onLanguage} label={t.header.language} className={styles.language} />
                    <button type="button" className={styles.button} onClick={openSetup}>{t.header.tableSetup}</button>
                </div>
            </header>

            <div className={sheetStyles.stripOnly}>
                <ScoreStrip history={history} balance={game.balance} names={names} poolTarget={poolTarget} onOpen={openSheet} />
            </div>

            <div className={styles.layout}>
                <div>
                    <div className={styles.table} dir="ltr">
                        {seatView(1)}
                        <div className={styles.info}>
                            <span className={styles.contract}>{info.headline}</span>
                            <p className={styles.hint}>{info.hint}</p>
                        </div>
                        <TrickArea deal={deal} />
                        {seatView(2)}
                        {seatView(0)}
                    </div>

                    {deal.phase === 'done' && deal.result ? (
                        <div className={`${styles.panel} ${styles.result}`}>
                            <p className={styles.resultText}>{resultText(deal.result, names, t)}</p>
                            {!game.gameOver && <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={game.startNextDeal}>{t.actions.nextDeal}</button>}
                        </div>
                    ) : (
                        <ActionPanel deal={deal} humanSeat={HUMAN_SEAT} isHumanTurn={game.isHumanTurn && !setupOpen} selected={selected} act={game.act} />
                    )}
                </div>

                <div className={sheetStyles.sideOnly}>
                    <ScoreSheet history={history} balance={game.balance} log={game.log} names={names} variant={game.settings.table.variant} titleId="preferans-sheet-side"
                        poolTarget={poolTarget} poolTotal={game.poolTotal} onExpand={openSheet} />
                </div>
            </div>

            {sheetOpen && (
                <ScoreSheetDialog labelledBy="preferans-sheet-large" onClose={closeSheet}>
                    <ScoreSheet history={history} balance={game.balance} log={game.log} names={names} variant={game.settings.table.variant} titleId="preferans-sheet-large"
                        poolTarget={poolTarget} poolTotal={game.poolTotal} large onClose={closeSheet} />
                </ScoreSheetDialog>
            )}

            {game.gameOver && !setupOpen && (
                <GameOverOverlay status={humanBalance > 0.05 ? 'win' : humanBalance < -0.05 ? 'lose' : 'draw'} onTryAgain={openSetup}>
                    <p className="text-xl mb-2 text-slate-200">{t.results.poolClosed}</p>
                    <p className="text-slate-300">
                        {names.map((name, seat) => `${name} ${signed(game.balance[seat])}`).join(' · ')} {t.results.whists}
                    </p>
                </GameOverOverlay>
            )}

            {setupOpen && (
                <SetupPanel initial={game.settings} saved={saved} results={results} language={language} onLanguage={onLanguage}
                    onContinue={continuePool} onStart={startPool} onClose={tableStarted ? () => setSetupOpen(false) : null} />
            )}
        </div>
        </TextsContext.Provider>
    );
};

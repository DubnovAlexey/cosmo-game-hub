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
import { OPTIONS, cardsOf, isDarkBid, isHandVisible, isOn, legalPlays, sheetWidth, type Card, type DealSeating, type DealState, type Seat } from '../engine/index.ts';
import { teethOf } from './teeth';
import {
    HUMAN_PLAYER, SAVE_ID, SAVE_VERSION, usePreferans,
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
import { TrickArea, type TablePosition } from './TrickArea';
import { contractLabel, lastCall, resultText, roleOf, signed } from './format';
import { buildSheetHistory } from './sheetHistory';
import styles from './Preferans.module.css';
import sheetStyles from './ScoreSheet.module.css';

// [EN] Where each table player sits: you at the bottom, the others clockwise (four at the table one sits on top).
// [RU] Где сидит каждый игрок стола: вы внизу, остальные по часовой стрелке (вчетвером один сидит сверху).
const POSITIONS: Readonly<Record<2 | 3 | 4, readonly TablePosition[]>> = {
    2: ['bottom', 'left', 'right'], // [EN] you, the opponent, the dummy [RU] вы, соперник, болван
    3: ['bottom', 'left', 'right'],
    4: ['bottom', 'left', 'top', 'right'],
};

// [EN] One line in the middle of the table: what is being played and what matters now. The texts speak of table
//      players, the deal of its seats. [RU] Одна строка в середине стола: что играется и что сейчас важно. Тексты
//      говорят об игроках стола, раздача — о своих местах.
function tableInfo(deal: DealState, t: Dictionary, seating: DealSeating): { headline: string; hint: string } {
    const player = (seat: Seat): number => seating.players[seat];
    if (deal.phase === 'bidding') return { headline: t.info.auction, hint: t.info.speaksFirst(player(deal.firstHand)) };
    if (deal.mode === 'raspasy' || deal.declarer === null) return { headline: t.info.allPass, hint: deal.rules.raspasyTalonLeads ? t.info.allPassTalonHint : t.info.allPassHint };
    const declarer = player(deal.declarer);
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
    const { seating, humanSeat, size } = game;
    // [EN] Who sits at the table besides you: the opponents of this pool, and two at the table the dummy too.
    //      The sentences agree with them. [RU] Кто сидит за столом кроме вас: соперники этой пули, а вдвоём ещё
    //      и болван. Фразы согласуются с ними.
    const company = useMemo(() => (size === 2 ? [...game.cast, 'dummy' as const] : game.cast), [size, game.cast]);
    const t = useMemo(() => texts(company), [texts, company]);
    const names = t.seatNames;
    const [selected, setSelected] = useState<Card[]>([]);
    const history = useMemo(() => buildSheetHistory(game.log, sheetWidth(size)), [game.log, size]);
    const openSheet = useCallback(() => setSheetOpen(true), []);
    const closeSheet = useCallback(() => setSheetOpen(false), []);
    const poolTarget = game.settings.table.poolTarget;
    const extras = OPTIONS.filter(spec => spec.kind === 'extra' && isOn(game.settings.table, spec.id)).map(spec => t.explain.options[spec.id].name);
    const teeth = useMemo(() => (deal.rules.teeth ? teethOf(game.log) : null), [deal.rules.teeth, game.log]);

    // [EN] A new phase or deal clears the discard selection. [RU] Новая фаза или раздача сбрасывает выбор сноса.
    useEffect(() => { setSelected([]); }, [deal.phase, deal.dealer]);
    // [EN] Dark calls (Classic): your cards come closed and stay so until you look, or until the auction ends after a
    //      dark bid. [RU] Тёмные заявки (Классика): ваши карты приходят закрытыми, пока вы не посмотрите или пока после
    //      тёмной заявки не кончится торговля.
    const [looked, setLooked] = useState(true);
    useEffect(() => { setLooked(!deal.rules.darkBids); }, [deal.dealt, deal.rules.darkBids]);
    const humanBid = game.humanSeat === null ? null : deal.bidding.lastBid[game.humanSeat];
    const handHidden = deal.rules.darkBids && deal.phase === 'bidding' && game.humanSeat !== null && (!looked || isDarkBid(humanBid));
    const look = useCallback(() => setLooked(true), []);
    // [EN] Four at the table: you deal and took a passer's hand to whist with it. [RU] Вчетвером вы сдаёте и взяли руку спасовавшего, чтобы вистовать.
    const humanDeals = seating.sittingOut === HUMAN_PLAYER;
    const dealerSees = (seat: Seat): boolean => humanDeals && (deal.whist?.dealerLook === seat || deal.whist?.dealerSeat === seat);

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
    const info = tableInfo(deal, t, seating);
    const humanBalance = game.balance[HUMAN_PLAYER];
    const positionOf = (seat: Seat): TablePosition => POSITIONS[size][seating.players[seat]];
    const dealerPosition: TablePosition | null = seating.sittingOut === null ? null : POSITIONS[size][seating.sittingOut];
    const characterOf = (player: number) => (player === HUMAN_PLAYER ? null : company[player - 1] ?? null);
    const playing = deal.phase === 'play' || deal.phase === 'done';

    const seatView = (seat: Seat) => {
        const player = seating.players[seat];
        return (
            <PlayerSeat
                key={`seat-${player}`}
                name={names[player]}
                character={characterOf(player)}
                position={positionOf(seat)}
                hand={deal.hands[seat]}
                visible={(isHandVisible(deal, seat, (humanSeat ?? -1) as Seat) || controlledSeat === seat || dealerSees(seat)) && !(handHidden && seat === humanSeat)}
                bombs={deal.rules.bombs ? game.bombs[player] ?? 0 : 0}
                isTurn={deal.turn === seat}
                thinking={game.thinking && deal.turn === seat}
                role={roleOf(deal, seat, t)}
                isDeclarer={deal.declarer === seat && deal.mode !== 'raspasy'}
                tricks={playing ? deal.tricksWon[seat] : null}
                bubble={lastCall(deal, seat, t)}
                clickable={clickableFor(seat)}
                selected={player === HUMAN_PLAYER ? selected : []}
                onCard={onCard(seat)}
            />
        );
    };
    // [EN] Four at the table: the dealer gets no cards and sits on the talon; on all-pass the talon plays for him and
    //      its tricks lie by him. [RU] Вчетвером сдающий карт не получает и сидит на прикупе; на распасах прикуп играет
    //      за него, и его взятки лежат возле него.
    const dealerView = () => {
        const player = seating.sittingOut;
        if (player === null || !dealerPosition) return null;
        return (
            <PlayerSeat key={`seat-${player}`} name={names[player]} character={characterOf(player)} position={dealerPosition}
                hand={0} visible={false} isTurn={false} thinking={game.thinking && game.actorOf(deal) === player} role={t.roles.onTalon} isDeclarer={false}
                bombs={deal.rules.bombs ? game.bombs[player] ?? 0 : 0}
                tricks={playing && deal.mode === 'raspasy' ? deal.talonTricks : null} bubble={null} clickable={null} selected={[]} onCard={() => {}} />
        );
    };

    return (
        <TextsContext.Provider value={t}>
        <div id="preferans-room" className={styles.room}>
            <Lair />
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}><span className={styles.titleInitial}>{t.gameTitle.slice(0, 1)}</span>{t.gameTitle.slice(1)}</h1>
                    <p className={styles.subtitle}>
                        {[t.header.rules(t.explain.variants[game.settings.table.variant].name), t.header.pool(poolTarget), ...extras].join(' · ')} · {t.header.tagline}
                    </p>
                </div>
                <div className={styles.settings}>
                    <LanguageSwitch value={language} onChange={onLanguage} label={t.header.language} className={styles.language} />
                    {/* [EN] Save on demand (the pool is also saved after every move and when the page hides).
                        [RU] Сохранить по требованию (пуля сохраняется и после каждого хода, и когда страница скрывается). */}
                    {tableStarted && (
                        <span className={styles.saveBox}>
                            <button type="button" className={styles.button} onClick={game.saveNow}>{t.extra.save}</button>
                            {game.savedAt !== null && (
                                <span className={styles.savedAt} aria-live="polite">
                                    {t.extra.savedAt(new Date(game.savedAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }))}
                                </span>
                            )}
                        </span>
                    )}
                    <button type="button" className={styles.button} onClick={openSetup}>{t.header.tableSetup}</button>
                </div>
            </header>

            <div className={sheetStyles.stripOnly}>
                <ScoreStrip history={history} balance={game.balance} names={names.slice(0, size)} poolTarget={poolTarget} onOpen={openSheet} />
            </div>

            <div className={styles.layout}>
                <div>
                    <div className={`${styles.table} ${size === 4 ? styles.tableFour : ''}`} dir="ltr">
                        {([0, 1, 2] as Seat[]).map(seatView)}
                        {dealerView()}
                        <div className={styles.info}>
                            <span className={styles.contract}>{info.headline}</span>
                            <p className={styles.hint}>{info.hint}</p>
                        </div>
                        <TrickArea deal={deal} positionOf={positionOf} dealerPosition={deal.rules.talonTakesTricks ? dealerPosition : null} />
                    </div>

                    {deal.phase === 'done' && deal.result ? (
                        <div className={`${styles.panel} ${styles.result}`}>
                            <p className={styles.resultText}>{resultText(deal.result, names, t, seating, { bombs: deal.rules.bombs })}</p>
                            {!game.gameOver && <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={game.startNextDeal}>{t.actions.nextDeal}</button>}
                        </div>
                    ) : (
                        <ActionPanel deal={deal} humanSeat={humanSeat} seating={seating} isHumanTurn={game.isHumanTurn && !setupOpen} selected={selected} act={game.act}
                            actor={game.actorOf(deal)} looked={!handHidden} onLook={look} />
                    )}
                </div>

                <div className={sheetStyles.sideOnly}>
                    <ScoreSheet history={history} balance={game.balance} log={game.log} names={names} variant={game.settings.table.variant} titleId="preferans-sheet-side" teeth={teeth}
                        poolTarget={poolTarget} poolTotal={game.poolTotal} players={size} onExpand={openSheet} />
                </div>
            </div>

            {sheetOpen && (
                <ScoreSheetDialog labelledBy="preferans-sheet-large" onClose={closeSheet}>
                    <ScoreSheet history={history} balance={game.balance} log={game.log} names={names} variant={game.settings.table.variant} titleId="preferans-sheet-large" teeth={teeth}
                        poolTarget={poolTarget} poolTotal={game.poolTotal} players={size} large onClose={closeSheet} />
                </ScoreSheetDialog>
            )}

            {game.gameOver && !setupOpen && (
                <GameOverOverlay status={humanBalance > 0.05 ? 'win' : humanBalance < -0.05 ? 'lose' : 'draw'} onTryAgain={openSetup}>
                    <p className="text-xl mb-2 text-slate-200">{t.results.poolClosed}</p>
                    <p className="text-slate-300">
                        {names.slice(0, size).map((name, seat) => `${name} ${signed(game.balance[seat])}`).join(' · ')} {t.results.whists}
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

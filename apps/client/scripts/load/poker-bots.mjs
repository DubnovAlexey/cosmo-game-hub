// [EN] FILE: apps/client/scripts/load/poker-bots.mjs — the poker regulars play sit-and-goes against each other (six
//      bots, the casual setting of the game) and the script reports how each manner shows: VPIP (how often a player
//      puts chips in before the flop of his own will), PFR (how often he raises before the flop), aggression (bets and
//      raises per call), tournament wins, hands per tournament, the time a decision takes. It also checks that no
//      chip is ever lost or made. Run: node apps/client/scripts/load/poker-bots.mjs [--tournaments 30] [--samples 260]
// [RU] ФАЙЛ: завсегдатаи покерного стола играют турниры друг против друга (шесть ботов, обычная сила игры), а скрипт
//      показывает, как видна манера каждого: VPIP (как часто игрок по своей воле вкладывает фишки до флопа), PFR (как
//      часто рейзит до флопа), агрессия (беты и рейзы на один колл), победы в турнирах, раздач на турнир, время
//      решения. Заодно проверяет, что ни одна фишка не теряется и не появляется из ничего.
import { performance } from 'node:perf_hooks';

const { CAST } = await import('../../src/games/poker/characters.ts');
const { createRandom, newTable, nextHand, applyAction, choosePokerAction, DEFAULT_RULES } = await import('../../src/games/poker/engine/index.ts');
const arg = (name, fallback) => { const index = process.argv.indexOf(`--${name}`); return index > 0 ? Number(process.argv[index + 1]) : fallback; };
const tournaments = arg('tournaments', 30);
const samples = arg('samples', 260);

const stats = new Map(CAST.map(character => [character.id, { hands: 0, vpip: 0, pfr: 0, bets: 0, calls: 0, wins: 0, tournaments: 0 }]));
let hands = 0;
let decisions = 0;
let thinking = 0;
for (let t = 0; t < tournaments; t += 1) {
  const random = createRandom(5000 + t);
  const company = [...CAST].sort(() => random() - 0.5).slice(0, 6);
  company.forEach(character => { stats.get(character.id).tournaments += 1; });
  let state = newTable(6, random, { rules: DEFAULT_RULES, button: t % 6 });
  for (let guard = 0; state && guard < 600; guard += 1) {
    const voluntary = new Set();
    const raised = new Set();
    state.seats.forEach((seat, index) => { if (!seat.out) stats.get(company[index].id).hands += 1; });
    while (state.phase === 'betting') {
      const seat = state.turn;
      const started = performance.now();
      const action = choosePokerAction(state, { random, samples, noise: 0.18, style: company[seat].style });
      thinking += performance.now() - started;
      decisions += 1;
      const s = stats.get(company[seat].id);
      if (action.type === 'raise' || action.type === 'allIn') s.bets += 1;
      if (action.type === 'call') s.calls += 1;
      if (state.street === 'preflop' && (action.type === 'call' || action.type === 'raise' || action.type === 'allIn')) voluntary.add(seat);
      if (state.street === 'preflop' && (action.type === 'raise' || action.type === 'allIn')) raised.add(seat);
      state = applyAction(state, action);
    }
    voluntary.forEach(seat => { stats.get(company[seat].id).vpip += 1; });
    raised.forEach(seat => { stats.get(company[seat].id).pfr += 1; });
    hands += 1;
    const total = state.seats.reduce((sum, seat) => sum + seat.stack, 0);
    if (total !== 6 * DEFAULT_RULES.startingStack) throw new Error(`chips: ${total} after hand ${state.handNumber} of tournament ${t}`);
    const next = nextHand(state, random);
    if (!next) {
      const winner = state.seats.findIndex(seat => seat.stack > 0);
      stats.get(company[winner].id).wins += 1;
    }
    state = next;
  }
}
const pct = (part, whole) => (whole ? `${Math.round((100 * part) / whole)}%` : '—');
console.log(`${tournaments} sit-and-goes of six bots, ${hands} hands (${(hands / tournaments).toFixed(0)} per tournament), ${decisions} decisions, ${(thinking / decisions).toFixed(2)} ms per decision`);
console.log('regular          | VPIP | PFR | aggression | wins / played');
for (const character of CAST) {
  const s = stats.get(character.id);
  console.log(`${character.id.padEnd(16)} | ${pct(s.vpip, s.hands).padStart(4)} | ${pct(s.pfr, s.hands).padStart(3)} | ${(s.calls ? s.bets / s.calls : s.bets).toFixed(2).padStart(10)} | ${s.wins} / ${s.tournaments}`);
}
console.log('no chip lost or made');

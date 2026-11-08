// [EN] FILE: games/preferans/i18n/en.ts — English texts of the preferans table.
//      Sources of the explanations: the rules research of 08.11.2026 (Кодекс 1996, pref-bridge, Gambler,
//      preferans.games, FSPR, Wikipedia).
// [RU] ФАЙЛ: английские тексты стола преферанса.
import type { ClosedReason, OptionId, Seat, VariantId } from '../engine/index.ts';
import type { Dictionary, Explained } from './types.ts';

const VARIANTS: Readonly<Record<VariantId, Explained>> = {
    sochi: {
        name: 'Sochi', term: '«Сочинка»',
        what: 'The most common variant in clubs and online.',
        how: 'Whist is responsible: a defender who falls short pays the full game price per missing trick. A lone whister writes all the defence\'s whists (greedy whist).',
        effect: 'Defending is risky, so declarers are bold. A pool point is worth 10 whists.',
    },
    leningrad: {
        name: 'Leningrad · Piter', term: '«Ленинградка»',
        what: 'The variant of St Petersburg and of sport tournaments.',
        how: 'Whists and mountain are doubled; whist is semi-responsible and gentleman: a lone whister shares the whists with the defender who passed.',
        effect: 'Defending is cheaper and bolder. A pool point is worth 20 whists; all-pass usually costs 2 · 4 · 6.',
    },
    rostov: {
        name: 'Rostov', term: '«Ростовка»',
        what: 'Sochi prices with a gentler whist.',
        how: 'A defender who falls short pays half the game price; consolation is a flat 10 whists. All-pass is paid in whists to the player with the fewest tricks, and the talon is never opened.',
        effect: 'A calmer game: all-pass never adds mountain.',
    },
    classic: {
        name: 'Classic', term: '«Классика»',
        what: 'The oldest variant, kept alive by student companies.',
        how: 'Dark bids and bombs: after a dark all-pass the next game costs double or more.',
        effect: 'Big swings in the score.',
    },
};

const OPTIONS: Readonly<Record<OptionId, Explained>> = {
    seniorHold: {
        name: 'Senior hand may hold', term: '«здесь»',
        what: 'Of the two players still bidding, the senior one may keep the same bid instead of raising: “six hearts — here”.',
        how: 'The other player must then bid higher or pass.',
        effect: 'Ties in the auction go to the senior hand, so auctions end lower. Off: every new bid must be higher.',
    },
    halfWhist: {
        name: 'Half-whist on six and seven', term: '«полвиста»',
        what: 'After the first defender passes, the second may say half-whist instead of whist.',
        how: 'The game counts as made without play, and the half-whister writes whists for half the obligation: 2 tricks on a six, 1 on a seven. The first defender may still take the whist back and play.',
        effect: 'A small, safe score for the defence instead of the risk of a short whist.',
    },
    tenChecked: {
        name: 'The ten is checked', term: '«десятерная проверяется»',
        what: 'A ten-trick game is not whisted: the defenders only check that the declarer takes all ten.',
        how: 'Both defenders play, and neither has an obligation.',
        effect: 'No mountain for defenders on a ten; if the declarer fails, whists are written as if both had whisted. Off: the ten is whisted like an eight or nine.',
    },
    talonLeads: {
        name: 'All-pass: the talon leads', term: '«заход с прикупа»',
        what: 'On all-pass the two talon cards are turned over one by one and set the suit of the first two tricks.',
        how: 'Everyone must follow that suit, and the highest card of it takes the trick. If nobody has the suit, the first hand takes it (the sources are silent; this is our table\'s rule). The first hand leads the third trick.',
        effect: 'All-pass becomes less predictable. Rostov keeps the talon closed, so there it is not used.',
    },
    stalingrad: {
        name: 'Stalingrad', term: '«Сталинград»',
        what: 'On a six of spades both defenders must whist.',
        how: 'No pass and no half-whist: the game is always played, closed.',
        effect: 'There are no free sixes of spades. The declarer always faces two defenders with a joint obligation of four tricks, so bidding 6♠ becomes riskier.',
    },
    concedeTwo: {
        name: 'Concede two down', term: '«уход без двух»',
        what: 'After seeing the talon, the declarer may refuse to play a hopeless game.',
        how: 'Instead of naming a game he presses Concede: two tricks at the price of the level he bid go into his mountain, and nobody writes whists.',
        effect: 'It caps the loss of a bad talon — cheaper than going down three with whists and consolation, but always a loss. A table concedes two down or three down, not both.',
    },
    concedeThree: {
        name: 'Concede three down', term: '«уход без трёх»',
        what: 'After seeing the talon, the declarer may refuse to play a hopeless game.',
        how: 'Instead of naming a game he presses Concede: three tricks at the price of the level he bid go into his mountain, and nobody writes whists.',
        effect: 'It caps the loss of a really bad talon. A table concedes two down or three down, not both.',
    },
    whistPassHalf: {
        name: 'Whist · pass · half-whist', term: '«вист–пас–полвиста»',
        what: 'The defender who said whist may switch to half-whist after the other defender passes.',
        how: 'It extends half-whist, so it needs half-whist on.',
        effect: 'A lone defender can take a safe half-whist instead of defending alone.',
    },
    misereNoTalon: {
        name: 'Misère without the talon', term: '«мизер без прикупа»',
        what: 'A misère declared without taking the talon; it ranks above the nines.',
        how: 'Sources disagree on what overcalls it, so the table will fix one rule.',
        effect: 'A higher misère with neither help nor danger from the talon.',
    },
    darkBids: {
        name: 'Dark bids', term: '«тёмные заявки»',
        what: 'Bidding before looking at your cards: “pass in the dark”, “six in the dark”.',
        how: 'Part of Classic: dark bids are overcalled on a ladder of their own.',
        effect: 'Wins and losses on a dark game are doubled.',
    },
    bombs: {
        name: 'Bombs', term: '«бомбы»',
        what: 'After a dark all-pass, the players who passed in the dark get a bomb.',
        how: 'The next game on a bomb costs double; a second bomb ×4, a third ×8. A made game removes the bomb, a failed one leaves it. Needs dark bids.',
        effect: 'Big swings: one game can decide the pool.',
    },
    paidTalon: {
        name: 'Paid talon', term: '«платный прикуп»',
        what: 'Quick tricks found in the talon are paid for: an ace or a king and queen of one suit count as one trick, ace and king as two, two aces as three.',
        how: 'Each quick trick is paid at the game price to the declarer\'s opponents (sources differ in the details).',
        effect: 'A lucky talon costs the declarer something.',
    },
    americanHelp: {
        name: 'Help', term: '«помощь»',
        what: 'When your pool is full, points you earn above the target go into the pool of the opponent with the larger pool.',
        how: 'You write 10 whists on him for every such point. Used where each player closes his own pool (Sochi, Rostov).',
        effect: 'The pool closes sooner and no points are lost.',
    },
    dealerWhists: {
        name: 'Dealer whists for the passers',
        what: 'At a table of four, when both defenders pass, the dealer may look at one defender\'s cards and whist instead.',
        how: 'Four players only; sources differ on which games it applies to.',
        effect: 'Fewer free games for the declarer.',
    },
    misereHalves: {
        name: 'Misère half-and-half', term: '«мизер пополам»',
        what: 'The declarer may invite the dealer to share a misère.',
        how: 'Premium and penalty are split in half. Four players only.',
        effect: 'Less risk on a doubtful misère.',
    },
    teeth: {
        name: 'Teeth', term: '«зубы»',
        what: 'A mark on the sheet towards the player who set you.',
        how: 'It changes nothing in the score — it is a promise to set him back when you can.',
        effect: 'Table folklore: shown on the sheet only.',
    },
};

const RANKS = ['Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const SUITS = ['spades', 'clubs', 'diamonds', 'hearts'];
const tricksWord = (count: number): string => (count === 1 ? 'trick' : 'tricks');

// [EN] Who sits where: "you" takes its own verb forms, Orion and Vega the third person.
// [RU] Кто где сидит: у «you» свои формы глагола, у Ориона и Веги — третье лицо.
const NAMES = ['You', 'Orion', 'Vega'] as const;
const by = <T>(seat: Seat, you: T, other: T): T => (seat === 0 ? you : other);
const name = (seat: Seat): string => NAMES[seat];

const closed = (reason: ClosedReason): string => {
    switch (reason.kind) {
        case 'notReady': return 'Coming soon: the engine does not play it yet.';
        case 'conflict': return `Cannot be combined with «${OPTIONS[reason.with].name}». Switch that off first.`;
        case 'requires': return `Needs «${OPTIONS[reason.option].name}» first.`;
        case 'variant': return `Only in ${reason.variants.map(variant => VARIANTS[variant].name).join(', ')}.`;
        case 'players': return `Only with ${reason.players.join(' or ')} players.`;
        default: return '';
    }
};

const en: Dictionary = {
    language: 'en',
    gameTitle: 'Preferans',
    seatNames: NAMES,
    header: {
        rules: variant => `${variant} rules`,
        pool: target => `pool ${target}`,
        tagline: 'you against two bots that never peek at hidden cards',
        tableSetup: 'Table setup',
        language: 'Language',
    },
    cards: {
        corners: ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
        name: (rank, suit) => `${RANKS[rank]} of ${SUITS[suit]}`,
    },
    bids: {
        noTrump: 'NT', misere: 'Misère', misereButton: 'Misère — take no tricks',
        hold: bid => `Hold ${bid}`, gridLabel: 'Bids',
    },
    info: {
        auction: 'Auction',
        speaksFirst: seat => `${name(seat)} ${by(seat, 'speak', 'speaks')} first · the talon waits face down`,
        allPass: 'All-pass',
        allPassHint: 'Take as few tricks as you can',
        allPassTalonHint: 'Take as few tricks as you can · the talon leads the first two tricks',
        misere: seat => `${name(seat)} · Misère`,
        misereHint: seat => `${name(seat)} must take no tricks · the catchers open their cards after the first trick`,
        takesTalon: seat => `${name(seat)} ${by(seat, 'take', 'takes')} the talon`,
        discardHint: 'Two cards go to the discard',
        needs: (seat, tricks) => `${name(seat)} ${by(seat, 'need', 'needs')} ${tricks} ${tricksWord(tricks)}`,
        defendersDecide: 'Defenders decide: whist or pass',
    },
    roles: { allPass: 'All-pass', misere: 'Misère', declarer: 'Declarer', catcher: 'Catcher', checks: 'Checks', whist: 'Whist', halfWhist: 'Half-whist', pass: 'Pass' },
    seat: { tricks: count => `tricks ${count}`, thinking: 'thinking…' },
    table: { centre: 'Table centre', talonOpen: 'Talon, shown to everybody', talonClosed: 'Talon, face down', talonLeads: 'Talon card leads this trick' },
    actions: {
        thinking: seat => `${name(seat)} ${by(seat, 'are', 'is')} thinking…`,
        yourBid: 'Your bid: name a game or pass',
        someoneBids: (seat, bid, canHold) => `${name(seat)} ${by(seat, 'bid', 'bids')} ${bid}${canHold ? ' — as the senior hand you may hold it' : ''}`,
        pass: 'Pass',
        discardMisere: 'Misère: discard two cards — keep the safest hand',
        discardGame: 'You took the talon: choose two cards to discard',
        selected: count => `Selected ${count} of 2`,
        discard: 'Discard',
        nameGame: bid => `Name the game: ${bid} or higher`,
        concede: tricks => `Concede · ${tricks} down`,
        concedeHint: 'Nobody writes whists; the conceded tricks at the price of your bid level go to your mountain',
        whistQuestion: (seat, contract) => `${name(seat)} ${by(seat, 'play', 'plays')} ${contract}. Whist (defend and score) or pass?`,
        whist: 'Whist', halfWhist: 'Half-whist',
        returnQuestion: seat => `${name(seat)} said half-whist. Take the whist back and defend?`,
        takeBack: 'Whist', leaveHalf: 'Leave the half-whist',
        modeQuestion: 'You defend alone. Open (both defending hands face up, you play both) or closed?',
        open: 'Open', closed: 'Closed',
        yourTurn: 'Your turn: pick a highlighted card',
        yourTurnFor: seat => `Your turn for ${name(seat)} (open whist): pick a highlighted card`,
        nextDeal: 'Next deal',
    },
    results: {
        allPass: scores => `All-pass · ${scores}`,
        misereClean: seat => `${name(seat)} · misère · clean, no tricks`,
        misereCaught: (seat, tricks) => `${name(seat)} · misère · caught with ${tricks} ${tricksWord(tricks)}`,
        conceded: (seat, contract, tricks) => `${name(seat)} · ${contract} · conceded ${tricks} down, no whists`,
        halfWhistCounted: (seat, contract) => `${name(seat)} · ${contract} · half-whist, counted as made`,
        nobodyWhisted: (seat, contract) => `${name(seat)} · ${contract} · nobody whisted, counted as made`,
        made: (seat, contract, tricks, defence) => `${name(seat)} · ${contract} · made with ${tricks} · defence ${defence}`,
        down: (seat, contract, under, tricks) => `${name(seat)} · ${contract} · down ${under} (${tricks} ${tricksWord(tricks)})`,
        poolClosed: 'The pool is closed.',
        whists: 'whists',
    },
    sheet: {
        title: 'Score sheet',
        meta: (target, total) => `pool to ${target} · ${total} of ${target * 3}`,
        openLarge: 'Open the score sheet large',
        close: 'Close the score sheet',
        legend: { mountain: 'mountain · inner', pool: 'pool · middle', whists: 'whists · outer' },
        ifClosedNow: 'If the pool closed now:',
        sumsToZero: 'whists, sums to zero',
        deals: count => `Deals · ${count}`,
        deal: number => `Deal ${number}`,
        rulesTitle: 'Rules in short (Sochi)',
        rules: [
            '32 cards, three players, ten cards each, two in the talon.',
            'Auction from 6♠ up to 10NT; misère sits between 8NT and 9♠ and only as your first bid. A senior hand may hold an equal bid.',
            'The winner takes the talon, discards two cards and names the final game, equal or higher.',
            'Defenders say whist or pass. Whisters must take 4 tricks against a six, 2 against a seven, 1 against an eight or nine; a ten is only checked.',
            'Follow suit; with none, play a trump; with neither, any card.',
            'A made game goes to the pool; every missing trick costs the game price in the mountain. Whists pay the price per trick.',
            'Everybody passed: all-pass, take as few tricks as you can. The talon leads the first two tricks.',
        ],
        bandPool: name => `${name} · pool`,
        bandMountain: name => `${name} · mountain`,
        bandWhists: (writer, target) => `${writer} · whists on ${target}`,
        empty: 'empty',
        closesAt: points => `The pool closes at ${points} points together`,
        resultTitle: name => `${name} · if the pool closed now, in whists`,
        drawing: target => `Score sheet, pool to ${target}`,
        strip: players => `Score sheet. ${players}. Open the full sheet.`,
        stripPlayer: (name, pool, target, mountain, balance) => `${name}: pool ${pool} of ${target}, mountain ${mountain}, ${balance} whists`,
    },
    setup: {
        title: 'Preferans table',
        savedPool: 'Saved pool',
        savedLine: (deal, pool, max, when) => `Deal ${deal} · pool ${pool} of ${max} · saved ${when}`,
        continueSaved: 'Continue where you stopped',
        playPlain: 'Play plain preferans',
        playPlainHint: 'Three players, Sochi rules, a short pool, no extras. Or put your own table together below.',
        players: '1 · Players', rules: '2 · Rules', pool: 'Pool length', progression: 'All-pass prices', bots: 'Bots',
        conventions: '3 · Conventions of the variant', conventionsNote: 'on by default',
        extras: '4 · Extras', extrasNote: 'add what you like',
        soon: 'soon',
        what: 'What it is.', how: 'How it plays.', effect: 'What it changes.',
        about: name => `What is «${name}»?`,
        yourTable: 'Your table:', play: 'Play', reset: 'Reset to plain', back: 'Back to the table', lastPools: 'Last pools',
        resultLine: (when, deals, balance) => `${when} · ${deals} deals · you ${balance} whists`,
        dropped: names => `Switched off, it does not fit the new choice: ${names}.`,
        summary: {
            players: count => `${count} players`,
            pool: target => `pool ${target}`,
            allPass: prices => `all-pass ${prices}`,
            without: name => `without «${name}»`,
            bots: { casual: 'casual bots', strong: 'strong bots' },
        },
        strength: { casual: 'Casual · quick', strong: 'Strong · thinks longer' },
    },
    explain: {
        players: {
            3: { name: '3 · you + 2 bots', what: 'The classic table: ten cards each, two in the talon.', how: 'You sit at the bottom; Orion and Vega take the other seats and never look at hidden cards.', effect: 'The standard game. Every rule on this menu is written for three players.' },
            2: { name: '2 · Gusarik', term: '«гусарик»', what: 'You against one bot, with a dummy hand that always passes.', how: 'The defender decides on whist without seeing the dummy; a whist is always played open, and the defender plays both defence hands.', effect: 'A quicker, sharper duel. Sources describe it in three different ways, so the table will state its exact rules.' },
            4: { name: '4 · dealer sits out', term: '«сдающий на прикупе»', what: 'Four at the table; the dealer gets no cards in his own deal.', how: 'The dealer still scores: he writes consolation when the declarer fails, and on all-pass the talon is his hand.', effect: 'Everyone rests every fourth deal. The sport federation (FSPR) plays four at a table.' },
        },
        variants: VARIANTS,
        pool: {
            name: 'Pool length', term: '«пуля»',
            what: 'The pool closes when the three pools together reach three times this number.',
            how: 'A made game writes its price into the declarer\'s pool: 2 for a six, 4 for a seven … 10 for a ten or a misère.',
            effect: '10 is short, 20 classic, 30 long. A longer pool means more deals and less luck.',
        },
        progression: {
            name: 'All-pass prices', term: '«прогрессия распасов»',
            what: 'What one trick costs on all-pass deals that follow one another.',
            how: '1 · 2 · 3 is the usual Sochi rule: the price grows and then stays at 3. 1 · 2 · 4 grows faster; “1 every time” never grows. Any played game resets the price.',
            effect: 'An expensive all-pass series pushes players to bid instead of passing.',
        },
        progressionLabels: { '1-2-3': '1 · 2 · 3', '1-2-4': '1 · 2 · 4', flat: '1 every time' },
        bots: {
            name: 'Bots',
            what: 'How long the bots think. They never look at hidden cards at any strength.',
            how: 'Casual: 8 sampled deals per card, about a quarter of a second. Strong: 32 deals, under a second.',
            effect: 'Strong bots defend and catch misères better.',
        },
        options: OPTIONS,
    },
    closed,
};

export default en;

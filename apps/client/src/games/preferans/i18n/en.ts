// [EN] FILE: games/preferans/i18n/en.ts — English texts of the preferans table.
//      Sources of the explanations: the rules research of 08.11.2026 (Кодекс 1996, pref-bridge, Gambler,
//      preferans.games, FSPR, Wikipedia).
// [RU] ФАЙЛ: английские тексты стола преферанса.
import type { ClosedReason, OptionId, VariantId } from '../engine/index.ts';
import type { Cast } from '../characters/roster.ts';
import { CHARACTERS_EN } from '../../../shared/characters/texts/en.ts';
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
        what: 'The oldest variant, kept alive by student companies: Sochi prices and whist, all-pass 1 · 2 · 4.',
        how: 'Only here are dark bids and bombs (switch them on among the extras): a dark game costs double, a game on bombs two, four or eight times as much.',
        effect: 'Big swings in the score: one deal can decide the pool.',
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
        what: 'A whister may switch to half-whist when the other defender has passed.',
        how: 'Only on six and seven: instead of playing alone he takes half-whist — the game counts as made without play and he writes whists for half the obligation. Needs half-whist on; never at a table of two, where the whist with the dummy is always open at once.',
        effect: 'A lone whister takes a sure half-whist instead of facing the declarer alone.',
    },
    misereNoTalon: {
        name: 'Misère without the talon', term: '«мизер без прикупа»',
        what: 'A misère bid without taking the talon; in the auction it ranks above the nines.',
        how: 'Only a ten beats it (sources differ; our table keeps to this). A player who bid ordinary misère may raise to it. Played with your own ten cards, the talon stays closed; scored like misère.',
        effect: 'A higher-ranking misère: no help from the talon, but no dangerous card from it either.',
    },
    darkBids: {
        name: 'Dark bids', term: '«тёмные заявки»',
        what: 'A word before looking at your cards: "pass in the dark" or "six in the dark", "seven in the dark"…',
        how: 'Only as your first word in a deal, while your cards are closed. A dark level ranks above every light bid of that level ("six dark" beats 6NT but not 7♠); the suit is chosen after the talon. After a dark bid you can only raise in the dark or pass.',
        effect: 'A dark game costs double: pool, mountain and whists. An all-pass where someone passed in the dark costs double too.',
    },
    bombs: {
        name: 'Bombs', term: '«бомбы»',
        what: 'After an all-pass everyone who said "pass in the dark" gets a bomb.',
        how: 'His next game or misère costs double, on two bombs four times, on three (a "tree") eight times as much. Made — the bombs burn out; failed — they stay for the next game. Needs dark bids.',
        effect: 'Big swings: one game on bombs can decide the pool.',
    },
    paidTalon: {
        name: 'Paid talon', term: '«платный прикуп»',
        what: 'The declarer pays for quick tricks in the talon: an ace, or a king and queen of a suit — one trick; ace and king of a suit — two; two aces — three.',
        how: 'Each quick trick costs the price of the game in whists: at three each defender writes half of it on the declarer, at four the dealer writes the whole premium (FSPR).',
        effect: 'A lucky talon costs the declarer something.',
    },
    americanHelp: {
        name: 'Help', term: '«помощь»',
        what: 'When your pool is closed, points above the target go into the pool of the opponent with the biggest pool not yet closed.',
        how: 'A tie helps the player on your left. For every point given you write 10 whists on him. Played where everyone closes his own pool (Sochi, Rostov, Classic).',
        effect: 'The pool closes faster and extra points are not lost.',
    },
    dealerWhists: {
        name: 'Dealer whists for the passers',
        what: 'At four: when both defenders pass, the dealer may take one of their hands and whist himself.',
        how: 'The dealer looks at one defender\'s cards and decides: whist — he plays those cards closed and writes everything that defender would; pass — the game counts.',
        effect: 'Fewer free games for the declarer.',
    },
    misereHalves: {
        name: 'Misère half-and-half', term: '«мизер пополам»',
        what: 'At four the misère declarer may call the dealer to share it half and half.',
        how: 'Decided right after the auction, before the talon. The pool for a clean misère or the mountain for a caught one is split equally between the declarer and the dealer.',
        effect: 'Less risk on a doubtful misère — and a smaller win.',
    },
    teeth: {
        name: 'Teeth', term: '«зубы»',
        what: 'A mark on the sheet towards whoever set you down.',
        how: 'When you go down against a whist, a tooth appears under the sheet towards each whister. It does not change the score — it is a promise to set him down in return.',
        effect: 'Table folklore: only a mark on the sheet.',
    },
};

const RANKS = ['Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const SUITS = ['spades', 'clubs', 'diamonds', 'hearts'];
const tricksWord = (count: number): string => (count === 1 ? 'trick' : 'tricks');

// [EN] Who sits where: "you" takes its own verb forms, the opponents of this pool (characters/roster.ts) the third person.
// [RU] Кто где сидит: у «you» свои формы глагола, у соперников этой пули (characters/roster.ts) — третье лицо.
const by = <T>(seat: number, you: T, other: T): T => (seat === 0 ? you : other);

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

export default function en(cast: Cast): Dictionary {
    const NAMES = ['You', ...cast.map(id => CHARACTERS_EN[id].name)];
    const name = (seat: number): string => NAMES[seat];
    return {
    language: 'en',
    gameTitle: 'Preferans',
    seatNames: NAMES,
    characters: CHARACTERS_EN,
    portrait: {
        guest: 'guest', dweller: 'dweller of the crypt', about: who => `${who}: a biography`, close: 'Close',
        manner: {
            bidding: 'Bidding', whist: 'Whist', misere: 'Misère', pace: 'Thinks',
            bold: 'boldly', even: 'evenly', careful: 'carefully',
            eager: 'eagerly', calculated: 'by calculation', cautious: 'reluctantly',
            loves: 'loves it', sometimes: 'now and then', cleanOnly: 'only a clean one',
            fast: 'fast', moderate: 'moderately', slow: 'long',
        },
    },
    header: {
        rules: variant => `${variant} rules`,
        pool: target => `pool ${target}`,
        tagline: 'you against the dwellers of the crypt, who swear on their graves never to peek at hidden cards',
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
    roles: { allPass: 'All-pass', misere: 'Misère', declarer: 'Declarer', catcher: 'Catcher', checks: 'Checks', whist: 'Whist', halfWhist: 'Half-whist', pass: 'Pass', onTalon: 'on the talon' },
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
        yourTurn: 'Your turn — play one of the raised cards',
        yourTurnFor: seat => `Your turn for ${name(seat)} (open whist) — play one of the raised cards`,
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
        redeal: 'Everybody passed — a new deal',
        whists: 'whists',
    },
    extra: {
        save: 'Save',
        savedAt: time => `saved at ${time}`,
        misereNoTalon: 'Misère without the talon',
        misereNoTalonButton: 'Misère without the talon — no talon, not a single trick',
        dark: level => `${level} dark`,
        darkPass: 'Pass in the dark',
        darkRow: 'In the dark, without looking at the cards',
        lookAtCards: 'Look at the cards',
        darkQuestion: 'Your cards are still closed: you may speak in the dark — the game and the whists cost double — or look first',
        darkOnly: 'You bid in the dark and have not seen your cards: you can only raise in the dark, or pass',
        cardsClosed: 'cards closed',
        shareQuestion: 'Call the dealer to share the misère half and half? The pool or the mountain is split equally',
        share: 'Half with the dealer',
        playAlone: 'Play alone',
        dealerQuestion: 'Both defenders passed. Take one of their hands and whist yourself?',
        dealerHand: seat => `Hand: ${name(seat)}`,
        dealerWhistQuestion: seat => `Whist with the hand of ${name(seat)}? The obligation is yours`,
        bombs: count => `bombs: ${count}`,
        teeth: 'Teeth',
        tooth: (from, to, count) => `${from} → ${to}${count > 1 ? ` ×${count}` : ''}`,
        results: {
            dark: 'in the dark', times: factor => `×${factor}`, bombs: 'on bombs', darkAllPass: 'dark all-pass',
            bombsEarned: names => `bomb: ${names}`, shared: 'half with the dealer',
            dealerWhisted: seat => `the dealer whisted — ${name(seat)}`, premium: whists => `paid talon: ${whists} whists`, noTalon: 'without the talon',
        },
    },
    sheet: {
        title: 'Score sheet',
        meta: (target, total, max) => `pool to ${target} · ${total} of ${max}`,
        openLarge: 'Open the score sheet large',
        close: 'Close the score sheet',
        legend: { mountain: 'mountain · inner', pool: 'pool · middle', whists: 'whists · outer' },
        ifClosedNow: 'If the pool closed now:',
        sumsToZero: 'whists, sums to zero',
        deals: count => `Deals · ${count}`,
        deal: number => `Deal ${number}`,
        rulesTitle: variant => `Rules in short (${variant})`,
        rules: [
            '32 cards, three players, ten cards each, two in the talon.',
            'Auction from 6♠ up to 10NT; misère sits between 8NT and 9♠ and only as your first bid. A senior hand may hold an equal bid.',
            'The winner takes the talon, discards two cards and names the final game, equal or higher.',
            'Defenders say whist or pass. Whisters must take 4 tricks against a six, 2 against a seven, 1 against an eight or nine.',
            'Follow suit; with none, play a trump; with neither, any card.',
            'A made game goes to the pool, missing tricks to the mountain, defensive tricks to the whists; what each costs depends on the variant (below).',
            'Everybody passed: all-pass, take as few tricks as you can.',
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
            allPassWhists: 'all-pass paid in whists',
            without: name => `without «${name}»`,
            bots: { casual: 'casual bots', strong: 'strong bots' },
        },
        strength: { casual: 'Casual · quick', strong: 'Strong · thinks longer' },
        opponents: 'Opponents',
        opponentsNote: max => (max === 1 ? 'pick a portrait; without a choice the crypt decides' : `pick portraits (up to ${max === 2 ? 'two' : 'three'}); without a choice the crypt decides`),
        randomOpponents: 'Random',
        champion: who => `${who} won the last pool and takes a free seat at the table.`,
    },
    explain: {
        players: {
            3: { name: '3 · you + 2 bots', what: 'The classic table: ten cards each, two in the talon.', how: 'You sit at the bottom; two dwellers of the crypt (new ones every pool) take the other seats and never look at hidden cards.', effect: 'The standard game. Every rule on this menu is written for three players.' },
            2: { name: '2 · duel with a dummy', what: 'You against one opponent; the third hand is the dummy, a scarecrow skeleton that always passes.', how: 'The defender decides to whist without seeing the dummy; the whist is always open and the defender plays both hands. Everybody passed — a new deal.', effect: 'A quick, sharp duel. The defender writes the whists of the dummy; at the end the mountain is not divided: the difference of mountains × 10 whists.' },
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
        progressionLabel: prices => (prices.length === 1 ? `${prices[0]} every time` : prices.join(' · ')),
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
}

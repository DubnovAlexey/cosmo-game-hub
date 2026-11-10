// [EN] FILE: games/preferans/i18n/fr.ts — French texts of the preferans table. French typography: a non-breaking
//      space ( ) before « : ; ? » and inside guillemets. The Russian pool, «пуля», comes from the French
//      «poule», so here it is simply «la poule»; the Russian terms stay in «».
// [RU] ФАЙЛ: французские тексты стола преферанса. Французская типографика: неразрывный пробел ( ) перед
//      «: ; ?» и внутри кавычек-ёлочек. Русская «пуля» происходит от французского «poule», поэтому здесь она
//      просто «la poule»; русские термины остаются в «».
import type { ClosedReason, OptionId, VariantId } from '../engine/index.ts';
import type { Cast } from '../characters/roster.ts';
import { CHARACTERS_FR } from '../../../shared/characters/texts/fr.ts';
import type { Dictionary, Explained } from './types.ts';

const VARIANTS: Readonly<Record<VariantId, Explained>> = {
    sochi: {
        name: 'Sotchi', term: '«Сочинка»',
        what: 'La variante la plus répandue dans les clubs et en ligne.',
        how: 'Le whist est responsable : le défenseur qui reste court paie le prix entier du jeu pour chaque pli manquant. Un défenseur seul au whist inscrit tous les whists de la défense (whist « avare »).',
        effect: 'Défendre est risqué, donc les déclarants osent davantage. Un point de poule vaut 10 whists.',
    },
    leningrad: {
        name: 'Léningrad · Piter', term: '«Ленинградка»',
        what: 'La variante de Saint-Pétersbourg et des tournois sportifs.',
        how: 'Whists et montagne sont doublés ; le whist est semi-responsable et « gentleman » : un défenseur seul au whist partage les whists avec celui qui a passé.',
        effect: 'Défendre coûte moins cher et devient plus hardi. Un point de poule vaut 20 whists ; la passe générale coûte souvent 2 · 4 · 6.',
    },
    rostov: {
        name: 'Rostov', term: '«Ростовка»',
        what: 'Les prix de Sotchi avec un whist plus doux.',
        how: 'Le défenseur qui reste court paie la moitié du prix du jeu ; la consolation est fixe, 10 whists. La passe générale se paie en whists au joueur qui a fait le moins de plis, et le talon n’est jamais retourné.',
        effect: 'Un jeu plus calme : la passe générale n’ajoute jamais de montagne.',
    },
    classic: {
        name: 'Classique', term: '«Классика»',
        what: 'La variante la plus ancienne, gardée par les bandes d’étudiants : prix et whist de Sotchi, passe générale 1 · 2 · 4.',
        how: 'Seule ici existent les annonces à l’aveugle et les bombes (à activer dans les extras) : un jeu à l’aveugle coûte double, un jeu sur bombes deux, quatre ou huit fois plus.',
        effect: 'De grands écarts au score : une donne peut décider la poule.',
    },
};

const OPTIONS: Readonly<Record<OptionId, Explained>> = {
    seniorHold: {
        name: 'La main aînée peut tenir', term: '«здесь»',
        what: 'Des deux joueurs qui enchérissent encore, l’aîné peut garder la même annonce au lieu de monter : « six cœur — ici ».',
        how: 'L’autre doit alors monter ou passer.',
        effect: 'Les égalités d’enchères reviennent à la main aînée, donc les enchères s’arrêtent plus bas. Désactivé : chaque nouvelle annonce doit être plus haute.',
    },
    halfWhist: {
        name: 'Demi-whist sur six et sept', term: '«полвиста»',
        what: 'Quand le premier défenseur passe, le second peut dire demi-whist au lieu de whist.',
        how: 'Le jeu compte comme réussi sans être joué, et celui qui dit demi-whist inscrit des whists pour la moitié de l’obligation : 2 plis sur un six, 1 sur un sept. Le premier défenseur peut encore reprendre le whist et jouer.',
        effect: 'Un petit gain sûr pour la défense au lieu du risque d’un whist court.',
    },
    tenChecked: {
        name: 'Le dix est vérifié', term: '«десятерная проверяется»',
        what: 'On ne fait pas whist contre un jeu de dix plis : les défenseurs vérifient seulement que le déclarant les fait tous.',
        how: 'Les deux défenseurs jouent, et aucun n’a d’obligation.',
        effect: 'Pas de montagne pour les défenseurs sur un dix ; si le déclarant chute, les whists s’inscrivent comme si les deux avaient fait whist. Désactivé : on fait whist contre le dix comme contre un huit ou un neuf.',
    },
    talonLeads: {
        name: 'Passe générale : le talon entame', term: '«заход с прикупа»',
        what: 'En passe générale, les deux cartes du talon sont retournées l’une après l’autre et fixent la couleur des deux premiers plis.',
        how: 'Chacun doit fournir cette couleur, et la plus haute carte de cette couleur remporte le pli. Si personne ne l’a, le pli revient à la main (les sources n’en disent rien ; c’est la règle de notre table). La main entame le troisième pli.',
        effect: 'La passe générale devient moins prévisible. À Rostov le talon reste fermé, donc on ne l’utilise pas.',
    },
    stalingrad: {
        name: 'Stalingrad', term: '«Сталинград»',
        what: 'Sur un six de pique, les deux défenseurs doivent faire whist.',
        how: 'Ni passe ni demi-whist : le jeu se joue toujours, fermé.',
        effect: 'Plus de six de pique gratuits. Le déclarant affronte toujours deux défenseurs avec une obligation commune de quatre plis, donc annoncer 6♠ devient plus risqué.',
    },
    concedeTwo: {
        name: 'Abandon à deux de chute', term: '«уход без двух»',
        what: 'Après avoir vu le talon, le déclarant peut refuser de jouer un jeu perdu d’avance.',
        how: 'Au lieu de nommer le jeu, il appuie sur Abandonner : deux plis au prix du niveau annoncé vont dans sa montagne, et personne n’inscrit de whists.',
        effect: 'Cela limite la perte d’un mauvais talon : moins cher que trois de chute avec whists et consolation, mais toujours une perte. Une table abandonne à deux ou à trois de chute, pas les deux.',
    },
    concedeThree: {
        name: 'Abandon à trois de chute', term: '«уход без трёх»',
        what: 'Après avoir vu le talon, le déclarant peut refuser de jouer un jeu perdu d’avance.',
        how: 'Au lieu de nommer le jeu, il appuie sur Abandonner : trois plis au prix du niveau annoncé vont dans sa montagne, et personne n’inscrit de whists.',
        effect: 'Cela limite la perte d’un talon vraiment mauvais. Une table abandonne à deux ou à trois de chute, pas les deux.',
    },
    whistPassHalf: {
        name: 'Whist · passe · demi-whist', term: '«вист–пас–полвиста»',
        what: 'Celui qui a dit whist peut passer au demi-whist si l’autre défenseur a passé.',
        how: 'Seulement sur six et sept : au lieu de jouer seul, il prend le demi-whist — le jeu compte comme réussi sans être joué et il inscrit des whists pour la moitié de l’obligation. Nécessite le demi-whist ; jamais à deux, où le whist avec le Mort est toujours ouvert d’emblée.',
        effect: 'Un défenseur seul prend un demi-whist sûr au lieu d’affronter seul le déclarant.',
    },
    misereNoTalon: {
        name: 'Misère sans talon', term: '«мизер без прикупа»',
        what: 'Une misère annoncée sans prendre le talon ; aux enchères elle passe au-dessus des neuf.',
        how: 'Seul un dix la bat (les sources divergent ; notre table s’en tient à cela). Qui a annoncé une misère ordinaire peut monter jusqu’à elle. Elle se joue avec vos dix cartes, le talon reste fermé ; elle se compte comme une misère.',
        effect: 'Une misère de rang supérieur : sans l’aide du talon, mais sans carte dangereuse venue de lui.',
    },
    darkBids: {
        name: 'Annonces à l’aveugle', term: '«тёмные заявки»',
        what: 'Une parole avant de regarder ses cartes : « passe à l’aveugle » ou « six à l’aveugle », « sept à l’aveugle »…',
        how: 'Seulement comme premier mot de la donne, cartes fermées. Un niveau à l’aveugle passe au-dessus de toute enchère visible de ce niveau (« six à l’aveugle » bat 6SA mais pas 7♠) ; la couleur se choisit après le talon. Après une annonce à l’aveugle, on ne peut que monter à l’aveugle ou passer.',
        effect: 'Un jeu à l’aveugle coûte double : poule, montagne et whists. Une passe générale où quelqu’un a passé à l’aveugle coûte double aussi.',
    },
    bombs: {
        name: 'Bombes', term: '«бомбы»',
        what: 'Après une passe générale, chacun de ceux qui ont dit « passe à l’aveugle » reçoit une bombe.',
        how: 'Son prochain jeu ou sa prochaine misère coûte double, sur deux bombes quatre fois, sur trois (« sapin ») huit fois plus. Réussi, les bombes s’éteignent ; chuté, elles restent pour le jeu suivant. Nécessite les annonces à l’aveugle.',
        effect: 'De grands écarts : un seul jeu sur bombes peut décider la poule.',
    },
    paidTalon: {
        name: 'Talon payant', term: '«платный прикуп»',
        what: 'Le déclarant paie les plis rapides du talon : un as, ou un roi et une dame de même couleur — un pli ; as et roi de même couleur — deux ; deux as — trois.',
        how: 'Chaque pli rapide coûte le prix du jeu en whists : à trois, chaque défenseur en inscrit la moitié sur le déclarant ; à quatre, le donneur inscrit toute la prime (FSPR).',
        effect: 'Un talon chanceux coûte quelque chose au déclarant.',
    },
    americanHelp: {
        name: 'Aide', term: '«помощь»',
        what: 'Quand votre poule est fermée, les points au-delà de l’objectif vont dans la poule de l’adversaire dont la poule est la plus grande sans être fermée.',
        how: 'À égalité, on aide le joueur de gauche. Pour chaque point donné, vous inscrivez 10 whists sur lui. Se joue là où chacun ferme sa propre poule (Sotchi, Rostov, Classique).',
        effect: 'La poule se ferme plus vite et les points en trop ne se perdent pas.',
    },
    dealerWhists: {
        name: 'Le donneur fait whist pour ceux qui passent',
        what: 'À quatre : si les deux défenseurs passent, le donneur peut prendre la main de l’un d’eux et faire le whist lui-même.',
        how: 'Le donneur regarde les cartes d’un défenseur et décide : whist — il joue ces cartes fermées et inscrit tout ce qu’aurait inscrit ce défenseur ; passe — le jeu compte.',
        effect: 'Moins de jeux gratuits pour le déclarant.',
    },
    misereHalves: {
        name: 'Misère à moitié', term: '«мизер пополам»',
        what: 'À quatre, le déclarant d’une misère peut appeler le donneur pour la partager à moitié.',
        how: 'La décision se prend juste après les enchères, avant le talon. La poule d’une misère nette ou la montagne d’une misère prise se partage à parts égales entre le déclarant et le donneur.',
        effect: 'Moins de risque sur une misère douteuse — et un gain plus petit.',
    },
    teeth: {
        name: 'Dents', term: '«зубы»',
        what: 'Une marque sur la feuille en direction de celui qui vous a fait chuter.',
        how: 'Quand vous chutez contre un whist, une dent apparaît sous la poule en direction de chaque défenseur. Cela ne change pas le score : c’est la promesse de le faire chuter à son tour.',
        effect: 'Folklore de table : seulement une marque sur la feuille.',
    },
};

const RANKS = ['Sept', 'Huit', 'Neuf', 'Dix', 'Valet', 'Dame', 'Roi', 'As'];
const SUITS = ['pique', 'trèfle', 'carreau', 'cœur'];
const tricksWord = (count: number): string => (count === 1 ? 'pli' : 'plis');

// [EN] Who sits where: «vous» takes its own verb forms, the opponents of this pool (characters/roster.ts) the third person.
// [RU] Кто где сидит: у «vous» свои формы глагола, у соперников этой пули (characters/roster.ts) — третье лицо.
const by = <T>(seat: number, you: T, other: T): T => (seat === 0 ? you : other);

const closed = (reason: ClosedReason): string => {
    switch (reason.kind) {
        case 'notReady': return 'Bientôt : le moteur ne le joue pas encore.';
        case 'conflict': return `Incompatible avec « ${OPTIONS[reason.with].name} ». Désactivez-la d’abord.`;
        case 'requires': return `Il faut d’abord activer « ${OPTIONS[reason.option].name} ».`;
        case 'variant': return `Seulement en ${reason.variants.map(variant => VARIANTS[variant].name).join(', ')}.`;
        case 'players': return `Seulement à ${reason.players.join(' ou ')} joueurs.`;
        default: return '';
    }
};

export default function fr(cast: Cast): Dictionary {
    const NAMES = ['Vous', ...cast.map(id => CHARACTERS_FR[id].name)];
    const name = (seat: number): string => NAMES[seat];
    return {
    language: 'fr',
    gameTitle: 'Préférence',
    seatNames: NAMES,
    characters: CHARACTERS_FR,
    portrait: { guest: 'invité', dweller: 'habitant de la crypte', about: who => `${who} : une biographie`, close: 'Fermer',
        manner: {
            bidding: 'Enchères', whist: 'Whist', misere: 'Misère', pace: 'Réfléchit',
            bold: 'avec audace', even: 'sans excès', careful: 'avec prudence',
            eager: 'volontiers', calculated: 'par calcul', cautious: 'à contrecœur',
            loves: 'l’adore', sometimes: 'parfois', cleanOnly: 'seulement propre',
            fast: 'vite', moderate: 'posément', slow: 'longuement',
        },
    },
    header: {
        rules: variant => `règles de ${variant}`,
        pool: target => `poule de ${target}`,
        tagline: 'vous contre les habitants de la crypte, qui jurent sur leur tombe de ne jamais regarder les cartes cachées',
        tableSetup: 'Réglages de la table',
        language: 'Langue',
    },
    cards: {
        corners: ['7', '8', '9', '10', 'V', 'D', 'R', 'A'],
        name: (rank, suit) => `${RANKS[rank]} de ${SUITS[suit]}`,
    },
    bids: {
        noTrump: 'SA', misere: 'Misère', misereButton: 'Misère — ne faire aucun pli',
        hold: bid => `Tenir ${bid}`, gridLabel: 'Annonces',
    },
    info: {
        auction: 'Enchères',
        speaksFirst: seat => `${by(seat, 'Vous parlez', `${name(seat)} parle`)} en premier · le talon attend face cachée`,
        allPass: 'Passe générale',
        allPassHint: 'Faites le moins de plis possible',
        allPassTalonHint: 'Faites le moins de plis possible · le talon fixe les deux premiers plis',
        misere: seat => `${name(seat)} · Misère`,
        misereHint: seat => `${by(seat, 'Vous ne devez', `${name(seat)} ne doit`)} faire aucun pli · les chasseurs étalent leurs cartes après le premier pli`,
        takesTalon: seat => by(seat, 'Vous prenez le talon', `${name(seat)} prend le talon`),
        discardHint: 'Deux cartes vont à l’écart',
        needs: (seat, tricks) => `${by(seat, 'Vous devez', `${name(seat)} doit`)} faire ${tricks} ${tricksWord(tricks)}`,
        defendersDecide: 'La défense décide : whist ou passe',
    },
    roles: { allPass: 'Passe générale', misere: 'Misère', declarer: 'Joue', catcher: 'Chasse', checks: 'Vérifie', whist: 'Whist', halfWhist: 'Demi-whist', pass: 'Passe', onTalon: 'au talon' },
    seat: { tricks: count => `plis ${count}`, thinking: 'réfléchit…' },
    table: { centre: 'Centre de la table', talonOpen: 'Talon, visible de tous', talonClosed: 'Talon, face cachée', talonLeads: 'Une carte du talon fixe ce pli' },
    actions: {
        thinking: seat => by(seat, 'Vous réfléchissez…', `${name(seat)} réfléchit…`),
        yourBid: 'À vous : annoncez un jeu ou passez',
        someoneBids: (seat, bid, canHold) => `${by(seat, 'Vous annoncez', `${name(seat)} annonce`)} ${bid}${canHold ? ' — en main aînée, vous pouvez tenir' : ''}`,
        pass: 'Passe',
        discardMisere: 'Misère : écartez deux cartes et gardez la main la plus sûre',
        discardGame: 'Vous avez pris le talon : choisissez deux cartes à écarter',
        selected: count => `${count} sur 2 choisies`,
        discard: 'Écarter',
        nameGame: bid => `Nommez le jeu : ${bid} ou plus`,
        concede: tricks => `Abandonner · ${tricks === 2 ? 'deux' : 'trois'} de chute`,
        concedeHint: 'Personne n’inscrit de whists ; les plis concédés, au prix de votre niveau annoncé, vont dans votre montagne',
        whistQuestion: (seat, contract) => `${by(seat, 'Vous jouez', `${name(seat)} joue`)} ${contract}. Whist (défendre et marquer) ou passe ?`,
        whist: 'Whist', halfWhist: 'Demi-whist',
        returnQuestion: seat => `${by(seat, 'Vous avez dit', `${name(seat)} a dit`)} demi-whist. Reprendre le whist et défendre ?`,
        takeBack: 'Whist', leaveHalf: 'Laisser le demi-whist',
        modeQuestion: 'Vous défendez sans partenaire. Ouvert (les deux mains de la défense visibles, vous jouez les deux) ou fermé ?',
        open: 'Ouvert', closed: 'Fermé',
        yourTurn: 'À vous de jouer : jouez une des cartes levées',
        yourTurnFor: seat => `À vous de jouer pour ${name(seat)} (whist ouvert) : jouez une des cartes levées`,
        nextDeal: 'Donne suivante',
    },
    results: {
        allPass: scores => `Passe générale · ${scores}`,
        misereClean: seat => `${name(seat)} · misère · propre, aucun pli`,
        misereCaught: (seat, tricks) => `${name(seat)} · misère · prise avec ${tricks} ${tricksWord(tricks)}`,
        conceded: (seat, contract, tricks) => `${name(seat)} · ${contract} · abandon à ${tricks === 2 ? 'deux' : 'trois'} de chute, sans whists`,
        halfWhistCounted: (seat, contract) => `${name(seat)} · ${contract} · demi-whist, compté comme réussi`,
        nobodyWhisted: (seat, contract) => `${name(seat)} · ${contract} · personne n’a fait whist, compté comme réussi`,
        made: (seat, contract, tricks, defence) => `${name(seat)} · ${contract} · réussi avec ${tricks} · défense ${defence}`,
        down: (seat, contract, under, tricks) => `${name(seat)} · ${contract} · ${under} de chute (${tricks} ${tricksWord(tricks)})`,
        poolClosed: 'La poule est fermée.',
        redeal: 'Tout le monde passe : on redistribue',
        whists: 'whists',
    },
    extra: {
        save: 'Enregistrer',
        savedAt: time => `enregistré à ${time}`,
        misereNoTalon: 'Misère sans talon',
        misereNoTalonButton: 'Misère sans talon — sans prendre le talon, aucun pli',
        dark: level => `${level} à l’aveugle`,
        darkPass: 'Passe à l’aveugle',
        darkRow: 'À l’aveugle, sans regarder ses cartes',
        lookAtCards: 'Regarder les cartes',
        darkQuestion: 'Vos cartes sont encore fermées\u00a0: vous pouvez parler à l’aveugle — le jeu et les whists coûtent double — ou regarder d’abord',
        darkOnly: 'Vous avez annoncé à l’aveugle sans voir vos cartes\u00a0: vous ne pouvez que monter à l’aveugle, ou passer',
        cardsClosed: 'cartes fermées',
        shareQuestion: 'Appeler le donneur pour partager la misère à moitié\u00a0? La poule ou la montagne se partage à parts égales',
        share: 'À moitié avec le donneur',
        playAlone: 'Jouer seul',
        dealerQuestion: 'Les deux défenseurs ont passé. Prendre la main de l’un d’eux et faire le whist vous-même\u00a0?',
        dealerHand: seat => `Main\u00a0: ${name(seat)}`,
        dealerWhistQuestion: seat => `Whist avec la main de ${name(seat)}\u00a0? L’obligation est pour vous`,
        bombs: count => `bombes\u00a0: ${count}`,
        teeth: 'Dents',
        tooth: (from, to, count) => `${from} → ${to}${count > 1 ? ` ×${count}` : ''}`,
        results: {
            dark: 'à l’aveugle', times: factor => `×${factor}`, bombs: 'sur bombes', darkAllPass: 'passe générale à l’aveugle',
            bombsEarned: names => `bombe\u00a0: ${names}`, shared: 'à moitié avec le donneur',
            dealerWhisted: seat => `whist du donneur\u00a0: ${name(seat)}`, premium: whists => `talon payant\u00a0: ${whists} whists`, noTalon: 'sans talon',
        },
    },
    sheet: {
        title: 'Feuille de marque',
        meta: (target, total, max) => `poule de ${target} · ${total} sur ${max}`,
        openLarge: 'Ouvrir la feuille en grand',
        close: 'Fermer la feuille',
        legend: { mountain: 'montagne · au centre', pool: 'poule · au milieu', whists: 'whists · au bord' },
        ifClosedNow: 'Si la poule se fermait maintenant :',
        sumsToZero: 'whists, la somme fait zéro',
        deals: count => `Donnes · ${count}`,
        deal: number => `Donne ${number}`,
        rulesTitle: variant => `Les règles en bref (${variant})`,
        rules: [
            '32 cartes, trois joueurs, dix cartes chacun et deux au talon.',
            'Enchères de 6♠ à 10SA ; la misère se place entre 8SA et 9♠ et seulement comme première annonce. La main aînée peut tenir une annonce égale.',
            'Celui qui remporte les enchères prend le talon, écarte deux cartes et nomme le jeu final, égal ou plus haut.',
            'Les défenseurs disent whist ou passe. Au whist, il faut faire 4 plis contre un six, 2 contre un sept, 1 contre un huit ou un neuf.',
            'On fournit la couleur ; sinon on coupe à l’atout ; sinon n’importe quelle carte.',
            'Un jeu réussi va dans la poule, les plis manquants en montagne, ceux de la défense en whists ; ce que vaut chacun dépend de la variante (ci-dessous).',
            'Tout le monde a passé : passe générale, faites le moins de plis possible.',
        ],
        bandPool: owner => `${owner} · poule`,
        bandMountain: owner => `${owner} · montagne`,
        bandWhists: (writer, target) => `${writer} · whists sur ${target}`,
        empty: 'vide',
        closesAt: points => `La poule se ferme à ${points} points au total`,
        resultTitle: owner => `${owner} · si la poule se fermait maintenant, en whists`,
        drawing: target => `Feuille de marque, poule de ${target}`,
        strip: players => `Feuille de marque. ${players}. Ouvrir la feuille entière.`,
        stripPlayer: (owner, pool, target, mountain, balance) => `${owner} : poule ${pool} sur ${target}, montagne ${mountain}, ${balance} whists`,
    },
    setup: {
        title: 'Table de préférence',
        savedPool: 'Poule enregistrée',
        savedLine: (deal, pool, max, when) => `Donne ${deal} · poule ${pool} sur ${max} · enregistrée le ${when}`,
        continueSaved: 'Reprendre la partie en cours',
        playPlain: 'Jouer la version simple',
        playPlainHint: 'Trois joueurs, règles de Sotchi, une poule courte, sans extras. Ou composez votre table ci-dessous.',
        players: '1 · Joueurs', rules: '2 · Règles', pool: 'Longueur de la poule', progression: 'Prix de la passe générale', bots: 'Bots',
        conventions: '3 · Conventions de la variante', conventionsNote: 'activées par défaut',
        extras: '4 · Extras', extrasNote: 'selon vos goûts',
        soon: 'bientôt',
        what: 'Ce que c’est.', how: 'Comment on joue.', effect: 'Ce que ça change.',
        about: option => `Qu’est-ce que « ${option} » ?`,
        yourTable: 'Votre table :', play: 'Jouer', reset: 'Revenir au simple', back: 'Retour à la table', lastPools: 'Dernières poules',
        resultLine: (when, deals, balance) => `${when} · ${deals} donnes · vous ${balance} whists`,
        dropped: names => `Désactivé, incompatible avec le nouveau choix : ${names}.`,
        summary: {
            players: count => `${count} joueurs`,
            pool: target => `poule de ${target}`,
            allPass: prices => `passe générale ${prices}`,
            allPassWhists: 'passe générale payée en whists',
            without: option => `sans « ${option} »`,
            bots: { casual: 'bots tranquilles', strong: 'bots forts' },
        },
        strength: { casual: 'Tranquilles · rapides', strong: 'Forts · réfléchissent plus' },
        opponents: 'Adversaires',
        opponentsNote: max => (max === 1 ? 'choisissez un portrait ; sans choix, la crypte décide' : `choisissez des portraits (${max === 2 ? 'deux' : 'trois'} au plus) ; sans choix, la crypte décide`),
        randomOpponents: 'Au hasard',
        champion: who => `${who} a gagné la dernière poule et prend une place libre à table.`,
    },
    explain: {
        players: {
            3: { name: '3 · vous + 2 bots', what: 'La table classique : dix cartes chacun, deux au talon.', how: 'Vous êtes en bas ; deux habitants de la crypte (nouveaux à chaque poule) occupent les autres places et ne regardent jamais les cartes cachées.', effect: 'Le jeu standard. Toutes les règles de ce menu sont écrites pour trois joueurs.' },
            2: { name: '2 · duel avec le mort', what: 'Vous contre un adversaire ; la troisième main est le mort, un épouvantail squelette qui passe toujours.', how: 'Le défenseur décide du whist sans voir le mort ; le whist est toujours ouvert et le défenseur joue les deux mains. Tout le monde passe : on redistribue.', effect: 'Un duel rapide et tranchant. Le défenseur inscrit les whists du mort ; à la fin la montagne n’est pas partagée : la différence des montagnes × 10 whists.' },
            4: { name: '4 · le donneur se repose', term: '«сдающий на прикупе»', what: 'Quatre à table ; le donneur ne reçoit pas de cartes dans sa propre donne.', how: 'Le donneur marque quand même : il touche la consolation quand le déclarant chute, et en passe générale le talon est sa main.', effect: 'Chacun se repose une donne sur quatre. La fédération sportive (FSPR) joue à quatre.' },
        },
        variants: VARIANTS,
        pool: {
            name: 'Longueur de la poule', term: '«пуля»',
            what: 'La poule se ferme quand les trois poules réunies atteignent trois fois ce nombre.',
            how: 'Un jeu réussi inscrit son prix dans la poule du déclarant : 2 pour un six, 4 pour un sept … 10 pour un dix ou une misère.',
            effect: '10, c’est court ; 20, classique ; 30, long. Plus la poule est longue, plus il y a de donnes et moins de chance.',
        },
        progression: {
            name: 'Prix de la passe générale', term: '«прогрессия распасов»',
            what: 'Ce que coûte un pli lors de passes générales successives.',
            how: '1 · 2 · 3 est la règle habituelle à Sotchi : le prix monte puis reste à 3. 1 · 2 · 4 monte plus vite ; « toujours 1 » ne monte jamais. Tout jeu joué remet le prix au départ.',
            effect: 'Une série chère de passes générales pousse à annoncer plutôt qu’à passer.',
        },
        progressionLabel: prices => (prices.length === 1 ? `toujours ${prices[0]}` : prices.join(' · ')),
        bots: {
            name: 'Bots',
            what: 'Le temps de réflexion des bots. Quelle que soit leur force, ils ne regardent jamais les cartes cachées.',
            how: 'Tranquilles : 8 donnes simulées par carte, un quart de seconde. Forts : 32 donnes, moins d’une seconde.',
            effect: 'Les bots forts défendent mieux et chassent mieux les misères.',
        },
        options: OPTIONS,
    },
    closed,
    };
}

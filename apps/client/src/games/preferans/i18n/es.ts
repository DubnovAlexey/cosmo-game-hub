// [EN] FILE: games/preferans/i18n/es.ts — Spanish texts of the preferans table. The Russian terms stay in «»,
//      because that is how players everywhere know them; the pool keeps its Russian name, «pulya».
// [RU] ФАЙЛ: испанские тексты стола преферанса. Русские термины остаются в «» — под ними игру знают везде;
//      пуля сохраняет русское имя: «pulya».
import type { ClosedReason, OptionId, Seat, VariantId } from '../engine/index.ts';
import type { Dictionary, Explained } from './types.ts';

const VARIANTS: Readonly<Record<VariantId, Explained>> = {
    sochi: {
        name: 'Sochi', term: '«Сочинка»',
        what: 'La variante más extendida en los clubes y en internet.',
        how: 'El whist es responsable: el defensor que se queda corto paga el precio completo del juego por cada baza que falte. Si solo uno hace whist, se anota todos los whists de la defensa (whist «codicioso»).',
        effect: 'Defender es arriesgado, así que los declarantes se atreven más. Un punto de pulya vale 10 whists.',
    },
    leningrad: {
        name: 'Leningrado · Píter', term: '«Ленинградка»',
        what: 'La variante de San Petersburgo y de los torneos deportivos.',
        how: 'Los whists y la montaña se duplican; el whist es semirresponsable y «de caballeros»: si solo uno hace whist, reparte los whists con el defensor que pasó.',
        effect: 'Defender sale más barato y se defiende con más audacia. Un punto de pulya vale 20 whists; el pase general suele costar 2 · 4 · 6.',
    },
    rostov: {
        name: 'Rostov', term: '«Ростовка»',
        what: 'Los precios de Sochi con un whist más suave.',
        how: 'El defensor que se queda corto paga la mitad del precio del juego; la consolación es fija, 10 whists. El pase general se paga en whists al jugador con menos bazas, y el talón nunca se descubre.',
        effect: 'Un juego más tranquilo: el pase general nunca suma montaña.',
    },
    classic: {
        name: 'Clásica', term: '«Классика»',
        what: 'La variante más antigua, que siguen jugando los grupos de estudiantes.',
        how: 'Declaraciones a ciegas y bombas: tras un pase general a ciegas, el juego siguiente vale el doble o más.',
        effect: 'Grandes vaivenes en el marcador.',
    },
};

const OPTIONS: Readonly<Record<OptionId, Explained>> = {
    seniorHold: {
        name: 'La mano mayor puede mantener', term: '«здесь»',
        what: 'De los dos jugadores que siguen pujando, el mayor puede mantener la misma declaración en vez de subirla: «seis de corazones — aquí».',
        how: 'El otro debe entonces subir o pasar.',
        effect: 'Los empates de la subasta son para la mano mayor, así que las subastas terminan más bajas. Desactivado: cada declaración nueva debe ser más alta.',
    },
    halfWhist: {
        name: 'Medio whist en seis y siete', term: '«полвиста»',
        what: 'Cuando el primer defensor pasa, el segundo puede decir medio whist en lugar de whist.',
        how: 'El juego se da por cumplido sin jugarse, y quien dice medio whist anota whists por la mitad de la obligación: 2 bazas en un seis, 1 en un siete. El primer defensor aún puede recuperar el whist y jugar.',
        effect: 'Un tanto pequeño y seguro para la defensa en vez del riesgo de un whist corto.',
    },
    tenChecked: {
        name: 'El diez se comprueba', term: '«десятерная проверяется»',
        what: 'Al juego de diez bazas no se le hace whist: los defensores solo comprueban que el declarante gane las diez.',
        how: 'Juegan los dos defensores y ninguno tiene obligación.',
        effect: 'Sin montaña para los defensores en un diez; si el declarante falla, los whists se anotan como si los dos hubieran hecho whist. Desactivado: al diez se le hace whist como a un ocho o un nueve.',
    },
    talonLeads: {
        name: 'Pase general: sale el talón', term: '«заход с прикупа»',
        what: 'En el pase general, las dos cartas del talón se descubren una a una y marcan el palo de las dos primeras bazas.',
        how: 'Todos deben seguir ese palo, y la carta más alta de ese palo gana la baza. Si nadie lo tiene, la gana la mano (las fuentes no lo dicen; es la regla de nuestra mesa). La mano sale en la tercera baza.',
        effect: 'El pase general se vuelve menos previsible. En Rostov el talón queda cerrado, así que allí no se usa.',
    },
    stalingrad: {
        name: 'Stalingrado', term: '«Сталинград»',
        what: 'En un seis de picas los dos defensores deben hacer whist.',
        how: 'Sin paso ni medio whist: el juego siempre se juega, cerrado.',
        effect: 'Ya no hay seises de picas gratis. El declarante siempre se enfrenta a dos defensores con una obligación conjunta de cuatro bazas, así que declarar 6♠ es más arriesgado.',
    },
    concedeTwo: {
        name: 'Rendirse con dos de menos', term: '«уход без двух»',
        what: 'Tras ver el talón, el declarante puede negarse a jugar un juego perdido.',
        how: 'En lugar de nombrar el juego pulsa Rendirse: dos bazas al precio del nivel declarado van a su montaña, y nadie anota whists.',
        effect: 'Limita la pérdida de un mal talón: sale más barato que caer tres con whists y consolación, pero siempre es una pérdida. Una mesa se rinde con dos o con tres de menos, no con ambas.',
    },
    concedeThree: {
        name: 'Rendirse con tres de menos', term: '«уход без трёх»',
        what: 'Tras ver el talón, el declarante puede negarse a jugar un juego perdido.',
        how: 'En lugar de nombrar el juego pulsa Rendirse: tres bazas al precio del nivel declarado van a su montaña, y nadie anota whists.',
        effect: 'Limita la pérdida de un talón realmente malo. Una mesa se rinde con dos o con tres de menos, no con ambas.',
    },
    whistPassHalf: {
        name: 'Whist · paso · medio whist', term: '«вист–пас–полвиста»',
        what: 'El defensor que dijo whist puede cambiar a medio whist cuando el otro defensor pasa.',
        how: 'Amplía el medio whist, así que necesita el medio whist activado.',
        effect: 'Un defensor solo puede quedarse con un medio whist seguro en vez de defender en solitario.',
    },
    misereNoTalon: {
        name: 'Miseria sin talón', term: '«мизер без прикупа»',
        what: 'Una miseria declarada sin tomar el talón; está por encima de los nueves.',
        how: 'Las fuentes no coinciden en qué la supera, así que la mesa fijará una sola regla.',
        effect: 'Una miseria más alta, sin ayuda ni peligro del talón.',
    },
    darkBids: {
        name: 'Declaraciones a ciegas', term: '«тёмные заявки»',
        what: 'Pujar antes de mirar tus cartas: «paso a ciegas», «seis a ciegas».',
        how: 'Forma parte de la Clásica: las declaraciones a ciegas se superan en una escala propia.',
        effect: 'Las ganancias y las pérdidas de un juego a ciegas se duplican.',
    },
    bombs: {
        name: 'Bombas', term: '«бомбы»',
        what: 'Tras un pase general a ciegas, los jugadores que pasaron a ciegas reciben una bomba.',
        how: 'El siguiente juego con bomba vale el doble; una segunda bomba, ×4; una tercera, ×8. Un juego cumplido quita la bomba; uno fallado la deja. Necesita las declaraciones a ciegas.',
        effect: 'Grandes vaivenes: un solo juego puede decidir la pulya.',
    },
    paidTalon: {
        name: 'Talón de pago', term: '«платный прикуп»',
        what: 'Las bazas rápidas que aparecen en el talón se pagan: un as, o el rey y la dama de un mismo palo, cuentan como una baza; as y rey, como dos; dos ases, como tres.',
        how: 'Cada baza rápida se paga al precio del juego a los rivales del declarante (las fuentes difieren en los detalles).',
        effect: 'Un talón afortunado le cuesta algo al declarante.',
    },
    americanHelp: {
        name: 'Ayuda', term: '«помощь»',
        what: 'Cuando tu pulya está llena, los puntos que ganas por encima del objetivo van a la pulya del rival que la tenga más grande.',
        how: 'Por cada uno de esos puntos le anotas 10 whists. Se usa donde cada jugador cierra su propia pulya (Sochi, Rostov).',
        effect: 'La pulya se cierra antes y no se pierde ningún punto.',
    },
    dealerWhists: {
        name: 'El repartidor hace whist por los que pasan',
        what: 'En una mesa de cuatro, cuando los dos defensores pasan, el repartidor puede mirar las cartas de un defensor y hacer whist en su lugar.',
        how: 'Solo con cuatro jugadores; las fuentes difieren en a qué juegos se aplica.',
        effect: 'Menos juegos gratis para el declarante.',
    },
    misereHalves: {
        name: 'Miseria a medias', term: '«мизер пополам»',
        what: 'El declarante puede invitar al repartidor a compartir una miseria.',
        how: 'El premio y la penalización se reparten a la mitad. Solo con cuatro jugadores.',
        effect: 'Menos riesgo en una miseria dudosa.',
    },
    teeth: {
        name: 'Dientes', term: '«зубы»',
        what: 'Una marca en la hoja hacia el jugador que te hizo caer.',
        how: 'No cambia nada en el marcador: es la promesa de devolvérsela cuando puedas.',
        effect: 'Folclore de mesa: solo se muestra en la hoja.',
    },
};

const RANKS = ['Siete', 'Ocho', 'Nueve', 'Diez', 'Jota', 'Reina', 'Rey', 'As'];
const SUITS = ['picas', 'tréboles', 'diamantes', 'corazones'];
const tricksWord = (count: number): string => (count === 1 ? 'baza' : 'bazas');

// [EN] Who sits where: «tú» takes its own verb forms, Orión and Vega the third person.
// [RU] Кто где сидит: у «tú» свои формы глагола, у Ориона и Веги — третье лицо.
const NAMES = ['Tú', 'Orión', 'Vega'] as const;
const by = <T>(seat: Seat, you: T, other: T): T => (seat === 0 ? you : other);
const name = (seat: Seat): string => NAMES[seat];

const closed = (reason: ClosedReason): string => {
    switch (reason.kind) {
        case 'notReady': return 'Próximamente: el motor aún no lo juega.';
        case 'conflict': return `No se puede combinar con «${OPTIONS[reason.with].name}». Desactívalo primero.`;
        case 'requires': return `Antes hay que activar «${OPTIONS[reason.option].name}».`;
        case 'variant': return `Solo en ${reason.variants.map(variant => VARIANTS[variant].name).join(', ')}.`;
        case 'players': return `Solo con ${reason.players.join(' o ')} jugadores.`;
        default: return '';
    }
};

const es: Dictionary = {
    language: 'es',
    gameTitle: 'Preferans',
    seatNames: NAMES,
    header: {
        rules: variant => `reglas de ${variant}`,
        pool: target => `pulya a ${target}`,
        tagline: 'tú contra dos bots que nunca miran las cartas ocultas',
        tableSetup: 'Configurar la mesa',
        language: 'Idioma',
    },
    cards: {
        corners: ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
        name: (rank, suit) => `${RANKS[rank]} de ${SUITS[suit]}`,
    },
    bids: {
        noTrump: 'ST', misere: 'Miseria', misereButton: 'Miseria — no ganar ninguna baza',
        hold: bid => `Mantener ${bid}`, gridLabel: 'Declaraciones',
    },
    info: {
        auction: 'Subasta',
        speaksFirst: seat => `${by(seat, 'Hablas', `${name(seat)} habla`)} primero · el talón espera boca abajo`,
        allPass: 'Pase general',
        allPassHint: 'Gana las menos bazas posibles',
        allPassTalonHint: 'Gana las menos bazas posibles · el talón marca las dos primeras bazas',
        misere: seat => `${name(seat)} · Miseria`,
        misereHint: seat => `${by(seat, 'No debes', `${name(seat)} no debe`)} ganar ninguna baza · los cazadores descubren sus cartas tras la primera baza`,
        takesTalon: seat => by(seat, 'Tomas el talón', `${name(seat)} toma el talón`),
        discardHint: 'Dos cartas van al descarte',
        needs: (seat, tricks) => `${by(seat, 'Necesitas', `${name(seat)} necesita`)} ${tricks} ${tricksWord(tricks)}`,
        defendersDecide: 'Deciden los defensores: whist o paso',
    },
    roles: { allPass: 'Pase general', misere: 'Miseria', declarer: 'Declarante', catcher: 'Caza', checks: 'Comprueba', whist: 'Whist', halfWhist: 'Medio whist', pass: 'Paso' },
    seat: { tricks: count => `bazas ${count}`, thinking: 'pensando…' },
    table: { centre: 'Centro de la mesa', talonOpen: 'Talón, a la vista de todos', talonClosed: 'Talón, boca abajo', talonLeads: 'Una carta del talón marca esta baza' },
    actions: {
        thinking: seat => by(seat, 'Estás pensando…', `${name(seat)} está pensando…`),
        yourBid: 'Tu turno: declara un juego o pasa',
        someoneBids: (seat, bid, canHold) => `${by(seat, 'Declaras', `${name(seat)} declara`)} ${bid}${canHold ? ' — como mano mayor puedes mantenerlo' : ''}`,
        pass: 'Paso',
        discardMisere: 'Miseria: descarta dos cartas y quédate con la mano más segura',
        discardGame: 'Has tomado el talón: elige dos cartas para descartar',
        selected: count => `${count} de 2 elegidas`,
        discard: 'Descartar',
        nameGame: bid => `Nombra el juego: ${bid} o más alto`,
        concede: tricks => `Rendirse · ${tricks === 2 ? 'dos' : 'tres'} de menos`,
        concedeHint: 'Nadie anota whists; las bazas cedidas, al precio de tu nivel declarado, van a tu montaña',
        whistQuestion: (seat, contract) => `${by(seat, 'Juegas', `${name(seat)} juega`)} ${contract}. ¿Whist (defender y anotar) o paso?`,
        whist: 'Whist', halfWhist: 'Medio whist',
        returnQuestion: seat => `${by(seat, 'Dijiste', `${name(seat)} dijo`)} medio whist. ¿Recuperas el whist y defiendes?`,
        takeBack: 'Whist', leaveHalf: 'Dejar el medio whist',
        modeQuestion: 'Defiendes en solitario. ¿Abierto (las dos manos de la defensa boca arriba, juegas las dos) o cerrado?',
        open: 'Abierto', closed: 'Cerrado',
        yourTurn: 'Tu turno: elige una carta resaltada',
        yourTurnFor: seat => `Tu turno por ${name(seat)} (whist abierto): elige una carta resaltada`,
        nextDeal: 'Siguiente reparto',
    },
    results: {
        allPass: scores => `Pase general · ${scores}`,
        misereClean: seat => `${name(seat)} · miseria · limpia, ninguna baza`,
        misereCaught: (seat, tricks) => `${name(seat)} · miseria · cazada con ${tricks} ${tricksWord(tricks)}`,
        conceded: (seat, contract, tricks) => `${name(seat)} · ${contract} · rendición con ${tricks === 2 ? 'dos' : 'tres'} de menos, sin whists`,
        halfWhistCounted: (seat, contract) => `${name(seat)} · ${contract} · medio whist, se da por cumplido`,
        nobodyWhisted: (seat, contract) => `${name(seat)} · ${contract} · nadie hizo whist, se da por cumplido`,
        made: (seat, contract, tricks, defence) => `${name(seat)} · ${contract} · cumplido con ${tricks} · defensa ${defence}`,
        down: (seat, contract, under, tricks) => `${name(seat)} · ${contract} · ${under} de menos (${tricks} ${tricksWord(tricks)})`,
        poolClosed: 'La pulya está cerrada.',
        whists: 'whists',
    },
    sheet: {
        title: 'Hoja de la pulya',
        meta: (target, total) => `pulya a ${target} · ${total} de ${target * 3}`,
        openLarge: 'Abrir la hoja en grande',
        close: 'Cerrar la hoja',
        legend: { mountain: 'montaña · al centro', pool: 'pulya · en medio', whists: 'whists · al borde' },
        ifClosedNow: 'Si la pulya se cerrara ahora:',
        sumsToZero: 'whists, la suma es cero',
        deals: count => `Repartos · ${count}`,
        deal: number => `Reparto ${number}`,
        rulesTitle: 'Reglas en breve (Sochi)',
        rules: [
            '32 cartas, tres jugadores, diez cartas cada uno y dos en el talón.',
            'Subasta de 6♠ a 10ST; la miseria va entre 8ST y 9♠ y solo como primera declaración. La mano mayor puede mantener una declaración igual.',
            'Quien gana la subasta toma el talón, descarta dos cartas y nombra el juego final, igual o más alto.',
            'Los defensores dicen whist o paso. Quien hace whist debe ganar 4 bazas contra un seis, 2 contra un siete y 1 contra un ocho o un nueve; el diez solo se comprueba.',
            'Hay que seguir el palo; si no se tiene, jugar triunfo; si tampoco, cualquier carta.',
            'Un juego cumplido va a la pulya; cada baza que falta cuesta el precio del juego en la montaña. Los whists pagan ese precio por baza.',
            'Si todos pasan, hay pase general: gana las menos bazas posibles. El talón marca las dos primeras bazas.',
        ],
        bandPool: owner => `${owner} · pulya`,
        bandMountain: owner => `${owner} · montaña`,
        bandWhists: (writer, target) => `${writer} · whists sobre ${target}`,
        empty: 'vacío',
        closesAt: points => `La pulya se cierra cuando entre todos suman ${points} puntos`,
        resultTitle: owner => `${owner} · si la pulya se cerrara ahora, en whists`,
        drawing: target => `Hoja de la pulya, pulya a ${target}`,
        strip: players => `Hoja de la pulya. ${players}. Abrir la hoja completa.`,
        stripPlayer: (owner, pool, target, mountain, balance) => `${owner}: pulya ${pool} de ${target}, montaña ${mountain}, ${balance} whists`,
    },
    setup: {
        title: 'Mesa de preferans',
        savedPool: 'Pulya guardada',
        savedLine: (deal, pool, max, when) => `Reparto ${deal} · pulya ${pool} de ${max} · guardada el ${when}`,
        continueSaved: 'Seguir donde lo dejaste',
        playPlain: 'Jugar preferans sencillo',
        playPlainHint: 'Tres jugadores, reglas de Sochi, una pulya corta, sin extras. O arma tu propia mesa aquí abajo.',
        players: '1 · Jugadores', rules: '2 · Reglas', pool: 'Largo de la pulya', progression: 'Precios del pase general', bots: 'Bots',
        conventions: '3 · Convenciones de la variante', conventionsNote: 'activadas por defecto',
        extras: '4 · Extras', extrasNote: 'al gusto',
        soon: 'pronto',
        what: 'Qué es.', how: 'Cómo se juega.', effect: 'Qué cambia.',
        about: option => `¿Qué es «${option}»?`,
        yourTable: 'Tu mesa:', play: 'Jugar', reset: 'Volver a lo sencillo', back: 'Volver a la mesa', lastPools: 'Últimas pulyas',
        resultLine: (when, deals, balance) => `${when} · ${deals} repartos · tú ${balance} whists`,
        dropped: names => `Desactivado, no encaja con la nueva elección: ${names}.`,
        summary: {
            players: count => `${count} jugadores`,
            pool: target => `pulya a ${target}`,
            allPass: prices => `pase general ${prices}`,
            without: option => `sin «${option}»`,
            bots: { casual: 'bots normales', strong: 'bots fuertes' },
        },
        strength: { casual: 'Normales · rápidos', strong: 'Fuertes · piensan más' },
    },
    explain: {
        players: {
            3: { name: '3 · tú + 2 bots', what: 'La mesa clásica: diez cartas cada uno y dos en el talón.', how: 'Te sientas abajo; Orión y Vega ocupan los otros sitios y nunca miran las cartas ocultas.', effect: 'El juego estándar. Todas las reglas de este menú están escritas para tres jugadores.' },
            2: { name: '2 · Gusárik', term: '«гусарик»', what: 'Tú contra un bot, con una mano muerta que siempre pasa.', how: 'El defensor decide si hace whist sin ver la mano muerta; el whist siempre se juega abierto, y el defensor juega las dos manos de la defensa.', effect: 'Un duelo más rápido y más afilado. Las fuentes lo describen de tres maneras distintas, así que la mesa fijará sus reglas exactas.' },
            4: { name: '4 · el repartidor descansa', term: '«сдающий на прикупе»', what: 'Cuatro en la mesa; el repartidor no recibe cartas en su propio reparto.', how: 'El repartidor sigue anotando: cobra la consolación cuando el declarante falla, y en el pase general el talón es su mano.', effect: 'Cada uno descansa uno de cada cuatro repartos. La federación deportiva (FSPR) juega con cuatro en la mesa.' },
        },
        variants: VARIANTS,
        pool: {
            name: 'Largo de la pulya', term: '«пуля»',
            what: 'La pulya se cierra cuando las tres pulyas juntas llegan a tres veces este número.',
            how: 'Un juego cumplido anota su precio en la pulya del declarante: 2 por un seis, 4 por un siete … 10 por un diez o una miseria.',
            effect: '10 es corta, 20 clásica, 30 larga. Cuanto más larga, más repartos y menos suerte.',
        },
        progression: {
            name: 'Precios del pase general', term: '«прогрессия распасов»',
            what: 'Cuánto cuesta una baza en los pases generales que van seguidos.',
            how: '1 · 2 · 3 es la regla habitual de Sochi: el precio sube y luego se queda en 3. 1 · 2 · 4 sube más deprisa; «siempre 1» no sube nunca. Cualquier juego jugado devuelve el precio al principio.',
            effect: 'Una serie cara de pases generales empuja a declarar en vez de pasar.',
        },
        progressionLabels: { '1-2-3': '1 · 2 · 3', '1-2-4': '1 · 2 · 4', flat: 'siempre 1' },
        bots: {
            name: 'Bots',
            what: 'Cuánto piensan los bots. Con cualquier fuerza, nunca miran las cartas ocultas.',
            how: 'Normales: 8 repartos simulados por carta, un cuarto de segundo. Fuertes: 32 repartos, menos de un segundo.',
            effect: 'Los bots fuertes defienden y cazan miserias mejor.',
        },
        options: OPTIONS,
    },
    closed,
};

export default es;

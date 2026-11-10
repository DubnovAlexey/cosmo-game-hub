// [EN] FILE: games/poker/i18n/fr.ts — the poker table in French, with a non-breaking space before : ; ? !
// [RU] ФАЙЛ: покерный стол по-французски, с неразрывным пробелом перед : ; ? !
import type { PokerTexts, Who } from './types';

const RANK_NAMES = ['deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'valet', 'dame', 'roi', 'as'];
const SUIT_NAMES = ['pique', 'cœur', 'carreau', 'trèfle'];
const capitalised = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
const name = (who: Who): string => (who.you ? 'Vous' : capitalised(who.name));
const S = ' ';

const fr: PokerTexts = {
  language: 'fr',
  gameTitle: 'Poker',
  tagline: 'Texas hold’em · tournoi à élimination · vous contre les habitués de la crypte',
  header: {
    language: 'Langue',
    save: 'Enregistrer',
    savedAt: time => `enregistré à ${time}`,
    menu: 'Menu de la table',
    level: (small, big, ante, hand) => `Blindes ${small}/${big}${ante > 0 ? ` · ante ${ante}` : ''} · main ${hand}`,
  },
  setup: {
    title: 'La table de poker du repaire',
    intro: `Texas hold’em sans limite, tournoi à élimination${S}: tout le monde part avec les mêmes jetons et les blindes montent jusqu’à ce qu’il n’en reste qu’un. Vos adversaires sont les habitués de la crypte, chacun avec sa manière.`,
    noMoney: `Jetons de jeu seulement${S}: un jeu et une leçon de probabilités, jamais un pari d’argent.`,
    opponents: 'Adversaires à la table',
    opponentsCount: count => `${count} ${count === 1 ? 'adversaire' : 'adversaires'}`,
    stack: 'Jetons par joueur',
    speed: 'Les blindes montent',
    speeds: { slow: 'lentement', normal: 'comme d’habitude', fast: 'vite' },
    speedHint: hands => `toutes les ${hands} mains`,
    strength: 'Adversaires',
    strengths: { casual: 'ordinaires — ils se trompent', strong: 'forts — ils calculent' },
    start: 'S’asseoir à la table',
    continue: 'Reprendre le tournoi',
    savedLine: (hand, players, when) => `Tournoi enregistré${S}: main ${hand}, ${players} à la table, ${when}`,
    close: 'Fermer le menu',
  },
  seat: {
    you: 'Vous',
    dealer: 'Bouton',
    smallBlind: 'PB',
    bigBlind: 'GB',
    folded: 'couché',
    allIn: 'tapis',
    thinking: 'réfléchit…',
    out: 'éliminé',
    stack: chips => `${chips} jetons`,
    about: who => `Qui est ${who}`,
  },
  actions: {
    fold: 'Se coucher',
    check: 'Parole',
    call: amount => `Suivre ${amount}`,
    bet: to => `Miser ${to}`,
    raise: to => `Relancer à ${to}`,
    allIn: amount => `Tapis ${amount}`,
    amount: 'Mise',
    presets: { half: '½ pot', threeQuarters: '¾ pot', pot: 'Pot', max: 'Tout' },
    yourTurn: 'À vous',
    waiting: who => `À ${who.name} de parler`,
  },
  streets: { preflop: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Abattage' },
  pot: amount => `Pot ${amount}`,
  sidePot: (index, amount) => `Pot annexe ${index}${S}: ${amount}`,
  hands: ['Carte haute', 'Paire', 'Double paire', 'Brelan', 'Quinte', 'Couleur', 'Full', 'Carré', 'Quinte flush', 'Quinte flush royale'],
  log: {
    title: 'La main jusqu’ici',
    blinds: (small, big, ante) => `Blindes ${small}/${big}${ante ? `, ante ${ante}` : ''}`,
    fold: who => `${name(who)}${S}: se couche`,
    check: who => `${name(who)}${S}: parole`,
    call: (who, to, allIn) => `${name(who)}${S}: suit ${to}${allIn ? ', tapis' : ''}`,
    bet: (who, to, allIn) => `${name(who)}${S}: mise ${to}${allIn ? ', tapis' : ''}`,
    raise: (who, to, allIn) => `${name(who)}${S}: relance à ${to}${allIn ? ', tapis' : ''}`,
    street: (street, cards) => `${street}${S}: ${cards}`,
  },
  results: {
    wins: (who, amount, hand) => (who.you ? `Vous remportez ${amount} — ${hand}` : `${capitalised(who.name)} remporte ${amount} — ${hand}`),
    uncontested: (who, amount) => (who.you ? `Vous remportez ${amount} sans abattage` : `${capitalised(who.name)} remporte ${amount} sans abattage`),
    returned: (who, amount) => (who.you ? `Votre mise non suivie de ${amount} vous revient` : `La mise non suivie de ${amount} revient à ${who.name}`),
    split: (names, amount, hand) => `${names} se partagent ${amount} — ${hand}`,
    nextHand: 'Main suivante',
    youWon: `Vous avez gagné le tournoi${S}! Tous les jetons de la crypte sont à vous.`,
    youOut: (place, players) => `Vous êtes éliminé${S}: place ${place} sur ${players}.`,
    botWon: who => `${capitalised(who.name)} remporte le tournoi.`,
    newTournament: 'Nouveau tournoi',
  },
  cards: { name: (rank, suit) => `${RANK_NAMES[rank]} de ${SUIT_NAMES[suit]}`, back: 'une carte face cachée' },
  characters: {
    vlad: { name: 'Comte Vlad', tagline: 'Joue peu de mains, et chacune jusqu’à la dernière goutte.' },
    carmilla: { name: 'Carmilla', tagline: `Sourit pareil avec des as et avec rien. Devinez ce qu’elle a${S}?` },
    koschei: { name: 'Kochtcheï', tagline: `Immortel, donc jamais pressé${S}: il attendra les as cent ans s’il le faut.` },
    stilet: { name: 'Don Stylet', tagline: 'Mise comme si le pot était déjà à lui. Parfois, c’est vrai.' },
    kaznachey: { name: 'Trésorier Osselet', tagline: `Paie pour voir chaque carte${S}: le trésor ne se vérifiera pas tout seul.` },
    lilith: { name: 'Lilith', tagline: 'Calcule la cote du pot avant que vous ayez cligné des yeux.' },
    crystal: { name: 'le Crâne de cristal', tagline: `Transparent, et pourtant illisible${S}: dedans, rien que des mathématiques.` },
    galeon: { name: 'Capitaine Galion', tagline: `Fait tapis comme on monte à l’abordage${S}: bruyamment et sans le moindre doute.` },
    shadow: { name: 'Lady Ombre', tagline: 'Se tait sur un monstre et mise quand elle n’a rien.' },
    semyonych: { name: 'Sémionytch le raton', tagline: `Quarante ans de poker de cuisine${S}: il connaît tous les tours et en a inventé la moitié.` },
  },
};

export default fr;

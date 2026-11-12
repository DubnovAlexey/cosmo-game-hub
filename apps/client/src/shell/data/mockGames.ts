// Define the structure of a Game object for type safety
// Определяем структуру объекта игры для типобезопасности
export interface Game {
    title: string;
    description: string;
    badge?: string; // Optional property (необязательное свойство)
    gameUrl: string;
    coverUrl?: string; // [EN] NEW: Optional cover image URL [RU] НОВОЕ: Необязательная ссылка на обложку
    // [EN] Our own variants beside the cover (Alexey, 12.11.2026: «мы дополним существующие своими вариантами»):
    //      pictures generated on our GPU (FLUX.1 Krea) from his prompt books on the Desktop; the card slowly dissolves
    //      from the cover to each of them and back (GameCard.astro). The cover itself always comes first.
    // [RU] Наши варианты рядом с обложкой (Алексей, 12.11.2026: «мы дополним существующие своими вариантами»):
    //      картинки сгенерированы на нашей видеокарте (FLUX.1 Krea) по его книгам промптов на рабочем столе; карточка
    //      медленно перетекает от обложки к каждой из них и обратно (GameCard.astro). Сама обложка всегда первая.
    covers?: readonly string[];
    // [EN] 'playable' opens the game; 'soon' shows an honest "Coming soon" card without a link —
    // the page for that game does not exist yet, and a link would end in 404.
    // [RU] 'playable' открывает игру; 'soon' — честная карточка «Скоро» без ссылки: страницы игры
    // ещё нет, и ссылка вела бы на 404.
    status: 'playable' | 'soon';
    // [EN] Symbol drawn on the cover area while the game has no cover image
    // [RU] Символ на месте обложки, пока у игры нет картинки
    icon?: string;
}

// Export the array of games as our mock database
// Экспортируем массив игр как нашу базу данных-заглушку
export const games: Game[] = [
    {
        title: "Chess",
        description: "Classic strategic board game for two players. Master your tactics and checkmate the king.",
        badge: "Hot",
        gameUrl: "/games/chess",
        coverUrl: "/games/chess/cover.webp", // [EN] Path to our new cover [RU] Путь к нашей новой обложке
        // [EN] A crystal cave, a pastel planet, starry marble. [RU] Кристальная пещера, пастельная планета, звёздный мрамор.
        covers: ["/games/chess/covers/1.webp", "/games/chess/covers/2.webp", "/games/chess/covers/3.webp"],
        status: "playable"
    },
    {
        title: "Checkers",
        description: "Draughts on the cracked marble of the lair: Russian rules with flying kings or English ones, compulsory captures, a hero of the vampire lair as the opponent, three levels of play.",
        badge: "New",
        gameUrl: "/games/checkers",
        // [EN] A dead warrior and a nosferatu over a bloodied board, from Alexey's folder «Шашки» — his favourite
        //      picture, 999.jpg (11.11.2026), only scaled down (public/games/checkers/cover.webp).
        // [RU] Мёртвый воин и носферату над окровавленной доской из папки Алексея «Шашки» — его любимая картинка
        //      999.jpg (11.11.2026), только уменьшенная (public/games/checkers/cover.webp).
        coverUrl: "/games/checkers/cover.webp",
        // [EN] An underwater palace, a garden of crystal spirits. [RU] Подводный дворец, сад кристальных духов.
        covers: ["/games/checkers/covers/1.webp", "/games/checkers/covers/2.webp"],
        status: "playable",
        icon: "⛀"
    },
    {
        title: "Go",
        description: "Ancient abstract strategy board game aiming to surround more territory than the opponent.",
        gameUrl: "/games/go",
        // [EN] A rock garden on the Moon, a coral reef, obsidian and quartz. [RU] Сад камней на Луне, коралловый риф, обсидиан и кварц.
        coverUrl: "/games/go/covers/1.webp",
        covers: ["/games/go/covers/2.webp", "/games/go/covers/3.webp"],
        status: "soon",
        icon: "◐"
    },
    {
        // [EN] Our own trading board game, never a copy of a branded one: its name, board and cards are ours (Alexey
        //      named it «Кровная рента», 11.11.2026). The engine is in games/rent; the table comes next.
        // [RU] Наша собственная торговая настольная игра, а не копия фирменной: название, поле и карты — наши (Алексей
        //      назвал её «Кровная рента», 11.11.2026). Движок — в games/rent; стол — следующим.
        title: "Blood Rent",
        description: "Our own trading board game of cosmic horror: buy up the sectors of a dead station, pay rent in credits — or in flesh on infected sectors — and outlive thirty monsters before the station collapses.",
        gameUrl: "/games/rent",
        // [EN] The box, the heart of the board, the collapse of the station. [RU] Коробка, центр поля, крах станции.
        coverUrl: "/games/rent/covers/1.webp",
        covers: ["/games/rent/covers/2.webp", "/games/rent/covers/3.webp"],
        status: "soon",
        icon: "☣"
    },
    {
        title: "Preferans",
        description: "The classic card game of bidding and whist: Sochi, Leningrad, Rostov and Classic rules, two to four at the table, against fair bots with characters in a vampire lair.",
        badge: "New",
        gameUrl: "/games/preferans",
        // [EN] A score sheet on green felt, drawn by apps/client/scripts/preferans-cover.mjs.
        // [RU] Лист пули на зелёном сукне; рисует apps/client/scripts/preferans-cover.mjs.
        coverUrl: "/games/preferans/cover.svg",
        // [EN] A salon in the lair, an airship above the clouds, a tree house. [RU] Салон в логове, дирижабль над облаками, домик на дереве.
        covers: ["/games/preferans/covers/1.webp", "/games/preferans/covers/2.webp", "/games/preferans/covers/3.webp"],
        status: "playable",
        icon: "♣"
    },
    {
        title: "Poker",
        description: "No-limit Texas hold'em, a sit-and-go of two to six: rising blinds, side pots, and the regulars of the vampire lair as opponents, each with a poker manner of their own. Play chips only.",
        badge: "New",
        gameUrl: "/games/poker",
        // [EN] Hole cards and chips on the lair's felt, drawn by hand (public/games/poker/cover.svg).
        // [RU] Карманные карты и фишки на сукне логова, нарисовано вручную (public/games/poker/cover.svg).
        coverUrl: "/games/poker/cover.svg",
        // [EN] The vampires' lair, an underwater casino, a saloon of the asteroid belt. [RU] Логово вампиров, подводное казино, салун пояса астероидов.
        covers: ["/games/poker/covers/1.webp", "/games/poker/covers/2.webp", "/games/poker/covers/3.webp"],
        status: "playable",
        icon: "♠"
    },
    {
        title: "Sea Battle",
        description: "Battleship on a night sea: the classic notebook rules or the boxed ones, a hero of the vampire lair as the opponent, three levels of gunnery. Set out your fleet and find the other one first.",
        badge: "New",
        gameUrl: "/games/battleship",
        // [EN] A pirate ship in space from Alexey's folder «Морской бой» (11.11.2026) beside a chart of the battle
        //      (public/games/battleship/cover.webp).
        // [RU] Пиратский корабль в космосе из папки Алексея «Морской бой» (11.11.2026) рядом с картой боя
        //      (public/games/battleship/cover.webp).
        coverUrl: "/games/battleship/cover.webp",
        // [EN] A living fleet of the deep, a space armada, a storm and ironclads. [RU] Живой флот глубин, космическая армада, шторм и броненосцы.
        covers: ["/games/battleship/covers/1.webp", "/games/battleship/covers/2.webp", "/games/battleship/covers/3.webp"],
        status: "playable",
        icon: "⚓"
    },
    {
        title: "Tic-Tac-Toe",
        description: "Quick and fun logic game. Perfect for a short break or testing your basic algorithms.",
        gameUrl: "/games/tic-tac-toe",
        // [EN] A magic island, crystal golems, a toy planet. [RU] Волшебный остров, кристальные големы, игрушечная планета.
        coverUrl: "/games/tic-tac-toe/covers/1.webp",
        covers: ["/games/tic-tac-toe/covers/2.webp", "/games/tic-tac-toe/covers/3.webp"],
        status: "soon",
        icon: "✕"
    },
    {
        title: "Cosmo Snake",
        description: "Navigate your snake through space, collect stars, and grow as long as possible without crashing.",
        gameUrl: "/games/snake",
        // [EN] A neon grid, a serpent of the deep, a crystal serpent. [RU] Неоновая сетка, змей глубин, кристальный змей.
        coverUrl: "/games/snake/covers/1.webp",
        covers: ["/games/snake/covers/2.webp", "/games/snake/covers/3.webp"],
        status: "soon",
        icon: "∿"
    }
];

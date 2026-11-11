// Define the structure of a Game object for type safety
// Определяем структуру объекта игры для типобезопасности
export interface Game {
    title: string;
    description: string;
    badge?: string; // Optional property (необязательное свойство)
    gameUrl: string;
    coverUrl?: string; // [EN] NEW: Optional cover image URL [RU] НОВОЕ: Необязательная ссылка на обложку
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
        status: "playable",
        icon: "⛀"
    },
    {
        title: "Go",
        description: "Ancient abstract strategy board game aiming to surround more territory than the opponent.",
        gameUrl: "/games/go",
        status: "soon",
        icon: "◐"
    },
    {
        title: "Monopoly",
        description: "Economic and strategic board game. Buy properties, build hotels, and bankrupt your friends.",
        gameUrl: "/games/monopoly",
        status: "soon",
        icon: "⌂"
    },
    {
        title: "Preferans",
        description: "The classic card game of bidding and whist: Sochi, Leningrad, Rostov and Classic rules, two to four at the table, against fair bots with characters in a vampire lair.",
        badge: "New",
        gameUrl: "/games/preferans",
        // [EN] A score sheet on green felt, drawn by apps/client/scripts/preferans-cover.mjs.
        // [RU] Лист пули на зелёном сукне; рисует apps/client/scripts/preferans-cover.mjs.
        coverUrl: "/games/preferans/cover.svg",
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
        status: "playable",
        icon: "⚓"
    },
    {
        title: "Tic-Tac-Toe",
        description: "Quick and fun logic game. Perfect for a short break or testing your basic algorithms.",
        gameUrl: "/games/tic-tac-toe",
        status: "soon",
        icon: "✕"
    },
    {
        title: "Cosmo Snake",
        description: "Navigate your snake through space, collect stars, and grow as long as possible without crashing.",
        gameUrl: "/games/snake",
        status: "soon",
        icon: "∿"
    }
];

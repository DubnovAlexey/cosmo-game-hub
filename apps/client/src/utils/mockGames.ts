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
        coverUrl: "/assets/images/covers/chess-cover.webp", // [EN] Path to our new cover [RU] Путь к нашей новой обложке
        status: "playable"
    },
    {
        title: "Checkers",
        description: "Traditional board game of diagonal moves and captures. Simple to learn, hard to master.",
        gameUrl: "/games/checkers",
        status: "soon",
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
        description: "Classic Eastern European trick-taking card game featuring complex bidding and strategy.",
        gameUrl: "/games/preferans",
        status: "soon",
        icon: "♣"
    },
    {
        title: "Poker",
        description: "The ultimate card game combining strategy, psychology, and a little bit of luck.",
        gameUrl: "/games/poker",
        status: "soon",
        icon: "♠"
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

// Define the structure of a Game object for type safety
// Определяем структуру объекта игры для типобезопасности
export interface Game {
    title: string;
    description: string;
    badge?: string; // Optional property (необязательное свойство)
    gameUrl: string;
}

// Export the array of games as our mock database
// Экспортируем массив игр как нашу базу данных-заглушку
export const games: Game[] = [
    {
        title: "Chess",
        description: "Classic strategic board game for two players. Master your tactics and checkmate the king.",
        badge: "Hot",
        gameUrl: "/games/chess"
    },
    {
        title: "Checkers",
        description: "Traditional board game of diagonal moves and captures. Simple to learn, hard to master.",
        gameUrl: "/games/checkers"
    },
    {
        title: "Go",
        description: "Ancient abstract strategy board game aiming to surround more territory than the opponent.",
        badge: "Pro",
        gameUrl: "/games/go"
    },
    {
        title: "Monopoly",
        description: "Economic and strategic board game. Buy properties, build hotels, and bankrupt your friends.",
        gameUrl: "/games/monopoly"
    },
    {
        title: "Preferans",
        description: "Classic Eastern European trick-taking card game featuring complex bidding and strategy.",
        gameUrl: "/games/preferans"
    },
    {
        title: "Poker",
        description: "The ultimate card game combining strategy, psychology, and a little bit of luck.",
        badge: "Hot",
        gameUrl: "/games/poker"
    },
    {
        title: "Tic-Tac-Toe",
        description: "Quick and fun logic game. Perfect for a short break or testing your basic algorithms.",
        gameUrl: "/games/tic-tac-toe"
    },
    {
        title: "Cosmo Snake",
        description: "Navigate your snake through space, collect stars, and grow as long as possible without crashing.",
        badge: "New",
        gameUrl: "/games/snake"
    }
];
// Define the structure of a Leaderboard Entry for strict typing
// Определяем структуру записи в таблице лидеров для строгой типизации
export interface LeaderboardEntry {
    rank: number;
    username: string;
    score: string;
    game: string;
    rankColor: string; // Tailwind class for styling the rank (Tailwind-класс для стилизации ранга)
}

// Export the array of players as our mock database
// Экспортируем массив игроков как нашу базу данных-заглушку
export const leaderboardData: LeaderboardEntry[] = [
    {
        rank: 1,
        username: "Alex_Pro",
        score: "9,500",
        game: "Chess",
        rankColor: "text-yellow-500" // Gold (Золото)
    },
    {
        rank: 2,
        username: "CosmoGamer",
        score: "8,200",
        game: "Go",
        rankColor: "text-gray-400" // Silver (Серебро)
    },
    {
        rank: 3,
        username: "LogicMaster",
        score: "7,850",
        game: "Checkers",
        rankColor: "text-orange-400" // Bronze (Бронза)
    },
    {
        rank: 4,
        username: "SnakeCharmer",
        score: "6,120",
        game: "Cosmo Snake",
        rankColor: "text-gray-500" // Standard (Стандартный)
    },
    {
        rank: 5,
        username: "PokerFace",
        score: "5,400",
        game: "Poker",
        rankColor: "text-gray-500" // Standard (Стандартный)
    }
];
// Define a generic interface for our game save state
// Определяем общий интерфейс для состояния сохранения нашей игры
export interface GameSaveState {
    gameId: string;
    timestamp: number;
    // 'data' will hold the specific game board state (e.g., chess piece positions)
    // 'data' будет хранить конкретное состояние игрового поля (например, позиции шахматных фигур)
    data: any;
}

// Function to save game state to Local Storage
// Функция для сохранения состояния игры в Local Storage
export const saveGame = (key: string, state: GameSaveState): boolean => {
    try {
        // Serialize the JavaScript object into a JSON string
        // Сериализуем JavaScript-объект в JSON-строку
        const serializedState = JSON.stringify(state);
        localStorage.setItem(key, serializedState);
        return true;
    } catch (error) {
        // Log error if serialization or storage fails (e.g., quota exceeded)
        // Логируем ошибку, если сериализация или сохранение не удались (например, превышена квота)
        console.error("Failed to save game state:", error);
        return false;
    }
};

// Function to load game state from Local Storage
// Функция для загрузки состояния игры из Local Storage
export const loadGame = (key: string): GameSaveState | null => {
    try {
        const serializedState = localStorage.getItem(key);

        // If no data exists for this key, return null
        // Если данных по этому ключу нет, возвращаем null
        if (!serializedState) {
            return null;
        }

        // Deserialize the string back into a JavaScript object
        // Десериализуем строку обратно в JavaScript-объект
        return JSON.parse(serializedState) as GameSaveState;
    } catch (error) {
        console.error("Failed to load game state:", error);
        return null;
    }
};

// Function to clear a specific save or all saves
// Функция для очистки конкретного сохранения или всех сохранений
export const clearGameSave = (key: string): void => {
    localStorage.removeItem(key);
};
// Define the board size constant
// Определяем константу размера доски
const BOARD_SIZE = 64;

// Generate a 1D array from 0 to 63 for the squares
// Генерируем одномерный массив от 0 до 63 для клеток
const squares = Array.from({ length: BOARD_SIZE }, (_, index) => index);

// Main functional component for the board
// Главный функциональный компонент для доски
export default function ChessBoard() {

    // Return the UI structure using Tailwind CSS Grid
    // Возвращаем структуру интерфейса, используя Tailwind CSS Grid
    return (
        <div className="flex flex-col items-center mt-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Engine-Ready Board</h2>

            {/* Grid container for exactly 64 squares */}
            {/* Контейнер-сетка ровно для 64 клеток */}
            <div className="grid grid-cols-8 grid-rows-8 border-4 border-gray-800 w-[400px] h-[400px]">
        {squares.map((index) => {
            // Calculate row and column mathematically
            // Вычисляем строку и столбец математически
            const row = Math.floor(index / 8);
            const col = index % 8;

            // Determine square color based on parity (even/odd)
            // Определяем цвет клетки на основе четности (четное/нечетное)
            const isDark = (row + col) % 2 === 1;
            const squareColor = isDark ? "bg-green-800" : "bg-green-200";

            return (
                <div
                    key={index}
                    className={`w-full h-full flex justify-center items-center ${squareColor}`}
                >
              {/* Optional: Show index for development purposes */}
                    {/* Необязательно: Показываем индекс для целей разработки */}
                    <span className="text-xs font-mono text-gray-500 opacity-60">
                {index}
              </span>
            </div>
            );
        })}
      </div>
    </div>
    );
}
// [EN] EngineManager class encapsulates the Web Worker and UCI protocol communication
// [RU] Класс EngineManager инкапсулирует общение с Web Worker и протоколом UCI
export class EngineManager {
    // [EN] Reference to the background thread (Worker)
    // [RU] Ссылка на фоновый поток (Worker)
    private worker: Worker | null = null;

    // [EN] Flag to track if the engine is ready
    // [RU] Флаг для отслеживания готовности движка
    private isReady: boolean = false;

    // [EN] Callback to resolve the Promise when the best move is found
    // [RU] Коллбэк для успешного выполнения Promise, когда найден лучший ход
    private bestMoveResolve: ((move: string) => void) | null = null;

    constructor() {
        this.init();
    }

    // [EN] Initialize the Web Worker and send initial UCI commands
    // [RU] Инициализация Web Worker и отправка начальных команд UCI
    private init() {
        if (typeof window === 'undefined') return; // [EN] SSR Guard [RU] Защита от серверного рендеринга (SSR)

        // [EN] Instantiate the worker directly from the public asset
        // [RU] Создаем экземпляр воркера напрямую из публичного ассета
        this.worker = new Worker('/engines/chess/stockfish.js');

        // [EN] Listen for messages from the engine
        // [RU] Слушаем сообщения от движка
        this.worker.onmessage = (event: MessageEvent) => {
            const line = event.data as string;

            // [EN] Engine confirms it is ready
            // [RU] Движок подтверждает свою готовность
            if (line === 'readyok') {
                this.isReady = true;
            }

            // [EN] Parse the best move from the engine output
            // [RU] Парсим лучший ход из вывода движка
            if (line.startsWith('bestmove')) {
                // [EN] Example output: "bestmove e2e4 ponder e7e5"
                // [RU] Пример вывода: "bestmove e2e4 ponder e7e5"
                const parts = line.split(' ');
                const move = parts[1]; // [EN] 'e2e4' [RU] Извлекаем 'e2e4'

                if (this.bestMoveResolve) {
                    this.bestMoveResolve(move);
                    this.bestMoveResolve = null; // [EN] Clear callback [RU] Очищаем коллбэк во избежание утечек памяти
                }
            }
        };

        // [EN] Initialize the UCI protocol
        // [RU] Инициализируем протокол UCI
        this.sendCommand('uci');
        this.sendCommand('isready');
    }

    // [EN] Helper method to safely send commands to the engine
    // [RU] Вспомогательный метод для безопасной отправки команд движку
    private sendCommand(command: string) {
        if (this.worker) {
            this.worker.postMessage(command);
        }
    }

    // [EN] Request the best move based on current FEN and difficulty level
    // [RU] Запрос лучшего хода на основе текущего FEN и уровня сложности
    public getBestMove(fen: string, level: number): Promise<string> {
        return new Promise((resolve) => {
            if (!this.worker) {
                resolve('');
                return;
            }

            // [EN] Store the resolve function to call it later in onmessage
            // [RU] Сохраняем функцию resolve, чтобы вызвать её позже в onmessage
            this.bestMoveResolve = resolve;

            // [EN] Map our 1-10 level to Stockfish's Skill Level (0-20)
            // [RU] Преобразуем наш уровень 1-10 в уровень навыка Stockfish (0-20)
            const stockfishSkillLevel = Math.round((level / 10) * 20);

            // [EN] Configure engine strength
            // [RU] Настраиваем силу движка
            this.sendCommand(`setoption name Skill Level value ${stockfishSkillLevel}`);

            // [EN] Set the current board position
            // [RU] Устанавливаем текущую позицию на доске
            this.sendCommand(`position fen ${fen}`);

            // [EN] Tell engine to start searching. Depth limits the search speed.
            // [RU] Даем команду на поиск. Глубина (Depth) ограничивает скорость поиска.
            const depth = Math.max(1, Math.round(level * 1.5));
            this.sendCommand(`go depth ${depth}`);
        });
    }

    // [EN] Cleanup method to terminate the worker
    // [RU] Метод очистки для принудительного завершения работы воркера
    public destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
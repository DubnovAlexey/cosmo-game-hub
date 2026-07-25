import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

// [EN] Resolve current directory path for ES modules in Node environment
// [RU] Получаем путь к текущей директории для ES-модулей в окружении Node
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // [EN] Map path aliases to physical project directories
            // [RU] Сопоставляем алиасы путей с физическими директориями проекта
            '@hooks': path.resolve(__dirname, 'src/hooks'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@engines': path.resolve(__dirname, 'src/engines'),
        },
    },
});
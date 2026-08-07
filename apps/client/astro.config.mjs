// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// [EN] FIX: `site` was left as a literal placeholder ('https://<YOUR_GITHUB_USERNAME>.github.io').
// Astro validates `site` as a real URL at startup, and the angle brackets made it invalid — that is
// exactly the "Invalid URL" crash on `npm run dev`. Commented out for now so local dev works again;
// `base` alone is enough for local dev and for the BASE_URL-aware code (Header.astro, EngineManager.ts)
// to resolve correctly. Uncomment `site` and fill in your real GitHub username only when you're ready
// to actually run `astro build` for GitHub Pages deployment.
// [EN] NOTE: with `base` active, the local dev server now serves the site at
// http://localhost:4321/cosmo-game-hub/ instead of the bare root — that's expected, not a new bug.
// [RU] ИСПРАВЛЕНИЕ: `site` остался буквальным плейсхолдером ('https://<YOUR_GITHUB_USERNAME>.github.io').
// Astro при старте проверяет `site` как настоящий URL, и угловые скобки делают его невалидным — это и
// есть та самая ошибка "Invalid URL" при `npm run dev`. Закомментировал, чтобы локальная разработка
// снова заработала; одного `base` достаточно для локальной разработки и для кода, учитывающего
// BASE_URL (Header.astro, EngineManager.ts). Раскомментируй `site` и впиши свой реальный GitHub-логин
// только когда будешь готов по-настоящему запускать `astro build` для деплоя на GitHub Pages.
// [RU] ПРИМЕЧАНИЕ: с активным `base` локальный dev-сервер теперь отдаёт сайт по адресу
// http://localhost:4321/cosmo-game-hub/, а не с голого корня — это ожидаемо, не новый баг.
//
// https://astro.build/config
export default defineConfig({
  // site: 'https://<YOUR_GITHUB_USERNAME>.github.io',
  base: '/cosmo-game-hub',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});

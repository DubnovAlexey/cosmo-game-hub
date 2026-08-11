// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// [EN] FIX: filled in the real GitHub username (confirmed from your Pages settings screenshot —
// the default custom-domain text showed "dubnovalexey.github.io"). This is now a syntactically valid
// URL, so it's safe to keep active for both local dev and production builds — the earlier "Invalid
// URL" crash was specifically caused by the literal '<YOUR_GITHUB_USERNAME>' placeholder, not by
// having `site` set at all.
// [EN] NOTE: with `base` active, local dev is served at http://localhost:4321/cosmo-game-hub/, not
// the bare root — expected, not a bug.
// [RU] ИСПРАВЛЕНИЕ: вписан реальный GitHub-логин (подтверждён по скриншоту настроек Pages — в поле
// custom domain по умолчанию было показано "dubnovalexey.github.io"). Теперь это синтаксически
// валидный URL, так что можно спокойно оставить его активным и для локальной разработки, и для
// продакшен-сборки — прошлый краш "Invalid URL" был вызван именно буквальным плейсхолдером
// '<YOUR_GITHUB_USERNAME>', а не самим наличием `site`.
// [RU] ПРИМЕЧАНИЕ: с активным `base` локальная разработка идёт по адресу
// http://localhost:4321/cosmo-game-hub/, а не с голого корня — это ожидаемо, не баг.
//
// https://astro.build/config
export default defineConfig({
  site: 'https://dubnovalexey.github.io',
  base: '/cosmo-game-hub',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});

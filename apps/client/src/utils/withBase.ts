// [EN] Base-aware link helper. On GitHub Pages the site is served from /cosmo-game-hub/, so a raw
// href="/games" points at the domain root and gives 404. Works whether BASE_URL ends with a slash or not.
// [RU] Ссылка с учётом base. На GitHub Pages сайт отдаётся из /cosmo-game-hub/, поэтому «сырой»
// href="/games" ведёт в корень домена и даёт 404. Работает и с BASE_URL со слешем на конце, и без него.
export function withBase(path: string): string {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
}

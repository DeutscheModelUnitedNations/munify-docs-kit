// Free of app and browser imports: the screenshot scripts outside SvelteKit use it too
export const SCREENSHOT_THEMES = ['light', 'dark'];
/** Where generated screenshots are served from, below the app's `static/` directory */
export const SCREENSHOT_BASE = '/docs-assets/screenshots';
/** URL of one generated screenshot, `id` as referenced by `shot:<id>` */
export function screenshotPath({ locale, theme, id, base = SCREENSHOT_BASE }) {
    return `${base}/${locale}/${theme}/${id}.jpg`;
}

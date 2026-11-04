export declare const SCREENSHOT_THEMES: readonly ["light", "dark"];
export type ScreenshotTheme = (typeof SCREENSHOT_THEMES)[number];
/** Where generated screenshots are served from, below the app's `static/` directory */
export declare const SCREENSHOT_BASE = "/docs-assets/screenshots";
/** URL of one generated screenshot, `id` as referenced by `shot:<id>` */
export declare function screenshotPath({ locale, theme, id, base }: {
    locale: string;
    theme: string;
    id: string;
    base?: string;
}): string;

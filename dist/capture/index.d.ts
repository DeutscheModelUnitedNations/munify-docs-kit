import { type BrowserContext, type LaunchOptions, type Locator, type Page } from 'playwright';
/** Looks up an app message in the locale being captured, `Key` being the app's message keys */
export type Translate<Key extends string = string> = (key: Key) => string;
export type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;
export type PrepareContext<Ids, Role extends string, Key extends string = string> = {
    page: Page;
    ids: Ids;
    t: Translate<Key>;
    /** Opens a second page signed in as another role, closed after the capture */
    openAs: (role: Role, path: string) => Promise<Page>;
};
export type Shot<Ids, Role extends string, Key extends string = string> = {
    /** Referenced from markdown as `shot:<id>` */
    id: string;
    role: Role;
    path: (ids: Ids) => string;
    /** Database state on top of the staged data, before the page loads */
    setup?: (ids: Ids) => Promise<void>;
    /** Clicks and key presses to reach the view after the page loaded */
    prepare?: (ctx: PrepareContext<Ids, Role, Key>) => Promise<void>;
    /** localStorage entries set before the page loads */
    storage?: Record<string, string>;
    /** Captures only this element instead of the viewport */
    clip?: string | ((page: Page, t: Translate<Key>) => Locator);
    viewport?: {
        width: number;
        height: number;
    };
    fullPage?: boolean;
};
export type CaptureOptions<Ids, Role extends string, Key extends string = string> = {
    baseUrl: string;
    shots: Shot<Ids, Role, Key>[];
    roles: Role[];
    /** Signs in as `role` on a fresh page and returns once the session is established */
    login: (input: {
        page: Page;
        baseUrl: string;
        role: Role;
    }) => Promise<void>;
    /** Resets the data the shots run against, once per capture. Returns the ids shots use */
    stage: (t: Translate<Key>) => Promise<Ids>;
    /** Where `<locale>/<theme>/<id>.jpg` is written, usually `static/docs-assets/screenshots` */
    outDir: string;
    /** Paraglide's `messages/` directory, one `<locale>.json` each */
    messagesDir: string;
    locales: string[];
    themes?: readonly string[];
    /** Only shots whose id starts with this */
    filter?: string;
    /**
     * Sets the locale in a new browser context, Paraglide's cookie by default. `false` for apps
     * that take the locale from the URL only; see `localizePath`
     */
    localeCookie?: string | false;
    /** A shot's path in a locale, for apps with the locale in the URL (`/en/dashboard`) */
    localizePath?: (input: {
        path: string;
        locale: string;
    }) => string;
    /** localStorage entries that select a theme, `{ theme }` by default */
    themeStorage?: (theme: string) => Record<string, string>;
    viewport?: {
        width: number;
        height: number;
    };
    /** How long a page gets after `load`: live queries keep connections open, so there is no idle */
    settleMs?: number;
    /** Passed to `chromium.launch`, e.g. an `executablePath` for a browser installed elsewhere */
    launch?: LaunchOptions;
};
/**
 * Captures every shot in every locale and theme and returns the failures. Each capture
 * re-stages the data, so shots never see what an earlier one changed.
 */
export declare function captureShots<Ids, Role extends string, Key extends string = string>(options: CaptureOptions<Ids, Role, Key>): Promise<string[]>;
/** Whether something listens on `port` on this machine */
export declare function portInUse(port: number): Promise<boolean>;
/** Polls `url` until it answers, failing when `isAlive` says the server is gone. */
export declare function waitForServer({ url, isAlive, timeoutMs }: {
    url: string;
    isAlive?: () => boolean;
    timeoutMs?: number;
}): Promise<void>;

import { mkdir, readFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import {
	chromium,
	type BrowserContext,
	type LaunchOptions,
	type Locator,
	type Page
} from 'playwright';
import { SCREENSHOT_THEMES } from '../screenshots';

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
	viewport?: { width: number; height: number };
	fullPage?: boolean;
};

export type CaptureOptions<Ids, Role extends string, Key extends string = string> = {
	baseUrl: string;
	shots: Shot<Ids, Role, Key>[];
	roles: Role[];
	/** Signs in as `role` on a fresh page and returns once the session is established */
	login: (input: { page: Page; baseUrl: string; role: Role }) => Promise<void>;
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
	localizePath?: (input: { path: string; locale: string }) => string;
	/** localStorage entries that select a theme, `{ theme }` by default */
	themeStorage?: (theme: string) => Record<string, string>;
	viewport?: { width: number; height: number };
	/** How long a page gets after `load`: live queries keep connections open, so there is no idle */
	settleMs?: number;
	/** Further CSS for every captured page, e.g. to hide dev-only overlays */
	css?: string;
	/** Passed to `chromium.launch`, e.g. an `executablePath` for a browser installed elsewhere */
	launch?: LaunchOptions;
};

// Animations and transitions would otherwise be captured halfway
const FREEZE_CSS = `*, *::before, *::after {
	animation-duration: 0s !important;
	animation-delay: 0s !important;
	transition-duration: 0s !important;
	transition-delay: 0s !important;
	caret-color: transparent !important;
}`;

async function translator<Key extends string>({
	messagesDir,
	locale
}: {
	messagesDir: string;
	locale: string;
}): Promise<Translate<Key>> {
	const messages: Record<string, unknown> = JSON.parse(
		await readFile(join(messagesDir, `${locale}.json`), 'utf8')
	);
	return (key: Key) => {
		const message = messages[key];
		if (typeof message !== 'string') throw new Error(`Unknown message ${key}`);
		return message;
	};
}

/**
 * Captures every shot in every locale and theme and returns the failures. Each capture
 * re-stages the data, so shots never see what an earlier one changed.
 */
export async function captureShots<Ids, Role extends string, Key extends string = string>(
	options: CaptureOptions<Ids, Role, Key>
) {
	const {
		baseUrl,
		roles,
		login,
		stage,
		outDir,
		messagesDir,
		locales,
		themes = SCREENSHOT_THEMES,
		filter,
		localeCookie = 'PARAGLIDE_LOCALE',
		localizePath = ({ path }) => path,
		themeStorage = (theme) => ({ theme }),
		viewport = { width: 1280, height: 800 },
		settleMs = 2000,
		css = ''
	} = options;
	const shots = options.shots.filter((s) => !filter || s.id.startsWith(filter));
	const browser = await chromium.launch(options.launch);
	const failures: string[] = [];

	async function signIn(role: Role): Promise<StorageState> {
		const context = await browser.newContext();
		const page = await context.newPage();
		await login({ page, baseUrl, role });
		const state = await context.storageState();
		await context.close();
		return state;
	}

	try {
		const states = new Map<Role, StorageState>();
		for (const role of roles) states.set(role, await signIn(role));

		async function newContext({
			role,
			locale,
			theme,
			shot
		}: {
			role: Role;
			locale: string;
			theme: string;
			shot?: Shot<Ids, Role, Key>;
		}) {
			const context = await browser.newContext({
				storageState: states.get(role),
				viewport: shot?.viewport ?? viewport,
				colorScheme: theme === 'dark' ? 'dark' : 'light',
				reducedMotion: 'reduce',
				locale
			});
			if (localeCookie) {
				await context.addCookies([{ name: localeCookie, value: locale, url: baseUrl }]);
			}
			await context.addInitScript(
				(entries) => {
					for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
				},
				{ ...themeStorage(theme), ...shot?.storage }
			);
			return context;
		}

		async function captureShot({
			shot,
			locale,
			theme,
			t
		}: {
			shot: Shot<Ids, Role, Key>;
			locale: string;
			theme: string;
			t: Translate<Key>;
		}) {
			const ids = await stage(t);
			await shot.setup?.(ids);

			const contexts: BrowserContext[] = [];
			try {
				const context = await newContext({ role: shot.role, locale, theme, shot });
				contexts.push(context);
				const page = await context.newPage();
				const path = localizePath({ path: shot.path(ids), locale });
				await page.goto(`${baseUrl}${path}`, { waitUntil: 'load' });
				await page.addStyleTag({ content: FREEZE_CSS + css });
				await page.waitForTimeout(settleMs);

				await shot.prepare?.({
					page,
					ids,
					t,
					openAs: async (role, path) => {
						const other = await newContext({ role, locale, theme });
						contexts.push(other);
						const otherPage = await other.newPage();
						await otherPage.goto(`${baseUrl}${localizePath({ path, locale })}`, {
							waitUntil: 'load'
						});
						await otherPage.waitForTimeout(settleMs);
						return otherPage;
					}
				});
				await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(400);

				const file = join(outDir, locale, theme, `${shot.id}.jpg`);
				await mkdir(dirname(file), { recursive: true });
				const screenshot = { path: file, type: 'jpeg', quality: 82 } as const;
				if (typeof shot.clip === 'function') await shot.clip(page, t).screenshot(screenshot);
				else if (shot.clip) await page.locator(shot.clip).first().screenshot(screenshot);
				else await page.screenshot({ ...screenshot, fullPage: shot.fullPage });
			} finally {
				for (const context of contexts) await context.close();
			}
		}

		for (const shot of shots) {
			for (const locale of locales) {
				const t = await translator<Key>({ messagesDir, locale });
				for (const theme of themes) {
					const input = { shot, locale, theme, t };
					try {
						// Vite occasionally reloads a page while optimizing dependencies
						await captureShot(input).catch(() => captureShot(input));
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						failures.push(`${shot.id} (${locale}, ${theme}): ${message}`);
					}
				}
			}
			console.info(`captured ${shot.id}`);
		}
	} finally {
		await browser.close();
	}
	return failures;
}

/** Whether something listens on `port` on this machine */
export function portInUse(port: number) {
	return new Promise<boolean>((resolve) => {
		const socket = createConnection({ port, host: '127.0.0.1' });
		socket.once('connect', () => {
			socket.destroy();
			resolve(true);
		});
		socket.once('error', () => resolve(false));
	});
}

/** Polls `url` until it answers, failing when `isAlive` says the server is gone. */
export async function waitForServer({
	url,
	isAlive = () => true,
	timeoutMs = 120_000
}: {
	url: string;
	isAlive?: () => boolean;
	timeoutMs?: number;
}) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (!isAlive()) throw new Error('The server exited');
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			// not up yet
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	throw new Error(`${url} did not answer within ${timeoutMs / 1000}s`);
}

import { mkdir, readFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { SCREENSHOT_THEMES } from '../screenshots';
// Animations and transitions would otherwise be captured halfway
const FREEZE_CSS = `*, *::before, *::after {
	animation-duration: 0s !important;
	animation-delay: 0s !important;
	transition-duration: 0s !important;
	transition-delay: 0s !important;
	caret-color: transparent !important;
}`;
async function translator({ messagesDir, locale }) {
    const messages = JSON.parse(await readFile(join(messagesDir, `${locale}.json`), 'utf8'));
    return (key) => {
        const message = messages[key];
        if (typeof message !== 'string')
            throw new Error(`Unknown message ${key}`);
        return message;
    };
}
/**
 * Captures every shot in every locale and theme and returns the failures. Each capture
 * re-stages the data, so shots never see what an earlier one changed.
 */
export async function captureShots(options) {
    const { baseUrl, roles, login, stage, outDir, messagesDir, locales, themes = SCREENSHOT_THEMES, filter, localeCookie = 'PARAGLIDE_LOCALE', localizePath = ({ path }) => path, themeStorage = (theme) => ({ theme }), viewport = { width: 1280, height: 800 }, settleMs = 2000 } = options;
    const shots = options.shots.filter((s) => !filter || s.id.startsWith(filter));
    const browser = await chromium.launch(options.launch);
    const failures = [];
    async function signIn(role) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await login({ page, baseUrl, role });
        const state = await context.storageState();
        await context.close();
        return state;
    }
    try {
        const states = new Map();
        for (const role of roles)
            states.set(role, await signIn(role));
        async function newContext({ role, locale, theme, shot }) {
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
            await context.addInitScript((entries) => {
                for (const [key, value] of Object.entries(entries))
                    localStorage.setItem(key, value);
            }, { ...themeStorage(theme), ...shot?.storage });
            return context;
        }
        async function captureShot({ shot, locale, theme, t }) {
            const ids = await stage(t);
            await shot.setup?.(ids);
            const contexts = [];
            try {
                const context = await newContext({ role: shot.role, locale, theme, shot });
                contexts.push(context);
                const page = await context.newPage();
                const path = localizePath({ path: shot.path(ids), locale });
                await page.goto(`${baseUrl}${path}`, { waitUntil: 'load' });
                await page.addStyleTag({ content: FREEZE_CSS });
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
                const screenshot = { path: file, type: 'jpeg', quality: 82 };
                if (typeof shot.clip === 'function')
                    await shot.clip(page, t).screenshot(screenshot);
                else if (shot.clip)
                    await page.locator(shot.clip).first().screenshot(screenshot);
                else
                    await page.screenshot({ ...screenshot, fullPage: shot.fullPage });
            }
            finally {
                for (const context of contexts)
                    await context.close();
            }
        }
        for (const shot of shots) {
            for (const locale of locales) {
                const t = await translator({ messagesDir, locale });
                for (const theme of themes) {
                    const input = { shot, locale, theme, t };
                    try {
                        // Vite occasionally reloads a page while optimizing dependencies
                        await captureShot(input).catch(() => captureShot(input));
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        failures.push(`${shot.id} (${locale}, ${theme}): ${message}`);
                    }
                }
            }
            console.info(`captured ${shot.id}`);
        }
    }
    finally {
        await browser.close();
    }
    return failures;
}
/** Whether something listens on `port` on this machine */
export function portInUse(port) {
    return new Promise((resolve) => {
        const socket = createConnection({ port, host: '127.0.0.1' });
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => resolve(false));
    });
}
/** Polls `url` until it answers, failing when `isAlive` says the server is gone. */
export async function waitForServer({ url, isAlive = () => true, timeoutMs = 120_000 }) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (!isAlive())
            throw new Error('The server exited');
        try {
            if ((await fetch(url)).ok)
                return;
        }
        catch {
            // not up yet
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`${url} did not answer within ${timeoutMs / 1000}s`);
}

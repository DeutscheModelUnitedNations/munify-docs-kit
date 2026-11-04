import { Marked, type TokenizerAndRendererExtension, type Tokens } from 'marked';
export type { TokenizerAndRendererExtension } from 'marked';
import GithubSlugger from 'github-slugger';
import { load as loadYaml } from 'js-yaml';
import { SCREENSHOT_BASE, SCREENSHOT_THEMES, screenshotPath } from './screenshots';

export type DocsFrontmatter = {
	title?: string;
	description?: string;
	sidebar_position?: number;
};

export type DocsTocEntry = { id: string; text: string; depth: number };

export type RenderedDoc = {
	frontmatter: DocsFrontmatter;
	html: string;
	toc: DocsTocEntry[];
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function isFrontmatter(value: unknown): value is DocsFrontmatter {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseFrontmatter(source: string): { frontmatter: DocsFrontmatter; body: string } {
	const match = FRONTMATTER.exec(source);
	if (!match) return { frontmatter: {}, body: source };
	const parsed: unknown = loadYaml(match[1]);
	return {
		frontmatter: isFrontmatter(parsed) ? parsed : {},
		body: source.slice(match[0].length)
	};
}

// Docusaurus-style admonitions (:::tip Optional title ... :::) mapped to DaisyUI alerts
const ADMONITION_CLASSES: Record<string, { alert: string; icon: string }> = {
	note: { alert: 'alert-info', icon: 'fa-circle-info' },
	info: { alert: 'alert-info', icon: 'fa-circle-info' },
	tip: { alert: 'alert-success', icon: 'fa-lightbulb' },
	caution: { alert: 'alert-warning', icon: 'fa-triangle-exclamation' },
	warning: { alert: 'alert-warning', icon: 'fa-triangle-exclamation' },
	danger: { alert: 'alert-error', icon: 'fa-circle-exclamation' }
};

const EXPLICIT_ID = /\s*\{#([\w-]+)\}\s*$/;

export type RenderOptions = {
	/** Locale of the screenshots: the reader's locale, even when the text falls back */
	locale: string;
	/** Where the manual is mounted, `/docs` by default */
	basePath?: string;
	/** Where generated screenshots are served from, see `screenshotPath` */
	screenshotBase?: string;
	/**
	 * FontAwesome classes put in front of an icon name, e.g. `fa-duotone` or
	 * `fa-sharp-duotone fa-solid`
	 */
	iconPrefix?: string;
	/**
	 * Further marked block or inline extensions, such as an app's live demo embeds. They run
	 * before the built-in admonitions, so an extension may claim a `:::name` block for itself.
	 */
	extensions?: TokenizerAndRendererExtension[];
};

export function escapeHtml(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Renders one manual page. `slug` is the page's path below the manual, needed to turn
 * relative links like `./agenda-status` into absolute app URLs.
 *
 * Besides plain markdown it supports Docusaurus-style admonitions, `{#id}` heading ids and
 * generated screenshots as `![alt](shot:chair/speakers-list)`, one image per theme.
 */
export function renderDoc({
	source,
	slug,
	locale,
	basePath = '/docs',
	screenshotBase = SCREENSHOT_BASE,
	iconPrefix = 'fa-duotone',
	extensions = []
}: RenderOptions & { source: string; slug: string }): RenderedDoc {
	const { frontmatter, body } = parseFrontmatter(source);
	const slugger = new GithubSlugger();
	const toc: DocsTocEntry[] = [];
	const base = new URL(`${basePath}/${slug}`, 'http://docs.local');
	const claimed = new Set(extensions.map((e) => e.name));

	const marked = new Marked({ gfm: true });
	marked.use({
		extensions: [
			...extensions,
			{
				name: 'admonition',
				level: 'block',
				start: (src) => src.match(/^:::/m)?.index,
				tokenizer(src) {
					const match = /^:::(\w+)[ \t]*([^\n]*)\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/.exec(src);
					if (!match || claimed.has(match[1])) return;
					const token = {
						type: 'admonition',
						raw: match[0],
						kind: match[1],
						title: match[2].trim(),
						tokens: [] as Tokens.Generic[]
					};
					this.lexer.blockTokens(match[3], token.tokens);
					return token;
				},
				renderer(token) {
					const style = ADMONITION_CLASSES[token.kind] ?? ADMONITION_CLASSES.note;
					const title = token.title
						? `<p class="font-semibold">${escapeHtml(token.title)}</p>`
						: '';
					const inner = this.parser.parse(token.tokens ?? []);
					return `<div role="note" class="docs-admonition alert alert-soft ${style.alert} not-prose my-6 items-start"><i class="${iconPrefix} ${style.icon} mt-1"></i><div class="prose prose-sm max-w-none">${title}${inner}</div></div>`;
				}
			}
		],
		renderer: {
			heading({ tokens, depth, text }) {
				let id: string;
				let content = this.parser.parseInline(tokens);
				const explicit = EXPLICIT_ID.exec(text);
				if (explicit) {
					id = explicit[1];
					content = content.replace(EXPLICIT_ID, '');
					text = text.replace(EXPLICIT_ID, '');
				} else {
					id = slugger.slug(text);
				}
				if (depth === 2 || depth === 3) toc.push({ id, text: text.replace(/[*_`]/g, ''), depth });
				if (depth === 1) return `<h1>${content}</h1>`;
				return `<h${depth} id="${id}" class="group scroll-mt-24">${content}<a href="#${id}" class="ml-2 opacity-0 group-hover:opacity-50 no-underline" aria-hidden="true">#</a></h${depth}>`;
			},
			link({ href, title, tokens }) {
				const text = this.parser.parseInline(tokens);
				const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
				if (/^[a-z]+:/i.test(href)) {
					return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
				}
				if (href.startsWith('#')) return `<a href="${escapeHtml(href)}"${titleAttr}>${text}</a>`;
				const url = new URL(href, base);
				return `<a href="${escapeHtml(url.pathname + url.hash)}"${titleAttr}>${text}</a>`;
			},
			image({ href, title, text }) {
				const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
				if (href.startsWith('shot:')) {
					// One image per theme, the kit's CSS shows the one matching the app theme
					const id = href.slice('shot:'.length);
					return SCREENSHOT_THEMES.map(
						(theme) =>
							`<img src="${escapeHtml(screenshotPath({ locale, theme, id, base: screenshotBase }))}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" class="docs-shot docs-shot-${theme} rounded-box border border-base-300 shadow-sm" />`
					).join('');
				}
				return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" class="rounded-box border border-base-300 shadow-sm" />`;
			}
		}
	});

	const html = marked.parse(body, { async: false });
	return { frontmatter, html, toc };
}

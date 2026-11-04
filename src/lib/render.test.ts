import { describe, expect, it } from 'vitest';
import type { TokenizerAndRendererExtension } from 'marked';
import { parseFrontmatter, renderDoc } from './render';

const render = (source: string, extra: Partial<Parameters<typeof renderDoc>[0]> = {}) =>
	renderDoc({ source, slug: 'guide/intro', locale: 'de', ...extra });

describe('parseFrontmatter', () => {
	it('splits frontmatter from the body', () => {
		const { frontmatter, body } = parseFrontmatter('---\ntitle: Hallo\n---\n# Text');
		expect(frontmatter.title).toBe('Hallo');
		expect(body).toBe('# Text');
	});

	it('treats a page without frontmatter as body', () => {
		expect(parseFrontmatter('# Text')).toEqual({ frontmatter: {}, body: '# Text' });
	});

	it('ignores frontmatter that is not a mapping', () => {
		expect(parseFrontmatter('---\n- a\n---\nx').frontmatter).toEqual({});
	});
});

describe('renderDoc', () => {
	it('collects h2 and h3 headings, honouring explicit ids', () => {
		const doc = render('# Title\n\n## First\n\n### Second {#custom}\n\n#### Deep');
		expect(doc.toc).toEqual([
			{ id: 'first', text: 'First', depth: 2 },
			{ id: 'custom', text: 'Second', depth: 3 }
		]);
		expect(doc.html).toContain('id="custom"');
		expect(doc.html).not.toContain('{#custom}');
	});

	it('resolves relative links against the page and opens external ones in a new tab', () => {
		const doc = render('[a](./other#x) [b](../top) [c](https://example.org) [d](#here)');
		expect(doc.html).toContain('href="/docs/guide/other#x"');
		expect(doc.html).toContain('href="/docs/top"');
		expect(doc.html).toContain('href="https://example.org" target="_blank"');
		expect(doc.html).toContain('href="#here"');
	});

	it('honours another base path', () => {
		expect(render('[a](./b)', { basePath: '/hilfe' }).html).toContain('href="/hilfe/guide/b"');
	});

	it('renders a screenshot once per theme in the reader locale', () => {
		const { html } = render('![Alt](shot:team/board)', { locale: 'en' });
		expect(html).toContain('src="/docs-assets/screenshots/en/light/team/board.jpg"');
		expect(html).toContain('src="/docs-assets/screenshots/en/dark/team/board.jpg"');
		expect(html).toContain('docs-shot-dark');
	});

	it('renders admonitions as alerts with the icon prefix', () => {
		const { html } = render(':::tip Gut zu wissen\nInhalt **fett**\n:::', {
			iconPrefix: 'fa-sharp-duotone fa-solid'
		});
		expect(html).toContain('alert-success');
		expect(html).toContain('fa-sharp-duotone fa-solid fa-lightbulb');
		expect(html).toContain('Gut zu wissen');
		expect(html).toContain('<strong>fett</strong>');
	});

	it('lets an app extension claim a ::: block', () => {
		const live: TokenizerAndRendererExtension = {
			name: 'live',
			level: 'block',
			start: (src) => src.match(/^:::live /m)?.index,
			tokenizer(src) {
				const match = /^:::live[ \t]+([\w/-]+)[ \t]*(?:\n|$)/.exec(src);
				if (match) return { type: 'live', raw: match[0], id: match[1] };
			},
			renderer: (token) => `<div data-live="${token.id}"></div>`
		};
		const { html } = render(':::live chair/x\n\nText', { extensions: [live] });
		expect(html).toContain('data-live="chair/x"');
		expect(html).not.toContain('alert');
	});

	it('escapes attribute values', () => {
		expect(render('![a"b](x.png)').html).toContain('alt="a&quot;b"');
	});
});

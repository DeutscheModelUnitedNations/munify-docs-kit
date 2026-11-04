import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDocsNav } from '../nav';
import { renderDoc } from '../render';
import { docIssues, targetIssue } from './checks';
import { definedTourAnchors, markdownSlugs, usedTourAnchors } from './files';

const nav = createDocsNav({ defaultSlug: 'a', entries: ['a', 'b'] });
const doc = (source: string, slug = 'a') => renderDoc({ source, slug, locale: 'de' });

describe('docIssues', () => {
	const rendered = new Map([
		['a', doc('---\ntitle: A\n---\n[b](./b#there) [x](./x) [y](./b#nowhere)')],
		['b', doc('---\ntitle: B\n---\n## There', 'b')]
	]);

	it('reports unknown pages and headings', () => {
		const issues = docIssues({ doc: rendered.get('a')!, rendered, nav, staticDir: tmpdir() });
		expect(issues).toEqual([
			'link /docs/x: no page x',
			'link /docs/b#nowhere: no heading #nowhere'
		]);
	});

	it('reports a missing title and missing images', () => {
		const issues = docIssues({ doc: doc('![s](shot:z)'), rendered, nav, staticDir: tmpdir() });
		expect(issues[0]).toBe('no frontmatter title');
		expect(issues).toHaveLength(3);
	});

	it('checks help targets without the base path', () => {
		expect(targetIssue({ target: 'b#there', rendered, nav })).toBeUndefined();
		expect(targetIssue({ target: 'c', rendered, nav })).toBe('no page c');
	});
});

describe('files', () => {
	const root = mkdtempSync(join(tmpdir(), 'docs-kit-'));
	mkdirSync(join(root, 'de/team'), { recursive: true });
	writeFileSync(join(root, 'de/intro.md'), '');
	writeFileSync(join(root, 'de/team/board.md'), '');
	mkdirSync(join(root, 'src/paraglide'), { recursive: true });
	writeFileSync(
		join(root, 'src/Page.svelte'),
		`<div data-tour="page.head"></div><div data-tour={open ? 'page.a' : 'page.b'}></div>`
	);
	writeFileSync(join(root, 'src/paraglide/X.svelte'), `<div data-tour="ignored"></div>`);
	writeFileSync(
		join(root, 'src/page.tour.ts'),
		`steps: [{ anchor: 'page.head' }, { anchor: 'page.b' }]`
	);

	it('lists markdown slugs', () => {
		expect(markdownSlugs(join(root, 'de'))).toEqual(['intro', 'team/board']);
	});

	it('finds defined and used anchors', () => {
		const srcDir = join(root, 'src');
		expect([...definedTourAnchors({ srcDir })].sort()).toEqual(['page.a', 'page.b', 'page.head']);
		expect(usedTourAnchors({ srcDir }).map((u) => u.anchor)).toEqual(['page.head', 'page.b']);
	});
});

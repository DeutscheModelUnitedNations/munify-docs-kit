import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DocsNav } from '../nav';
import type { RenderedDoc } from '../render';
import { docIssues, targetIssue } from './checks';
import {
	definedTourAnchors,
	markdownSlugs,
	shotIdsOf,
	shotReferences,
	usedTourAnchors
} from './files';

export * from './checks';
export * from './files';

export type DocsSuiteOptions = {
	/** The app's root, `process.cwd()` by default */
	root?: string;
	/** Markdown directory with one folder per locale, relative to `root` */
	docsDir?: string;
	/** Static assets, where generated screenshots live, relative to `root` */
	staticDir?: string;
	/** The locale every other one is compared with first */
	locales: string[];
	nav: DocsNav;
	render: (input: { source: string; slug: string; locale: string }) => RenderedDoc;
	/** The shot manifest, relative to `root`. Without it screenshot usage isn't checked */
	shotsManifest?: string;
	/** Help targets by route (`slug` or `slug#heading`), e.g. the app's route help map */
	helpTargets?: Record<string, string | undefined>;
	basePath?: string;
};

/**
 * Registers the tests that keep a manual consistent: every page is in the sidebar and in
 * every locale, links, anchors and images point at things that exist, every screenshot is
 * listed and used, and every help target exists. Call it from a test file of the app.
 */
export function docsSuite({
	root = process.cwd(),
	docsDir = 'docs',
	staticDir = 'static',
	locales,
	nav,
	render,
	shotsManifest,
	helpTargets = {},
	basePath = '/docs'
}: DocsSuiteOptions) {
	const docs = join(root, docsDir);
	const statics = join(root, staticDir);
	const [reference] = locales;

	const renderedByLocale = new Map(
		locales.map((locale) => [
			locale,
			new Map(
				markdownSlugs(join(docs, locale)).map((slug) => [
					slug,
					render({ source: readFileSync(join(docs, locale, `${slug}.md`), 'utf8'), slug, locale })
				])
			)
		])
	);

	describe('docs', () => {
		it('lists every markdown page in the sidebar and nothing else', () => {
			expect(markdownSlugs(join(docs, reference))).toEqual([...nav.pageSlugs].sort());
		});

		it.each(locales)('has every page translated to %s', (locale) => {
			expect(markdownSlugs(join(docs, locale))).toEqual(markdownSlugs(join(docs, reference)));
		});

		it('has no duplicate sidebar entries', () => {
			expect(new Set(nav.flatSlugs).size).toBe(nav.flatSlugs.length);
		});

		describe.each(locales)('%s', (locale) => {
			const rendered = renderedByLocale.get(locale)!;
			it.each([...rendered.keys()])('%s has a title and valid links and images', (slug) => {
				expect(
					docIssues({ doc: rendered.get(slug)!, rendered, nav, staticDir: statics, basePath })
				).toEqual([]);
			});
		});

		if (shotsManifest) {
			it('only uses screenshots listed in the shot manifest, and all of them', () => {
				const ids = shotIdsOf({ manifest: join(root, shotsManifest) });
				const sources = locales.flatMap((locale) =>
					markdownSlugs(join(docs, locale)).map((slug) =>
						readFileSync(join(docs, locale, `${slug}.md`), 'utf8')
					)
				);
				const used = shotReferences(sources);
				for (const id of used) expect(ids, `shot:${id} is not in the manifest`).toContain(id);
				for (const id of ids) expect(used, `${id} is captured but never used`).toContain(id);
			});
		}

		const targets = Object.entries(helpTargets).filter(
			(entry): entry is [string, string] => entry[1] !== undefined
		);
		if (targets.length > 0) {
			it.each(targets)('help of %s points at an existing page (%s)', (_, target) => {
				const rendered = renderedByLocale.get(reference)!;
				expect(targetIssue({ target, rendered, nav, basePath })).toBeUndefined();
			});
		}
	});
}

/** Registers a test failing when a component loses a `data-tour` anchor a tour points at. */
export function tourAnchorsSuite({
	srcDir = join(process.cwd(), 'src'),
	skip
}: {
	srcDir?: string;
	skip?: string[];
} = {}) {
	describe('tour anchors', () => {
		const defined = definedTourAnchors({ srcDir, skip });
		const used = usedTourAnchors({ srcDir, skip });

		it('finds tours to check', () => {
			expect(used.length).toBeGreaterThan(0);
		});

		it.each(used.map((u) => [u.anchor, u.file]))('"%s" exists in the markup (%s)', (anchor) => {
			expect(defined).toContain(anchor);
		});
	});
}

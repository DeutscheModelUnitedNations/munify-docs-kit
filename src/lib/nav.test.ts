import { describe, expect, it } from 'vitest';
import { createDocsNav } from './nav';
import { createDocsContent } from './content';
import { renderDoc } from './render';

const nav = createDocsNav({
	defaultSlug: 'intro',
	entries: [
		'intro',
		{ slug: 'team', label: () => 'Team', description: () => '', items: ['team/a', 'team/b'] },
		'faq'
	]
});

describe('createDocsNav', () => {
	it('lists pages and overviews in reading order', () => {
		expect(nav.pageSlugs).toEqual(['intro', 'team/a', 'team/b', 'faq']);
		expect(nav.flatSlugs).toEqual(['intro', 'team', 'team/a', 'team/b', 'faq']);
	});

	it('knows pages and categories', () => {
		expect(nav.isKnownSlug('team')).toBe(true);
		expect(nav.isKnownSlug('team/b')).toBe(true);
		expect(nav.isKnownSlug('nope')).toBe(false);
	});

	it('finds neighbours', () => {
		expect(nav.neighbours('team')).toEqual({ prev: 'intro', next: 'team/a' });
		expect(nav.neighbours('intro').prev).toBeUndefined();
		expect(nav.neighbours('unknown')).toEqual({ prev: undefined, next: undefined });
	});
});

describe('createDocsContent', () => {
	const content = createDocsContent<'de' | 'en'>({
		baseLocale: 'de',
		render: ({ source, slug, locale }) => renderDoc({ source, slug, locale }),
		sources: {
			'/docs/de/intro.md': '---\ntitle: Einführung\n---\nHallo',
			'/docs/en/intro.md': '---\ntitle: Introduction\n---\nHello',
			'/docs/de/faq.md': '---\ntitle: Fragen\n---\nFAQ'
		}
	});

	it('loads a page in the asked locale', () => {
		expect(content.loadDoc({ slug: 'intro', locale: 'en' })).toMatchObject({ locale: 'en' });
	});

	it('falls back to the base locale', () => {
		expect(content.loadDoc({ slug: 'faq', locale: 'en' })).toMatchObject({ locale: 'de' });
		expect(content.loadDoc({ slug: 'missing', locale: 'en' })).toBeUndefined();
	});

	it('lists titles, falling back per page', () => {
		expect(content.docTitles('en')).toEqual({ intro: 'Introduction', faq: 'Fragen' });
		expect(content.docExists('faq')).toBe(true);
	});
});

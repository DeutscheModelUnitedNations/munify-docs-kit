/**
 * Sidebar structure of a manual. Page titles come from each markdown file's frontmatter,
 * so only the order and the category labels live in the app's nav. Slugs are paths below
 * `docs/<locale>/` without the `.md` extension.
 */
export type DocsNavCategory = {
	slug: string;
	label: () => string;
	description: () => string;
	items: string[];
};

export type DocsNavEntry = string | DocsNavCategory;

export function isCategory(entry: DocsNavEntry): entry is DocsNavCategory {
	return typeof entry !== 'string';
}

/** Wraps an app's sidebar entries with the lookups the routes, help buttons and tests need. */
export function createDocsNav({
	entries,
	defaultSlug
}: {
	entries: DocsNavEntry[];
	/** Where `/docs` itself redirects to */
	defaultSlug: string;
}) {
	const categories = entries.filter(isCategory);
	/** Every page backed by a markdown file, in reading order */
	const pageSlugs = entries.flatMap((e) => (isCategory(e) ? e.items : [e]));
	/** Every page including category overviews, in reading order (prev/next links) */
	const flatSlugs = entries.flatMap((e) => (isCategory(e) ? [e.slug, ...e.items] : [e]));

	function findCategory(slug: string) {
		return categories.find((c) => c.slug === slug);
	}

	return {
		entries,
		defaultSlug,
		pageSlugs,
		flatSlugs,
		findCategory,
		/** A page or a category overview */
		isKnownSlug: (slug: string) => pageSlugs.includes(slug) || findCategory(slug) !== undefined,
		neighbours(slug: string) {
			const index = flatSlugs.indexOf(slug);
			if (index === -1) return { prev: undefined, next: undefined };
			return { prev: flatSlugs[index - 1], next: flatSlugs[index + 1] };
		}
	};
}

export type DocsNav = ReturnType<typeof createDocsNav>;

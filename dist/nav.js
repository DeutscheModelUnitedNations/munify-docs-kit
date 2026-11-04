export function isCategory(entry) {
    return typeof entry !== 'string';
}
/** Wraps an app's sidebar entries with the lookups the routes, help buttons and tests need. */
export function createDocsNav({ entries, defaultSlug }) {
    const categories = entries.filter(isCategory);
    /** Every page backed by a markdown file, in reading order */
    const pageSlugs = entries.flatMap((e) => (isCategory(e) ? e.items : [e]));
    /** Every page including category overviews, in reading order (prev/next links) */
    const flatSlugs = entries.flatMap((e) => (isCategory(e) ? [e.slug, ...e.items] : [e]));
    function findCategory(slug) {
        return categories.find((c) => c.slug === slug);
    }
    return {
        entries,
        defaultSlug,
        pageSlugs,
        flatSlugs,
        findCategory,
        /** A page or a category overview */
        isKnownSlug: (slug) => pageSlugs.includes(slug) || findCategory(slug) !== undefined,
        neighbours(slug) {
            const index = flatSlugs.indexOf(slug);
            if (index === -1)
                return { prev: undefined, next: undefined };
            return { prev: flatSlugs[index - 1], next: flatSlugs[index + 1] };
        }
    };
}

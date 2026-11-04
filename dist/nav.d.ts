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
export declare function isCategory(entry: DocsNavEntry): entry is DocsNavCategory;
/** Wraps an app's sidebar entries with the lookups the routes, help buttons and tests need. */
export declare function createDocsNav({ entries, defaultSlug }: {
    entries: DocsNavEntry[];
    /** Where `/docs` itself redirects to */
    defaultSlug: string;
}): {
    entries: DocsNavEntry[];
    defaultSlug: string;
    pageSlugs: string[];
    flatSlugs: string[];
    findCategory: (slug: string) => DocsNavCategory | undefined;
    /** A page or a category overview */
    isKnownSlug: (slug: string) => boolean;
    neighbours(slug: string): {
        prev: undefined;
        next: undefined;
    } | {
        prev: string;
        next: string;
    };
};
export type DocsNav = ReturnType<typeof createDocsNav>;

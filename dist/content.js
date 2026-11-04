import { parseFrontmatter } from './render';
/**
 * Serves an app's markdown sources. `sources` is what
 * `import.meta.glob('/docs/*\/**\/*.md', { query: '?raw', import: 'default', eager: true })`
 * returns: raw markdown keyed by `<root>/<locale>/<slug>.md`, bundled into the server build.
 * Pages missing in a locale fall back to `baseLocale`. Rendered pages are cached per locale.
 */
/** Pass the app's locale type explicitly: `createDocsContent<Locale>({ … })`. */
export function createDocsContent({ sources, baseLocale, render, root = '/docs' }) {
    const pattern = new RegExp(`^${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/]+)/(.+)\\.md$`);
    const cache = new Map();
    function sourceFor({ locale, slug }) {
        return sources[`${root}/${locale}/${slug}.md`];
    }
    return {
        docExists: (slug) => sourceFor({ locale: baseLocale, slug }) !== undefined,
        /** Renders a page in the requested locale, falling back to the base locale. */
        loadDoc({ slug, locale }) {
            const key = `${locale}:${slug}`;
            const cached = cache.get(key);
            if (cached)
                return cached;
            const usedLocale = sourceFor({ locale, slug }) !== undefined ? locale : baseLocale;
            const source = sourceFor({ locale: usedLocale, slug });
            if (source === undefined)
                return undefined;
            const doc = { ...render({ source, slug, locale }), locale: usedLocale };
            cache.set(key, doc);
            return doc;
        },
        /** Page titles for the sidebar, without rendering the full pages. */
        docTitles(locale) {
            const titles = {};
            for (const path of Object.keys(sources)) {
                const match = pattern.exec(path);
                if (!match)
                    continue;
                const [, fileLocale, slug] = match;
                if (fileLocale !== locale && (fileLocale !== baseLocale || titles[slug]))
                    continue;
                const title = parseFrontmatter(sources[path]).frontmatter.title;
                if (title)
                    titles[slug] = title;
            }
            return titles;
        }
    };
}

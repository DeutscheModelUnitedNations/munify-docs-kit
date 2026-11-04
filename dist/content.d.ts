import { type RenderedDoc } from './render';
export type LoadedDoc = RenderedDoc & {
    /** Locale the page was actually rendered in, differs from the request on fallback */
    locale: string;
};
/**
 * Serves an app's markdown sources. `sources` is what
 * `import.meta.glob('/docs/*\/**\/*.md', { query: '?raw', import: 'default', eager: true })`
 * returns: raw markdown keyed by `<root>/<locale>/<slug>.md`, bundled into the server build.
 * Pages missing in a locale fall back to `baseLocale`. Rendered pages are cached per locale.
 */
/** Pass the app's locale type explicitly: `createDocsContent<Locale>({ … })`. */
export declare function createDocsContent<L extends string = string>({ sources, baseLocale, render, root }: {
    sources: Record<string, string>;
    baseLocale: NoInfer<L>;
    /** Renders a page's source for a reader of `locale`, usually `renderDoc` with app options */
    render: (input: {
        source: string;
        slug: string;
        locale: L;
    }) => RenderedDoc;
    root?: string;
}): {
    docExists: (slug: string) => boolean;
    /** Renders a page in the requested locale, falling back to the base locale. */
    loadDoc({ slug, locale }: {
        slug: string;
        locale: L;
    }): LoadedDoc | undefined;
    /** Page titles for the sidebar, without rendering the full pages. */
    docTitles(locale: L): Record<string, string>;
};
export type DocsContent<L extends string = string> = ReturnType<typeof createDocsContent<L>>;

import { type TokenizerAndRendererExtension } from 'marked';
export type { TokenizerAndRendererExtension } from 'marked';
export type DocsFrontmatter = {
    title?: string;
    description?: string;
    sidebar_position?: number;
};
export type DocsTocEntry = {
    id: string;
    text: string;
    depth: number;
};
export type RenderedDoc = {
    frontmatter: DocsFrontmatter;
    html: string;
    toc: DocsTocEntry[];
};
export declare function parseFrontmatter(source: string): {
    frontmatter: DocsFrontmatter;
    body: string;
};
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
export declare function escapeHtml(text: string): string;
/**
 * Renders one manual page. `slug` is the page's path below the manual, needed to turn
 * relative links like `./agenda-status` into absolute app URLs.
 *
 * Besides plain markdown it supports Docusaurus-style admonitions, `{#id}` heading ids and
 * generated screenshots as `![alt](shot:chair/speakers-list)`, one image per theme.
 */
export declare function renderDoc({ source, slug, locale, basePath, screenshotBase, iconPrefix, extensions }: RenderOptions & {
    source: string;
    slug: string;
}): RenderedDoc;

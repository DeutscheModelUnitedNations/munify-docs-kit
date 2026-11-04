import type { DocsNav } from '../nav';
import type { RenderedDoc } from '../render';
/**
 * What is wrong with one rendered page: a missing title, links to pages or anchors that
 * don't exist, images missing from `staticDir`. `rendered` holds every page of the locale,
 * for the anchor checks.
 */
export declare function docIssues({ doc, rendered, nav, staticDir, basePath }: {
    doc: RenderedDoc;
    rendered: Map<string, RenderedDoc>;
    nav: DocsNav;
    staticDir: string;
    basePath?: string;
}): string[];
/**
 * Whether `target` (a manual URL, or `slug#section` without the base path) is a page and,
 * with a hash, one of its headings. Returns the problem, or undefined.
 */
export declare function targetIssue({ target, rendered, nav, basePath }: {
    target: string;
    rendered: Map<string, RenderedDoc>;
    nav: DocsNav;
    basePath?: string;
}): string | undefined;

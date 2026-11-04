import type { DocsNav } from '../nav';
import type { RenderedDoc } from '../render';
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
    render: (input: {
        source: string;
        slug: string;
        locale: string;
    }) => RenderedDoc;
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
export declare function docsSuite({ root, docsDir, staticDir, locales, nav, render, shotsManifest, helpTargets, basePath }: DocsSuiteOptions): void;
/** Registers a test failing when a component loses a `data-tour` anchor a tour points at. */
export declare function tourAnchorsSuite({ srcDir, skip }?: {
    srcDir?: string;
    skip?: string[];
}): void;

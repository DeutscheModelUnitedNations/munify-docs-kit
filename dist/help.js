/** Wraps `import('./x.tour')` for modules exporting their tour as `tour`. */
export function lazyTour(load) {
    return async () => (await load()).tour;
}
/** Manual URL of a page, optionally with a section anchor (`slug#section`). */
export function docsHref({ slug, basePath = '/docs' }) {
    return `${basePath}/${slug}`;
}

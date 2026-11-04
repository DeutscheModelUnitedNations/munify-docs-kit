import type { Tour } from './tours/types';

export type RouteHelp = {
	/** Manual page below the manual's base path, see the app's nav */
	docs: string;
	/** Lazily loaded so tour copy and driver.js aren't bundled into every page */
	tour?: () => Promise<Tour>;
};

/** Wraps `import('./x.tour')` for modules exporting their tour as `tour`. */
export function lazyTour(load: () => Promise<{ tour: Tour }>) {
	return async () => (await load()).tour;
}

/** Manual URL of a page, optionally with a section anchor (`slug#section`). */
export function docsHref({ slug, basePath = '/docs' }: { slug: string; basePath?: string }) {
	return `${basePath}/${slug}`;
}

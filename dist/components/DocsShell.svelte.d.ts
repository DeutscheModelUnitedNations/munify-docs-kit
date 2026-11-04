import type { Snippet } from 'svelte';
import type { DocsNav } from '../nav';
type $$ComponentProps = {
    nav: DocsNav;
    /** Page titles by slug, from `docTitles` */
    titles: Record<string, string>;
    /** Slug of the open page */
    current: string;
    href: (slug: string) => string;
    labels: {
        menu: string;
        close: string;
        navigation: string;
        overview: string;
    };
    iconPrefix?: string;
    children: Snippet;
};
declare const DocsShell: import("svelte").Component<$$ComponentProps, {}, "">;
type DocsShell = ReturnType<typeof DocsShell>;
export default DocsShell;

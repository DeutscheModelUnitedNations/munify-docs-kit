import type { Attachment } from 'svelte/attachments';
import type { LoadedDoc } from '../content';
import type { DocsNav } from '../nav';
type $$ComponentProps = {
    nav: DocsNav;
    slug: string;
    /** The rendered page, undefined for a category overview */
    doc?: LoadedDoc;
    titles: Record<string, string>;
    href: (slug: string) => string;
    labels: {
        onThisPage: string;
        editPage: string;
    };
    /** Shown above the page when it fell back to another locale */
    fallbackNotice?: string;
    editUrl?: string;
    iconPrefix?: string;
    /** Behaviour on the rendered article, e.g. chase's live demo dialogs */
    attach?: Attachment<HTMLElement>;
};
declare const DocsArticle: import("svelte").Component<$$ComponentProps, {}, "">;
type DocsArticle = ReturnType<typeof DocsArticle>;
export default DocsArticle;

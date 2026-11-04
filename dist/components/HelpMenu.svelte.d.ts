import type { Snippet } from 'svelte';
type $$ComponentProps = {
    manualHref: string;
    labels: {
        help: string;
        manual: string;
        tour: string;
    };
    /** Starts the current route's tour; the entry is hidden without one */
    onTour?: () => void;
    /** Further `<li>` entries shown first */
    items?: Snippet<[{
        close: () => void;
    }]>;
    iconPrefix?: string;
    buttonClass?: string;
    tooltip?: string;
};
declare const HelpMenu: import("svelte").Component<$$ComponentProps, {}, "">;
type HelpMenu = ReturnType<typeof HelpMenu>;
export default HelpMenu;

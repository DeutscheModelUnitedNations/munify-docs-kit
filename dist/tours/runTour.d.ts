import 'driver.js/dist/driver.css';
import { type Tour } from './types';
export type TourLabels = {
    next: string;
    previous: string;
    done: string;
    /** Progress text, `{{current}}` and `{{total}}` are filled in by driver.js */
    progress: string;
};
/**
 * Starts a tour on the current page. Steps whose anchor is missing or hidden (e.g. a sidebar
 * only shown on wide screens) are skipped instead of breaking the tour. Import this module
 * lazily, so driver.js and its styles load only when a tour actually starts.
 */
export declare function startTour({ tour, labels, popoverClass }: {
    tour: Tour;
    labels: TourLabels;
    popoverClass?: string;
}): boolean;

import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { tourAnchorSelector, type Tour } from './types';

export type TourLabels = {
	next: string;
	previous: string;
	done: string;
	/** Progress text, `{{current}}` and `{{total}}` are filled in by driver.js */
	progress: string;
};

function isVisible(element: Element) {
	return element.getClientRects().length > 0;
}

/**
 * Starts a tour on the current page. Steps whose anchor is missing or hidden (e.g. a sidebar
 * only shown on wide screens) are skipped instead of breaking the tour. Import this module
 * lazily, so driver.js and its styles load only when a tour actually starts.
 */
export function startTour({
	tour,
	labels,
	popoverClass = 'docs-tour'
}: {
	tour: Tour;
	labels: TourLabels;
	popoverClass?: string;
}) {
	const steps: DriveStep[] = tour.steps
		.filter((step) => {
			if (!step.anchor) return true;
			const element = document.querySelector(tourAnchorSelector(step.anchor));
			return element !== null && isVisible(element);
		})
		.map((step) => ({
			element: step.anchor ? tourAnchorSelector(step.anchor) : undefined,
			popover: { title: step.title(), description: step.body(), side: step.side }
		}));

	if (steps.length === 0) return false;

	driver({
		steps,
		showProgress: steps.length > 1,
		progressText: labels.progress,
		nextBtnText: labels.next,
		prevBtnText: labels.previous,
		doneBtnText: labels.done,
		popoverClass,
		// driver.js only scrolls elements outside the window, but fixed bars can still cover
		// them, so always bring the highlighted element to the middle
		onHighlightStarted: (element) => element?.scrollIntoView({ block: 'center' }),
		stagePadding: 6,
		stageRadius: 12
	}).drive();
	return true;
}

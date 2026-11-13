<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The help button: a dropdown with the manual page of the current route, its tour when
	 * there is one, and whatever the app adds in front (e.g. its command palette).
	 */
	let {
		manualHref,
		labels,
		onTour,
		items,
		iconPrefix = 'ph-duotone',
		buttonClass = 'btn btn-ghost btn-circle btn-sm',
		tooltip
	}: {
		manualHref: string;
		labels: { help: string; manual: string; tour: string };
		/** Starts the current route's tour; the entry is hidden without one */
		onTour?: () => void;
		/** Further `<li>` entries shown first */
		items?: Snippet<[{ close: () => void }]>;
		iconPrefix?: string;
		buttonClass?: string;
		tooltip?: string;
	} = $props();

	/** Closes the dropdown, so it doesn't sit on top of the first highlighted element */
	function close() {
		const active = document.activeElement;
		if (active instanceof HTMLElement) active.blur();
	}
</script>

<div class="dropdown dropdown-end">
	<button
		type="button"
		class={[buttonClass, tooltip && 'tooltip tooltip-left']}
		aria-label={labels.help}
		data-tip={tooltip}
		data-testid="help-menu"
	>
		<i class="{iconPrefix} ph-question text-lg"></i>
	</button>
	<ul class="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 w-64 p-2 shadow-md">
		{@render items?.({ close })}
		{#if onTour}
			<li>
				<button
					type="button"
					onclick={() => {
						close();
						onTour?.();
					}}
				>
					<i class="{iconPrefix} ph-path w-5 text-center"></i>
					{labels.tour}
				</button>
			</li>
		{/if}
		<li>
			<a href={manualHref} target="_blank" rel="noopener noreferrer">
				<i class="{iconPrefix} ph-book-open w-5 text-center"></i>
				<span class="flex-1">{labels.manual}</span>
				<i class="{iconPrefix} ph-arrow-up-right text-base-content/50 text-xs" aria-hidden="true"
				></i>
			</a>
		</li>
	</ul>
</div>

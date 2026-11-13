<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DocsNav } from '../nav';

	/**
	 * The manual's frame: a sidebar with the app's nav (a drawer on small screens) next to
	 * the page. Use it in the app's `docs/+layout.svelte`.
	 */
	let {
		nav,
		titles,
		current,
		href,
		labels,
		iconPrefix = 'ph-duotone',
		children
	}: {
		nav: DocsNav;
		/** Page titles by slug, from `docTitles` */
		titles: Record<string, string>;
		/** Slug of the open page */
		current: string;
		href: (slug: string) => string;
		labels: { menu: string; close: string; navigation: string; overview: string };
		iconPrefix?: string;
		children: Snippet;
	} = $props();
</script>

<div class="drawer lg:drawer-open mx-auto max-w-[1200px] px-4 md:px-12">
	<input id="docs-drawer" type="checkbox" class="drawer-toggle" />

	<div class="drawer-content min-w-0 pb-16 lg:pl-10">
		<label for="docs-drawer" class="btn btn-sm btn-ghost mb-4 lg:hidden">
			<i class="{iconPrefix} ph-list"></i>
			{labels.menu}
		</label>
		{@render children()}
	</div>

	<div class="drawer-side z-40 lg:z-auto">
		<label for="docs-drawer" aria-label={labels.close} class="drawer-overlay"></label>
		<nav
			class="bg-base-100 min-h-full w-72 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:min-h-0 lg:overflow-y-auto lg:p-0"
			aria-label={labels.navigation}
		>
			<ul class="menu w-full p-0">
				{#each nav.entries as entry (typeof entry === 'string' ? entry : entry.slug)}
					{#if typeof entry === 'string'}
						<li>
							<a href={href(entry)} class={current === entry ? 'menu-active' : ''}>
								{titles[entry] ?? entry}
							</a>
						</li>
					{:else}
						<li>
							<details open={current === entry.slug || current.startsWith(`${entry.slug}/`)}>
								<summary>{entry.label()}</summary>
								<ul>
									<li>
										<a href={href(entry.slug)} class={current === entry.slug ? 'menu-active' : ''}>
											{labels.overview}
										</a>
									</li>
									{#each entry.items as item (item)}
										<li>
											<a href={href(item)} class={current === item ? 'menu-active' : ''}>
												{titles[item] ?? item}
											</a>
										</li>
									{/each}
								</ul>
							</details>
						</li>
					{/if}
				{/each}
			</ul>
		</nav>
	</div>
</div>

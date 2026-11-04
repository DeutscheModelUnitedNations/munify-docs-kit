<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { LoadedDoc } from '../content';
	import type { DocsNav } from '../nav';

	/**
	 * One manual page or a category overview, with prev/next links, an edit link and the
	 * page's table of contents. Use it in the app's `docs/[...slug]/+page.svelte`.
	 */
	let {
		nav,
		slug,
		doc,
		titles,
		href,
		labels,
		fallbackNotice,
		editUrl,
		iconPrefix = 'fa-duotone',
		attach
	}: {
		nav: DocsNav;
		slug: string;
		/** The rendered page, undefined for a category overview */
		doc?: LoadedDoc;
		titles: Record<string, string>;
		href: (slug: string) => string;
		labels: { onThisPage: string; editPage: string };
		/** Shown above the page when it fell back to another locale */
		fallbackNotice?: string;
		editUrl?: string;
		iconPrefix?: string;
		/** Behaviour on the rendered article, e.g. chase's live demo dialogs */
		attach?: Attachment<HTMLElement>;
	} = $props();

	const category = $derived(doc ? undefined : nav.findCategory(slug));
	const neighbours = $derived(nav.neighbours(slug));

	function titleFor(target: string) {
		return titles[target] ?? nav.findCategory(target)?.label() ?? target;
	}
</script>

<div class="flex gap-10">
	<article class="prose prose-headings:font-bold max-w-none min-w-0 flex-1" {@attach attach}>
		{#if doc}
			{#if fallbackNotice}
				<div role="note" class="alert alert-soft alert-info not-prose mb-6">
					<i class="{iconPrefix} fa-language"></i>
					<span>{fallbackNotice}</span>
				</div>
			{/if}
			<!-- Rendered from the app's own markdown in docs/ -->
			{@html doc.html}
		{:else if category}
			<h1>{category.label()}</h1>
			<p class="lead">{category.description()}</p>
			<div class="not-prose grid gap-3 sm:grid-cols-2">
				{#each category.items as item (item)}
					<a href={href(item)} class="card card-border bg-base-100 hover:bg-base-200 p-4">
						<span class="font-semibold">{titleFor(item)}</span>
					</a>
				{/each}
			</div>
		{/if}

		<div class="not-prose border-base-300 mt-12 flex flex-wrap justify-between gap-4 border-t pt-6">
			{#if neighbours.prev}
				<a href={href(neighbours.prev)} class="btn btn-ghost">
					<i class="{iconPrefix} fa-arrow-left"></i>
					{titleFor(neighbours.prev)}
				</a>
			{:else}
				<span></span>
			{/if}
			{#if neighbours.next}
				<a href={href(neighbours.next)} class="btn btn-ghost">
					{titleFor(neighbours.next)}
					<i class="{iconPrefix} fa-arrow-right"></i>
				</a>
			{/if}
		</div>

		{#if editUrl}
			<p class="not-prose mt-4 text-sm">
				<a
					class="link link-hover opacity-70"
					href={editUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					<i class="{iconPrefix} fa-pen-to-square"></i>
					{labels.editPage}
				</a>
			</p>
		{/if}
	</article>

	{#if doc && doc.toc.length > 1}
		<aside class="hidden w-56 shrink-0 xl:block">
			<nav class="sticky top-4 text-sm" aria-label={labels.onThisPage}>
				<p class="mb-2 font-semibold">{labels.onThisPage}</p>
				<ul class="flex flex-col gap-1">
					{#each doc.toc as entry (entry.id)}
						<li class={entry.depth === 3 ? 'pl-3' : ''}>
							<a class="link link-hover opacity-80" href="#{entry.id}">{entry.text}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</aside>
	{/if}
</div>

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Every file below `dir` ending in `suffix`, skipping directories named in `skip`. */
export function listFiles({
	dir,
	suffix,
	skip = []
}: {
	dir: string;
	suffix: string;
	skip?: string[];
}): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory())
			return skip.includes(entry.name) ? [] : listFiles({ dir: path, suffix, skip });
		return entry.name.endsWith(suffix) ? [path] : [];
	});
}

/** Page slugs of one locale's markdown directory, sorted. */
export function markdownSlugs(localeDir: string) {
	return listFiles({ dir: localeDir, suffix: '.md' })
		.map((path) => relative(localeDir, path).replace(/\\/g, '/').replace(/\.md$/, ''))
		.sort();
}

/**
 * Screenshot ids of a shot manifest, read as text: the manifest itself usually pulls in
 * Playwright and the database.
 */
export function shotIdsOf({
	manifest,
	pattern = /^\s*\{?\s*id: '([^']+)'/gm
}: {
	manifest: string;
	pattern?: RegExp;
}) {
	return [...readFileSync(manifest, 'utf8').matchAll(pattern)].map(([, id]) => id);
}

/** `shot:<id>` references in markdown sources */
export function shotReferences(sources: string[]) {
	return new Set(sources.flatMap((s) => [...s.matchAll(/\]\(shot:([^)\s]+)\)/g)].map((m) => m[1])));
}

/**
 * `data-tour` anchors defined in Svelte markup, including conditional ones like
 * `data-tour={x ? 'a' : 'b'}` and anchors built by a prefix helper
 * (`` `speakers-list.${name}` `` + `tourAnchor('timer')`).
 */
export function definedTourAnchors({
	srcDir,
	skip = ['paraglide']
}: {
	srcDir: string;
	skip?: string[];
}) {
	const anchors = new Set<string>();
	for (const file of listFiles({ dir: srcDir, suffix: '.svelte', skip })) {
		const source = readFileSync(file, 'utf8');
		for (const [, plain, expression] of source.matchAll(/data-tour=(?:"([^"]+)"|\{([^}]+)\})/g)) {
			if (plain) anchors.add(plain);
			for (const [, quoted] of expression?.matchAll(/['"`]([\w.-]+)['"`]/g) ?? []) {
				anchors.add(quoted);
			}
		}
		for (const [, prefix] of source.matchAll(/`([\w-]+\.)\$\{name\}`/g)) {
			for (const [, name] of source.matchAll(/tourAnchor\('([\w-]+)'\)/g)) {
				anchors.add(prefix + name);
			}
		}
	}
	return anchors;
}

/** Anchors the `*.tour.ts` files below `srcDir` point at. */
export function usedTourAnchors({
	srcDir,
	skip = ['paraglide']
}: {
	srcDir: string;
	skip?: string[];
}) {
	return listFiles({ dir: srcDir, suffix: '.tour.ts', skip }).flatMap((file) =>
		[...readFileSync(file, 'utf8').matchAll(/anchor:\s*'([^']+)'/g)].map(([, anchor]) => ({
			file,
			anchor
		}))
	);
}

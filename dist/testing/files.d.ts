/** Every file below `dir` ending in `suffix`, skipping directories named in `skip`. */
export declare function listFiles({ dir, suffix, skip }: {
    dir: string;
    suffix: string;
    skip?: string[];
}): string[];
/** Page slugs of one locale's markdown directory, sorted. */
export declare function markdownSlugs(localeDir: string): string[];
/**
 * Screenshot ids of a shot manifest, read as text: the manifest itself usually pulls in
 * Playwright and the database.
 */
export declare function shotIdsOf({ manifest, pattern }: {
    manifest: string;
    pattern?: RegExp;
}): string[];
/** `shot:<id>` references in markdown sources */
export declare function shotReferences(sources: string[]): Set<string>;
/**
 * `data-tour` anchors defined in Svelte markup, including conditional ones like
 * `data-tour={x ? 'a' : 'b'}` and anchors built by a prefix helper
 * (`` `speakers-list.${name}` `` + `tourAnchor('timer')`).
 */
export declare function definedTourAnchors({ srcDir, skip }: {
    srcDir: string;
    skip?: string[];
}): Set<string>;
/** Anchors the `*.tour.ts` files below `srcDir` point at. */
export declare function usedTourAnchors({ srcDir, skip }: {
    srcDir: string;
    skip?: string[];
}): {
    file: string;
    anchor: string;
}[];

import { existsSync } from 'node:fs';
import { join } from 'node:path';
/**
 * What is wrong with one rendered page: a missing title, links to pages or anchors that
 * don't exist, images missing from `staticDir`. `rendered` holds every page of the locale,
 * for the anchor checks.
 */
export function docIssues({ doc, rendered, nav, staticDir, basePath = '/docs' }) {
    const issues = [];
    if (!doc.frontmatter.title)
        issues.push('no frontmatter title');
    for (const [, href] of doc.html.matchAll(/<a href="(\/[^"]*)"/g)) {
        const issue = targetIssue({ target: href, rendered, nav, basePath });
        if (issue)
            issues.push(`link ${href}: ${issue}`);
    }
    for (const [, src] of doc.html.matchAll(/<img src="(\/[^"]+)"/g)) {
        if (!existsSync(join(staticDir, src)))
            issues.push(`image ${src} is missing`);
    }
    return issues;
}
/**
 * Whether `target` (a manual URL, or `slug#section` without the base path) is a page and,
 * with a hash, one of its headings. Returns the problem, or undefined.
 */
export function targetIssue({ target, rendered, nav, basePath = '/docs' }) {
    const [path, hash] = target.split('#');
    let slug = path;
    if (path.startsWith('/')) {
        if (!path.startsWith(`${basePath}/`))
            return undefined;
        slug = path.slice(basePath.length + 1);
    }
    if (!nav.isKnownSlug(slug))
        return `no page ${slug}`;
    if (hash && !rendered.get(slug)?.toc.some((t) => t.id === hash))
        return `no heading #${hash}`;
    return undefined;
}

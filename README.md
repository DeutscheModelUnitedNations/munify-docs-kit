# MUNify docs kit

`@deutschemodelunitednations/docs-kit` gives the MUNify SvelteKit apps (CHASE, DELEGATOR) an
in-app user manual, a help button pointing at the manual page of the route you are on, guided
tours, and generated screenshots. The apps keep their content (markdown, sidebar order, which
route gets which page, tours, shot list, how to stage data); the kit holds everything around it.

## What is in it

| Import                                            | What                                                                                                                                                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@deutschemodelunitednations/docs-kit`            | `renderDoc` (markdown with admonitions, `{#id}` headings, `shot:` screenshots), `createDocsContent` (loading, locale fallback, titles), `createDocsNav`, `RouteHelp`, `lazyTour`, `Tour` types |
| `@deutschemodelunitednations/docs-kit/components` | `DocsShell` (sidebar layout), `DocsArticle` (page, overview, prev/next, toc), `HelpMenu` (help dropdown)                                                                                       |
| `@deutschemodelunitednations/docs-kit/tour`       | `startTour`, the driver.js runner. Import it lazily: it loads driver.js and its CSS                                                                                                            |
| `@deutschemodelunitednations/docs-kit/testing`    | `docsSuite` and `tourAnchorsSuite` (vitest), plus the plain checks they are built from                                                                                                         |
| `@deutschemodelunitednations/docs-kit/capture`    | `captureShots` (Playwright, every shot in every locale and theme), `portInUse`, `waitForServer`                                                                                                |
| `@deutschemodelunitednations/docs-kit/styles.css` | Theme-aware screenshots and the `docs-tour` popover style                                                                                                                                      |

The components use DaisyUI and Tailwind classes. Import the kit's stylesheet after Tailwind;
it registers the kit as a Tailwind source:

```css
@import 'tailwindcss';
@import '@deutschemodelunitednations/docs-kit/styles.css';
```

No component knows about Paraglide: every label is a prop, so the app passes its own messages.

## Using it in an app

1. Markdown in `docs/<locale>/…/*.md` with a `title` in the frontmatter.
2. `nav.ts`: `createDocsNav({ entries, defaultSlug })`.
3. `content.server.ts`: `createDocsContent({ sources: import.meta.glob('/docs/*/**/*.md', { query: '?raw', import: 'default', eager: true }), baseLocale, render })`.
4. Routes `docs/+layout.svelte` (`DocsShell`) and `docs/[...slug]/+page.svelte` (`DocsArticle`).
5. A route help map (`RouteId` → `{ docs, tour? }`) and a `HelpMenu` in the app's header.
6. A test file calling `docsSuite({ locales, nav, render, shotsManifest, helpTargets })` and
   `tourAnchorsSuite()`.
7. A screenshot script calling `captureShots` with the app's shots, roles, login and staging.

CHASE and DELEGATOR are the reference implementations.

## Development

```bash
bun install
bun run check   # svelte-check
bun run test    # vitest
bun run build   # svelte-package into dist/
```

## Releasing

Bump `version` in `package.json`, merge, then publish a GitHub release tagged `v<version>`. The
release workflow builds and publishes to npm through trusted publishing (no token: npm trusts
`release.yml` of this repository, set in the package's settings on npmjs.com).

# CLAUDE.md

The shared docs kit of the MUNify apps (CHASE, DELEGATOR). See README.md for what it exports.

- **Generic only.** Nothing here knows an app: no Paraglide, no `$app/*`, no app routes. Labels,
  icon prefixes (`fa-duotone` in CHASE, `fa-sharp-duotone fa-solid` in DELEGATOR), base paths and
  app-specific markdown extensions (CHASE's live demos) come in as options or props.
- **Two or more parameters take one object**, as in the apps.
- `src/lib` is packaged by `svelte-package` into `dist/`; `src/ambient.d.ts` is not shipped.
- Every change ships with tests (`*.test.ts` next to the code). Run `bun run check`,
  `bun run test` and `bun run format` before committing.
- A breaking change bumps the minor version while below 1.0, and needs matching PRs in both apps.
- Commits follow Conventional Commits, as in the apps.

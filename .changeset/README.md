# Changesets

Run `pnpm changeset` when changing **publishable** packages under `packages/`.

## Lockstep group

`@agent-ready/schema`, `@agent-ready/runtime`, `@agent-ready/react` version together (see `.changeset/config.json`).

## When to add a changeset

| Change | Bump |
|--------|------|
| Bug fix, internal refactor (no API change) | **patch** |
| New backward-compatible API | **minor** |
| Breaking public API or behavior | **major** |
| Docs-only / apps / CI | No changeset |

## CI

Pull requests that modify `packages/**` must include a `.changeset/*.md` file (except `README.md`). See `scripts/check-changeset.mjs`.

## Release tags

- `pnpm changeset publish --tag beta` — 0.2.x
- `pnpm changeset publish --tag rc` — 0.3.x
- `pnpm changeset publish` — GA `latest`

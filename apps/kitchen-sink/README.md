# Kitchen Sink

Next.js App Router examples for Agent Ready SDK.

## Pages

| Route | Pattern |
|-------|---------|
| `/rsc` | Server Component declares manifests via `@agent-ready/react/rsc` |
| `/client-actions` | Client page uses `useAgentAction(handle, action, handler)` |

## Build

```bash
pnpm --filter kitchen-sink build
pnpm --filter kitchen-sink dev
```

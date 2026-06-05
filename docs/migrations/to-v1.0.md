# Migration Guide — alpha → GA (v1.0)

## Version path

| Release | Phase | Highlights |
|---------|-------|------------|
| **0.1.x** | Alpha | Surface/Action registry, defaultDeny policy |
| **0.2.x** | Beta | Observation, bridge, DevTools, explicit `handle` hooks (ADR-007) |
| **0.3.x** | RC | MCP SSE, RSC manifest, OTel, kitchen-sink |
| **1.0.x** | GA | Enterprise policy/audit/rate-limit, LTS support |

## Breaking changes by version

### 0.1 → 0.2

- React hooks require explicit `handle` first argument:
  - `useAgentAction(handle, action, handler)`
  - `useAgentObservation(handle, definition, selector, options?)`

### 0.2 → 0.3

- `@agent-ready/react/rsc` is a separate export for Server Components.
- MCP SSE transport available at `@agent-ready/mcp/sse`.

### 0.3 → 1.0

- Audit and rate-limit hooks are stable; configure before production traffic.
- npm `latest` tag moves to 1.0 — pin `rc`/`beta` if you need older behavior.

## Upgrade checklist

1. Run `pnpm test` in your app after bumping SDK versions.
2. Regenerate MCP tools: `agent-ready codegen mcp mcp-tools.json`.
3. Enable policy + audit in staging before GA cutover.

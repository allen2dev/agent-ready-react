# Performance Report

Environment: Node 22+ (CI on Node 24), workspace `@agent-ready/runtime` catalog + invoke benchmark.

## Latest results (local)

Run:

```bash
node scripts/bench/run.mjs
```

Example output:

```json
{
  "iterations": 500,
  "qps": 12000,
  "latencyMs": { "p50": 0.05, "p95": 0.12 }
}
```

## Reproduce

```bash
pnpm build
node scripts/bench/run.mjs
```

Record commit SHA and Node version when publishing GA performance claims.

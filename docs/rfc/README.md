# RFC Process

Use an RFC when proposing **breaking changes**, new public API surfaces, or cross-package architectural shifts.

## When to open an RFC

| Change type | RFC required? |
|-------------|---------------|
| Patch bugfix | No |
| Additive minor API | Optional |
| Breaking API / behavior | **Yes** |
| New published package | **Yes** |

## Workflow

1. Copy the [ADR template](../architecture.md#9-架构决策记录adr-摘要) section into `docs/rfc/NNN-title.md`.
2. Open a draft PR with the RFC markdown only (or alongside a spike).
3. Reviewers sign off on **context**, **decision**, and **consequences**.
4. After merge, add a summary row to [architecture.md § ADR](../architecture.md#9-架构决策记录adr-摘要) if the decision is accepted.

## ADR template (minimal)

```markdown
# RFC-NNN: Title

## Status
Proposed | Accepted | Rejected

## Context
What problem are we solving?

## Decision
What will we do?

## Consequences
Trade-offs, migration, follow-ups.
```

## Related

- [architecture.md — ADR index](../architecture.md#9-架构决策记录adr-摘要)
- [sdk-api.md — stability policy](../sdk-api.md#10-稳定性与废弃策略)
- [migrations/to-v1.0.md](../migrations/to-v1.0.md)

# Phase 2 — Observable UI（v0.2 beta）

> **Phase 目标**：Observation、DevTools、ESLint、HTTP Bridge、beta 发布  
> **依赖 Phase**：Phase 1 完成（P1-020）

---

### P2-001: Runtime — Observation Registry

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-012, P0-008 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`registerObservation` / 注销
- 不做：snapshot

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- registry.observation
```

**验收标准**
- [ ] catalog summary 含 observations 名称列表

---

### P2-002: Runtime — readObservation

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P2-001 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：拉取 selector 当前值、schema 校验输出
- 不做：stream

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- readObservation
```

**验收标准**
- [ ] `NOT_FOUND` 与校验失败可测

---

### P2-003: Runtime — Snapshot Engine + etag

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-002 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：合并多 observation、`etag` 基于序列化 hash
- 不做：diff 推送

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- snapshot
```

**验收标准**
- [ ] 相同数据 etag 不变

---

### P2-004: Runtime — Observation debounce

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-003 |
| **包/应用** | `packages/runtime` |

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- debounce
```

**验收标准**
- [ ] 100ms 内多次更新只触发一次读

---

### P2-005: React — useAgentObservation

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-002, P1-003 |
| **包/应用** | `packages/react` |

**范围**
- 做：selector 注册、禁止副作用 lint 文档
- 不做：stream hook

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- useAgentObservation
```

**验收标准**
- [ ] MockAgent read 与 selector 一致

---

### P2-006: 脚手架 `@agent-ready/observability`

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-017 |
| **包/应用** | `packages/observability` |

**范围**
- 做：包结构、订阅 runtime events 类型
- 不做：OTel

**独立测试**
```bash
pnpm --filter @agent-ready/observability build
```

**验收标准**
- [ ] 无 OTel 硬依赖

---

### P2-007: Observability — Runtime 事件订阅器

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P2-006, P0-017 |
| **包/应用** | `packages/observability` |

**独立测试**
```bash
pnpm --filter @agent-ready/observability test -- listener
```

**验收标准**
- [ ] `action:invoked` 可记录到内存 sink

---

### P2-008: Observability — Redaction middleware 占位

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-007 |
| **包/应用** | `packages/observability` |

**范围**
- 做：`createRedactionMiddleware(fields[])` 打码
- 不做：PII 自动检测

**独立测试**
```bash
pnpm --filter @agent-ready/observability test -- redaction
```

**验收标准**
- [ ] 指定字段变为 `[REDACTED]`

---

### P2-009: 脚手架 `@agent-ready/devtools`

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-001 |
| **包/应用** | `packages/devtools` |

**范围**
- 做：独立 bundle、`window.__AGENT_READY_DEVTOOLS__` 钩子
- 不做：UI 面板

**独立测试**
```bash
pnpm --filter @agent-ready/devtools build
```

**验收标准**
- [ ] 动态 import 不进入生产默认 chunk

---

### P2-010: DevTools — Catalog 树面板

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-009, P0-015 |
| **包/应用** | `packages/devtools` |

**独立测试**
```bash
pnpm --filter @agent-ready/devtools test -- catalog-panel
```

**验收标准**
- [ ] 展示 handle + capabilities

---

### P2-011: DevTools — Action 日志环形缓冲

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P2-009, P2-007 |
| **包/应用** | `packages/devtools` |

**范围**
- 做：最近 100 条 invoke 记录
- 不做：持久化

**独立测试**
```bash
pnpm --filter @agent-ready/devtools test -- action-log
```

**验收标准**
- [ ] 第 101 条挤掉最旧

---

### P2-012: DevTools — Policy 决策展示

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-011, P1-008 |
| **包/应用** | `packages/devtools` |

**独立测试**
```bash
pnpm --filter @agent-ready/devtools test -- policy-panel
```

**验收标准**
- [ ] 拒绝记录含 `AGENT_POLICY_DENIED`

---

### P2-013: 脚手架 `eslint-plugin-agent-ready`

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-005 |
| **包/应用** | `packages/eslint-plugin` |

**独立测试**
```bash
pnpm --filter eslint-plugin-agent-ready test
```

**验收标准**
- [ ] RuleTester 可运行

---

### P2-014: ESLint — require-surface-for-interactive

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-013 |
| **包/应用** | `packages/eslint-plugin` |

**范围**
- 做：检测 `onClick` 且无同级 `useAgentSurface`（启发式 MVP）
- 不做：完美 AST 覆盖

**独立测试**
```bash
pnpm --filter eslint-plugin-agent-ready test -- require-surface
```

**验收标准**
- [ ] 含 3 valid + 3 invalid fixtures

---

### P2-015: ESLint — no-raw-handle

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-013 |
| **包/应用** | `packages/eslint-plugin` |

**独立测试**
```bash
pnpm --filter eslint-plugin-agent-ready test -- no-raw-handle
```

**验收标准**
- [ ] 硬编码 `://` 字符串报 warning

---

### P2-016: ESLint — schema-sync

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-013, P0-010 |
| **包/应用** | `packages/eslint-plugin` |

**范围**
- 做：对比同文件 Zod 与旁路 JSON snapshot _mtime（简化版）
- 不做：全仓库扫描

**独立测试**
```bash
pnpm --filter eslint-plugin-agent-ready test -- schema-sync
```

**验收标准**
- [ ] drift 时报 error

---

### P2-017: 脚手架 `@agent-ready/bridge`

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-014 |
| **包/应用** | `packages/bridge` |

**范围**
- 做：Node-only、HTTP server 依赖
- 不做：路由实现

**独立测试**
```bash
pnpm --filter @agent-ready/bridge build
```

**验收标准**
- [ ] react 不在依赖树

---

### P2-018: Bridge — JSON-RPC catalog.list

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P2-017, P0-015 |
| **包/应用** | `packages/bridge` |

**独立测试**
```bash
pnpm --filter @agent-ready/bridge test -- catalog.list
```

**验收标准**
- [ ] POST 返回 catalog JSON-RPC result

---

### P2-019: Bridge — JSON-RPC action.invoke

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P2-018, P1-008 |
| **包/应用** | `packages/bridge` |

**独立测试**
```bash
pnpm --filter @agent-ready/bridge test -- action.invoke
```

**验收标准**
- [ ] 与 runtime invoke 结果一致

---

### P2-020: Bridge — JSON-RPC observation.read

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-018, P2-002 |
| **包/应用** | `packages/bridge` |

**独立测试**
```bash
pnpm --filter @agent-ready/bridge test -- observation.read
```

**验收标准**
- [ ] 返回 etag

---

### P2-021: Bridge — Auth middleware 占位

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-017 |
| **包/应用** | `packages/bridge` |

**范围**
- 做：Bearer token 校验 stub，可配置关闭
- 不做：OIDC

**独立测试**
```bash
pnpm --filter @agent-ready/bridge test -- auth
```

**验收标准**
- [ ] 无 token 返回 401

---

### P2-022: Bridge — e2e 集成测试

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-019, P0-019 |
| **包/应用** | `packages/bridge` |

**范围**
- 做：supertest 或 node fetch 启服 → invoke 全链路
- 不做：Playwright

**独立测试**
```bash
pnpm --filter @agent-ready/bridge test -- e2e
```

**验收标准**
- [ ] CI 可跑、无 flaky

---

### P2-023: 性能测试 — Catalog 100 surfaces

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-015 |
| **包/应用** | `packages/runtime` |

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- perf.catalog
```

**验收标准**
- [ ] p50 < 16ms（CI 宽松阈值或仅本地 benchmark 文档）

---

### P2-024: 体积检查 — react 包 gzip budget

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-001 |
| **包/应用** | `packages/react` |

**范围**
- 做：`size-limit` 或 bundlesize 配置
- 不做：优化实现

**独立测试**
```bash
pnpm --filter @agent-ready/react size
```

**验收标准**
- [ ] 超限 CI 失败或 warning

---

### P2-025: 文档 — alpha → beta 迁移指南

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P2-005 |
| **包/应用** | `docs/migrations/v0.1-to-v0.2.md` |

**独立测试**
```bash
# 人工 review：列出 Observation API 新增项
```

**验收标准**
- [ ] 含 breaking 无则显式声明「无 breaking」

---

### P2-026: React — useAgentCatalog hook

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-002, P0-015 |
| **包/应用** | `packages/react` |

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- useAgentCatalog
```

**验收标准**
- [ ] 注册 surface 后 hook 返回更新

---

## Phase 2 完成检查

- [ ] Observation 可读（P2-002 + P2-005）
- [ ] DevTools 100 条日志（P2-011）
- [ ] bridge e2e（P2-022）
- [ ] beta 发布（配合 P1-020 流程 + P2-025）

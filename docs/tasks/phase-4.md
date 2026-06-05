# Phase 4 — Enterprise（v1.0 GA）

> **Phase 目标**：企业级 Policy、审计、限流、安全/性能报告、GA 发布  
> **依赖 Phase**：Phase 3 完成（P3-018）

---

### P4-001: Policy — OIDC role mapping Provider

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P1-007 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`createOidcRolePolicyProvider(config)` 将 claims → roles
- 不做：完整 OIDC 登录 UI

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- policy.oidc
```

**验收标准**
- [ ] mock JWT claims 映射 role 正确

---

### P4-002: Policy — per-tenant allowlist

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-007 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`tenantId` 在 session metadata，规则表按 tenant 过滤 action
- 不做：多租户数据面

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- policy.tenant
```

**验收标准**
- [ ] tenant A 不能 invoke tenant B 的 handle

---

### P4-003: Audit — 可插拔 sink 接口

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-017 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`AuditSink` 类型、`emitAuditEvent(entry)`
- 不做：具体 sink

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- audit.interface
```

**验收标准**
- [ ] invoke 成功/拒绝/失败均产生 audit entry

---

### P4-004: Audit — Console sink 实现

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P4-003 |
| **包/应用** | `packages/runtime` |

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- audit.console
```

**验收标准**
- [ ] 结构化 JSON 单行输出

---

### P4-005: Audit — HTTP sink 实现

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P4-003 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：批量 POST、失败重试 1 次
- 不做：SIEM 专有格式

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- audit.http
# mock fetch server
```

**验收标准**
- [ ] mock server 收到预期 body

---

### P4-006: Rate limit — per session

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-008 |
| **包/应用** | `packages/runtime` |

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- ratelimit.session
```

**验收标准**
- [ ] 超限返回 `AGENT_RATE_LIMITED`

---

### P4-007: Rate limit — per action 细粒度

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P4-006 |
| **包/应用** | `packages/runtime` |

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- ratelimit.action
```

**验收标准**
- [ ] 不同 action 独立计数

---

### P4-008: 文档 — 安全审计清单（OWASP 对齐）

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | — |
| **包/应用** | `docs/security/audit-checklist.md` |

**独立测试**
```bash
# 同行 review：覆盖威胁模型 6 项
```

**验收标准**
- [ ] 每项有「通过/待办」列

---

### P4-009: 性能 — 压力测试脚本（Catalog + invoke）

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-023, P0-016 |
| **包/应用** | `scripts/bench/` |

**独立测试**
```bash
node scripts/bench/run.mjs
```

**验收标准**
- [ ] 输出 QPS、p50/p95 延迟

---

### P4-010: 性能 — 报告写入 docs

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P4-009 |
| **包/应用** | `docs/performance/report.md` |

**验收标准**
- [ ] 含环境与复现命令

---

### P4-011: 文档 — 默认 Policy 合规说明

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-006, P4-002 |
| **包/应用** | `docs/security/default-policy.md` |

**验收标准**
- [ ] SOC2 友好措辞（能力声明，非法律意见）

---

### P4-012: 文档 — v1.0 迁移指南（alpha→GA）

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P2-025 |
| **包/应用** | `docs/migrations/to-v1.0.md` |

**验收标准**
- [ ] 版本路径 0.1 → 0.2 → 0.3 → 1.0

---

### P4-013: 文档 — LTS 与支持策略

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | — |
| **包/应用** | `docs/support/lts.md` |

**验收标准**
- [ ] 声明 6 个月 patch 支持范围

---

### P4-014: GA 发布执行与里程碑检查

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P4-001 … P4-013, P3-018 |
| **包/应用** | release |

**范围**
- 做：走 [roadmap 里程碑检查表](../roadmap.md#11-里程碑检查表维护者用)
- 不做：新功能

**独立测试**
```bash
pnpm test && pnpm build && pnpm changeset publish # 实际 GA
```

**验收标准**
- [ ] npm `latest` tag
- [ ] GitHub Release + CHANGELOG

---

## Phase 4 完成检查

- [ ] 企业 Policy + 审计 + 限流（P4-001 … P4-007）
- [ ] 安全/性能文档（P4-008 … P4-010）
- [ ] GA 发布（P4-014）

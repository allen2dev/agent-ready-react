# 横向任务（全 Phase 持续）

> 可在对应 Phase 并行领取；部分任务重复出现于多 Phase，按 **触发时机** 执行。

---

### PX-001: 依赖边界 ESLint 规则（depcruise）

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-011, P1-001 |
| **触发** | Phase 0 末 / 持续 |
| **包/应用** | root |

**范围**
- 做：`dependency-cruiser` 配置禁止 runtime→react、react→bridge
- 不做：自定义 ESLint

**独立测试**
```bash
pnpm depcruise packages
```

**验收标准**
- [ ] 违规依赖 CI 失败

---

### PX-002: 契约测试覆盖率门槛 CI

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-004, P1-009 |
| **触发** | Phase 1 起 |
| **包/应用** | CI |

**独立测试**
```bash
pnpm test -- --coverage && node scripts/check-coverage.mjs 90
```

**验收标准**
- [ ] schema + runtime 核心 ≥90%

---

### PX-003: 公共 API 变更同步 sdk-api.md

| 属性 | 值 |
|------|-----|
| **估算** | 1h / 次 |
| **依赖** | — |
| **触发** | 任何 PUBLIC API PR |
| **包/应用** | `docs/sdk-api.md` |

**独立测试**
```bash
# PR checklist：sdk-api  diff 非空或 N/A 说明
```

**验收标准**
- [ ] 版本能力矩阵更新

---

### PX-004: Changeset 流程 enforcement

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-022 |
| **触发** | Phase 0 起 |
| **包/应用** | `.github/workflows` |

**范围**
- 做：PR 无 changeset 时 bot 评论 / label
- 不做：自动发版

**独立测试**
```bash
# 开测试 PR 无 .changeset 应失败或 warning
```

**验收标准**
- [ ] 文档说明何时需要 major/minor/patch

---

### PX-005: npm audit 与安全依赖 Renovate

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-001 |
| **触发** | Phase 0 起 |
| **包/应用** | `.github/renovate.json` |

**独立测试**
```bash
pnpm audit --audit-level=high
```

**验收标准**
- [ ] CI 对 high 漏洞失败或开 issue

---

### PX-006: RFC 流程文档（breaking change）

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | — |
| **触发** | Phase 1 前 |
| **包/应用** | `docs/rfc/README.md` |

**验收标准**
- [ ] 含 ADR 模板链接

---

### PX-007: Playground dogfooding 冒烟清单

| 属性 | 值 |
|------|-----|
| **估算** | 1h / release |
| **依赖** | P1-017 |
| **触发** | 每次 npm 预发布前 |
| **包/应用** | `docs/checklists/playground-smoke.md` |

**验收标准**
- [ ] ≤10 步人工冒烟

---

### PX-008: RFC — Zod SchemaAdapter 抽象（v3/v4）

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P0-009 |
| **触发** | Phase 0 风险项 |
| **包/应用** | `packages/schema` |

**范围**
- 做：`SchemaAdapter` 接口，内置 zod3/zod4 检测
- 不做：支持所有框架

**独立测试**
```bash
pnpm --filter @agent-ready/schema test -- adapter
```

**验收标准**
- [ ] 至少在 CI matrix 测一个 zod 版本

---

## 横向任务与 Phase 关系

| 任务 | 建议开始 Phase |
|------|----------------|
| PX-001 | 0 |
| PX-002 | 1 |
| PX-003 | 1+ |
| PX-004 | 0 |
| PX-005 | 0 |
| PX-006 | 1 前 |
| PX-007 | 1+ |
| PX-008 | 0（若遇 zod 兼容问题） |

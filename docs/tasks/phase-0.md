# Phase 0 — Foundation（内部）

> **Phase 目标**：Monorepo 骨架 + `@agent-ready/schema` + `@agent-ready/runtime` 核心 + 契约测试基座 + CI  
> **退出标准**：见 [roadmap.md](../roadmap.md#3-phase-0--foundation内部)

---

### P0-001: 初始化 pnpm workspace

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | — |
| **包/应用** | root |

**范围**
- 做：根 `package.json`、`pnpm-workspace.yaml`（`packages/*`, `apps/*`, `tooling/*`）、`.npmrc`（`strict-peer-dependencies`）
- 不做：具体 package 实现

**产出**
- 可执行 `pnpm install` 的空 workspace

**独立测试**
```bash
pnpm install && pnpm -r exec pwd
```

**验收标准**
- [ ] workspace 三路径 glob 生效
- [ ] Node 20+ engines 声明

---

### P0-002: 配置 Turborepo 任务管道

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-001 |
| **包/应用** | root |

**范围**
- 做：`turbo.json` 定义 `build` / `test` / `lint` / `typecheck`，`build` 依赖 `^build`
- 不做：各包具体 build 脚本

**产出**
- `turbo.json` + 根脚本 `pnpm build` / `pnpm test`

**独立测试**
```bash
pnpm turbo run build --dry-run
```

**验收标准**
- [ ] dry-run 无循环依赖
- [ ] 空包不参与时报错可理解

---

### P0-003: 共享 TypeScript 配置包

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-001 |
| **包/应用** | `tooling/tsconfig` |

**范围**
- 做：`base.json`、`node.json`、`react.json` 三套 extends
- 不做：业务类型

**产出**
- `tooling/tsconfig/package.json` exports

**独立测试**
```bash
echo '{"extends":"./base.json"}' > /tmp/tsconfig.json && pnpm exec tsc --showConfig -p /tmp 2>/dev/null || true
```

**验收标准**
- [ ] `strict: true`、`moduleResolution: bundler`
- [ ] 其他包可通过 `"extends": "@agent-ready/tsconfig/base.json"` 引用

---

### P0-004: 共享 Vitest 配置包

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-001 |
| **包/应用** | `tooling/vitest-config` |

**范围**
- 做：默认 `environment: node`、coverage 阈值占位、`defineConfig` 导出
- 不做：具体测试用例

**产出**
- `tooling/vitest-config/index.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/vitest-config test  # 占位测试 pass
```

**验收标准**
- [ ] 含 1 个 smoke test 验证配置可加载

---

### P0-005: 脚手架 `@agent-ready/schema` 包

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-003, P0-004 |
| **包/应用** | `packages/schema` |

**范围**
- 做：`package.json` exports、tsup 双格式、`src/index.ts` 空导出、peer `zod`
- 不做：类型实现

**产出**
- 可 `pnpm --filter @agent-ready/schema build`

**独立测试**
```bash
pnpm --filter @agent-ready/schema build && test -f packages/schema/dist/index.js
```

**验收标准**
- [ ] `sideEffects: false`
- [ ] `attw` 预备（exports 含 types）

---

### P0-006: Schema — 核心标识与 Manifest 类型

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-005 |
| **包/应用** | `packages/schema` |

**范围**
- 做：`AgentHandle`、`SurfaceManifest`、`AgentCapabilityKind`、Zod schema
- 不做：JSON Schema 生成

**产出**
- `src/types/surface.ts` + 单元测试

**独立测试**
```bash
pnpm --filter @agent-ready/schema test -- surface
```

**验收标准**
- [ ] 非法 handle 格式被 Zod 拒绝
- [ ] 类型与 [sdk-api.md](../sdk-api.md) 一致

---

### P0-007: Schema — AgentError 与 AgentResult

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-005 |
| **包/应用** | `packages/schema` |

**范围**
- 做：`AgentErrorCode` 枚举、`AgentError`、`AgentResult<T>`、`ResultMeta`
- 不做：runtime 抛错逻辑

**产出**
- `src/types/result.ts` + 测试

**独立测试**
```bash
pnpm --filter @agent-ready/schema test -- result
```

**验收标准**
- [ ] 错误码与 architecture 文档 6 个 code 对齐
- [ ] discriminated union 收窄正常

---

### P0-008: Schema — Action / Observation 定义辅助

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-006, P0-007 |
| **包/应用** | `packages/schema` |

**范围**
- 做：`ActionDefinition`、`ObservationDefinition`、`defineAction`、`defineObservation`
- 不做：`validateAgentInput` 实现

**产出**
- `src/definitions.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/schema test -- definitions
```

**验收标准**
- [ ] `defineAction` 保留泛型推断
- [ ] `risk` / `idempotent` 可选字段

---

### P0-009: Schema — validateAgentInput

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-008 |
| **包/应用** | `packages/schema` |

**范围**
- 做：纯函数校验，失败返回 `AGENT_VALIDATION_FAILED`
- 不做：JSON Schema 导出

**产出**
- `src/validate.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/schema test -- validate
```

**验收标准**
- [ ] 成功路径返回 `{ success: true, data }`
- [ ] 失败含 Zod issue 摘要（可控长度）

---

### P0-010: Schema — toJsonSchema + 快照测试

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P0-008 |
| **包/应用** | `packages/schema` |

**范围**
- 做：`toJsonSchema(zodSchema)`，Vitest snapshot 锁定示例 Action input
- 不做：支持所有 Zod 边缘类型（文档列出限制）

**产出**
- `src/json-schema.ts` + `__snapshots__`

**独立测试**
```bash
pnpm --filter @agent-ready/schema test -- json-schema
```

**验收标准**
- [ ] snapshot 变更需显式 review
- [ ] 至少 3 个 fixture schema

---

### P0-011: 脚手架 `@agent-ready/runtime` 包

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-005, P0-003 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：包结构、依赖 `@agent-ready/schema` only、tsup、**禁止** react 依赖
- 不做：registry 逻辑

**产出**
- 空 runtime 可 build

**独立测试**
```bash
pnpm --filter @agent-ready/runtime build && ! grep -q '"react"' packages/runtime/package.json
```

**验收标准**
- [ ] `package.json` 无 react
- [ ] `pnpm why react` 在 runtime 包内为空

---

### P0-012: Runtime — Surface Registry

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-011, P0-006 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`registerSurface` / 注销、handle 唯一性冲突检测（dev throw）
- 不做：Catalog 查询

**产出**
- `src/registry/surface.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- registry.surface
```

**验收标准**
- [ ] 重复 handle 注册失败
- [ ] unregister 后 get 不到

---

### P0-013: Runtime — Action Registry

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-012, P0-008 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：按 handle 挂载多 action、注销
- 不做：invoke 执行

**产出**
- `src/registry/action.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- registry.action
```

**验收标准**
- [ ] 同 handle 下 action name 唯一
- [ ] 卸载 surface 时级联移除 actions（或显式失败策略文档化）

---

### P0-014: Runtime — createAgentRuntime 工厂

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-012, P0-013 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`createAgentRuntime(config)` 组装 registry、config 默认值
- 不做：Policy

**产出**
- `src/runtime.ts` 公共入口

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- runtime.factory
```

**验收标准**
- [ ] 导出 `AgentRuntime` 接口与 sdk-api 对齐
- [ ] `scheduler` 可注入

---

### P0-015: Runtime — Catalog 扁平列表

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-014 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`getCatalog({ limit, cursor })` 扁平 `surfaces[]`（Phase 0 无树）
- 不做：`toPromptContext`

**产出**
- `src/catalog/index.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- catalog
```

**验收标准**
- [ ] 分页 cursor 稳定
- [ ] 空 registry 返回 `{ surfaces: [], total: 0 }`

---

### P0-016: Runtime — Action Executor（无 Policy）

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P0-013, P0-009, P0-014 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`invokeAction`：校验 input → 调 handler → `AgentResult`；`NOT_FOUND` / `VALIDATION_FAILED` / `HANDLER_ERROR`
- 不做：Policy、timeout

**产出**
- `src/executor/action.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- executor
```

**验收标准**
- [ ] 成功返回 `ok: true` + `meta.durationMs`
- [ ] handler 抛错映射 `AGENT_HANDLER_ERROR`

---

### P0-017: Runtime — 类型安全 Event Bus

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-014 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`on('action:invoked', ...)` 等事件；`runtime.on` 公开
- 不做：observability 包

**产出**
- `src/events.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- events
```

**验收标准**
- [ ] unsubscribe 不泄漏监听器
- [ ] 至少 3 种事件类型有测试

---

### P0-018: 脚手架 `@agent-ready/testing`

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-014 |
| **包/应用** | `packages/testing` |

**范围**
- 做：包结构、`createTestRuntime()` 复用 `createAgentRuntime`
- 不做：RTL 集成

**产出**
- `packages/testing` 可 build

**独立测试**
```bash
pnpm --filter @agent-ready/testing test
```

**验收标准**
- [ ] 测试内可创建独立 runtime 实例

---

### P0-019: Testing — createMockAgent

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-018, P0-016 |
| **包/应用** | `packages/testing` |

**范围**
- 做：`invoke` / `listCatalog` 封装 Mock Agent session
- 不做：`renderWithAgentReady`

**产出**
- `src/mock-agent.ts`

**独立测试**
```bash
pnpm --filter @agent-ready/testing test -- mock-agent
```

**验收标准**
- [ ] 与 P0-016 executor 集成测试通过

---

### P0-020: CI — GitHub Actions 基础流水线

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-002, P0-005, P0-011 |
| **包/应用** | `.github/workflows` |

**范围**
- 做：`ci.yml`：pnpm install → turbo lint/test/build/typecheck
- 不做：npm publish

**产出**
- CI workflow 文件

**独立测试**
```bash
# 本地 act 可选；PR 上 CI 绿即为验收
pnpm lint && pnpm test && pnpm build
```

**验收标准**
- [ ] PR 触发 CI
- [ ] Node 20 matrix（单版本即可）

---

### P0-021: CI — Are The Types Wrong 检查

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-005, P0-011, P0-020 |
| **包/应用** | root |

**范围**
- 做：`attw --pack` 对 schema + runtime
- 不做：全部包

**产出**
- `pnpm attw` 脚本 + CI step

**独立测试**
```bash
pnpm attw
```

**验收标准**
- [ ] exports.types 与 import 解析无 error

---

### P0-022: Changesets 版本管理初始化

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-001 |
| **包/应用** | `tooling/changeset` |

**范围**
- 做：`.changeset/config.json`、lockstep 组（schema/runtime/react 占位）
- 不做：实际发布

**产出**
- `pnpm changeset` 可用

**独立测试**
```bash
pnpm changeset status
```

**验收标准**
- [ ] README 说明如何写 changeset

---

## Phase 0 完成检查

- [ ] P0-001 … P0-022 全部验收
- [ ] roadmap Phase 0 退出标准三项满足

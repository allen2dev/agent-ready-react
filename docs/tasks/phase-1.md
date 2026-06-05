# Phase 1 — Agent Surface（v0.1 alpha）

> **Phase 目标**：React 注册 Surface/Action + Policy defaultDeny + playground + alpha  
> **依赖 Phase**：Phase 0 完成（P0-022）

---

### P1-001: 脚手架 `@agent-ready/react` 包

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-011, P0-003 |
| **包/应用** | `packages/react` |

**范围**
- 做：peer `react`/`react-dom`、tsup、依赖 runtime + schema
- 不做：Hooks

**独立测试**
```bash
pnpm --filter @agent-ready/react build
```

**验收标准**
- [ ] 不依赖 bridge/mcp

---

### P1-002: React — AgentReadyProvider 与 Context

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-001, P0-014 |
| **包/应用** | `packages/react` |

**范围**
- 做：注入/创建 runtime、session context
- 不做：Hooks

**产出**
- `src/provider/AgentReadyProvider.tsx`

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- provider
```

**验收标准**
- [ ] 子组件可 `useAgentReadyContext`
- [ ] 可传入外部 `runtime` 实例

---

### P1-003: React — useAgentSurface

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-002, P0-012 |
| **包/应用** | `packages/react` |

**范围**
- 做：mount 注册 / unmount 注销、`updateManifest`
- 不做：Action

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- useAgentSurface
```

**验收标准**
- [ ] 卸载后 catalog 不含该 handle

---

### P1-004: React — useAgentAction

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P1-003, P0-013, P0-016 |
| **包/应用** | `packages/react` |

**范围**
- 做：注册 handler + AbortSignal；stable callback（`useEffectEvent` 或 ref 模式）
- 不做：Policy UI

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- useAgentAction
```

**验收标准**
- [ ] MockAgent invoke 触发 handler
- [ ] 重渲染不重复注册

---

### P1-005: React — AgentBoundary

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-002 |
| **包/应用** | `packages/react` |

**范围**
- 做：错误边界隔离子树，可选 `onError`
- 不做：DevTools

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- AgentBoundary
```

**验收标准**
- [ ] 子树 throw 不影响兄弟 Surface 注册

---

### P1-006: Runtime — Policy 引擎 defaultDeny

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-016 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`PolicyConfig.mode: defaultDeny`、无 rule 时拒绝
- 不做：OIDC

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- policy.defaultDeny
```

**验收标准**
- [ ] 未配置 allow 时 `AGENT_POLICY_DENIED`

---

### P1-007: Runtime — PolicyProvider 与 role rules

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P1-006 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`PolicyProvider` 接口、静态 `rules[]` 按 role 匹配
- 不做：租户 allowlist

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- policy.roles
```

**验收标准**
- [ ] `roles: ['admin']` 可访问标记为 admin 的 action

---

### P1-008: Runtime — invokeAction 集成 Policy

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-007, P0-016 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：Policy 求值在 validate 之后、handler 之前
- 不做：observation policy

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- invoke.policy
```

**验收标准**
- [ ] 拒绝时不调用 handler

---

### P1-009: 契约测试 — invoke 成功路径

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-004, P1-008, P0-019 |
| **包/应用** | `packages/testing` |

**范围**
- 做：1 个 e2e 风格测试：register → invoke → ok
- 不做：其他失败场景

**独立测试**
```bash
pnpm --filter @agent-ready/testing test -- contract.success
```

**验收标准**
- [ ] 覆盖 sdk-api 成功响应形状

---

### P1-010: 契约测试 — VALIDATION_FAILED

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-009 |
| **包/应用** | `packages/testing` |

**范围**
- 做：非法 input 断言 error code
- 不做：Policy

**独立测试**
```bash
pnpm --filter @agent-ready/testing test -- contract.validation
```

**验收标准**
- [ ] `code === AGENT_VALIDATION_FAILED`

---

### P1-011: 契约测试 — POLICY_DENIED

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-009, P1-008 |
| **包/应用** | `packages/testing` |

**独立测试**
```bash
pnpm --filter @agent-ready/testing test -- contract.policy
```

**验收标准**
- [ ] defaultDeny 下无 role 拒绝

---

### P1-012: 契约测试 — 卸载后 NOT_FOUND

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-009, P1-003 |
| **包/应用** | `packages/testing` |

**范围**
- 做：RTL 挂载/卸载组件后 invoke
- 不做：playground

**独立测试**
```bash
pnpm --filter @agent-ready/testing test -- contract.unmount
```

**验收标准**
- [ ] `AGENT_SURFACE_NOT_FOUND`

---

### P1-013: 脚手架 `@agent-ready/cli`

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-005 |
| **包/应用** | `packages/cli` |

**范围**
- 做：`bin/agent-ready`、commander 或 citty 骨架
- 不做：子命令逻辑

**独立测试**
```bash
pnpm --filter @agent-ready/cli build && node packages/cli/dist/index.js --help
```

**验收标准**
- [ ] `--help` 输出

---

### P1-014: CLI — validate 子命令 MVP

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P1-013, P0-010 |
| **包/应用** | `packages/cli` |

**范围**
- 做：校验 JSON manifest 文件 against schema
- 不做：与 runtime 注册对比

**独立测试**
```bash
pnpm --filter @agent-ready/cli test && agent-ready validate fixtures/valid.json
```

**验收标准**
- [ ] 非法 JSON 退出码非 0

---

### P1-015: 脚手架 `apps/playground`（Vite + React）

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-001 |
| **包/应用** | `apps/playground` |

**范围**
- 做：Vite 配置、链接 workspace 包
- 不做：Agent 演示

**独立测试**
```bash
pnpm --filter playground dev --host 2>&1 | head -5
```

**验收标准**
- [ ] 本地可启动

---

### P1-016: Playground — Surface 注册面板

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-015, P1-003 |
| **包/应用** | `apps/playground` |

**范围**
- 做：展示 live catalog 列表（只读）
- 不做：invoke UI

**独立测试**
```bash
pnpm --filter playground build
```

**验收标准**
- [ ] 页面列出 ≥1 个 surface handle

---

### P1-017: Playground — Action invoke 与错误展示

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P1-016, P1-004, P1-008 |
| **包/应用** | `apps/playground` |

**范围**
- 做：按钮触发 invoke；展示成功/失败 JSON
- 不做：Observation

**独立测试**
```bash
# 手动：点击 invoke 见结果；或 Playwright smoke（可选）
pnpm --filter playground build
```

**验收标准**
- [ ] 成功与 Policy 拒绝可复现

---

### P1-018: README Quick Start 文档

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P1-017 |
| **包/应用** | root `README.md` |

**范围**
- 做：安装、最小 Provider + 2 hooks 示例
- 不做：完整 API 列表

**独立测试**
```bash
# 人工：按 README 步骤在新目录 copy 示例可理解
```

**验收标准**
- [ ] 示例代码与 sdk-api 一致

---

### P1-019: Runtime — toPromptContext 基础版

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-015 |
| **包/应用** | `packages/runtime` |

**范围**
- 做：`tier: summary` 文本序列化 catalog
- 不做：token budget 算法

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- prompt
```

**验收标准**
- [ ] 输出非空字符串且含 handle 列表

---

### P1-020: Alpha 发布配置（npm beta tag）

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P0-022, P1-001, P0-005, P0-011 |
| **包/应用** | `.github/workflows` |

**范围**
- 做：`release.yml` + changeset publish 文档；`publishConfig.access: public`
- 不做：实际首次 publish（可用 dry-run）

**独立测试**
```bash
pnpm changeset version --snapshot alpha && pnpm -r publish --dry-run
```

**验收标准**
- [ ] dry-run 显示 @agent-ready/schema 等包名

---

## Phase 1 完成检查

- [ ] 契约测试 ≥4 场景（P1-009 … P1-012）
- [ ] playground 端到端 invoke（P1-017）
- [ ] roadmap Phase 1 退出标准

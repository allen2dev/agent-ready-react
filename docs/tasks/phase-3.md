# Phase 3 — Platform Scale（v0.3 rc）

> **Phase 目标**：MCP Server、RSC manifest、Observation stream、OTel、rc 发布  
> **依赖 Phase**：Phase 2 完成

---

### P3-001: 脚手架 `@agent-ready/mcp`

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P0-014, P2-017 |
| **包/应用** | `packages/mcp` |

**范围**
- 做：依赖 `@modelcontextprotocol/sdk`、连接 runtime
- 不做：tool 映射

**独立测试**
```bash
pnpm --filter @agent-ready/mcp build
```

**验收标准**
- [ ] SDK 版本 pin 在 package.json

---

### P3-002: MCP — tools/list 映射 Catalog

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P3-001, P0-015, P0-010 |
| **包/应用** | `packages/mcp` |

**独立测试**
```bash
pnpm --filter @agent-ready/mcp test -- tools.list
```

**验收标准**
- [ ] 每个 action 对应一个 tool，含 inputSchema

---

### P3-003: MCP — tools/call 映射 invokeAction

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P3-002, P1-008 |
| **包/应用** | `packages/mcp` |

**独立测试**
```bash
pnpm --filter @agent-ready/mcp test -- tools.call
```

**验收标准**
- [ ] 成功/失败结构与 AgentResult 一致

---

### P3-004: MCP — resources/read 映射 Observation

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P3-001, P2-002 |
| **包/应用** | `packages/mcp` |

**独立测试**
```bash
pnpm --filter @agent-ready/mcp test -- resources.read
```

**验收标准**
- [ ] URI 格式 `agent://observation/{handle}/{name}`

---

### P3-005: MCP — stdio 传输启动器

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P3-003 |
| **包/应用** | `packages/mcp` |

**范围**
- 做：`createMcpStdioServer(runtime)` CLI 入口
- 不做：SSE

**独立测试**
```bash
pnpm --filter @agent-ready/mcp test -- stdio
# 或 echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node ...
```

**验收标准**
- [ ] 可手动 list tools

---

### P3-006: MCP — SSE 传输启动器

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P3-005 |
| **包/应用** | `packages/mcp` |

**独立测试**
```bash
pnpm --filter @agent-ready/mcp test -- sse
```

**验收标准**
- [ ] 本地 HTTP 端口可连接

---

### P3-007: Runtime — subscribeObservation stream

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-003, P0-017 |
| **包/应用** | `packages/runtime` |

**独立测试**
```bash
pnpm --filter @agent-ready/runtime test -- subscribe
```

**验收标准**
- [ ] unsubscribe 停止推送

---

### P3-008: React RSC — declareAgentManifest

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-001, P0-006 |
| **包/应用** | `packages/react` → `@agent-ready/react/rsc` |

**范围**
- 做：服务端收集静态 manifest 列表
- 不做：Client Action

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- rsc.declare
```

**验收标准**
- [ ] 导出路径 `react/rsc` 独立

---

### P3-009: React RSC — serializeAgentManifests

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P3-008 |
| **包/应用** | `packages/react/rsc` |

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- rsc.serialize
```

**验收标准**
- [ ] 输出可嵌入 `<script type="application/json">`

---

### P3-010: React RSC — Provider hydration 合并 manifest

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P3-009, P1-002 |
| **包/应用** | `packages/react` |

**独立测试**
```bash
pnpm --filter @agent-ready/react test -- rsc.hydration
```

**验收标准**
- [ ] 服务端声明 + 客户端注册不冲突

---

### P3-011: Observability — OpenTelemetry span 集成

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P2-007 |
| **包/应用** | `packages/observability` |

**范围**
- 做：可选 peer `@opentelemetry/api`；`agent.action.invoke` span
- 不做：exporter 配置

**独立测试**
```bash
pnpm --filter @agent-ready/observability test -- otel
```

**验收标准**
- [ ] 无 OTel 时 tree-shake / no-op

---

### P3-012: CLI — codegen mcp 子命令

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-014, P3-002 |
| **包/应用** | `packages/cli` |

**独立测试**
```bash
pnpm --filter @agent-ready/cli test -- codegen.mcp
```

**验收标准**
- [ ] 生成 `mcp-tools.json` golden 对比

---

### P3-013: CLI — codegen docs 子命令

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P1-014, P0-010 |
| **包/应用** | `packages/cli` |

**独立测试**
```bash
pnpm --filter @agent-ready/cli test -- codegen.docs
```

**验收标准**
- [ ] 从 schema 生成 Markdown 表

---

### P3-014: 脚手架 `apps/mcp-server-demo`

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P3-005 |
| **包/应用** | `apps/mcp-server-demo` |

**范围**
- 做：最小 runtime + 2 actions；README 联调步骤
- 不做：完整 playground 复制

**独立测试**
```bash
pnpm --filter mcp-server-demo start &
# MCP Inspector 连接说明在 README
```

**验收标准**
- [ ] README 含 Inspector 配置 JSON 片段

---

### P3-015: Kitchen-sink — Next.js App Router 示例页

| 属性 | 值 |
|------|-----|
| **估算** | 2h |
| **依赖** | P3-010, P1-004 |
| **包/应用** | `apps/kitchen-sink` |

**独立测试**
```bash
pnpm --filter kitchen-sink build
```

**验收标准**
- [ ] 1 个 RSC 页 + 1 个 Client Action 页

---

### P3-016: MCP Inspector 验收清单与 smoke 脚本

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P3-014, P3-006 |
| **包/应用** | `apps/mcp-server-demo` |

**范围**
- 做：`docs/checklists/mcp-inspector.md` + 可选自动化 smoke
- 不做：CI 真连 Inspector

**独立测试**
```bash
# 人工按 checklist 勾选；脚本 mock MCP 协议
pnpm --filter @agent-ready/mcp test -- inspector.smoke
```

**验收标准**
- [ ] checklist 覆盖 list/call/read

---

### P3-017: Playground — OTel span 演示开关

| 属性 | 值 |
|------|-----|
| **估算** | 1h |
| **依赖** | P3-011, P1-017 |
| **包/应用** | `apps/playground` |

**独立测试**
```bash
pnpm --filter playground build
```

**验收标准**
- [ ] 文档说明如何用 console exporter 查看 span

---

### P3-018: RC 发布与 API 文档自动生成流水线

| 属性 | 值 |
|------|-----|
| **估算** | 1.5h |
| **依赖** | P3-013, P1-020 |
| **包/应用** | CI + `docs/api/` |

**独立测试**
```bash
pnpm codegen:docs && git diff --exit-code docs/api/  # 或首次生成
```

**验收标准**
- [ ] rc tag 发布文档更新 sdk-api 版本矩阵

---

## Phase 3 完成检查

- [ ] MCP list/call/read（P3-002 … P3-004）
- [ ] Next.js 示例（P3-015）
- [ ] Inspector checklist（P3-016）

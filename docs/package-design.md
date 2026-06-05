# Agent Ready React SDK — Monorepo 与模块边界

> **版本**: 0.1.0-draft  
> **包管理器**: pnpm 9+  
> **构建编排**: Turborepo 2+

## 1. Monorepo 目录结构

```
agent-ready-react/
├── apps/
│   ├── playground/                 # 交互式文档站（非业务，仅 SDK 演示）
│   ├── kitchen-sink/               # 集成测试用示例应用
│   └── mcp-server-demo/            # 本地 MCP Server 联调
│
├── packages/
│   ├── schema/                     # @agent-ready/schema
│   ├── runtime/                    # @agent-ready/runtime
│   ├── react/                      # @agent-ready/react
│   ├── observability/              # @agent-ready/observability
│   ├── bridge/                     # @agent-ready/bridge
│   ├── mcp/                        # @agent-ready/mcp
│   ├── testing/                    # @agent-ready/testing
│   ├── devtools/                   # @agent-ready/devtools
│   ├── eslint-plugin/              # eslint-plugin-agent-ready
│   └── cli/                        # @agent-ready/cli
│
├── tooling/
│   ├── tsconfig/                   # 共享 TS 配置
│   ├── vitest-config/              # 共享测试配置
│   └── changeset/                  # 版本与 CHANGELOG
│
├── docs/                           # 架构与 API 文档（本目录）
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

### 1.1 Workspace 配置（`pnpm-workspace.yaml`）

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

### 1.2 Turborepo 任务图（`turbo.json` 摘要）

| Task | dependsOn | outputs |
|------|-----------|---------|
| `build` | `^build` | `dist/**` |
| `test` | `^build` | coverage |
| `lint` | — | — |
| `typecheck` | `^build` | — |
| `validate` | `build` | — |

---

## 2. 包清单与依赖矩阵

### 2.1 发布包（Public API）

| 包名 | npm scope | 描述 | 运行时环境 |
|------|-----------|------|------------|
| schema | `@agent-ready/schema` | 类型、Zod、JSON Schema 生成 | Universal |
| runtime | `@agent-ready/runtime` | 注册表、执行器、策略 | Browser / Node |
| react | `@agent-ready/react` | React Provider、Hooks | Browser (Client) |
| observability | `@agent-ready/observability` | OTel、事件、脱敏 | Universal |
| bridge | `@agent-ready/bridge` | HTTP / WebSocket 传输 | Node / Edge |
| mcp | `@agent-ready/mcp` | MCP Server 适配 | Node |
| testing | `@agent-ready/testing` | 测试工具、Mock Agent | Node / Vitest |
| devtools | `@agent-ready/devtools` | 浏览器面板 | Browser (Dev) |
| eslint-plugin | `eslint-plugin-agent-ready` | 静态规则 | Dev only |
| cli | `@agent-ready/cli` | 校验、Codegen | Node CLI |

### 2.2 依赖方向（强制单向）

```
                    ┌─────────────┐
                    │   schema    │  ← 零依赖（仅 zod 为 peer）
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌──────────────┐
        │ runtime  │ │observability│ │ eslint-plugin│
        └────┬─────┘ └─────┬─────┘ └──────────────┘
             │             │
     ┌───────┼───────┐     │
     ▼       ▼       ▼     │
 ┌───────┐ ┌────┐ ┌──────┐ │
 │ react │ │mcp │ │bridge│◄┘
 └───┬───┘ └──┬─┘ └──┬───┘
     │        │      │
     └────────┼──────┘
              ▼
        ┌──────────┐
        │ testing  │
        └──────────┘
              │
              ▼
        ┌──────────┐
        │   cli    │  ← 依赖 schema + 可选 runtime 类型
        └──────────┘
```

**禁止**：

- `schema` → 任何其他 `@agent-ready/*`
- `runtime` → `react`
- `react` → `bridge` | `mcp`（避免浏览器拉入 Node 传输层）

### 2.3 Peer Dependencies 策略

| 包 | peerDependencies |
|----|------------------|
| `@agent-ready/react` | `react ^18.3 \|\| ^19.0`, `react-dom` |
| `@agent-ready/schema` | `zod ^3.23 \|\| ^4.0`（optional 降级为 types-only） |
| `@agent-ready/observability` | `@opentelemetry/api` (optional) |
| `@agent-ready/mcp` | `@modelcontextprotocol/sdk` |

---

## 3. 模块边界详解

### 3.1 `@agent-ready/schema`

**职责边界**

- ✅ 定义 `SurfaceManifest`, `ActionDefinition`, `ObservationDefinition`, `AgentResult`, `AgentError`
- ✅ `zodToJsonSchema()`, `validateAgentInput()`
- ❌ 不包含注册表、不包含 React、不包含 IO

**导出面**

```ts
// 仅类型 + schema + 纯函数
export * from "./types";
export * from "./schemas";
export * from "./json-schema";
export * from "./errors";
```

---

### 3.2 `@agent-ready/runtime`

**职责边界**

- ✅ `AgentRuntime` 类：registry, catalog, executor, policy, snapshot
- ✅ 纯 JS 实现，通过 `setScheduler()` 适配环境
- ❌ 不 import `react`, `react-dom`
- ❌ 不实现 HTTP/MCP

**内部模块划分**

| 内部目录 | 职责 |
|----------|------|
| `registry/` | Surface/Action/Observation 的增删改查 |
| `catalog/` | 索引、搜索、分页、prompt 序列化 |
| `executor/` | Action 调用链、超时、重试策略 |
| `policy/` | 策略接口与默认实现 |
| `snapshot/` | Observation 聚合与 etag |
| `events/` | 类型安全 EventEmitter |

**公共入口**

```ts
export { createAgentRuntime, type AgentRuntime, type AgentRuntimeConfig };
```

---

### 3.3 `@agent-ready/react`

**职责边界**

- ✅ Provider、Hooks、Boundary、RSC manifest 辅助
- ✅ 将 React 生命周期映射到 runtime registry
- ❌ 不实现 Policy 存储（注入 `PolicyProvider`）
- ❌ 不实现 Bridge

**内部模块划分**

| 内部目录 | 职责 |
|----------|------|
| `provider/` | Context、runtime 单例/作用域 |
| `hooks/` | useAgentSurface, useAgentAction, useAgentObservation |
| `boundary/` | 错误边界与 Surface 隔离 |
| `rsc/` | Server Component manifest 序列化 |
| `ssr/` | Hydration 状态同步 |

---

### 3.4 `@agent-ready/observability`

**职责边界**

- ✅ Span、Metric、结构化日志、PII redaction middleware
- ✅ 订阅 runtime events 并导出
- ❌ 不修改业务状态

**与 runtime 的耦合方式**：事件订阅（listener），非 monkey-patch。

---

### 3.5 `@agent-ready/bridge` & `@agent-ready/mcp`

**职责边界**

| 能力 | bridge | mcp |
|------|--------|-----|
| HTTP JSON-RPC | ✅ | — |
| WebSocket | ✅（可选） | — |
| MCP stdio/SSE | — | ✅ |
| Auth middleware | ✅ | ✅ |

二者共享 `@agent-ready/bridge-core`（可选内部包，**不对外发布**）若协议转换重复度高。

---

### 3.6 `@agent-ready/testing`

**职责边界**

- ✅ `createTestRuntime()`, `createMockAgent()`, `invokeAction()`
- ✅ `@testing-library/react` 集成的 `renderWithAgentReady()`
- ❌ 不发布到生产依赖树（`devDependencies` 导向）

---

### 3.7 `@agent-ready/devtools`

**职责边界**

- ✅ 展示 Catalog、最近 Action、Policy 决策
- ✅ 通过 `window.__AGENT_READY_DEVTOOLS__` 钩子连接
- ❌ 生产环境默认不加载（动态 import）

---

### 3.8 `@agent-ready/cli` & `eslint-plugin-agent-ready`

**cli**

- `agent-ready validate` — manifest vs built artifacts
- `agent-ready codegen mcp` — 生成 MCP tool JSON
- `agent-ready codegen docs` — 生成 API 表

**eslint-plugin**

- `agent-ready/require-surface-for-interactive` — 可点击元素需注册
- `agent-ready/no-raw-handle` — 禁止硬编码 magic string
- `agent-ready/schema-sync` — Zod 与 JSON Schema 漂移检测

---

## 4. 包构建与导出规范

### 4.1 构建工具

| 工具 | 用途 |
|------|------|
| **tsup** | 各 package 双格式输出 ESM + CJS |
| **unbuild**（备选） | 复杂包的条件 exports |
| **arethetypeswrong** | CI 检查 exports 正确性 |

### 4.2 `package.json` exports 模板

```json
{
  "name": "@agent-ready/react",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./rsc": {
      "import": "./dist/rsc.js",
      "types": "./dist/rsc.d.ts"
    }
  },
  "sideEffects": false
}
```

### 4.3 条件导出约定

| 子路径 | 包 | 说明 |
|--------|-----|------|
| `@agent-ready/react` | react | 主入口 |
| `@agent-ready/react/rsc` | react | Server Components 辅助 |
| `@agent-ready/runtime/testing` | runtime | 轻量测试 helper（不依赖 testing 包） |

---

## 5. 版本与发布策略

### 5.1 SemVer 规则

- **MAJOR**：公共 API 破坏性变更、Handle 格式变更、默认 Policy 收紧
- **MINOR**：新 Hook、新 Action 类型、向后兼容的 runtime 能力
- **PATCH**：Bugfix、性能

### 5.2 固定版本组（Changesets）

```
@agent-ready/schema
@agent-ready/runtime      } 同版本号发布（lockstep）
@agent-ready/react
```

`bridge`, `mcp`, `devtools` 可独立版本。

### 5.3 发布渠道

| 标签 | 用途 |
|------|------|
| `latest` | 稳定版 |
| `beta` | 预发布功能 |
| `canary` | 每 main commit（可选） |

---

## 6. 应用（apps）边界

| App | 目的 | 是否发布 npm |
|-----|------|--------------|
| `playground` | 文档 + 交互示例 | 否 |
| `kitchen-sink` | e2e / 视觉回归 | 否 |
| `mcp-server-demo` | MCP 联调 | 否 |

**原则**：`apps/*` 可依赖所有 `packages/*`，但 **packages 不得依赖 apps**。

---

## 7. 跨包契约测试

```
packages/runtime  ←── contract tests ──→  packages/react
packages/schema   ←── schema snapshot ──→  packages/cli
packages/mcp      ←── golden files ──→     tooling/fixtures/mcp
```

CI 任务：`turbo run test contract validate`

---

## 8. 模块边界检查清单（PR Review）

- [ ] 新增依赖是否违反依赖矩阵？
- [ ] 是否在 `schema` 以外重复定义类型？
- [ ] React 是否泄漏进 `runtime`？
- [ ] Bridge 是否被 `react` 主入口意外 re-export？
- [ ] 公共 API 是否经 `exports` 显式声明？
- [ ] 是否附带 changeset？

---

## 9. 相关文档

- [architecture.md](./architecture.md)
- [sdk-api.md](./sdk-api.md)
- [roadmap.md](./roadmap.md)

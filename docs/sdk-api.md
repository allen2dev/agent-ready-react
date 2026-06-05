# Agent Ready React SDK — 公共 API 契约

> **版本**: 0.1.0-draft  
> **稳定性**: Phase 0 设计稿；实现前可能调整，破坏性变更通过 ADR 记录

本文档定义 **Agent 集成方** 与 **应用开发者** 共同依赖的稳定 API 面。实现细节以 TypeScript 类型为准。

---

## 1. API 分层总览

| 层级 | 入口 | 消费者 |
|------|------|--------|
| L0 Schema | `@agent-ready/schema` | 全员 |
| L1 Runtime | `@agent-ready/runtime` | 高级集成、Node 测试 |
| L2 React | `@agent-ready/react` | React 应用开发者 |
| L3 Bridge | `@agent-ready/bridge` | 平台、Agent 网关 |
| L4 MCP | `@agent-ready/mcp` | MCP Client |

---

## 2. `@agent-ready/schema`

### 2.1 核心类型

```typescript
/** 稳定寻址符 */
type AgentHandle = `${string}://${string}/${string}/${string}`;

type AgentCapabilityKind = "read" | "act" | "subscribe";

interface SurfaceManifest {
  handle: AgentHandle;
  title: string;
  description?: string;
  capabilities: AgentCapabilityKind[];
  version?: number;
  tags?: string[];
  /** 父 Surface，用于 Catalog 树 */
  parentHandle?: AgentHandle;
}

interface ActionDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  input: ZodSchema<TInput>;
  output?: ZodSchema<TOutput>;
  /** 副作用级别，供 Policy 默认规则使用 */
  risk?: "low" | "medium" | "high";
  idempotent?: boolean;
}

interface ObservationDefinition<T = unknown> {
  name: string;
  description: string;
  schema: ZodSchema<T>;
  /** 快照最大字节数（JSON 序列化后） */
  maxBytes?: number;
  refresh?: "push" | "pull" | "both";
}

type AgentErrorCode =
  | "AGENT_SURFACE_NOT_FOUND"
  | "AGENT_ACTION_NOT_FOUND"
  | "AGENT_VALIDATION_FAILED"
  | "AGENT_POLICY_DENIED"
  | "AGENT_HANDLER_ERROR"
  | "AGENT_RATE_LIMITED"
  | "AGENT_TIMEOUT";

interface AgentError {
  code: AgentErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

type AgentResult<T> =
  | { ok: true; data: T; meta?: ResultMeta }
  | { ok: false; error: AgentError };

interface ResultMeta {
  durationMs: number;
  etag?: string;
  traceId?: string;
}
```

### 2.2 工具函数

```typescript
function defineAction<TIn, TOut>(def: ActionDefinition<TIn, TOut>): ActionDefinition<TIn, TOut>;

function defineObservation<T>(def: ObservationDefinition<T>): ObservationDefinition<T>;

function toJsonSchema(schema: ZodSchema): JSONSchema7;

function validateAgentInput<T>(
  schema: ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: AgentError };
```

---

## 3. `@agent-ready/runtime`

### 3.1 创建 Runtime

```typescript
interface AgentRuntimeConfig {
  defaultPolicy?: PolicyConfig;
  scheduler?: (fn: () => void) => void;
  logger?: AgentLogger;
  maxCatalogEntries?: number;
  actionTimeoutMs?: number;
}

function createAgentRuntime(config?: AgentRuntimeConfig): AgentRuntime;
```

### 3.2 `AgentRuntime` 方法

```typescript
interface AgentRuntime {
  // —— 注册 ——
  registerSurface(entry: RegisteredSurface): () => void;
  registerAction(handle: AgentHandle, action: RegisteredAction): () => void;
  registerObservation(handle: AgentHandle, obs: RegisteredObservation): () => void;

  // —— 目录 ——
  getCatalog(query?: CatalogQuery): AgentCatalog;
  toPromptContext(options?: PromptContextOptions): string;

  // —— 执行 ——
  invokeAction<T = unknown>(request: InvokeActionRequest): Promise<AgentResult<T>>;
  readObservation(request: ReadObservationRequest): Promise<AgentResult<unknown>>;
  subscribeObservation(
    request: SubscribeObservationRequest,
    onUpdate: (snapshot: ObservationSnapshot) => void
  ): () => void;

  // —— 策略 ——
  setPolicyProvider(provider: PolicyProvider): void;

  // —— 事件 ——
  on<E extends AgentRuntimeEvent>(
    event: E,
    listener: (payload: AgentRuntimeEventMap[E]) => void
  ): () => void;
}
```

### 3.3 请求/响应形状

```typescript
interface InvokeActionRequest {
  handle: AgentHandle;
  action: string;
  input: unknown;
  /** Agent 会话上下文，供 Policy 使用 */
  context?: AgentSessionContext;
}

interface CatalogQuery {
  scope?: string;
  tags?: string[];
  capability?: AgentCapabilityKind;
  cursor?: string;
  limit?: number;
}

interface AgentCatalog {
  surfaces: CatalogSurfaceSummary[];
  total: number;
  cursor?: string;
}

interface CatalogSurfaceSummary {
  handle: AgentHandle;
  title: string;
  capabilities: AgentCapabilityKind[];
  actions: string[];
  observations: string[];
}

interface AgentSessionContext {
  sessionId: string;
  roles?: string[];
  metadata?: Record<string, string>;
}
```

### 3.4 Policy API

```typescript
interface PolicyProvider {
  canInvokeAction(ctx: PolicyContext): Promise<boolean | AgentError>;
  canReadObservation(ctx: PolicyContext): Promise<boolean | AgentError>;
}

interface PolicyConfig {
  mode: "defaultDeny" | "defaultAllow";
  rules?: PolicyRule[];
}
```

---

## 4. `@agent-ready/react`

### 4.1 Provider

```tsx
interface AgentReadyProviderProps {
  runtime?: AgentRuntime;
  config?: AgentRuntimeConfig;
  session?: AgentSessionContext;
  policy?: PolicyProvider;
  children: React.ReactNode;
}

function AgentReadyProvider(props: AgentReadyProviderProps): JSX.Element;
```

**约定**：每个 React 根（或微前端子应用）一个 Provider；嵌套 Provider 使用 `scope` 隔离 Catalog。

### 4.2 `useAgentSurface`

```typescript
function useAgentSurface(manifest: SurfaceManifest): {
  handle: AgentHandle;
  updateManifest: (patch: Partial<SurfaceManifest>) => void;
};
```

- 在 `useEffect` 中注册，unmount 自动注销
- `manifest.handle` 必须在整个应用中唯一（冲突时 dev 抛错，prod 上报）

### 4.3 `useAgentAction`

```typescript
function useAgentAction<TIn, TOut>(
  action: ActionDefinition<TIn, TOut>,
  handler: (input: TIn, ctx: ActionHandlerContext) => Promise<TOut> | TOut
): void;
```

```typescript
interface ActionHandlerContext {
  handle: AgentHandle;
  session: AgentSessionContext | undefined;
  signal: AbortSignal;
}
```

### 4.4 `useAgentObservation`

```typescript
function useAgentObservation<T>(
  definition: ObservationDefinition<T>,
  selector: () => T,
  options?: {
    debounceMs?: number;
    equalityFn?: (a: T, b: T) => boolean;
  }
): void;
```

- `selector` 在每次 React render 后由 runtime 拉取（受 debounce 约束）
- 禁止在 selector 内产生副作用

### 4.5 `useAgentCatalog`（宿主 / 调试）

```typescript
function useAgentCatalog(query?: CatalogQuery): AgentCatalog;
```

### 4.6 `AgentBoundary`

```tsx
interface AgentBoundaryProps {
  handle: AgentHandle;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  children: React.ReactNode;
}

function AgentBoundary(props: AgentBoundaryProps): JSX.Element;
```

### 4.7 RSC 辅助（`@agent-ready/react/rsc`）

```typescript
/** 在 Server Component 中声明静态 manifest（无 handler） */
function declareAgentManifest(manifest: SurfaceManifest): void;

/** 序列化到客户端 hydration */
function serializeAgentManifests(): string;
```

客户端 Provider 通过 `manifests` prop 合并服务端声明。

---

## 5. `@agent-ready/bridge` — JSON-RPC 映射

### 5.1 方法列表

| Method | 说明 |
|--------|------|
| `agent.catalog.list` | 等价 `getCatalog` |
| `agent.catalog.prompt` | 等价 `toPromptContext` |
| `agent.action.invoke` | 等价 `invokeAction` |
| `agent.observation.read` | 等价 `readObservation` |
| `agent.observation.subscribe` | SSE/WebSocket 推送 |

### 5.2 请求示例

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "agent.action.invoke",
  "params": {
    "handle": "crm://deals/detail-panel/deal-9281",
    "action": "updateStage",
    "input": { "stage": "negotiation" },
    "context": { "sessionId": "sess_abc", "roles": ["sales"] }
  }
}
```

### 5.3 响应示例

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "ok": true,
    "data": { "stage": "negotiation" },
    "meta": { "durationMs": 42, "traceId": "tr_xyz" }
  }
}
```

---

## 6. `@agent-ready/mcp` — Tool 映射约定

| MCP Concept | SDK 映射 |
|-------------|----------|
| Tool name | `{handle}::{action}`（URL 编码） |
| Tool description | `ActionDefinition.description` |
| inputSchema | `toJsonSchema(action.input)` |
| Tool call | `invokeAction` |
| Resource URI | `agent://observation/{handle}/{name}` |
| Resource read | `readObservation` |

---

## 7. `@agent-ready/testing`

```typescript
function createTestRuntime(config?: AgentRuntimeConfig): AgentRuntime;

function createMockAgent(runtime: AgentRuntime, session?: AgentSessionContext): {
  invoke: (req: InvokeActionRequest) => Promise<AgentResult<unknown>>;
  read: (req: ReadObservationRequest) => Promise<AgentResult<unknown>>;
  listCatalog: (query?: CatalogQuery) => AgentCatalog;
};

function renderWithAgentReady(
  ui: React.ReactElement,
  options?: { config?: AgentRuntimeConfig; session?: AgentSessionContext }
): RenderResult & { runtime: AgentRuntime; agent: ReturnType<typeof createMockAgent> };
```

---

## 8. 应用开发者最小示例

```tsx
import { AgentReadyProvider, useAgentSurface, useAgentAction } from "@agent-ready/react";
import { defineAction } from "@agent-ready/schema";
import { z } from "zod";

const submitForm = defineAction({
  name: "submitForm",
  description: "Submit the contact form",
  input: z.object({ email: z.string().email() }),
  risk: "medium",
});

function ContactForm() {
  useAgentSurface({
    handle: "marketing://forms/contact/main",
    title: "Contact Form",
    capabilities: ["act"],
  });

  useAgentAction(submitForm, async (input) => {
    // 业务逻辑由应用实现
    await api.submitContact(input);
    return { submitted: true };
  });

  return <form>{/* ... */}</form>;
}

export function App() {
  return (
    <AgentReadyProvider session={{ sessionId: "web-1" }}>
      <ContactForm />
    </AgentReadyProvider>
  );
}
```

---

## 9. Agent 集成方最小示例（MCP / Bridge）

```typescript
// 伪代码：外部 Agent 循环
const catalog = await client.call("agent.catalog.list", { limit: 50 });
const prompt = await client.call("agent.catalog.prompt", { tier: "summary" });

// Planner 选择 action 后
const result = await client.call("agent.action.invoke", {
  handle: "marketing://forms/contact/main",
  action: "submitForm",
  input: { email: "user@example.com" },
  context: { sessionId: agentSessionId, roles: ["agent-bot"] },
});

if (!result.ok) {
  // 根据 result.error.code 重试或求助人类
}
```

---

## 10. 稳定性与废弃策略

| API 状态 | 含义 |
|----------|------|
| `stable` | SemVer 保护 |
| `experimental` | 可能变更，需 opt-in 导入路径 |
| `deprecated` | 保留至少一个 MINOR 周期，控制台 warning |

**Experimental 导入示例**：

```ts
import { useAgentTransaction } from "@agent-ready/react/experimental";
```

---

## 11. 版本能力矩阵（目标）

| 能力 | v0.1 | v0.2 | v0.3 | v1.0 |
|------|------|------|------|------|
| Surface/Action 注册 | ✅ | ✅ | ✅ | ✅ |
| Observation | — | ✅ | ✅ | ✅ |
| Policy defaultDeny | ✅ | ✅ | ✅ | ✅ |
| MCP Server | — | ✅ | ✅ | ✅ |
| RSC manifest | — | — | ✅ | ✅ |
| Observation stream | — | — | ✅ | ✅ |
| DevTools | — | ✅ | ✅ | ✅ |

---

## 12. 相关文档

- [architecture.md](./architecture.md)
- [package-design.md](./package-design.md)
- [roadmap.md](./roadmap.md)

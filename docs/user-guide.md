# Agent Ready React SDK — 用户指南

> 在线阅读：[GitHub Pages 用户指南](https://allen2dev.github.io/agent-ready-react/)

## 项目简介

**Agent Ready React SDK** 是一套面向 React 应用的声明式元数据与运行时契约层。它让 AI Agent 能够：

- **发现** UI 中的可操作区域（Surface）
- **理解** 每个区域的 Schema 与语义
- **执行** 与用户意图等价的操作（Action）
- **订阅** 结构化状态快照（Observation）

SDK 不包含业务逻辑或 LLM 运行时，只提供注册、编目、校验、派发与治理机制。

## 核心优势

| 优势 | 说明 |
|------|------|
| Schema-first | 契约以 Zod / JSON Schema 为单一事实来源 |
| Opt-in | 未注册节点对 Agent 不可见 |
| 渐进式接入 | 按路由/Feature 切片接入 |
| 可治理 | Policy、OIDC、速率限制、审计日志 |
| 生态就绪 | MCP、OTel、CLI、Playground、Kitchen Sink |

## 包结构

- `@agent-ready/schema` — 类型与 Schema 工具
- `@agent-ready/runtime` — 注册表、Catalog、Action 路由
- `@agent-ready/react` — Provider、Hooks、RSC API
- `@agent-ready/mcp` — MCP 传输
- `@agent-ready/bridge` — HTTP 网关（可选）

## 快速开始

```bash
pnpm install
pnpm build
pnpm --filter playground dev
pnpm --filter kitchen-sink dev
```

## 更多文档

- [架构设计](./architecture.md)
- [SDK API 契约](./sdk-api.md)
- [Kitchen Sink 示例](../apps/kitchen-sink/README.md)

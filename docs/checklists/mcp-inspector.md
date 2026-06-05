# MCP Inspector 验收清单

- [ ] `tools/list` 返回已注册 action 对应的 tool
- [ ] `tools/call` 成功 invoke 并返回 `AgentResult`
- [ ] `resources/list` 含 observation URI
- [ ] `resources/read` 返回 observation JSON
- [ ] Policy 拒绝时 `tools/call` 返回 `AGENT_POLICY_DENIED`

## 本地联调

```bash
pnpm --filter @agent-ready/mcp build
pnpm --filter mcp-server-demo start
```

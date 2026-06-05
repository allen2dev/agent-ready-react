# MCP Server Demo

Minimal stdio MCP-style server for Agent Ready SDK.

## Start

```bash
pnpm build && pnpm start
```

## Example request (stdin)

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"app://mcp/demo/main::hello","arguments":{"input":{"name":"World"},"context":{"sessionId":"1","roles":["demo"]}}}}
```

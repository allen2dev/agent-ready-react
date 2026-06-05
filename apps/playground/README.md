# Agent Ready Playground

Interactive demo of the **zero-friction MCP dev bridge**. Run the app locally, connect Cursor, and invoke actions in the live browser runtime.

## Quick start

```bash
# From repo root
pnpm install
pnpm --filter playground dev
```

When Vite starts, the terminal prints an MCP config block. Copy it into `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-app": {
      "command": "npx",
      "args": [
        "agent-ready",
        "dev",
        "--ws",
        "ws://localhost:5173/__agent_ready_ws__"
      ]
    }
  }
}
```

Restart Cursor (or reload MCP servers), open the playground in your browser, then try:

- **"Fill the contact form with test data"** — invokes `fillContact` on the contact surface
- **"Search for react hooks"** — invokes `search` on the search surface
- **"Filter the table to active rows"** — invokes `applyFilters` on the data table
- **"Switch settings to dark mode"** — invokes `updateSettings` on the settings panel

Watch the **Agent Log** panel in the playground UI for live invocation events.

## Surfaces

| Handle | Actions |
|--------|---------|
| `app://playground/contact/main` | `fillContact` |
| `app://playground/search/main` | `search` |
| `app://playground/table/main` | `applyFilters` |
| `app://playground/settings/main` | `updateSettings` |

## How it works

1. `@agent-ready/dev-server` Vite plugin starts a WebSocket relay at `/__agent_ready_ws__`
2. The browser injects `AgentDevBridge`, which routes MCP requests to `runtime.invokeAction`
3. `npx agent-ready dev --ws ws://...` starts an MCP stdio server that proxies tool calls over the WebSocket

## Manual MCP CLI (without Vite plugin message)

If the dev server is already running on port 5173:

```bash
npx agent-ready dev --ws ws://localhost:5173/__agent_ready_ws__
```

## Troubleshooting

- **"No browser client connected"** — open http://localhost:5173 in a browser tab first
- **Policy denied** — playground uses role `agent`; ensure your MCP tool passes `context.roles: ["agent"]` if customizing calls
- **Tool not found** — refresh Cursor MCP after changing registered actions

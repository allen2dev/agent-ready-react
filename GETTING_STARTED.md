# Getting Started: Let Cursor Control Your App

This guide gets you from zero to a working **Cursor → MCP → your running app** loop in under 15 minutes, using the Agent Ready playground as reference.

## What you'll build

A React app where Cursor can invoke real actions in your browser — fill forms, click flows, read state — through a local MCP server with minimal setup.

## Prerequisites

- Node.js 22+
- pnpm 9+
- [Cursor](https://cursor.com) with MCP support

## Step 1 — Clone and install (2 min)

```bash
git clone https://github.com/allen2dev/agent-ready-react.git
cd agent-ready-react
pnpm install
pnpm build
```

## Step 2 — Run the playground (1 min)

```bash
pnpm --filter playground dev
```

Open http://localhost:5173 in your browser. Keep this tab open — the MCP bridge requires a connected browser client.

The terminal prints an MCP config. Copy it into `~/.cursor/mcp.json`:

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

Restart Cursor or reload MCP servers.

## Step 3 — Test with Cursor (2 min)

In Cursor chat, try:

> Fill the contact form with test data

Cursor should call the `fillContact` tool. The contact form in the playground updates, and the **Agent Log** panel shows the invocation.

Other prompts to try:

- "Search for react hooks"
- "Filter the table to show only active rows"
- "Set the theme to dark mode"

## Step 4 — Add Agent Ready to your own app (10 min)

### 4.1 Install packages

```bash
pnpm add @agent-ready/react @agent-ready/runtime @agent-ready/schema zod
pnpm add -D @agent-ready/dev-server
```

### 4.2 Wrap your app

```tsx
import { AgentReadyProvider, useAgentSurface, useAgentAction } from "@agent-ready/react";
import { createAgentRuntime } from "@agent-ready/runtime";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";

const runtime = createAgentRuntime({
  defaultPolicy: {
    mode: "defaultDeny",
    rules: [{ roles: ["agent"], actions: ["myAction"] }]
  }
});

function MyForm() {
  useAgentSurface({
    handle: "app://myapp/form/contact",
    title: "Contact Form",
    capabilities: ["act"]
  });

  useAgentAction(
    "app://myapp/form/contact",
    defineAction({
      name: "myAction",
      description: "Do something useful",
      input: z.object({ value: z.string() })
    }),
    (input) => ({ done: input.value })
  );

  return <form>...</form>;
}

export function App() {
  return (
    <AgentReadyProvider runtime={runtime} session={{ sessionId: "dev", roles: ["agent"] }}>
      <MyForm />
    </AgentReadyProvider>
  );
}
```

### 4.3 Enable the dev-server Vite plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { agentReadyDevServer } from "@agent-ready/dev-server/vite";

export default defineConfig({
  plugins: [
    react(),
    agentReadyDevServer({ wsPath: "/__agent_ready_ws__" })
  ]
});
```

### 4.4 Connect the browser bridge

```tsx
import { connectAgentDevBridge } from "@agent-ready/dev-server/client";

// Inside your app, after creating runtime:
if (import.meta.env.DEV) {
  connectAgentDevBridge(runtime, { wsPath: "/__agent_ready_ws__" });
}
```

Or expose runtime for auto-inject:

```tsx
if (import.meta.env.DEV) {
  window.__AGENT_READY_RUNTIME__ = runtime;
}
```

### 4.5 Add MCP to Cursor

Same `~/.cursor/mcp.json` entry, updating the WebSocket URL to match your dev server port.

## Next.js apps

Use `@agent-ready/next` for production HTTP bridge:

```ts
// app/api/agent-ready/route.ts
import { createAgentReadyHandler } from "@agent-ready/next";
import { runtime } from "@/lib/agent-runtime";

export const POST = createAgentReadyHandler(runtime);
```

```ts
// next.config.ts
import { withAgentReady } from "@agent-ready/next";

export default withAgentReady({
  /* your config */
});
```

For Pages Router, use `createPagesAgentReadyHandler` from `@agent-ready/next/pages`.

## How the dev bridge works

```
Cursor  →  MCP stdio (agent-ready dev)  →  WebSocket  →  Browser AgentDevBridge  →  runtime.invokeAction
```

- **Dev-only**: the Vite plugin and browser bridge are excluded from production builds
- **Live catalog**: tools are discovered from the browser runtime, not a static manifest
- **Optional manifest**: `agent-manifest.json` from `babel-plugin-agent-ready` provides offline hints

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No browser client connected | Open the app in a browser tab |
| Policy denied | Add `{ roles: ["agent"], actions: ["yourAction"] }` to defaultPolicy |
| Tool not listed | Reload Cursor MCP; ensure surface/action registered before calling |
| WebSocket error | Check port matches Vite output; use `ws://` not `http://` |

## Learn more

- Playground demo: `apps/playground`
- Package API: `docs/sdk-api.md`
- Architecture: `docs/architecture.md`

import type { Plugin } from "vite";
import { attachAgentWsRelay } from "./ws-relay.js";
import { resolveManifestSurfaces } from "./manifest.js";

export interface AgentReadyDevServerOptions {
  /** Reserved for future sidecar HTTP wrapper. Currently unused. */
  port?: number;
  wsPath?: string;
  root?: string;
}

const DEFAULT_WS_PATH = "/__agent_ready_ws__";

export function agentReadyDevServer(
  options: AgentReadyDevServerOptions = {}
): Plugin {
  const wsPath = options.wsPath ?? DEFAULT_WS_PATH;
  const root = options.root ?? process.cwd();

  return {
    name: "agent-ready-dev-server",
    apply: "serve",
    config() {
      return {
        define: {
          "import.meta.env.VITE_AGENT_READY_WS_PATH": JSON.stringify(wsPath)
        }
      };
    },
    configureServer(server) {
      const relay = attachAgentWsRelay(server.httpServer!, { path: wsPath });

      server.httpServer?.once("close", () => {
        relay.close();
      });

      const surfaces = resolveManifestSurfaces(root);
      if (surfaces.length > 0) {
        server.config.logger.info(
          `[agent-ready] Found ${surfaces.length} surface(s) in manifest/source`
        );
      }

      server.config.logger.info(
        `[agent-ready] WebSocket bridge at ws://localhost:<port>${wsPath}`
      );
      server.config.logger.info(
        `[agent-ready] Add to ~/.cursor/mcp.json:\n` +
          JSON.stringify(
            {
              mcpServers: {
                "my-app": {
                  command: "npx",
                  args: [
                    "agent-ready",
                    "dev",
                    "--ws",
                    `ws://localhost:${server.config.server.port ?? 5173}${wsPath}`
                  ]
                }
              }
            },
            null,
            2
          )
      );
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: { type: "module" },
            children: `
import { initAgentDevBridgeAuto } from "@agent-ready/dev-server/client";
initAgentDevBridgeAuto();
`.trim(),
            injectTo: "body"
          }
        ]
      };
    },
    transform(code, id) {
      if (!id.includes("/src/main.") && !id.endsWith("main.tsx") && !id.endsWith("main.ts")) {
        return null;
      }
      if (code.includes("__AGENT_READY_RUNTIME__")) return null;

      const injection = `
if (import.meta.env.DEV && typeof runtime !== "undefined") {
  window.__AGENT_READY_RUNTIME__ = runtime;
}
`;
      if (code.includes("createAgentRuntime")) {
        return {
          code: code.replace(
            /(const runtime = createAgentRuntime\([^)]*\);)/,
            `$1\n${injection}`
          ),
          map: null
        };
      }
      return null;
    }
  };
}

export { agentReadyDevServer as default };

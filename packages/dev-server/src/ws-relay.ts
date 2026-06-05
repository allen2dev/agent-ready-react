import type { Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import type { BridgeClientRole } from "./protocol.js";
import { parseBridgeMessage, serializeBridgeMessage } from "./protocol.js";

export interface AgentWsRelayOptions {
  path?: string;
}

interface RelayClient {
  role: BridgeClientRole;
  socket: WebSocket;
}

export class AgentWsRelay {
  private wss: WebSocketServer;
  private browser: RelayClient | undefined;
  private mcpClients = new Set<WebSocket>();

  constructor(httpServer: HttpServer, options: AgentWsRelayOptions = {}) {
    const path = options.path ?? "/__agent_ready_ws__";
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on("upgrade", (req, socket, head) => {
      const url = req.url ?? "";
      if (!url.startsWith(path)) return;

      this.wss.handleUpgrade(req, socket as Duplex, head, (ws) => {
        this.wss.emit("connection", ws, req);
      });
    });

    this.wss.on("connection", (socket) => {
      socket.on("message", (data) => {
        const raw = typeof data === "string" ? data : data.toString("utf8");
        this.onMessage(socket, raw);
      });

      socket.on("close", () => {
        if (this.browser?.socket === socket) {
          this.browser = undefined;
        }
        this.mcpClients.delete(socket);
      });
    });
  }

  close(): void {
    this.wss.close();
  }

  private onMessage(socket: WebSocket, raw: string) {
    const message = parseBridgeMessage(raw);
    if (!message) return;

    if (message.type === "register") {
      if (message.role === "browser") {
        this.browser = { role: "browser", socket };
      } else {
        this.mcpClients.add(socket);
      }
      socket.send(serializeBridgeMessage({ type: "ready", role: message.role }));
      return;
    }

    if (message.type === "response") {
      if (this.browser?.socket === socket) {
        for (const client of this.mcpClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(raw);
          }
        }
      }
      return;
    }

    if (message.type === "request") {
      if (!this.browser) {
        socket.send(
          serializeBridgeMessage({
            type: "response",
            id: message.id,
            error: {
              message:
                "No browser client connected. Open the app in your browser first."
            }
          })
        );
        return;
      }

      this.browser.socket.send(raw);
    }
  }
}

export function attachAgentWsRelay(
  httpServer: HttpServer | import("node:http2").Http2SecureServer,
  options?: AgentWsRelayOptions
): AgentWsRelay {
  return new AgentWsRelay(httpServer as HttpServer, options);
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { agentReadyDevServer } from "@agent-ready/dev-server/vite";

export default defineConfig({
  plugins: [
    react(),
    agentReadyDevServer({
      wsPath: "/__agent_ready_ws__"
    })
  ]
});

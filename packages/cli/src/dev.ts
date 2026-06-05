import { startMcpDevServer } from "@agent-ready/dev-server";

export async function runDevCommand(wsUrl: string): Promise<void> {
  process.stderr.write(`[agent-ready] Connecting MCP bridge to ${wsUrl}\n`);
  await startMcpDevServer({ wsUrl });
  process.stderr.write("[agent-ready] MCP stdio server ready\n");
}

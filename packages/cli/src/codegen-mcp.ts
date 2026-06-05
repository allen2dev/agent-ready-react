import { writeFileSync } from "node:fs";
import { createAgentRuntime } from "@agent-ready/runtime";
import { listTools } from "@agent-ready/mcp";

export function codegenMcp(outputPath: string) {
  const runtime = createAgentRuntime();
  const tools = listTools(runtime);
  writeFileSync(outputPath, JSON.stringify(tools, null, 2));
  console.log("Wrote", outputPath);
}

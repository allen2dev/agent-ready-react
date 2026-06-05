import { writeFileSync } from "node:fs";

export function codegenDocs(outputPath: string) {
  const md = `# Auto-generated API Reference

| Package | Entry |
|---------|-------|
| @agent-ready/schema | types, defineAction, defineObservation |
| @agent-ready/runtime | createAgentRuntime, invokeAction, readObservation |
| @agent-ready/react | AgentReadyProvider, useAgentSurface, useAgentAction(handle, …) |

> Regenerate via \`agent-ready codegen docs\`
`;
  writeFileSync(outputPath, md);
  console.log("Wrote", outputPath);
}

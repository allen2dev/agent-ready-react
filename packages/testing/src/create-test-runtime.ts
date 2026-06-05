import {
  createAgentRuntime,
  type AgentRuntime,
  type AgentRuntimeConfig
} from "@agent-ready/runtime";

export function createTestRuntime(
  config?: AgentRuntimeConfig
): AgentRuntime {
  return createAgentRuntime(config);
}

import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import type { AgentRuntime, AgentRuntimeConfig } from "@agent-ready/runtime";
import type { AgentSessionContext } from "@agent-ready/schema";
import { AgentReadyProvider } from "@agent-ready/react";
import { createTestRuntime } from "./create-test-runtime.js";
import { createMockAgent } from "./mock-agent.js";

export interface RenderWithAgentReadyOptions extends Omit<RenderOptions, "wrapper"> {
  config?: AgentRuntimeConfig;
  session?: AgentSessionContext;
}

export interface RenderWithAgentReadyResult extends RenderResult {
  runtime: AgentRuntime;
  agent: ReturnType<typeof createMockAgent>;
}

/**
 * Renders a component tree wrapped in {@link AgentReadyProvider} with a test runtime.
 *
 * Returns the Testing Library render result plus `runtime` and `agent` helpers.
 */
export function renderWithAgentReady(
  ui: ReactElement,
  options: RenderWithAgentReadyOptions = {}
): RenderWithAgentReadyResult {
  const { config, session, ...renderOptions } = options;
  const runtime = createTestRuntime(config);

  const result = render(ui, {
    ...renderOptions,
    wrapper: ({ children }) => (
      <AgentReadyProvider runtime={runtime} session={session}>
        {children}
      </AgentReadyProvider>
    )
  });

  const agent = createMockAgent(runtime, session);

  return { ...result, runtime, agent };
}

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentReadyProvider } from "./AgentReadyProvider.js";
import { useAgentReadyContext } from "./context.js";

function Probe() {
  const { runtime } = useAgentReadyContext();
  return <div data-testid="probe">{runtime.getCatalog().total}</div>;
}

describe("AgentReadyProvider", () => {
  it("provides runtime", () => {
    render(
      <AgentReadyProvider session={{ sessionId: "s1" }}>
        <Probe />
      </AgentReadyProvider>
    );
    expect(screen.getByTestId("probe").textContent).toBe("0");
  });
});

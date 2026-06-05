import { describe, expect, it } from "vitest";
import { agentError } from "./result.js";

describe("AgentResult", () => {
  it("creates agent errors with stable codes", () => {
    const err = agentError("AGENT_POLICY_DENIED", "denied");
    expect(err.code).toBe("AGENT_POLICY_DENIED");
  });
});

import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "./runtime.js";

describe("createAgentRuntime", () => {
  it("creates runtime instance", () => {
    const rt = createAgentRuntime({ actionTimeoutMs: 1000 });
    expect(rt.getCatalog().total).toBe(0);
  });
});

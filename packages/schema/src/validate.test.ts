import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validateAgentInput } from "./validate.js";

describe("validateAgentInput", () => {
  it("returns data on success", () => {
    const result = validateAgentInput(z.object({ id: z.number() }), { id: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(1);
  });

  it("returns AGENT_VALIDATION_FAILED on failure", () => {
    const result = validateAgentInput(z.object({ id: z.number() }), { id: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AGENT_VALIDATION_FAILED");
    }
  });
});

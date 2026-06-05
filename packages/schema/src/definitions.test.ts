import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction, defineObservation } from "./definitions.js";

describe("definitions", () => {
  it("defineAction preserves definition", () => {
    const action = defineAction({
      name: "submit",
      description: "Submit form",
      input: z.object({ email: z.string().email() }),
      risk: "medium"
    });
    expect(action.name).toBe("submit");
    expect(action.risk).toBe("medium");
  });

  it("defineObservation preserves definition", () => {
    const obs = defineObservation({
      name: "state",
      description: "UI state",
      schema: z.object({ count: z.number() })
    });
    expect(obs.name).toBe("state");
  });
});

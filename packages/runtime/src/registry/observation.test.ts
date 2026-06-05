import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineObservation } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";

describe("observation registry", () => {
  it("lists observations in catalog", () => {
    const rt = createAgentRuntime();
    const handle = "app://demo/page/main" as const;
    rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["read"] }
    });
    rt.registerObservation(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ count: z.number() })
      }),
      selector: () => ({ count: 1 })
    });
    const catalog = rt.getCatalog();
    expect(catalog.surfaces[0]?.observations).toContain("state");
  });

  it("reads observation value", () => {
    const rt = createAgentRuntime();
    const handle = "app://demo/page/main" as const;
    rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["read"] }
    });
    rt.registerObservation(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ count: z.number() })
      }),
      selector: () => ({ count: 42 })
    });
    const result = rt.readObservation({ handle, name: "state" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ count: 42 });
  });
});

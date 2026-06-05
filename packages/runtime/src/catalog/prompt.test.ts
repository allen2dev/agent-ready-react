import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";

describe("toPromptContext", () => {
  it("outputs non-empty summary", () => {
    const rt = createAgentRuntime();
    rt.registerSurface({
      manifest: {
        handle: "app://demo/page/main",
        title: "Main",
        capabilities: ["act"]
      }
    });
    const text = rt.toPromptContext({ tier: "summary" });
    expect(text).toContain("app://demo/page/main");
  });

  it("outputs full tier with actions", () => {
    const handle = "app://demo/page/main" as const;
    const rt = createAgentRuntime({ defaultPolicy: { mode: "defaultAllow" } });
    rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "save",
        description: "Save",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });
    const text = rt.toPromptContext({ tier: "full" });
    expect(text).toContain("actions: save");
  });
});

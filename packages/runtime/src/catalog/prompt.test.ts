import { describe, expect, it } from "vitest";
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
});

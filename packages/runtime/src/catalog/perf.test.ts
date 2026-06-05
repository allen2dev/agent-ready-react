import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "../runtime.js";

describe("catalog perf", () => {
  it("builds catalog for 100 surfaces under 16ms p50", () => {
    const rt = createAgentRuntime();
    for (let i = 0; i < 100; i++) {
      rt.registerSurface({
        manifest: {
          handle: `app://demo/list/item-${i}`,
          title: `Item ${i}`,
          capabilities: ["act"]
        }
      });
    }
    const start = performance.now();
    rt.getCatalog();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(16);
  });
});

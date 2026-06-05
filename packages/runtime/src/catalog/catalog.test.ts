import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "../runtime.js";

describe("catalog", () => {
  it("returns empty catalog", () => {
    const rt = createAgentRuntime();
    expect(rt.getCatalog()).toEqual({ surfaces: [], total: 0 });
  });

  it("paginates with cursor", () => {
    const rt = createAgentRuntime();
    for (let i = 0; i < 3; i++) {
      rt.registerSurface({
        manifest: {
          handle: `app://demo/list/item-${i}`,
          title: `Item ${i}`,
          capabilities: ["act"]
        }
      });
    }
    const page1 = rt.getCatalog({ limit: 2 });
    expect(page1.surfaces).toHaveLength(2);
    expect(page1.cursor).toBe("2");
    const page2 = rt.getCatalog({ limit: 2, cursor: page1.cursor });
    expect(page2.surfaces).toHaveLength(1);
  });

  it("filters by scope, tags, and capability", () => {
    const rt = createAgentRuntime();
    rt.registerSurface({
      manifest: {
        handle: "app://crm/deals/main",
        title: "CRM",
        capabilities: ["act", "read"],
        tags: ["sales"]
      }
    });
    rt.registerSurface({
      manifest: {
        handle: "app://hr/forms/main",
        title: "HR",
        capabilities: ["read"],
        tags: ["internal"]
      }
    });

    expect(rt.getCatalog({ scope: "crm" }).total).toBe(1);
    expect(rt.getCatalog({ tags: ["sales"] }).total).toBe(1);
    expect(rt.getCatalog({ capability: "act" }).total).toBe(1);
  });
});

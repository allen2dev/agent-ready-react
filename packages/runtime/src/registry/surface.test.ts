import { describe, expect, it } from "vitest";
import { SurfaceRegistry } from "./surface.js";

const manifest = {
  handle: "crm://deals/detail/deal-1" as const,
  title: "Deal",
  capabilities: ["act" as const]
};

describe("SurfaceRegistry", () => {
  it("registers and unregisters", () => {
    const registry = new SurfaceRegistry();
    const unregister = registry.register({ manifest });
    expect(registry.has(manifest.handle)).toBe(true);
    unregister();
    expect(registry.has(manifest.handle)).toBe(false);
  });

  it("throws on duplicate handle", () => {
    const registry = new SurfaceRegistry();
    registry.register({ manifest });
    expect(() => registry.register({ manifest })).toThrow();
  });
});

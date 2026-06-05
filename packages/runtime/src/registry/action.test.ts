import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { ActionRegistry } from "./action.js";

const handle = "crm://deals/detail/deal-1" as const;

describe("ActionRegistry", () => {
  it("registers actions per handle", () => {
    const registry = new ActionRegistry();
    const action = defineAction({
      name: "save",
      description: "Save",
      input: z.object({})
    });
    const unregister = registry.register(handle, {
      definition: action,
      handler: () => ({})
    });
    expect(registry.get(handle, "save")).toBeDefined();
    unregister();
    expect(registry.get(handle, "save")).toBeUndefined();
  });
});

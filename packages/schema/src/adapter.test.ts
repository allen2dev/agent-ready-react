import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createSchemaAdapter,
  getActiveSchemaAdapter
} from "./adapter.js";
import {
  detectZodMajorVersion,
  getActiveSchemaAdapterAuto
} from "./adapter-node.js";

describe("schema adapter", () => {
  it("detects installed zod major version", () => {
    const version = detectZodMajorVersion();
    expect([3, 4]).toContain(version);
  });

  it("parses input via active adapter", () => {
    const adapter = getActiveSchemaAdapter();
    const schema = z.object({ n: z.number() });
    const ok = adapter.safeParse(schema, { n: 1 });
    const bad = adapter.safeParse(schema, { n: "x" });
    expect(ok.success).toBe(true);
    expect(ok.data).toEqual({ n: 1 });
    expect(bad.success).toBe(false);
  });

  it("auto-detects zod version in node helper", () => {
    const adapter = getActiveSchemaAdapterAuto();
    expect([3, 4]).toContain(adapter.version);
  });

  it("converts schema to JSON schema", () => {
    const adapter = createSchemaAdapter(3);
    const schema = z.object({ id: z.string() });
    const json = adapter.toJsonSchema(schema);
    expect(json.type).toBe("object");
  });

  it("supports explicit zod4 adapter factory", () => {
    const adapter = createSchemaAdapter(4);
    expect(adapter.version).toBe(4);
  });
});

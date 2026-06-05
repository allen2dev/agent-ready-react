import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toJsonSchema } from "./json-schema.js";

describe("toJsonSchema", () => {
  it("converts email action input", () => {
    const schema = toJsonSchema(z.object({ email: z.string().email() }));
    expect(schema).toMatchSnapshot();
  });

  it("converts nested object", () => {
    const schema = toJsonSchema(
      z.object({
        user: z.object({ name: z.string(), age: z.number().optional() })
      })
    );
    expect(schema).toMatchSnapshot();
  });

  it("converts enum field", () => {
    const schema = toJsonSchema(z.object({ stage: z.enum(["new", "done"]) }));
    expect(schema).toMatchSnapshot();
  });
});

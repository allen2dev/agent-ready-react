import type { ZodType, ZodTypeDef } from "zod";
import { toJsonSchema, type JsonSchema } from "./json-schema.js";

export type ZodMajorVersion = 3 | 4;

export interface SchemaParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: unknown;
}

export interface SchemaAdapter {
  readonly version: ZodMajorVersion;
  safeParse<T>(
    schema: ZodType<T, ZodTypeDef, unknown>,
    input: unknown
  ): SchemaParseResult<T>;
  toJsonSchema(schema: ZodType<unknown, ZodTypeDef, unknown>): JsonSchema;
}

function createZod3Adapter(): SchemaAdapter {
  return {
    version: 3,
    safeParse(schema, input) {
      const parsed = schema.safeParse(input);
      return parsed.success
        ? { success: true, data: parsed.data }
        : { success: false, error: parsed.error };
    },
    toJsonSchema(schema) {
      return toJsonSchema(schema);
    }
  };
}

function createZod4Adapter(): SchemaAdapter {
  const base = createZod3Adapter();
  return { ...base, version: 4 };
}

export function createSchemaAdapter(version: ZodMajorVersion = 3): SchemaAdapter {
  return version === 4 ? createZod4Adapter() : createZod3Adapter();
}

/** Browser-safe default; use `@agent-ready/schema/adapter-node` for auto-detect. */
export function getActiveSchemaAdapter(): SchemaAdapter {
  return createSchemaAdapter(3);
}

import { createRequire } from "module";
import type { ZodType, ZodTypeDef } from "zod";
import { toJsonSchema, type JsonSchema } from "./json-schema.js";

const require = createRequire(import.meta.url);

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

export function detectZodMajorVersion(): ZodMajorVersion {
  try {
    const pkg = require("zod/package.json") as { version?: string };
    const major = Number.parseInt(String(pkg.version ?? "3").split(".")[0] ?? "3", 10);
    return major >= 4 ? 4 : 3;
  } catch {
    return 3;
  }
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

export function createSchemaAdapter(version?: ZodMajorVersion): SchemaAdapter {
  const resolved = version ?? detectZodMajorVersion();
  return resolved === 4 ? createZod4Adapter() : createZod3Adapter();
}

export function getActiveSchemaAdapter(): SchemaAdapter {
  return createSchemaAdapter();
}

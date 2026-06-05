import type { ZodType, ZodTypeDef } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type JsonSchema = Record<string, unknown>;

export function toJsonSchema(
  schema: ZodType<unknown, ZodTypeDef, unknown>
): JsonSchema {
  return zodToJsonSchema(schema, {
    $refStrategy: "none"
  }) as JsonSchema;
}

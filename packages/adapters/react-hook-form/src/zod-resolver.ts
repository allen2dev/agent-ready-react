import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType, ZodTypeDef, z } from "zod";

const resolverSchemas = new WeakMap<object, ZodType<unknown, ZodTypeDef, unknown>>();

export type AgentZodResolver<TFieldValues extends FieldValues> = Resolver<TFieldValues>;

/**
 * Wraps {@link zodResolver} and attaches schema metadata for agent action inference.
 */
export function agentZodResolver<TSchema extends ZodType<FieldValues, ZodTypeDef, unknown>>(
  schema: TSchema
): AgentZodResolver<z.infer<TSchema>> {
  const resolver = zodResolver(schema);
  resolverSchemas.set(resolver, schema);
  return resolver;
}

export function inferZodSchemaFromResolver(
  resolver: unknown
): ZodType<unknown, ZodTypeDef, unknown> | undefined {
  if (resolver && (typeof resolver === "function" || typeof resolver === "object")) {
    return resolverSchemas.get(resolver);
  }
  return undefined;
}

/**
 * Returns true when the resolver was created via {@link agentZodResolver}.
 */
export function isZodResolver(resolver: unknown): boolean {
  return inferZodSchemaFromResolver(resolver) !== undefined;
}

import type { ZodType, ZodTypeDef, z } from "zod";

const validatorSchemas = new WeakMap<
  (props: { value: unknown }) => unknown,
  ZodType<unknown, ZodTypeDef, unknown>
>();

export type AgentTanstackValidator<T> = (props: { value: T }) => unknown;

/**
 * Wraps a Zod schema as a TanStack Form validator with attached schema metadata.
 */
export function agentZodValidator<TSchema extends ZodType<unknown, ZodTypeDef, unknown>>(
  schema: TSchema
): AgentTanstackValidator<z.infer<TSchema>> {
  const validator = ({ value }: { value: unknown }) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return result.error.flatten();
    }
    return undefined;
  };

  validatorSchemas.set(validator, schema);
  return validator;
}

export function inferZodSchemaFromValidator(
  validator: unknown
): ZodType<unknown, ZodTypeDef, unknown> | undefined {
  if (typeof validator === "function") {
    return validatorSchemas.get(validator as (props: { value: unknown }) => unknown);
  }
  return undefined;
}

export function inferZodSchemaFromFormOptions(
  validators: unknown
): ZodType<unknown, ZodTypeDef, unknown> | undefined {
  if (!validators || typeof validators !== "object") return undefined;

  const record = validators as Record<string, unknown>;
  for (const key of ["onSubmit", "onChange", "onBlur", "onMount"] as const) {
    const schema = inferZodSchemaFromValidator(record[key]);
    if (schema) return schema;
  }
  return undefined;
}

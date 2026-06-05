import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";
import type { AgentHandle, SurfaceManifest } from "@agent-ready/schema";
import { defineAction, type ActionDefinition } from "@agent-ready/schema";
import type { ActionHandlerContext } from "@agent-ready/runtime";
import { useAgentAction, useAgentSurface } from "@agent-ready/react";
import { inferZodSchemaFromResolver } from "./zod-resolver.js";

type SurfaceManifestInput = Omit<SurfaceManifest, "handle">;

export type AgentFormActionDef<TFieldValues extends FieldValues, TOut = unknown> = Omit<
  ActionDefinition<TFieldValues, TOut>,
  "input"
> & {
  input?: ActionDefinition<TFieldValues, TOut>["input"];
};

export type AgentFormOptions<TFieldValues extends FieldValues> = UseFormProps<TFieldValues> & {
  manifest: SurfaceManifestInput;
  /** Optional explicit schema when not using {@link agentZodResolver}. */
  schema?: ActionDefinition<TFieldValues, unknown>["input"];
  onSubmit: (
    data: TFieldValues,
    ctx: ActionHandlerContext
  ) => Promise<unknown> | unknown;
};

export type AgentFormReturn<TFieldValues extends FieldValues> = UseFormReturn<TFieldValues>;

/**
 * Combines react-hook-form with agent surface and action registration.
 *
 * Infers the action input schema from an {@link agentZodResolver} when present;
 * otherwise `actionDef.input` must be provided explicitly.
 *
 * @example
 * ```tsx
 * const schema = z.object({ email: z.string().email() });
 *
 * function ContactForm() {
 *   const form = useAgentForm(
 *     "app://forms/contact/main",
 *     {
 *       resolver: agentZodResolver(schema),
 *       defaultValues: { email: "" },
 *       manifest: { title: "Contact", capabilities: ["act"] },
 *       onSubmit: async (data) => {
 *         await api.submit(data);
 *         return { submitted: true };
 *       },
 *     },
 *     { name: "submitForm", description: "Submit the contact form" }
 *   );
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(() => undefined)}>
 *       <input {...form.register("email")} />
 *     </form>
 *   );
 * }
 * ```
 */
export function useAgentForm<TFieldValues extends FieldValues, TOut = unknown>(
  handle: AgentHandle,
  formOptions: AgentFormOptions<TFieldValues>,
  actionDef: AgentFormActionDef<TFieldValues, TOut>
): AgentFormReturn<TFieldValues> {
  const { manifest, onSubmit, schema: explicitSchema, ...useFormOptions } = formOptions;

  useAgentSurface({ handle, ...manifest });

  const inferredInput =
    actionDef.input ??
    explicitSchema ??
    (useFormOptions.resolver
      ? inferZodSchemaFromResolver(useFormOptions.resolver)
      : undefined);

  if (!inferredInput) {
    throw new Error(
      "useAgentForm: provide actionDef.input, formOptions.schema, or agentZodResolver()"
    );
  }

  const form = useForm<TFieldValues>(useFormOptions);

  const action = defineAction({
    ...actionDef,
    input: inferredInput as ActionDefinition<TFieldValues, TOut>["input"]
  });

  useAgentAction(handle, action, async (input, ctx) => {
    form.reset(input as TFieldValues);

    return new Promise<TOut>((resolve, reject) => {
      void form.handleSubmit(
        async (data) => {
          try {
            const result = await onSubmit(data, ctx);
            resolve(result as TOut);
          } catch (error) {
            reject(error);
          }
        },
        (errors) => {
          reject(
            new Error(
              `Form validation failed: ${Object.keys(errors).join(", ") || "unknown"}`
            )
          );
        }
      )();
    });
  });

  return form;
}

export { agentZodResolver, inferZodSchemaFromResolver, isZodResolver } from "./zod-resolver.js";

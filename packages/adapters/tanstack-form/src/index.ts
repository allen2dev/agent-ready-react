import { useForm } from "@tanstack/react-form";
import type { AgentHandle, SurfaceManifest } from "@agent-ready/schema";
import { defineAction, type ActionDefinition } from "@agent-ready/schema";
import type { ActionHandlerContext } from "@agent-ready/runtime";
import { useAgentAction, useAgentSurface } from "@agent-ready/react";
import { inferZodSchemaFromFormOptions } from "./zod-validator.js";

type SurfaceManifestInput = Omit<SurfaceManifest, "handle">;

export type AgentTanstackFormActionDef<
  TFieldValues extends Record<string, unknown>,
  TOut = unknown
> = Omit<ActionDefinition<TFieldValues, TOut>, "input"> & {
  input?: ActionDefinition<TFieldValues, TOut>["input"];
};

export type AgentTanstackFormOptions<
  TFieldValues extends Record<string, unknown>
> = {
  defaultValues: TFieldValues;
  manifest: SurfaceManifestInput;
  /** Optional explicit schema when not using {@link agentZodValidator}. */
  schema?: ActionDefinition<TFieldValues, unknown>["input"];
  onSubmit: (
    data: TFieldValues,
    ctx: ActionHandlerContext
  ) => Promise<unknown> | unknown;
  validators?: Record<string, unknown>;
};

/**
 * Combines TanStack Form v0 with agent surface and action registration.
 *
 * Infers the action input schema from an {@link agentZodValidator} in `validators`;
 * otherwise `actionDef.input` must be provided explicitly.
 */
export function useAgentTanstackForm<
  TFieldValues extends Record<string, unknown>,
  TOut = unknown
>(
  handle: AgentHandle,
  formOptions: AgentTanstackFormOptions<TFieldValues>,
  actionDef: AgentTanstackFormActionDef<TFieldValues, TOut>
) {
  const { manifest, onSubmit, schema: explicitSchema, ...tanstackOptions } = formOptions;

  useAgentSurface({ handle, ...manifest });

  const inferredInput =
    actionDef.input ??
    explicitSchema ??
    inferZodSchemaFromFormOptions(tanstackOptions.validators);

  if (!inferredInput) {
    throw new Error(
      "useAgentTanstackForm: provide actionDef.input, formOptions.schema, or agentZodValidator()"
    );
  }

  const form = useForm({
    ...tanstackOptions,
    onSubmit: async () => undefined
  });

  const action = defineAction({
    ...actionDef,
    input: inferredInput as ActionDefinition<TFieldValues, TOut>["input"]
  });

  useAgentAction(handle, action, async (input, ctx) => {
    const values = input as TFieldValues;
    form.reset(values);
    await form.handleSubmit();
    return (await onSubmit(values, ctx)) as TOut;
  });

  return form;
}

export {
  agentZodValidator,
  inferZodSchemaFromFormOptions,
  inferZodSchemaFromValidator
} from "./zod-validator.js";

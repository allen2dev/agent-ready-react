import { useEffect, useRef } from "react";
import type { ActionDefinition } from "@agent-ready/schema";
import type { ActionHandlerContext } from "@agent-ready/runtime";
import type { ZodType, ZodTypeDef } from "zod";
import { useAgentReadyContext } from "../context.js";
import type { AgentHandle } from "@agent-ready/schema";

type InferZodOutput<T> = T extends ZodType<infer O, ZodTypeDef, unknown> ? O : never;

type ActionWithOutputSchema<TIn, TSchema extends ZodType<unknown, ZodTypeDef, unknown>> =
  ActionDefinition<TIn, InferZodOutput<TSchema>> & { output: TSchema };

/**
 * Registers an action handler on a surface for the lifetime of the component.
 *
 * The surface identified by `handle` must already be registered via {@link useAgentSurface}
 * or {@link createSurface} before actions can be invoked.
 *
 * @example
 * ```tsx
 * const handle = "app://forms/contact/main" as const;
 *
 * function ContactForm() {
 *   useAgentSurface({ handle, title: "Contact", capabilities: ["act"] });
 *   useAgentAction(
 *     handle,
 *     defineAction({
 *       name: "submitForm",
 *       description: "Submit the contact form",
 *       input: z.object({ email: z.string().email() }),
 *       output: z.object({ submitted: z.boolean() }),
 *     }),
 *     async (input) => {
 *       await api.submit(input);
 *       return { submitted: true };
 *     }
 *   );
 * }
 * ```
 */
export function useAgentAction<TIn, TSchema extends ZodType<unknown, ZodTypeDef, unknown>>(
  handle: AgentHandle,
  action: ActionWithOutputSchema<TIn, TSchema>,
  handler: (
    input: TIn,
    ctx: ActionHandlerContext
  ) => Promise<InferZodOutput<TSchema>> | InferZodOutput<TSchema>
): void;

export function useAgentAction<TIn, TOut>(
  handle: AgentHandle,
  action: ActionDefinition<TIn, TOut>,
  handler: (input: TIn, ctx: ActionHandlerContext) => Promise<TOut> | TOut
): void;

export function useAgentAction<TIn, TOut>(
  handle: AgentHandle,
  action: ActionDefinition<TIn, TOut>,
  handler: (input: TIn, ctx: ActionHandlerContext) => Promise<TOut> | TOut
) {
  const { runtime } = useAgentReadyContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!handle) return;
    return runtime.registerAction(handle, {
      definition: action,
      handler: (input, ctx) =>
        handlerRef.current(input as TIn, ctx)
    });
  }, [runtime, handle, action.name]);
}

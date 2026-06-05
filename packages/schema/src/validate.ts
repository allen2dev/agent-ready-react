import type { ZodType, ZodTypeDef } from "zod";
import { agentError, type AgentError } from "./types/result.js";

export function validateAgentInput<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  input: unknown
): { success: true; data: T } | { success: false; error: AgentError } {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const issues = parsed.error.issues.slice(0, 5).map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));

  return {
    success: false,
    error: agentError("AGENT_VALIDATION_FAILED", "Input validation failed", {
      issues
    })
  };
}

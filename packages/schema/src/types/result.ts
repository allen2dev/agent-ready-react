import { z } from "zod";

export const agentErrorCodeSchema = z.enum([
  "AGENT_SURFACE_NOT_FOUND",
  "AGENT_ACTION_NOT_FOUND",
  "AGENT_VALIDATION_FAILED",
  "AGENT_POLICY_DENIED",
  "AGENT_HANDLER_ERROR",
  "AGENT_RATE_LIMITED",
  "AGENT_TIMEOUT"
]);

export type AgentErrorCode = z.infer<typeof agentErrorCodeSchema>;

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResultMeta {
  durationMs: number;
  etag?: string;
  traceId?: string;
}

export type AgentResult<T> =
  | { ok: true; data: T; meta?: ResultMeta }
  | { ok: false; error: AgentError };

export function agentError(
  code: AgentErrorCode,
  message: string,
  details?: Record<string, unknown>
): AgentError {
  return { code, message, details };
}

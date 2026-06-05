import type { AgentHandle } from "./surface.js";

export interface AgentSessionContext {
  sessionId: string;
  roles?: string[];
  metadata?: Record<string, string>;
}

export interface InvokeActionRequest {
  handle: AgentHandle;
  action: string;
  input: unknown;
  context?: AgentSessionContext;
}

export interface ReadObservationRequest {
  handle: AgentHandle;
  name: string;
}

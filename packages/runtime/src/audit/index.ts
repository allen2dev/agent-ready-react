import type { AgentError, AgentHandle } from "@agent-ready/schema";
import type { AgentRuntime } from "../runtime.js";

export type AuditEventType =
  | "action.invoked"
  | "action.denied"
  | "action.failed";

export interface AuditEntry {
  type: AuditEventType;
  handle: AgentHandle;
  action: string;
  sessionId?: string;
  ok?: boolean;
  error?: AgentError;
  timestamp: number;
}

export interface AuditSink {
  emit(entry: AuditEntry): void | Promise<void>;
}

export function attachAuditSink(
  runtime: AgentRuntime,
  sink: AuditSink
): () => void {
  const offInvoked = runtime.on("action:invoked", (payload) => {
    void sink.emit({
      type: payload.result.ok ? "action.invoked" : "action.failed",
      handle: payload.handle,
      action: payload.actionName,
      sessionId: payload.sessionId,
      ok: payload.result.ok,
      error: payload.result.ok ? undefined : payload.result.error,
      timestamp: Date.now()
    });
  });

  const offDenied = runtime.on("policy:denied", (payload) => {
    void sink.emit({
      type: "action.denied",
      handle: payload.handle,
      action: payload.actionName,
      sessionId: payload.sessionId,
      timestamp: Date.now()
    });
  });

  return () => {
    offInvoked();
    offDenied();
  };
}

export function emitAuditEvent(sink: AuditSink, entry: AuditEntry): void {
  void sink.emit(entry);
}

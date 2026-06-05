import type { AuditEntry, AuditSink } from "./index.js";

export function createConsoleAuditSink(): AuditSink {
  return {
    emit(entry: AuditEntry) {
      console.log(JSON.stringify(entry));
    }
  };
}

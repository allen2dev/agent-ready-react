import type { AuditEntry, AuditSink } from "./index.js";

export interface HttpAuditSinkOptions {
  url: string;
  batchSize?: number;
  fetchImpl?: typeof fetch;
}

export function createHttpAuditSink(options: HttpAuditSinkOptions): AuditSink {
  const batchSize = options.batchSize ?? 10;
  const fetchImpl = options.fetchImpl ?? fetch;
  let buffer: AuditEntry[] = [];
  let flushPromise: Promise<void> | undefined;

  async function post(entries: AuditEntry[], retried = false): Promise<void> {
    const res = await fetchImpl(options.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries })
    });
    if (!res.ok && !retried) {
      await post(entries, true);
    }
  }

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const entries = buffer;
    buffer = [];
    await post(entries);
  }

  return {
    emit(entry: AuditEntry) {
      buffer.push(entry);
      if (buffer.length >= batchSize) {
        flushPromise = flush();
      }
    }
  };
}

export async function flushHttpAuditSink(sink: AuditSink): Promise<void> {
  if ("flush" in sink && typeof sink.flush === "function") {
    await sink.flush();
  }
}

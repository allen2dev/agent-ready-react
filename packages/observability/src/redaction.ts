import type { RedactionMiddleware } from "./types.js";

export function createRedactionMiddleware(
  fields: string[]
): RedactionMiddleware {
  return (event) => ({
    ...event,
    payload: redactObject(event.payload, fields) as typeof event.payload
  });
}

function redactObject(value: unknown, fields: string[]): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item, fields));
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = fields.includes(key) ? "[REDACTED]" : redactObject(val, fields);
  }
  return out;
}

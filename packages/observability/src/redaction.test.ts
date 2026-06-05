import { describe, expect, it } from "vitest";
import { createRedactionMiddleware } from "./redaction.js";

describe("createRedactionMiddleware", () => {
  it("redacts configured fields", () => {
    const mw = createRedactionMiddleware(["email"]);
    const result = mw({
      type: "action:invoked",
      timestamp: 0,
      payload: {
        handle: "app://demo/page/main",
        action: "submit",
        ok: false,
        error: { code: "AGENT_VALIDATION_FAILED", message: "x", details: { email: "a@b.c" } }
      }
    });
    const error = (result.payload as { error?: { details?: { email?: string } } }).error;
    expect(error?.details?.email).toBe("[REDACTED]");
  });
});

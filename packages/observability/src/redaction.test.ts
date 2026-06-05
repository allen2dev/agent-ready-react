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
        actionName: "submit",
        input: { email: "a@b.c" },
        result: {
          ok: false,
          error: {
            code: "AGENT_VALIDATION_FAILED",
            message: "x",
            details: { email: "a@b.c" }
          }
        },
        durationMs: 1,
        sessionId: "s1"
      }
    });
    const payload = result.payload as {
      input?: { email?: string };
      result?: { error?: { details?: { email?: string } } };
    };
    expect(payload.input?.email).toBe("[REDACTED]");
    expect(payload.result?.error?.details?.email).toBe("[REDACTED]");
  });
});

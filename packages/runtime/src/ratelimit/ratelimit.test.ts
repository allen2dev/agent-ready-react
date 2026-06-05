import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";
import {
  composeRateLimiters,
  createActionRateLimiter,
  createSessionRateLimiter
} from "./index.js";

const handle = "app://demo/page/main" as const;

function setupRuntime(rateLimit: ReturnType<typeof createSessionRateLimiter>) {
  const runtime = createAgentRuntime({
    defaultPolicy: { mode: "defaultAllow" },
    rateLimit
  });
  runtime.registerSurface({
    manifest: { handle, title: "Main", capabilities: ["act"] }
  });
  runtime.registerAction(handle, {
    definition: defineAction({
      name: "ping",
      description: "Ping",
      input: z.object({})
    }),
    handler: () => ({ ok: true })
  });
  runtime.registerAction(handle, {
    definition: defineAction({
      name: "pong",
      description: "Pong",
      input: z.object({})
    }),
    handler: () => ({ ok: true })
  });
  return runtime;
}

describe("ratelimit.session", () => {
  it("returns AGENT_RATE_LIMITED when session exceeds quota", async () => {
    const runtime = setupRuntime(
      createSessionRateLimiter({ maxRequests: 2, windowMs: 60_000 })
    );

    const ctx = { sessionId: "s1", roles: ["agent"] as string[] };
    expect((await runtime.invokeAction({ handle, action: "ping", input: {}, context: ctx })).ok).toBe(true);
    expect((await runtime.invokeAction({ handle, action: "ping", input: {}, context: ctx })).ok).toBe(true);

    const limited = await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: ctx
    });
    expect(limited.ok).toBe(false);
    if (!limited.ok) expect(limited.error.code).toBe("AGENT_RATE_LIMITED");
  });
});

describe("ratelimit.action", () => {
  it("limits actions independently", async () => {
    const runtime = setupRuntime(
      composeRateLimiters(
        createSessionRateLimiter({ maxRequests: 100, windowMs: 60_000 }),
        createActionRateLimiter({ maxRequests: 1, windowMs: 60_000 })
      )
    );

    const ctx = { sessionId: "s1", roles: ["agent"] as string[] };
    expect((await runtime.invokeAction({ handle, action: "ping", input: {}, context: ctx })).ok).toBe(true);
    expect((await runtime.invokeAction({ handle, action: "pong", input: {}, context: ctx })).ok).toBe(true);

    const limited = await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: ctx
    });
    expect(limited.ok).toBe(false);
    if (!limited.ok) expect(limited.error.code).toBe("AGENT_RATE_LIMITED");
  });
});

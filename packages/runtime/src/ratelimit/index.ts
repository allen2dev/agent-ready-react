import type { AgentHandle } from "@agent-ready/schema";

export interface RateLimitContext {
  sessionId: string;
  handle: AgentHandle;
  action: string;
}

export interface RateLimitProvider {
  check(ctx: RateLimitContext): Promise<boolean> | boolean;
}

export interface SessionRateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function createSessionRateLimiter(
  options: SessionRateLimitOptions
): RateLimitProvider {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(ctx) {
      const now = Date.now();
      const bucket = buckets.get(ctx.sessionId);
      if (!bucket || now >= bucket.resetAt) {
        buckets.set(ctx.sessionId, {
          count: 1,
          resetAt: now + options.windowMs
        });
        return true;
      }
      if (bucket.count >= options.maxRequests) {
        return false;
      }
      bucket.count += 1;
      return true;
    }
  };
}

export interface ActionRateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function createActionRateLimiter(
  options: ActionRateLimitOptions
): RateLimitProvider {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(ctx) {
      const key = `${ctx.handle}::${ctx.action}`;
      const now = Date.now();
      const bucket = buckets.get(key);
      if (!bucket || now >= bucket.resetAt) {
        buckets.set(key, {
          count: 1,
          resetAt: now + options.windowMs
        });
        return true;
      }
      if (bucket.count >= options.maxRequests) {
        return false;
      }
      bucket.count += 1;
      return true;
    }
  };
}

export function composeRateLimiters(
  ...providers: RateLimitProvider[]
): RateLimitProvider {
  return {
    async check(ctx) {
      for (const provider of providers) {
        const allowed = await provider.check(ctx);
        if (!allowed) return false;
      }
      return true;
    }
  };
}

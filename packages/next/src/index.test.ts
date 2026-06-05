import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "@agent-ready/runtime";
import { handleBridgeMethod } from "@agent-ready/bridge";
import { createAgentReadyHandler } from "./index.js";

describe("createAgentReadyHandler", () => {
  it("handles agent.catalog.list", async () => {
    const runtime = createAgentRuntime({ defaultPolicy: { mode: "defaultAllow" } });
    const handler = createAgentReadyHandler(runtime);

    const response = await handler(
      new Request("http://localhost/api/agent-ready", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "agent.catalog.list",
          params: {}
        })
      })
    );

    const body = (await response.json()) as { result: { total: number } };
    expect(body.result.total).toBe(0);
  });

  it("rejects non-POST methods", async () => {
    const runtime = createAgentRuntime();
    const handler = createAgentReadyHandler(runtime);
    const response = await handler(new Request("http://localhost", { method: "GET" }));
    expect(response.status).toBe(405);
  });
});

describe("handleBridgeMethod", () => {
  it("returns agent.catalog.prompt", async () => {
    const runtime = createAgentRuntime({ defaultPolicy: { mode: "defaultAllow" } });
    const result = await handleBridgeMethod(runtime, "agent.catalog.prompt", { tier: "summary" });
    expect(typeof result).toBe("string");
  });
});

describe("withAgentReady", () => {
  it("adds transpile packages", async () => {
    const { withAgentReady } = await import("./index.js");
    const config = withAgentReady({ reactStrictMode: true });
    expect(config.transpilePackages).toContain("@agent-ready/react");
    expect(config.reactStrictMode).toBe(true);
  });
});

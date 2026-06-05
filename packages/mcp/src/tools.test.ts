import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction, defineObservation } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import {
  callTool,
  decodeToolName,
  encodeToolName,
  listResources,
  listTools,
  readResource
} from "./tools.js";

describe("mcp tools", () => {
  const handle = "app://demo/page/main" as const;

  function setup() {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });
    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act", "read"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({ msg: z.string() })
      }),
      handler: (input) => ({ echo: input.msg })
    });
    runtime.registerObservation(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ n: z.number() })
      }),
      selector: () => ({ n: 1 })
    });
    return runtime;
  }

  it("lists tools from catalog", () => {
    const tools = listTools(setup());
    expect(tools.tools.some((t) => t.name === encodeToolName(handle, "ping"))).toBe(
      true
    );
  });

  it("calls tool via runtime", async () => {
    const runtime = setup();
    const name = encodeToolName(handle, "ping");
    const result = await callTool(runtime, name, {
      input: { msg: "hi" },
      context: { sessionId: "s1", roles: ["agent"] }
    });
    expect(result.content[0]?.text).toContain('"ok":true');
  });

  it("reads observation resource", () => {
    const runtime = setup();
    const uri = `agent://observation/${handle}/state`;
    const resources = listResources(runtime);
    expect(resources.resources.some((r) => r.uri === uri)).toBe(true);
    const data = readResource(runtime, uri);
    expect(data.contents[0]?.text).toContain('"ok":true');
  });

  it("encodes and decodes tool names", () => {
    const name = encodeToolName(handle, "ping");
    expect(decodeToolName(name)).toEqual({ handle, action: "ping" });
  });
});

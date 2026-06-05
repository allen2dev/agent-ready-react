import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { AgentReadyProvider } from "@agent-ready/react";
import { AgentDevPanel } from "./AgentDevPanel.js";

const handle = "app://demo/page/main" as const;

describe("AgentDevPanel", () => {
  it("matches snapshot when open", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });

    runtime.registerSurface({
      manifest: { handle, title: "Demo", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({ msg: z.string() })
      }),
      handler: (input) => ({ echo: input.msg })
    });

    const { container } = render(
      <AgentReadyProvider runtime={runtime}>
        <AgentDevPanel runtime={runtime} defaultOpen position="bottom-right" />
      </AgentReadyProvider>
    );

    await waitFor(() => {
      expect(document.body.textContent).toContain("Agent DevTools");
      expect(document.body.textContent).toContain(handle);
    });

    expect(document.body).toMatchSnapshot();
  });
});

describe("catalog-panel", () => {
  it("shows handle and capabilities", async () => {
    const runtime = createAgentRuntime();
    runtime.registerSurface({
      manifest: { handle, title: "Demo", capabilities: ["act", "observe"] }
    });

    render(<AgentDevPanel runtime={runtime} defaultOpen />);

    await waitFor(() => {
      expect(document.body.textContent).toContain(handle);
      expect(document.body.textContent).toContain("act, observe");
    });
  });
});

describe("action-log", () => {
  it("shows invocation entries", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });
    runtime.registerSurface({
      manifest: { handle, title: "Demo", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({ msg: z.string() })
      }),
      handler: (input) => ({ echo: input.msg })
    });

    render(<AgentDevPanel runtime={runtime} defaultOpen />);

    await runtime.invokeAction({
      handle,
      action: "ping",
      input: { msg: "hello" },
      context: { sessionId: "s1", roles: ["agent"] }
    });

    await waitFor(() => {
      expect(document.body.textContent).toContain("ping");
      expect(document.body.textContent).toContain("hello");
      expect(document.body.textContent).toContain("ok");
    });
  });
});

describe("policy-panel", () => {
  it("shows policy denied records", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: { mode: "defaultDeny", rules: [] }
    });
    runtime.registerSurface({
      manifest: { handle, title: "Demo", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "secret",
        description: "Secret",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });

    render(<AgentDevPanel runtime={runtime} defaultOpen />);

    await runtime.invokeAction({
      handle,
      action: "secret",
      input: {},
      context: { sessionId: "s1", roles: ["guest"] }
    });

    await waitFor(() => {
      expect(document.body.textContent).toContain("Policy denials");
      expect(document.body.textContent).toContain("Policy denied action");
    });
  });
});

describe("devtools e2e smoke", () => {
  it("renders surface, invokes action, and shows log entry", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["save"] }]
      }
    });

    function DemoSurface() {
      return null;
    }

    runtime.registerSurface({
      manifest: { handle, title: "Deal", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "save",
        description: "Save deal",
        input: z.object({ id: z.number() })
      }),
      handler: (input) => ({ saved: input.id })
    });

    render(
      <AgentReadyProvider runtime={runtime}>
        <DemoSurface />
        <AgentDevPanel runtime={runtime} defaultOpen />
      </AgentReadyProvider>
    );

    await waitFor(() => {
      expect(document.body.textContent).toContain(handle);
    });

    const result = await runtime.invokeAction({
      handle,
      action: "save",
      input: { id: 99 },
      context: { sessionId: "e2e", roles: ["agent"] }
    });
    expect(result.ok).toBe(true);

    await waitFor(() => {
      expect(document.body.textContent).toContain("save");
      expect(document.body.textContent).toContain("99");
    });
  });
});

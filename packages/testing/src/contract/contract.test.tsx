import React from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createTestRuntime, createMockAgent } from "../index.js";
import {
  AgentReadyProvider,
  useAgentSurface,
  useAgentAction
} from "@agent-ready/react";

const handle = "app://demo/form/contact" as const;

function ContactForm() {
  useAgentSurface({
    handle,
    title: "Contact",
    capabilities: ["act"]
  });
  useAgentAction(
    handle,
    defineAction({
      name: "submitForm",
      description: "Submit",
      input: z.object({ email: z.string().email() })
    }),
    async (input) => ({ submitted: true, email: input.email })
  );
  return null;
}

function setupRuntime() {
  return createTestRuntime({
    defaultPolicy: {
      mode: "defaultDeny",
      rules: [{ roles: ["agent"], actions: ["submitForm"] }]
    }
  });
}

describe("contract", () => {
  it("success path", async () => {
    const rt = setupRuntime();
    render(
      <AgentReadyProvider
        runtime={rt}
        session={{ sessionId: "s1", roles: ["agent"] }}
      >
        <ContactForm />
      </AgentReadyProvider>
    );
    await waitFor(() => expect(rt.getCatalog().total).toBe(1));

    const agent = createMockAgent(rt, { sessionId: "s1", roles: ["agent"] });
    const result = await agent.invoke({
      handle,
      action: "submitForm",
      input: { email: "user@example.com" }
    });
    expect(result.ok).toBe(true);
  });

  it("VALIDATION_FAILED", async () => {
    const rt = setupRuntime();
    render(
      <AgentReadyProvider runtime={rt} session={{ sessionId: "s1", roles: ["agent"] }}>
        <ContactForm />
      </AgentReadyProvider>
    );
    await waitFor(() => expect(rt.getCatalog().total).toBe(1));

    const agent = createMockAgent(rt, { sessionId: "s1", roles: ["agent"] });
    const result = await agent.invoke({
      handle,
      action: "submitForm",
      input: { email: "not-an-email" }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_VALIDATION_FAILED");
  });

  it("POLICY_DENIED", async () => {
    const rt = setupRuntime();
    render(
      <AgentReadyProvider runtime={rt} session={{ sessionId: "s1" }}>
        <ContactForm />
      </AgentReadyProvider>
    );
    await waitFor(() => expect(rt.getCatalog().total).toBe(1));

    const agent = createMockAgent(rt, { sessionId: "s1" });
    const result = await agent.invoke({
      handle,
      action: "submitForm",
      input: { email: "user@example.com" }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_POLICY_DENIED");
  });

  it("NOT_FOUND after unmount", async () => {
    const rt = setupRuntime();
    const { unmount } = render(
      <AgentReadyProvider runtime={rt} session={{ sessionId: "s1", roles: ["agent"] }}>
        <ContactForm />
      </AgentReadyProvider>
    );
    await waitFor(() => expect(rt.getCatalog().total).toBe(1));
    unmount();

    const agent = createMockAgent(rt, { sessionId: "s1", roles: ["agent"] });
    const result = await agent.invoke({
      handle,
      action: "submitForm",
      input: { email: "user@example.com" }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_SURFACE_NOT_FOUND");
  });
});

import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { z } from "zod";
import { renderWithAgentReady } from "@agent-ready/testing";
import { agentZodValidator, useAgentTanstackForm } from "./index.js";

const handle = "app://forms/contact/main" as const;
const schema = z.object({ email: z.string().email() });

function ContactForm() {
  useAgentTanstackForm(
    handle,
    {
      defaultValues: { email: "" },
      validators: { onSubmit: agentZodValidator(schema) },
      manifest: { title: "Contact", capabilities: ["act"] },
      onSubmit: async (data) => ({ submitted: true, email: data.email })
    },
    {
      name: "submitForm",
      description: "Submit the contact form"
    }
  );
  return null;
}

describe("useAgentTanstackForm", () => {
  it("registers surface and action from form options", async () => {
    const { runtime } = renderWithAgentReady(<ContactForm />, {
      config: {
        defaultPolicy: {
          mode: "defaultDeny",
          rules: [{ roles: ["agent"], actions: ["submitForm"] }]
        }
      },
      session: { sessionId: "s1", roles: ["agent"] }
    });

    await waitFor(() => expect(runtime.getCatalog().total).toBe(1));
    expect(runtime.getCatalog().surfaces[0]?.handle).toBe(handle);
  });

  it("invokes action through runtime after render", async () => {
    const { runtime, agent } = renderWithAgentReady(<ContactForm />, {
      config: {
        defaultPolicy: {
          mode: "defaultDeny",
          rules: [{ roles: ["agent"], actions: ["submitForm"] }]
        }
      },
      session: { sessionId: "s1", roles: ["agent"] }
    });

    await waitFor(() => expect(runtime.getCatalog().total).toBe(1));

    const result = await agent.invoke({
      handle,
      action: "submitForm",
      input: { email: "user@example.com" }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ submitted: true, email: "user@example.com" });
    }
  });
});

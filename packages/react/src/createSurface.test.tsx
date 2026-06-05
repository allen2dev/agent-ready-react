import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { z } from "zod";
import { defineAction, defineObservation } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { AgentReadyProvider } from "./AgentReadyProvider.js";
import { createSurface } from "./createSurface.js";

const handle = "app://demo/surface/main" as const;

const submitAction = defineAction({
  name: "save",
  description: "Save deal",
  input: z.object({ id: z.string() }),
  output: z.object({ saved: z.boolean() })
});

const dealObservation = defineObservation({
  name: "dealState",
  description: "Deal state",
  schema: z.object({ id: z.string() })
});

const surface = createSurface(handle, {
  title: "Deal Panel",
  capabilities: ["act", "read"]
});

describe("createSurface", () => {
  it("binds action and observation without repeating handle", async () => {
    let dealState = { id: "deal-1" };

    function DealPanel() {
      surface.useAction(submitAction, async (input) => {
        dealState = { id: input.id };
        return { saved: true };
      });
      surface.useObservation(dealObservation, () => dealState);
      return null;
    }

    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["save"] }]
      }
    });

    render(
      <AgentReadyProvider runtime={runtime} session={{ sessionId: "s1", roles: ["agent"] }}>
        <DealPanel />
      </AgentReadyProvider>
    );

    await waitFor(() => expect(runtime.getCatalog().total).toBe(1));

    const result = await runtime.invokeAction({
      handle,
      action: "save",
      input: { id: "deal-42" },
      context: { sessionId: "s1", roles: ["agent"] }
    });
    expect(result.ok).toBe(true);

    const observation = runtime.readObservation({
      handle,
      name: "dealState"
    });
    expect(observation.ok).toBe(true);
    if (observation.ok) {
      expect(observation.data).toEqual({ id: "deal-42" });
    }
  });
});

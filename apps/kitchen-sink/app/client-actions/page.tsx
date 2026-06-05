"use client";

import { useState } from "react";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import {
  AgentReadyProvider,
  useAgentAction,
  useAgentReadyContext,
  useAgentSurface
} from "@agent-ready/react";

const handle = "app://kitchen/client/main" as const;

const incrementAction = defineAction({
  name: "increment",
  description: "Increment a counter by amount",
  input: z.object({ amount: z.number().int().min(1).max(10) }),
  risk: "low"
});

export default function ClientActionsPage() {
  return (
    <main>
      <h1>Client Action Demo</h1>
      <p>
        Registers actions with explicit handle via{" "}
        <code>useAgentAction(handle, action, handler)</code>.
      </p>
      <AgentReadyProvider
        session={{ sessionId: "kitchen-client", roles: ["demo"] }}
        config={{
          defaultPolicy: {
            mode: "defaultDeny",
            rules: [{ roles: ["demo"], actions: ["increment"] }]
          }
        }}
      >
        <CounterDemo />
      </AgentReadyProvider>
    </main>
  );
}

function CounterDemo() {
  const { runtime, session } = useAgentReadyContext();
  const [result, setResult] = useState<string>("");

  useAgentSurface({
    handle,
    title: "Kitchen Client Actions",
    capabilities: ["act"]
  });

  useAgentAction(handle, incrementAction, (input) => ({
    delta: input.amount
  }));

  async function invoke() {
    const res = await runtime.invokeAction({
      handle,
      action: "increment",
      input: { amount: 1 },
      context: session ?? { sessionId: "kitchen-client", roles: ["demo"] }
    });
    setResult(JSON.stringify(res, null, 2));
  }

  return (
    <section>
      <button type="button" onClick={invoke}>
        Invoke increment
      </button>
      <pre>{result}</pre>
    </section>
  );
}

import { useState } from "react";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import {
  AgentReadyProvider,
  useAgentSurface,
  useAgentAction
} from "@agent-ready/react";
import { createAgentRuntime } from "@agent-ready/runtime";
import {
  disablePlaygroundOtel,
  enablePlaygroundOtel,
  isPlaygroundOtelEnabled
} from "./otel-demo.js";

const handle = "app://playground/demo/main" as const;
const runtime = createAgentRuntime({
  defaultPolicy: {
    mode: "defaultDeny",
    rules: [{ roles: ["playground"], actions: ["greet"] }]
  }
});

const greetAction = defineAction({
  name: "greet",
  description: "Return a greeting",
  input: z.object({ name: z.string().min(1) }),
  risk: "low"
});

function OtelPanel() {
  const [enabled, setEnabled] = useState(isPlaygroundOtelEnabled());

  function toggle() {
    if (enabled) {
      disablePlaygroundOtel();
      setEnabled(false);
      return;
    }
    enablePlaygroundOtel(runtime);
    setEnabled(true);
  }

  return (
    <section>
      <h2>OpenTelemetry</h2>
      <label>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        Enable console span exporter
      </label>
      <p>
        When enabled, each invoke emits an <code>agent.action.invoke</code> span to
        the browser devtools console via OpenTelemetry ConsoleSpanExporter.
      </p>
    </section>
  );
}

function DemoSurface() {
  useAgentSurface({
    handle,
    title: "Playground Demo",
    capabilities: ["act"]
  });

  useAgentAction(handle, greetAction, (input) => ({
    message: `Hello, ${input.name}!`
  }));

  return <p>Surface registered: {handle}</p>;
}

function InvokePanel() {
  const [name, setName] = useState("Agent");
  const [result, setResult] = useState<string>("");

  async function invoke() {
    const res = await runtime.invokeAction({
      handle,
      action: "greet",
      input: { name },
      context: { sessionId: "playground", roles: ["playground"] }
    });
    setResult(JSON.stringify(res, null, 2));
  }

  return (
    <section>
      <h2>Invoke Action</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" onClick={invoke}>
        Invoke greet
      </button>
      <pre>{result}</pre>
    </section>
  );
}

function CatalogPanel() {
  const catalog = runtime.getCatalog();
  return (
    <section>
      <h2>Catalog</h2>
      <pre>{JSON.stringify(catalog, null, 2)}</pre>
    </section>
  );
}

export function App() {
  return (
    <AgentReadyProvider
      runtime={runtime}
      session={{ sessionId: "playground", roles: ["playground"] }}
    >
      <h1>Agent Ready Playground</h1>
      <OtelPanel />
      <DemoSurface />
      <CatalogPanel />
      <InvokePanel />
    </AgentReadyProvider>
  );
}

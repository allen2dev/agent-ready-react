"use client";

import { useMemo } from "react";
import { AgentReadyProvider, useAgentCatalog } from "@agent-ready/react";
import { createAgentRuntime } from "@agent-ready/runtime";

export function RscDemoClient({ manifests }: { manifests: string }) {
  const runtime = useMemo(
    () =>
      createAgentRuntime({
        defaultPolicy: { mode: "defaultAllow" }
      }),
    []
  );

  return (
    <AgentReadyProvider
      runtime={runtime}
      manifests={manifests}
      session={{ sessionId: "kitchen-rsc", roles: ["demo"] }}
    >
      <HydratedSurface />
    </AgentReadyProvider>
  );
}

function HydratedSurface() {
  const catalog = useAgentCatalog();

  return (
    <section>
      <h2>Hydrated catalog</h2>
      <pre>{JSON.stringify(catalog, null, 2)}</pre>
    </section>
  );
}

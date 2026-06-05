"use client";

import { useMemo } from "react";
import type { AgentHandle } from "@agent-ready/schema";
import {
  AgentReadyProvider,
  useAgentCatalog,
  useAgentSurface
} from "@agent-ready/react";
import { createAgentRuntime } from "@agent-ready/runtime";

export function RscDemoClient({
  manifests,
  handle
}: {
  manifests: string;
  handle: AgentHandle;
}) {
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
      <HydratedSurface handle={handle} />
    </AgentReadyProvider>
  );
}

function HydratedSurface({ handle }: { handle: AgentHandle }) {
  useAgentSurface({
    handle,
    title: "Kitchen RSC Surface",
    capabilities: ["act", "read"]
  });

  const catalog = useAgentCatalog();

  return (
    <section>
      <h2>Hydrated catalog</h2>
      <pre>{JSON.stringify(catalog, null, 2)}</pre>
    </section>
  );
}

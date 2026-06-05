import { useEffect, useMemo, type ReactNode } from "react";
import {
  createAgentRuntime,
  type AgentRuntime,
  type AgentRuntimeConfig
} from "@agent-ready/runtime";
import type { AgentSessionContext } from "@agent-ready/schema";
import type { PolicyProvider } from "@agent-ready/runtime";
import type { SurfaceManifest } from "@agent-ready/schema";
import { AgentReadyContext } from "./context.js";

export interface AgentReadyProviderProps {
  runtime?: AgentRuntime;
  config?: AgentRuntimeConfig;
  session?: AgentSessionContext;
  policy?: PolicyProvider;
  /** Server-serialized manifests from serializeAgentManifests() */
  manifests?: SurfaceManifest[] | string;
  children: ReactNode;
}

export function AgentReadyProvider({
  runtime: runtimeProp,
  config,
  session,
  policy,
  manifests,
  children
}: AgentReadyProviderProps) {
  const runtime = useMemo(
    () => runtimeProp ?? createAgentRuntime(config),
    [runtimeProp, config]
  );

  useEffect(() => {
    if (!manifests) return;
    const list =
      typeof manifests === "string"
        ? (JSON.parse(manifests) as SurfaceManifest[])
        : manifests;
    const unsubs = list.map((manifest) =>
      runtime.registerSurface({ manifest })
    );
    return () => unsubs.forEach((off) => off());
  }, [runtime, manifests]);

  if (policy) {
    runtime.setPolicyProvider(policy);
  }

  const value = useMemo(
    () => ({ runtime, session }),
    [runtime, session]
  );

  return (
    <AgentReadyContext.Provider value={value}>{children}</AgentReadyContext.Provider>
  );
}

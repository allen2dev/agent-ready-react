import { useSyncExternalStore } from "react";
import type { CatalogQuery } from "@agent-ready/runtime";
import { useAgentReadyContext } from "../context.js";

export function useAgentCatalog(query?: CatalogQuery) {
  const { runtime } = useAgentReadyContext();
  const queryKey = JSON.stringify(query ?? {});

  return useSyncExternalStore(
    (onStoreChange) => {
      const offs = [
        runtime.on("surface:registered", onStoreChange),
        runtime.on("surface:unregistered", onStoreChange),
        runtime.on("action:registered", onStoreChange)
      ];
      return () => offs.forEach((off) => off());
    },
    () => runtime.getCatalog(query),
    () => runtime.getCatalog(query)
  );
}

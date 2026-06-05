import { useRef, useSyncExternalStore } from "react";
import type { AgentCatalog, CatalogQuery } from "@agent-ready/runtime";
import { useAgentReadyContext } from "../context.js";

/**
 * Subscribes to the agent catalog and re-renders when surfaces or actions change.
 *
 * @example
 * ```tsx
 * function AgentCatalogPanel() {
 *   const catalog = useAgentCatalog({ capabilities: ["act"] });
 *   return (
 *     <ul>
 *       {catalog.surfaces.map((surface) => (
 *         <li key={surface.handle}>{surface.title}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAgentCatalog(query?: CatalogQuery) {
  const { runtime } = useAgentReadyContext();
  const queryKey = JSON.stringify(query ?? {});
  const queryKeyRef = useRef(queryKey);
  const snapshotRef = useRef<AgentCatalog>(runtime.getCatalog(query));
  const serverSnapshotRef = useRef<AgentCatalog | null>(null);

  if (queryKeyRef.current !== queryKey) {
    queryKeyRef.current = queryKey;
    snapshotRef.current = runtime.getCatalog(query);
    serverSnapshotRef.current = null;
  }

  return useSyncExternalStore(
    (onStoreChange) => {
      const refresh = () => {
        snapshotRef.current = runtime.getCatalog(query);
        onStoreChange();
      };
      const offs = [
        runtime.on("surface:registered", refresh),
        runtime.on("surface:unregistered", refresh),
        runtime.on("action:registered", refresh)
      ];
      return () => offs.forEach((off) => off());
    },
    () => snapshotRef.current,
    () => {
      if (serverSnapshotRef.current === null) {
        serverSnapshotRef.current = runtime.getCatalog(query);
      }
      return serverSnapshotRef.current;
    }
  );
}

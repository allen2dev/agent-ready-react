import type { AgentHandle } from "@agent-ready/schema";
import type {
  AgentCatalog,
  CatalogQuery,
  CatalogSurfaceSummary
} from "../types.js";
import type { SurfaceRegistry } from "../registry/surface.js";
import type { ActionRegistry } from "../registry/action.js";

export function buildCatalog(
  surfaces: SurfaceRegistry,
  actions: ActionRegistry,
  query: CatalogQuery = {}
): AgentCatalog {
  const limit = query.limit ?? 50;
  const offset = query.cursor ? Number.parseInt(query.cursor, 10) : 0;

  let manifests = surfaces.list();

  if (query.scope) {
    manifests = manifests.filter((m) =>
      m.handle.includes(`://${query.scope}/`)
    );
  }

  if (query.tags?.length) {
    manifests = manifests.filter((m) =>
      query.tags!.every((tag) => m.tags?.includes(tag))
    );
  }

  if (query.capability) {
    manifests = manifests.filter((m) =>
      m.capabilities.includes(query.capability!)
    );
  }

  const total = manifests.length;
  const slice = manifests.slice(offset, offset + limit);
  const nextOffset = offset + limit;

  const summaries: CatalogSurfaceSummary[] = slice.map((manifest) => ({
    handle: manifest.handle as AgentHandle,
    title: manifest.title,
    capabilities: manifest.capabilities,
    actions: actions.listForHandle(manifest.handle as AgentHandle),
    observations: []
  }));

  return {
    surfaces: summaries,
    total,
    cursor: nextOffset < total ? String(nextOffset) : undefined
  };
}

export function toPromptContext(
  catalog: AgentCatalog,
  options: { tier?: "summary" | "full" | "debug" } = {}
): string {
  const tier = options.tier ?? "summary";
  const lines = catalog.surfaces.map((s) => {
    if (tier === "summary") {
      return `- ${s.handle}: ${s.title} [${s.capabilities.join(",")}]`;
    }
    return `- ${s.handle}: ${s.title}\n  actions: ${s.actions.join(", ") || "(none)"}`;
  });
  return lines.join("\n");
}

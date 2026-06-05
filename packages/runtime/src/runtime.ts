import type {
  AgentResult,
  InvokeActionRequest,
  ReadObservationRequest,
  SurfaceManifest
} from "@agent-ready/schema";
import { SurfaceRegistry } from "./registry/surface.js";
import { ActionRegistry } from "./registry/action.js";
import { ObservationRegistry } from "./registry/observation.js";
import { buildCatalog, toPromptContext } from "./catalog/index.js";
import { invokeAction } from "./executor/action.js";
import { readObservation } from "./snapshot/index.js";
import { TypedEventBus, type AgentRuntimeEventMap } from "./events.js";
import { createPolicyEngine } from "./policy/engine.js";
import type { PolicyProvider } from "./policy/types.js";
import type {
  AgentCatalog,
  AgentRuntimeConfig,
  CatalogQuery,
  PromptContextOptions,
  RegisteredAction,
  RegisteredObservation,
  RegisteredSurface
} from "./types.js";

export interface AgentRuntime {
  registerSurface(entry: RegisteredSurface): () => void;
  registerAction(handle: SurfaceManifest["handle"], action: RegisteredAction): () => void;
  registerObservation(handle: SurfaceManifest["handle"], obs: RegisteredObservation): () => void;
  getCatalog(query?: CatalogQuery): AgentCatalog;
  toPromptContext(options?: PromptContextOptions): string;
  invokeAction<T = unknown>(request: InvokeActionRequest): Promise<AgentResult<T>>;
  readObservation(request: ReadObservationRequest): AgentResult<unknown>;
  subscribeObservation(
    request: ReadObservationRequest,
    onUpdate: (result: AgentResult<unknown>) => void,
    options?: { intervalMs?: number }
  ): () => void;
  on<E extends keyof AgentRuntimeEventMap>(
    event: E,
    listener: (payload: AgentRuntimeEventMap[E]) => void
  ): () => void;
  setPolicyProvider(provider: PolicyProvider): void;
}

export function createAgentRuntime(config: AgentRuntimeConfig = {}): AgentRuntime {
  const surfaces = new SurfaceRegistry();
  const actions = new ActionRegistry();
  const observations = new ObservationRegistry();
  const events = new TypedEventBus();
  let policy: PolicyProvider | undefined = config.defaultPolicy
    ? createPolicyEngine(config.defaultPolicy)
    : createPolicyEngine({ mode: "defaultDeny" });

  const emitCatalogUpdated = () => {
    events.emit("catalog:updated", { totalSurfaces: surfaces.list().length });
  };

  return {
    registerSurface(entry) {
      const unregister = surfaces.register(entry);
      events.emit("surface:registered", {
        handle: entry.manifest.handle,
        manifest: entry.manifest
      });
      emitCatalogUpdated();
      return () => {
        const manifest = entry.manifest;
        unregister();
        actions.removeAllForHandle(entry.manifest.handle);
        observations.removeAllForHandle(entry.manifest.handle);
        events.emit("surface:unregistered", { handle: manifest.handle, manifest });
        emitCatalogUpdated();
      };
    },

    registerAction(handle, action) {
      if (!surfaces.has(handle)) {
        throw new Error(`Cannot register action for unknown surface: ${handle}`);
      }
      const actionName = action.definition.name;
      const unregister = actions.register(handle, action);
      events.emit("action:registered", { handle, actionName });
      emitCatalogUpdated();
      return () => {
        unregister();
        events.emit("action:unregistered", { handle, actionName });
        emitCatalogUpdated();
      };
    },

    registerObservation(handle, obs) {
      if (!surfaces.has(handle)) {
        throw new Error(`Cannot register observation for unknown surface: ${handle}`);
      }
      const unregister = observations.register(handle, obs);
      emitCatalogUpdated();
      return () => {
        unregister();
        emitCatalogUpdated();
      };
    },

    getCatalog(query) {
      return buildCatalog(surfaces, actions, observations, query);
    },

    toPromptContext(options) {
      return toPromptContext(
        buildCatalog(surfaces, actions, observations),
        options
      );
    },

    async invokeAction<T>(request: InvokeActionRequest) {
      return invokeAction(surfaces, actions, events, request, {
        actionTimeoutMs: config.actionTimeoutMs,
        policy,
        rateLimit: config.rateLimit
      }) as Promise<AgentResult<T>>;
    },

    readObservation(request) {
      return readObservation(surfaces, observations, request, events);
    },

    subscribeObservation(request, onUpdate, options) {
      const intervalMs = options?.intervalMs ?? 500;
      let lastEtag: string | undefined;
      const tick = () => {
        const result = readObservation(surfaces, observations, request, events);
        const etag = result.ok ? result.meta?.etag : undefined;
        if (etag !== lastEtag) {
          lastEtag = etag;
          onUpdate(result);
        }
      };
      tick();
      const id = setInterval(tick, intervalMs);
      return () => clearInterval(id);
    },

    on(event, listener) {
      return events.on(event, listener);
    },

    setPolicyProvider(provider) {
      policy = provider;
    }
  };
}

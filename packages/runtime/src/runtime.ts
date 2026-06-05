import type {
  AgentResult,
  InvokeActionRequest,
  SurfaceManifest
} from "@agent-ready/schema";
import { SurfaceRegistry } from "./registry/surface.js";
import { ActionRegistry } from "./registry/action.js";
import { buildCatalog, toPromptContext } from "./catalog/index.js";
import { invokeAction } from "./executor/action.js";
import { TypedEventBus, type AgentRuntimeEventMap } from "./events.js";
import { createPolicyEngine } from "./policy/engine.js";
import type { PolicyProvider } from "./policy/types.js";
import type {
  AgentCatalog,
  AgentRuntimeConfig,
  CatalogQuery,
  PromptContextOptions,
  RegisteredAction,
  RegisteredSurface
} from "./types.js";

export interface AgentRuntime {
  registerSurface(entry: RegisteredSurface): () => void;
  registerAction(handle: SurfaceManifest["handle"], action: RegisteredAction): () => void;
  getCatalog(query?: CatalogQuery): AgentCatalog;
  toPromptContext(options?: PromptContextOptions): string;
  invokeAction<T = unknown>(request: InvokeActionRequest): Promise<AgentResult<T>>;
  on<E extends keyof AgentRuntimeEventMap>(
    event: E,
    listener: (payload: AgentRuntimeEventMap[E]) => void
  ): () => void;
  setPolicyProvider(provider: PolicyProvider): void;
}

export function createAgentRuntime(config: AgentRuntimeConfig = {}): AgentRuntime {
  const surfaces = new SurfaceRegistry();
  const actions = new ActionRegistry();
  const events = new TypedEventBus();
  let policy: PolicyProvider | undefined = config.defaultPolicy
    ? createPolicyEngine(config.defaultPolicy)
    : createPolicyEngine({ mode: "defaultDeny" });

  return {
    registerSurface(entry) {
      const unregister = surfaces.register(entry);
      events.emit("surface:registered", { handle: entry.manifest.handle });
      return () => {
        unregister();
        actions.removeAllForHandle(entry.manifest.handle);
        events.emit("surface:unregistered", { handle: entry.manifest.handle });
      };
    },

    registerAction(handle, action) {
      if (!surfaces.has(handle)) {
        throw new Error(`Cannot register action for unknown surface: ${handle}`);
      }
      const unregister = actions.register(handle, action);
      events.emit("action:registered", {
        handle,
        action: action.definition.name
      });
      return unregister;
    },

    getCatalog(query) {
      return buildCatalog(surfaces, actions, query);
    },

    toPromptContext(options) {
      return toPromptContext(buildCatalog(surfaces, actions), options);
    },

    async invokeAction<T>(request: InvokeActionRequest) {
      return invokeAction(surfaces, actions, events, request, {
        actionTimeoutMs: config.actionTimeoutMs,
        policy
      }) as Promise<AgentResult<T>>;
    },

    on(event, listener) {
      return events.on(event, listener);
    },

    setPolicyProvider(provider) {
      policy = provider;
    }
  };
}

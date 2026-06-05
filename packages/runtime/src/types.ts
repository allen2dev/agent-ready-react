import type {
  ActionDefinition,
  AgentHandle,
  AgentResult,
  AgentSessionContext,
  InvokeActionRequest,
  SurfaceManifest
} from "@agent-ready/schema";
export type { AgentSessionContext, InvokeActionRequest };
import type { ZodType, ZodTypeDef } from "zod";

export interface AgentRuntimeConfig {
  scheduler?: (fn: () => void) => void;
  logger?: AgentLogger;
  maxCatalogEntries?: number;
  actionTimeoutMs?: number;
}

export interface AgentLogger {
  debug?(message: string, meta?: Record<string, unknown>): void;
  warn?(message: string, meta?: Record<string, unknown>): void;
}

export interface RegisteredSurface {
  manifest: SurfaceManifest;
}

export interface RegisteredAction<TIn = unknown, TOut = unknown> {
  definition: ActionDefinition<TIn, TOut>;
  handler: (
    input: TIn,
    ctx: ActionHandlerContext
  ) => Promise<TOut> | TOut;
}

export interface ActionHandlerContext {
  handle: AgentHandle;
  session: AgentSessionContext | undefined;
  signal: AbortSignal;
}

export interface CatalogQuery {
  scope?: string;
  tags?: string[];
  capability?: import("@agent-ready/schema").AgentCapabilityKind;
  cursor?: string;
  limit?: number;
}

export interface CatalogSurfaceSummary {
  handle: AgentHandle;
  title: string;
  capabilities: SurfaceManifest["capabilities"];
  actions: string[];
  observations: string[];
}

export interface AgentCatalog {
  surfaces: CatalogSurfaceSummary[];
  total: number;
  cursor?: string;
}

export interface PromptContextOptions {
  tier?: "summary" | "full" | "debug";
}

export type { AgentHandle, AgentResult };
export type { ZodType, ZodTypeDef };

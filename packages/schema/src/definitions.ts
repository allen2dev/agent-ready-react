import type { ZodType, ZodTypeDef } from "zod";

export type ActionRisk = "low" | "medium" | "high";
export type ObservationRefresh = "push" | "pull" | "both";

export interface ActionDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  input: ZodType<TInput, ZodTypeDef, unknown>;
  output?: ZodType<TOutput, ZodTypeDef, unknown>;
  risk?: ActionRisk;
  idempotent?: boolean;
}

export interface ObservationDefinition<T = unknown> {
  name: string;
  description: string;
  schema: ZodType<T, ZodTypeDef, unknown>;
  maxBytes?: number;
  refresh?: ObservationRefresh;
}

export function defineAction<TIn, TOut>(
  def: ActionDefinition<TIn, TOut>
): ActionDefinition<TIn, TOut> {
  return def;
}

export function defineObservation<T>(
  def: ObservationDefinition<T>
): ObservationDefinition<T> {
  return def;
}

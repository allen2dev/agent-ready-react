import { z } from "zod";

export const agentHandleSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9-]*:\/\/[^/]+\/[^/]+\/[^/]+$/,
    "Handle must match namespace://scope/type/localId"
  );

export type AgentHandle = z.infer<typeof agentHandleSchema>;

export const agentCapabilityKindSchema = z.enum(["read", "act", "subscribe"]);

export type AgentCapabilityKind = z.infer<typeof agentCapabilityKindSchema>;

export const surfaceManifestSchema = z.object({
  handle: agentHandleSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  capabilities: z.array(agentCapabilityKindSchema).min(1),
  version: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  parentHandle: agentHandleSchema.optional()
});

export type SurfaceManifest = z.infer<typeof surfaceManifestSchema>;

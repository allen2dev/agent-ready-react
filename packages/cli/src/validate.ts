import { readFileSync } from "node:fs";
import { surfaceManifestSchema } from "@agent-ready/schema";

export function validateCommand(manifestPath: string) {
  const raw = readFileSync(manifestPath, "utf8");
  const json = JSON.parse(raw) as unknown;
  const result = surfaceManifestSchema.safeParse(json);
  if (!result.success) {
    console.error("Validation failed:", result.error.flatten());
    process.exit(1);
  }
  console.log("OK:", result.data.handle);
}

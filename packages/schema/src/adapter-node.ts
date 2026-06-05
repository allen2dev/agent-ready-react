import { createRequire } from "module";
import {
  createSchemaAdapter,
  type ZodMajorVersion
} from "./adapter.js";

const require = createRequire(import.meta.url);

export function detectZodMajorVersion(): ZodMajorVersion {
  try {
    const pkg = require("zod/package.json") as { version?: string };
    const major = Number.parseInt(String(pkg.version ?? "3").split(".")[0] ?? "3", 10);
    return major >= 4 ? 4 : 3;
  } catch {
    return 3;
  }
}

export function getActiveSchemaAdapterAuto() {
  return createSchemaAdapter(detectZodMajorVersion());
}

export { createSchemaAdapter } from "./adapter.js";
export type { SchemaAdapter, SchemaParseResult, ZodMajorVersion } from "./adapter.js";

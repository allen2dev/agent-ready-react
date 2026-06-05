import { access } from "node:fs/promises";
import { join } from "node:path";

const packages = [
  "packages/schema/dist/index.js",
  "packages/schema/dist/index.d.ts",
  "packages/runtime/dist/index.js",
  "packages/runtime/dist/index.d.ts",
  "packages/testing/dist/index.js",
  "packages/testing/dist/index.d.ts",
  "packages/react/dist/index.js",
  "packages/react/dist/index.d.ts",
  "packages/observability/dist/index.js",
  "packages/devtools/dist/index.js"
];

for (const file of packages) {
  await access(join(process.cwd(), file));
  console.log(`ok: ${file}`);
}

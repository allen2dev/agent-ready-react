import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = dirname(import.meta.dirname);

test("base.json is valid JSON with strict mode", () => {
  const base = JSON.parse(readFileSync(join(root, "base.json"), "utf8"));
  assert.equal(base.compilerOptions.strict, true);
  assert.equal(base.compilerOptions.moduleResolution, "bundler");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createVitestConfig } from "../index.mjs";

test("createVitestConfig sets node environment", () => {
  const config = createVitestConfig();
  assert.equal(config.test.environment, "node");
});

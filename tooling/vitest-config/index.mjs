import { defineConfig } from "vitest/config";

export function createVitestConfig(overrides = {}) {
  return defineConfig({
    test: {
      environment: "node",
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary"]
      }
    },
    ...overrides
  });
}

export default createVitestConfig();

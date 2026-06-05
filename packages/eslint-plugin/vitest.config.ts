import { createVitestConfig } from "@agent-ready/vitest-config";

export default createVitestConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"]
  }
});

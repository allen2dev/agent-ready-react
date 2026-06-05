import { createVitestConfig } from "@agent-ready/vitest-config";

export default createVitestConfig({
  test: {
    environment: "jsdom"
  }
});

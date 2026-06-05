import { describe, expect, it } from "vitest";
import { createDevToolsStore } from "./store.js";

describe("createDevToolsStore", () => {
  it("keeps action log ring buffer at 100", () => {
    const store = createDevToolsStore(100);
    for (let i = 0; i < 101; i++) {
      store.pushEvent({
        type: "action:invoked",
        timestamp: i,
        payload: {
          handle: "app://demo/page/main",
          action: "a",
          ok: true
        }
      });
    }
    expect(store.getState().actionLog).toHaveLength(100);
  });

  it("records policy denied", () => {
    const store = createDevToolsStore();
    store.pushEvent({
      type: "policy:denied",
      timestamp: 1,
      payload: { handle: "app://demo/page/main", action: "x" }
    });
    expect(store.getState().policyLog).toHaveLength(1);
  });
});

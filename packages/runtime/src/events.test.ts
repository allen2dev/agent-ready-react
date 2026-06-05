import { describe, expect, it, vi } from "vitest";
import { TypedEventBus } from "./events.js";

describe("TypedEventBus", () => {
  it("subscribes and unsubscribes", () => {
    const bus = new TypedEventBus();
    const listener = vi.fn();
    const off = bus.on("surface:registered", listener);
    bus.emit("surface:registered", { handle: "app://demo/a/b/c" });
    expect(listener).toHaveBeenCalledOnce();
    off();
    bus.emit("surface:registered", { handle: "app://demo/a/b/d" });
    expect(listener).toHaveBeenCalledOnce();
  });
});

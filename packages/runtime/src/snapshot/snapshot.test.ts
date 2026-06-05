import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defineObservation } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";
import { SurfaceRegistry } from "../registry/surface.js";
import { ObservationRegistry } from "../registry/observation.js";
import { computeEtag, readObservation, readSnapshot } from "./index.js";

const handle = "app://demo/page/main" as const;

describe("computeEtag", () => {
  it("is stable for same data", () => {
    const data = { a: 1, b: "x" };
    expect(computeEtag(data)).toBe(computeEtag(data));
  });

  it("changes when data changes", () => {
    expect(computeEtag({ a: 1 })).not.toBe(computeEtag({ a: 2 }));
  });
});

describe("readObservation", () => {
  function setup() {
    const surfaces = new SurfaceRegistry();
    const observations = new ObservationRegistry();
    surfaces.register({
      manifest: { handle, title: "Main", capabilities: ["read"] }
    });
    observations.register(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ n: z.number() })
      }),
      selector: () => ({ n: 1 })
    });
    return { surfaces, observations };
  }

  it("reads registered observation", () => {
    const { surfaces, observations } = setup();
    const result = readObservation(surfaces, observations, {
      handle,
      name: "state"
    });
    expect(result.ok).toBe(true);
  });

  it("returns NOT_FOUND for missing surface", () => {
    const { surfaces, observations } = setup();
    const result = readObservation(surfaces, observations, {
      handle: "app://missing/x/y" as typeof handle,
      name: "state"
    });
    expect(result.ok).toBe(false);
  });

  it("returns NOT_FOUND for missing observation", () => {
    const { surfaces, observations } = setup();
    const result = readObservation(surfaces, observations, {
      handle,
      name: "missing"
    });
    expect(result.ok).toBe(false);
  });
});

describe("readSnapshot", () => {
  it("aggregates observations for handle", () => {
    const surfaces = new SurfaceRegistry();
    const observations = new ObservationRegistry();
    surfaces.register({
      manifest: { handle, title: "Main", capabilities: ["read"] }
    });
    observations.register(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ n: z.number() })
      }),
      selector: () => ({ n: 2 })
    });
    const result = readSnapshot(surfaces, observations, handle);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.state).toEqual({ n: 2 });
  });
});

describe("subscribeObservation", () => {
  it("pushes updates until unsubscribed", async () => {
    vi.useFakeTimers();
    let n = 0;
    const runtime = createAgentRuntime({ defaultPolicy: { mode: "defaultAllow" } });
    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["read"] }
    });
    runtime.registerObservation(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ n: z.number() })
      }),
      selector: () => ({ n: ++n })
    });

    const updates: number[] = [];
    const off = runtime.subscribeObservation(
      { handle, name: "state" },
      (result) => {
        if (result.ok) updates.push((result.data as { n: number }).n);
      },
      { intervalMs: 100 }
    );

    vi.advanceTimersByTime(250);
    off();
    vi.useRealTimers();
    expect(updates.length).toBeGreaterThan(1);
  });
});

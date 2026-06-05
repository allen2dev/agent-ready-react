#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";

const handle = "app://bench/page/main";
const runtime = createAgentRuntime({ defaultPolicy: { mode: "defaultAllow" } });

runtime.registerSurface({
  manifest: { handle, title: "Bench", capabilities: ["act"] }
});
runtime.registerAction(handle, {
  definition: defineAction({
    name: "ping",
    description: "Ping",
    input: z.object({ n: z.number() })
  }),
  handler: (input) => ({ n: input.n })
});

const iterations = 500;
const latencies = [];

for (let i = 0; i < iterations; i++) {
  const start = performance.now();
  await runtime.invokeAction({
    handle,
    action: "ping",
    input: { n: i },
    context: { sessionId: "bench", roles: ["agent"] }
  });
  latencies.push(performance.now() - start);
  runtime.getCatalog();
}

latencies.sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
const totalMs = latencies.reduce((sum, n) => sum + n, 0);
const qps = (iterations / totalMs) * 1000;

console.log(
  JSON.stringify(
    {
      iterations,
      qps: Number(qps.toFixed(2)),
      latencyMs: { p50: Number(p50.toFixed(3)), p95: Number(p95.toFixed(3)) }
    },
    null,
    2
  )
);

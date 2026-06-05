import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { loadAgentManifest, scanSourceForHandles } from "./manifest.js";
import { parseBridgeMessage, serializeBridgeMessage } from "./protocol.js";

describe("manifest", () => {
  it("loads agent-manifest.json when present", () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-manifest-"));
    writeFileSync(
      join(dir, "agent-manifest.json"),
      JSON.stringify({
        version: 1,
        surfaces: [{ handle: "app://demo/page/main", title: "Main" }]
      })
    );

    const manifest = loadAgentManifest(dir);
    expect(manifest?.surfaces).toHaveLength(1);
    expect(manifest?.surfaces[0]?.handle).toBe("app://demo/page/main");
  });

  it("scans source for useAgentSurface handles", () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-scan-"));
    const srcDir = join(dir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(
      join(srcDir, "App.tsx"),
      `useAgentSurface({ handle: "app://demo/form/contact", title: "Contact" });`
    );

    const surfaces = scanSourceForHandles(dir);
    expect(surfaces.some((s) => s.handle === "app://demo/form/contact")).toBe(true);
  });
});

describe("protocol", () => {
  it("round-trips bridge messages", () => {
    const message = {
      type: "request" as const,
      id: "1",
      method: "agent.action.invoke",
      params: { handle: "app://demo/page/main", action: "save" }
    };
    expect(parseBridgeMessage(serializeBridgeMessage(message))).toEqual(message);
  });
});

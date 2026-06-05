import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { transformSync } from "@babel/core";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import agentReadyPlugin from "./index.js";

const manifestPath = join(tmpdir(), `agent-manifest-${process.pid}.json`);

function transform(code: string, filename = "test.tsx") {
  return transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [[agentReadyPlugin, { manifestPath }]]
  });
}

describe("babel-plugin-agent-ready", () => {
  beforeEach(() => {
    try {
      rmSync(manifestPath);
    } catch {
      // ignore missing file
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("collects static handles from useAgentSurface", () => {
    transform(`
      useAgentSurface({
        handle: "app://demo/page/main",
        title: "Demo",
        capabilities: ["act"],
      });
    `);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest.surfaces).toEqual([
      {
        handle: "app://demo/page/main",
        title: "Demo",
        capabilities: ["act"],
        source: "test.tsx"
      }
    ]);
  });

  it("collects static handles from createSurface", () => {
    transform(`
      createSurface("crm://deals/panel/main", {
        title: "Deal Panel",
        capabilities: ["act", "read"],
      });
    `);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest.surfaces[0]).toMatchObject({
      handle: "crm://deals/panel/main",
      title: "Deal Panel",
      capabilities: ["act", "read"]
    });
  });

  it("warns when handle is dynamic", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    transform(`
      const handle = getHandle();
      useAgentSurface({ handle, title: "Demo", capabilities: ["act"] });
    `);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Dynamic handle passed to useAgentSurface")
    );
  });
});

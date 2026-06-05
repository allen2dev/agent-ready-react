import { describe, expect, it } from "vitest";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateCommand } from "./validate.js";

describe("validateCommand", () => {
  it("accepts valid manifest file", () => {
    const path = join(tmpdir(), `manifest-${Date.now()}.json`);
    writeFileSync(
      path,
      JSON.stringify({
        handle: "app://demo/page/main",
        title: "Main",
        capabilities: ["act"]
      })
    );
    expect(() => validateCommand(path)).not.toThrow();
    unlinkSync(path);
  });
});

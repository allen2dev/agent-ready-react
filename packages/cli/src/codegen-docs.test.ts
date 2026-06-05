import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { codegenDocs } from "./codegen-docs.js";

describe("codegen.docs", () => {
  it("generates api index and package tables", () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-ready-docs-"));
    const output = join(dir, "index.md");
    codegenDocs(output);

    const index = readFileSync(output, "utf8");
    const packages = readFileSync(join(dir, "packages.md"), "utf8");

    expect(index).toContain("0.3.0-rc");
    expect(index).toContain("@agent-ready/react");
    expect(packages).toContain("useAgentAction(handle, action, handler)");
    expect(packages).toContain("attachOtelTracing");
  });
});

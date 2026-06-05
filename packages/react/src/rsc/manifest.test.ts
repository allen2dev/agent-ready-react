import { describe, expect, it } from "vitest";
import {
  declareAgentManifest,
  resetDeclaredManifests,
  serializeAgentManifests
} from "./manifest.js";

describe("rsc manifest", () => {
  it("serializes declared manifests", () => {
    resetDeclaredManifests();
    declareAgentManifest({
      handle: "app://demo/page/main",
      title: "Main",
      capabilities: ["act"]
    });
    const json = serializeAgentManifests();
    expect(json).toContain("app://demo/page/main");
  });
});

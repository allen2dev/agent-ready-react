import { describe, expect, it } from "vitest";
import { computeEtag } from "./index.js";

describe("computeEtag", () => {
  it("is stable for same data", () => {
    const data = { a: 1, b: "x" };
    expect(computeEtag(data)).toBe(computeEtag(data));
  });

  it("changes when data changes", () => {
    expect(computeEtag({ a: 1 })).not.toBe(computeEtag({ a: 2 }));
  });
});

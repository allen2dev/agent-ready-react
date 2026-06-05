#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const threshold = Number(process.argv[2] ?? 90);
const packages = ["packages/schema", "packages/runtime"];

const skipSuffixes = ["/index.ts", "/types.ts"];

function computeCoreCoverage(summary) {
  let covered = 0;
  let total = 0;
  for (const [file, metrics] of Object.entries(summary)) {
    if (file === "total") continue;
    if (skipSuffixes.some((suffix) => file.endsWith(suffix))) continue;
    covered += metrics.statements.covered;
    total += metrics.statements.total;
  }
  return total === 0 ? 100 : (covered / total) * 100;
}

let failed = false;

for (const pkg of packages) {
  const summaryPath = join(process.cwd(), pkg, "coverage/coverage-summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const pct = computeCoreCoverage(summary);
  console.log(`${pkg}: ${pct.toFixed(2)}% core statements (min ${threshold}%)`);
  if (pct < threshold) {
    failed = true;
  }
}

if (failed) {
  console.error("Coverage threshold not met");
  process.exit(1);
}

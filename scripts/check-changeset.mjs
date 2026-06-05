#!/usr/bin/env node
/**
 * Fail when publishable packages changed without a changeset (PRs only).
 * Usage: node scripts/check-changeset.mjs [baseRef]
 */
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const baseRef = process.argv[2] ?? "origin/main";

function changedPackageFiles() {
  const diff = execSync(`git diff --name-only ${baseRef}...HEAD`, {
    encoding: "utf8"
  });
  return diff
    .split("\n")
    .filter((line) => line.startsWith("packages/") && !line.includes("/dist/"));
}

function hasChangeset() {
  const dir = join(process.cwd(), ".changeset");
  return readdirSync(dir).some(
    (name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md"
  );
}

const packageChanges = changedPackageFiles();
if (packageChanges.length === 0) {
  console.log("No package changes — changeset not required");
  process.exit(0);
}

if (hasChangeset()) {
  console.log("Changeset present for package changes");
  process.exit(0);
}

console.error(
  "Package changes detected without a .changeset/*.md file.\n" +
    "Run `pnpm changeset` and document major/minor/patch.\n" +
    "Changed paths:\n" +
    packageChanges.map((p) => `  - ${p}`).join("\n")
);
process.exit(1);

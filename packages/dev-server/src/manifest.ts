import { readFileSync, existsSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export interface ManifestSurface {
  handle: string;
  title?: string;
  capabilities?: string[];
  source?: string;
}

export interface AgentManifestFile {
  version: number;
  generatedAt?: string;
  surfaces: ManifestSurface[];
}

const SURFACE_HANDLE_RE =
  /useAgentSurface\s*\(\s*\{[^}]*handle:\s*["'`]([^"'`]+)["'`]/g;

export function loadAgentManifest(rootDir: string): AgentManifestFile | undefined {
  const manifestPath = resolve(rootDir, "agent-manifest.json");
  if (!existsSync(manifestPath)) return undefined;

  try {
    return JSON.parse(readFileSync(manifestPath, "utf8")) as AgentManifestFile;
  } catch {
    return undefined;
  }
}

export function scanSourceForHandles(rootDir: string, maxFiles = 200): ManifestSurface[] {
  const handles = new Map<string, ManifestSurface>();
  const srcDir = resolve(rootDir, "src");
  if (!existsSync(srcDir)) return [];

  const files: string[] = [];
  collectSourceFiles(srcDir, files, maxFiles);

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(SURFACE_HANDLE_RE)) {
      const handle = match[1];
      if (handle && !handles.has(handle)) {
        handles.set(handle, { handle, source: file.replace(`${rootDir}/`, "") });
      }
    }
  }

  return [...handles.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

function collectSourceFiles(dir: string, out: string[], maxFiles: number) {
  if (out.length >= maxFiles) return;

  for (const entry of readdirSync(dir)) {
    if (out.length >= maxFiles) return;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      collectSourceFiles(fullPath, out, maxFiles);
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry)) {
      out.push(fullPath);
    }
  }
}

export function resolveManifestSurfaces(rootDir: string): ManifestSurface[] {
  const manifest = loadAgentManifest(rootDir);
  if (manifest?.surfaces?.length) return manifest.surfaces;
  return scanSourceForHandles(rootDir);
}

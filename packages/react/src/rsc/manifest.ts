import type { SurfaceManifest } from "@agent-ready/schema";

const manifests: SurfaceManifest[] = [];

export function declareAgentManifest(manifest: SurfaceManifest): void {
  manifests.push(manifest);
}

export function serializeAgentManifests(): string {
  return JSON.stringify(manifests);
}

export function getDeclaredManifests(): SurfaceManifest[] {
  return [...manifests];
}

export function resetDeclaredManifests(): void {
  manifests.length = 0;
}

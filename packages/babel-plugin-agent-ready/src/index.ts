import type { PluginObj, PluginPass, NodePath } from "@babel/core";
import type { CallExpression, ObjectExpression, StringLiteral } from "@babel/types";
import * as t from "@babel/types";
import { writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

export interface AgentReadyPluginOptions {
  /** Output path for generated agent-manifest.json (relative to cwd). */
  manifestPath?: string;
}

interface ManifestEntry {
  handle: string;
  title?: string;
  capabilities?: string[];
  source?: string;
}

const handlesByFile = new WeakMap<PluginPass["file"], Map<string, ManifestEntry>>();

function getHandles(state: PluginPass): Map<string, ManifestEntry> {
  let handles = handlesByFile.get(state.file);
  if (!handles) {
    handles = new Map();
    handlesByFile.set(state.file, handles);
  }
  return handles;
}

function getSourceFile(state: PluginPass): string | undefined {
  const filename = state.filename ?? state.file.opts.filename ?? undefined;
  return filename ? basename(filename) : undefined;
}

const SURFACE_HOOKS = new Set([
  "useAgentSurface",
  "createSurface",
  "useAgentForm",
  "useAgentTanstackForm"
]);

function isStringLiteral(node: t.Node | null | undefined): node is StringLiteral {
  return !!node && t.isStringLiteral(node);
}

function getPropertyValue(
  object: ObjectExpression,
  keyName: string
): t.Node | undefined {
  for (const prop of object.properties) {
    if (!t.isObjectProperty(prop)) continue;
    if (t.isIdentifier(prop.key) && prop.key.name === keyName) {
      return prop.value;
    }
    if (t.isStringLiteral(prop.key) && prop.key.value === keyName) {
      return prop.value;
    }
  }
  return undefined;
}

function extractManifestFromObject(
  object: ObjectExpression,
  fallbackHandle?: StringLiteral
): { handle?: StringLiteral; title?: string; capabilities?: string[] } {
  const handleNode = getPropertyValue(object, "handle");
  const handle =
    handleNode && isStringLiteral(handleNode) ? handleNode : fallbackHandle;

  const titleNode = getPropertyValue(object, "title");
  const title = titleNode && isStringLiteral(titleNode) ? titleNode.value : undefined;

  const capabilitiesNode = getPropertyValue(object, "capabilities");
  let capabilities: string[] | undefined;
  if (capabilitiesNode && t.isArrayExpression(capabilitiesNode)) {
    capabilities = capabilitiesNode.elements
      .filter((el): el is StringLiteral => isStringLiteral(el))
      .map((el) => el.value);
  }

  return { handle, title, capabilities };
}

function warnDynamicHandle(path: NodePath, calleeName: string, state: PluginPass) {
  const filename = state.filename ?? state.file.opts.filename ?? "unknown";
  const loc = path.node.loc?.start;
  const location = loc ? `${loc.line}:${loc.column}` : "unknown";

  console.warn(
    `[babel-plugin-agent-ready] Dynamic handle passed to ${calleeName} at ${filename}:${location}. Handles must be compile-time string literals (ADR-007).`
  );
}

function recordHandle(
  state: PluginPass,
  handle: string,
  meta: Omit<ManifestEntry, "handle">
) {
  const handles = getHandles(state);
  const existing = handles.get(handle);
  handles.set(handle, {
    handle,
    title: meta.title ?? existing?.title,
    capabilities: meta.capabilities ?? existing?.capabilities,
    source: meta.source ?? existing?.source
  });
}

function visitSurfaceCall(path: NodePath<CallExpression>, state: PluginPass) {
  const callee = path.node.callee;
  if (!t.isIdentifier(callee)) return;

  const calleeName = callee.name;
  if (!SURFACE_HOOKS.has(calleeName)) return;

  const [firstArg, secondArg] = path.node.arguments;
  const source = getSourceFile(state);

  if (calleeName === "createSurface") {
    if (isStringLiteral(firstArg)) {
      const manifest =
        secondArg && t.isObjectExpression(secondArg)
          ? extractManifestFromObject(secondArg, firstArg)
          : { handle: firstArg };
      recordHandle(state, firstArg.value, {
        title: manifest.title,
        capabilities: manifest.capabilities,
        source
      });
    } else {
      warnDynamicHandle(path, calleeName, state);
    }
    return;
  }

  if (calleeName === "useAgentForm" || calleeName === "useAgentTanstackForm") {
    if (isStringLiteral(firstArg)) {
      const manifest =
        secondArg && t.isObjectExpression(secondArg)
          ? extractManifestFromObject(secondArg, firstArg)
          : { handle: firstArg };
      recordHandle(state, firstArg.value, {
        title: manifest.title,
        capabilities: manifest.capabilities,
        source
      });
    } else {
      warnDynamicHandle(path, calleeName, state);
    }
    return;
  }

  if (calleeName === "useAgentSurface") {
    if (firstArg && t.isObjectExpression(firstArg)) {
      const manifest = extractManifestFromObject(firstArg);
      if (manifest.handle) {
        recordHandle(state, manifest.handle.value, {
          title: manifest.title,
          capabilities: manifest.capabilities,
          source
        });
      } else {
        warnDynamicHandle(path, calleeName, state);
      }
    } else {
      warnDynamicHandle(path, calleeName, state);
    }
  }
}

export default function agentReadyPlugin(): PluginObj<PluginPass> {
  return {
    name: "babel-plugin-agent-ready",
    visitor: {
      CallExpression(path, state) {
        visitSurfaceCall(path, state);
      },
      Program: {
        exit(_path, state) {
          const manifestPath = (state.opts as AgentReadyPluginOptions).manifestPath;
          const handles = getHandles(state);
          if (!manifestPath || handles.size === 0) return;

          const manifest = {
            version: 1,
            generatedAt: new Date().toISOString(),
            surfaces: [...handles.values()].sort((a, b) =>
              a.handle.localeCompare(b.handle)
            )
          };

          const outputPath = resolve(process.cwd(), manifestPath);
          writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
        }
      }
    }
  };
}

export { agentReadyPlugin };

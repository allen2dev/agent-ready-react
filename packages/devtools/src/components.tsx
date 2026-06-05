import type { CSSProperties, ReactNode } from "react";
import type { AgentHandle } from "@agent-ready/schema";
import type { CatalogSurfaceSummary } from "@agent-ready/runtime";
import type { ActionLogEntry, ObservationSnapshot } from "./store.js";

export const devtoolsTheme = {
  bg: "#0f1117",
  panel: "#1a1d27",
  border: "#2d3348",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#58a6ff",
  success: "#3fb950",
  error: "#f85149",
  warning: "#d29922",
  font: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 12
} as const;

export function panelStyles(): CSSProperties {
  return {
    fontFamily: devtoolsTheme.font,
    fontSize: devtoolsTheme.fontSize,
    color: devtoolsTheme.text,
    background: devtoolsTheme.panel,
    border: `1px solid ${devtoolsTheme.border}`,
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  };
}

export function sectionTitleStyles(): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: devtoolsTheme.muted,
    margin: "0 0 8px 0"
  };
}

export function scrollAreaStyles(maxHeight: number | string): CSSProperties {
  return {
    overflow: "auto",
    maxHeight,
    padding: "8px 12px"
  };
}

interface SurfacesTreeProps {
  surfaces: CatalogSurfaceSummary[];
  selectedHandle?: AgentHandle;
  onSelect?: (handle: AgentHandle) => void;
}

export function SurfacesTree({ surfaces, selectedHandle, onSelect }: SurfacesTreeProps): ReactNode {
  if (surfaces.length === 0) {
    return <div style={{ color: devtoolsTheme.muted, padding: 8 }}>No surfaces registered</div>;
  }

  return (
    <div>
      {surfaces.map((surface) => {
        const selected = surface.handle === selectedHandle;
        return (
          <div key={surface.handle} style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => onSelect?.(surface.handle)}
              style={{
                all: "unset",
                cursor: onSelect ? "pointer" : "default",
                display: "block",
                width: "100%",
                padding: "4px 6px",
                borderRadius: 4,
                background: selected ? "#252a3a" : "transparent",
                color: devtoolsTheme.accent
              }}
            >
              {surface.handle}
            </button>
            <div style={{ paddingLeft: 12, color: devtoolsTheme.muted, fontSize: 11 }}>
              <div>capabilities: {surface.capabilities.join(", ") || "(none)"}</div>
              <div>actions: {surface.actions.join(", ") || "(none)"}</div>
              <div>observations: {surface.observations.join(", ") || "(none)"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ActionLogProps {
  entries: ActionLogEntry[];
  filterHandle?: AgentHandle;
}

export function ActionLog({ entries, filterHandle }: ActionLogProps): ReactNode {
  const filtered = filterHandle
    ? entries.filter((entry) => entry.handle === filterHandle)
    : entries;

  if (filtered.length === 0) {
    return <div style={{ color: devtoolsTheme.muted, padding: 8 }}>No invocations yet</div>;
  }

  return (
    <div>
      {[...filtered].reverse().map((entry, index) => (
        <div
          key={`${entry.timestamp}-${entry.actionName}-${index}`}
          style={{
            borderBottom: `1px solid ${devtoolsTheme.border}`,
            padding: "6px 0",
            fontSize: 11
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: devtoolsTheme.muted }}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ color: entry.ok ? devtoolsTheme.success : devtoolsTheme.error }}>
              {entry.ok ? "ok" : "error"}
            </span>
            <span>{entry.durationMs.toFixed(1)}ms</span>
          </div>
          <div style={{ color: devtoolsTheme.accent }}>{entry.handle}</div>
          <div>
            {entry.actionName}({entry.inputSummary})
          </div>
          {!entry.ok && entry.errorMessage ? (
            <div style={{ color: devtoolsTheme.error }}>{entry.errorMessage}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface ObservationViewerProps {
  snapshots: ObservationSnapshot[];
  filterHandle?: AgentHandle;
}

export function ObservationViewer({ snapshots, filterHandle }: ObservationViewerProps): ReactNode {
  const filtered = filterHandle
    ? snapshots.filter((snap) => snap.handle === filterHandle)
    : snapshots;

  if (filtered.length === 0) {
    return <div style={{ color: devtoolsTheme.muted, padding: 8 }}>No observations</div>;
  }

  return (
    <div>
      {filtered.map((snap) => (
        <div
          key={`${snap.handle}-${snap.observationName}`}
          style={{
            borderBottom: `1px solid ${devtoolsTheme.border}`,
            padding: "6px 0"
          }}
        >
          <div style={{ color: devtoolsTheme.accent }}>
            {snap.handle} / {snap.observationName}
          </div>
          <div style={{ color: devtoolsTheme.muted, fontSize: 11 }}>
            {snap.byteSize} bytes · {new Date(snap.readAt).toLocaleTimeString()}
          </div>
          <pre
            style={{
              margin: "4px 0 0",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 11
            }}
          >
            {JSON.stringify(snap.value, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}

interface InspectorContentProps {
  surface?: CatalogSurfaceSummary;
  actionLog: ActionLogEntry[];
  observationSnapshots: ObservationSnapshot[];
}

export function InspectorContent({
  surface,
  actionLog,
  observationSnapshots
}: InspectorContentProps): ReactNode {
  if (!surface) {
    return <div style={{ color: devtoolsTheme.muted }}>Surface not found</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <section>
        <h4 style={sectionTitleStyles()}>Surface</h4>
        <div style={{ color: devtoolsTheme.accent }}>{surface.handle}</div>
        <div style={{ color: devtoolsTheme.muted, marginTop: 4 }}>
          {surface.title} · [{surface.capabilities.join(", ")}]
        </div>
      </section>
      <section>
        <h4 style={sectionTitleStyles()}>Actions</h4>
        <div style={{ color: devtoolsTheme.muted }}>
          {surface.actions.join(", ") || "(none)"}
        </div>
      </section>
      <section>
        <h4 style={sectionTitleStyles()}>Action log</h4>
        <ActionLog entries={actionLog} filterHandle={surface.handle} />
      </section>
      <section>
        <h4 style={sectionTitleStyles()}>Observations</h4>
        <ObservationViewer
          snapshots={observationSnapshots}
          filterHandle={surface.handle}
        />
      </section>
    </div>
  );
}

export function DevtoolsSection({
  title,
  children,
  maxHeight = 180
}: {
  title: string;
  children: ReactNode;
  maxHeight?: number | string;
}): ReactNode {
  return (
    <section style={{ borderTop: `1px solid ${devtoolsTheme.border}` }}>
      <div
        style={{
          padding: "8px 12px",
          background: devtoolsTheme.bg,
          borderBottom: `1px solid ${devtoolsTheme.border}`
        }}
      >
        <h3 style={sectionTitleStyles()}>{title}</h3>
      </div>
      <div style={scrollAreaStyles(maxHeight)}>{children}</div>
    </section>
  );
}

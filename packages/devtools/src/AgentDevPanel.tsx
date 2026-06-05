import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AgentRuntime } from "@agent-ready/runtime";
import type { AgentHandle } from "@agent-ready/schema";
import { useDevToolsState } from "./useDevtoolsState.js";
import { useAgentRuntimeFromContext } from "./useAgentRuntimeFromContext.js";
import {
  ActionLog,
  DevtoolsSection,
  ObservationViewer,
  SurfacesTree,
  devtoolsTheme,
  panelStyles
} from "./components.js";

export type DevPanelPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface AgentDevPanelProps {
  runtime?: AgentRuntime;
  defaultOpen?: boolean;
  position?: DevPanelPosition;
}

function defaultPositionStyle(position: DevPanelPosition): CSSProperties {
  switch (position) {
    case "bottom-left":
      return { bottom: 16, left: 16 };
    case "top-right":
      return { top: 16, right: 16 };
    case "top-left":
      return { top: 16, left: 16 };
    case "bottom-right":
    default:
      return { bottom: 16, right: 16 };
  }
}

function DevPanelBody({ runtime }: { runtime: AgentRuntime }) {
  const state = useDevToolsState(runtime);
  const [selectedHandle, setSelectedHandle] = useState<AgentHandle | undefined>();

  useEffect(() => {
    if (
      selectedHandle &&
      !state.catalog.surfaces.some((surface) => surface.handle === selectedHandle)
    ) {
      setSelectedHandle(undefined);
    }
  }, [selectedHandle, state.catalog.surfaces]);

  return (
    <>
      <DevtoolsSection title="Surfaces">
        <SurfacesTree
          surfaces={state.catalog.surfaces}
          selectedHandle={selectedHandle}
          onSelect={setSelectedHandle}
        />
      </DevtoolsSection>
      <DevtoolsSection title="Action log">
        <ActionLog entries={state.actionLog} filterHandle={selectedHandle} />
      </DevtoolsSection>
      <DevtoolsSection title="Observations">
        <ObservationViewer
          snapshots={state.observationSnapshots}
          filterHandle={selectedHandle}
        />
      </DevtoolsSection>
      {state.policyLog.length > 0 ? (
        <DevtoolsSection title="Policy denials" maxHeight={120}>
          {[...state.policyLog].reverse().map((entry, index) => (
            <div
              key={`${entry.handle}-${entry.actionName}-${index}`}
              style={{ fontSize: 11, padding: "4px 0", color: devtoolsTheme.warning }}
            >
              {entry.handle} · {entry.actionName}: {entry.reason}
            </div>
          ))}
        </DevtoolsSection>
      ) : null}
    </>
  );
}

function AgentDevPanelInner({
  runtime,
  defaultOpen = false,
  position = "bottom-right"
}: Required<Pick<AgentDevPanelProps, "runtime">> & AgentDevPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorStyle = useMemo(() => defaultPositionStyle(position), [position]);

  const onHeaderMouseDown = useCallback((event: ReactMouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setPanelPos({ x: rect.left, y: rect.top });
  }, []);

  useEffect(() => {
    if (!dragOffset) return;

    const onMouseMove = (event: globalThis.MouseEvent) => {
      setPanelPos({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y
      });
    };

    const onMouseUp = () => setDragOffset(null);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragOffset]);

  const floatingStyle: CSSProperties = panelPos
    ? { position: "fixed", top: panelPos.y, left: panelPos.x, zIndex: 2147483646 }
    : { position: "fixed", ...anchorStyle, zIndex: 2147483646 };

  if (!open) {
    return createPortal(
      <ToggleButton anchorStyle={anchorStyle} onOpen={() => setOpen(true)} />,
      document.body
    );
  }

  return createPortal(
    <div
      ref={panelRef}
      style={{
        ...floatingStyle,
        ...panelStyles(),
        width: 420,
        maxHeight: "80vh"
      }}
    >
      <header
        onMouseDown={onHeaderMouseDown}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: devtoolsTheme.bg,
          borderBottom: `1px solid ${devtoolsTheme.border}`,
          cursor: "grab",
          userSelect: "none"
        }}
      >
        <strong style={{ fontSize: 13 }}>Agent DevTools</strong>
        <button
          type="button"
          aria-label="Close Agent DevTools"
          onClick={() => setOpen(false)}
          style={{
            all: "unset",
            cursor: "pointer",
            color: devtoolsTheme.muted,
            padding: "2px 6px"
          }}
        >
          ✕
        </button>
      </header>
      <div style={{ overflow: "auto", flex: 1 }}>
        <DevPanelBody runtime={runtime} />
      </div>
    </div>,
    document.body
  );
}

function ToggleButton({
  anchorStyle,
  onOpen
}: {
  anchorStyle: CSSProperties;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Open Agent DevTools"
      onClick={onOpen}
      style={{
        position: "fixed",
        ...anchorStyle,
        zIndex: 2147483646,
        fontFamily: devtoolsTheme.font,
        fontSize: 12,
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${devtoolsTheme.border}`,
        background: devtoolsTheme.panel,
        color: devtoolsTheme.text,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
      }}
    >
      Agent DevTools
    </button>
  );
}

function AgentDevPanelWithRuntime(
  props: Required<Pick<AgentDevPanelProps, "runtime">> & AgentDevPanelProps
) {
  return <AgentDevPanelInner {...props} />;
}

function AgentDevPanelWithContext(props: AgentDevPanelProps) {
  const runtime = useAgentRuntimeFromContext();
  return <AgentDevPanelInner {...props} runtime={runtime} />;
}

export function AgentDevPanel(props: AgentDevPanelProps): ReactNode {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (props.runtime) {
    return <AgentDevPanelWithRuntime {...props} runtime={props.runtime} />;
  }

  return <AgentDevPanelWithContext {...props} />;
}

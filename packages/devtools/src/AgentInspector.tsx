import { useMemo, type ReactNode } from "react";
import type { AgentRuntime } from "@agent-ready/runtime";
import type { AgentHandle } from "@agent-ready/schema";
import { useDevToolsState } from "./useDevtoolsState.js";
import { useAgentRuntimeFromContext } from "./useAgentRuntimeFromContext.js";
import { InspectorContent, devtoolsTheme, panelStyles } from "./components.js";

export interface AgentInspectorProps {
  handle: AgentHandle;
  runtime?: AgentRuntime;
  title?: string;
}

function AgentInspectorBody({
  runtime,
  handle,
  title = "Agent Inspector"
}: Required<Pick<AgentInspectorProps, "handle" | "runtime">> &
  Pick<AgentInspectorProps, "title">) {
  const state = useDevToolsState(runtime);
  const surface = useMemo(
    () => state.catalog.surfaces.find((entry) => entry.handle === handle),
    [state.catalog.surfaces, handle]
  );

  return (
    <div
      style={{
        ...panelStyles(),
        width: "100%",
        maxWidth: 480,
        fontSize: 12
      }}
    >
      <header
        style={{
          padding: "10px 12px",
          background: devtoolsTheme.bg,
          borderBottom: `1px solid ${devtoolsTheme.border}`
        }}
      >
        <strong style={{ fontSize: 13 }}>{title}</strong>
      </header>
      <div style={{ padding: 12 }}>
        <InspectorContent
          surface={surface}
          actionLog={state.actionLog}
          observationSnapshots={state.observationSnapshots}
        />
      </div>
    </div>
  );
}

export function AgentInspector(props: AgentInspectorProps): ReactNode {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (props.runtime) {
    return (
      <AgentInspectorBody
        runtime={props.runtime}
        handle={props.handle}
        title={props.title}
      />
    );
  }

  return <AgentInspectorWithContext handle={props.handle} title={props.title} />;
}

function AgentInspectorWithContext({
  handle,
  title
}: Pick<AgentInspectorProps, "handle" | "title">) {
  const runtime = useAgentRuntimeFromContext();
  return (
    <AgentInspectorBody runtime={runtime} handle={handle} title={title} />
  );
}

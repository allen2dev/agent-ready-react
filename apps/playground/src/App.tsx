import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { z } from "zod";
import { defineAction, defineObservation } from "@agent-ready/schema";
import {
  AgentReadyProvider,
  useAgentSurface,
  useAgentAction,
  useAgentObservation
} from "@agent-ready/react";
import { createAgentRuntime } from "@agent-ready/runtime";
import {
  disablePlaygroundOtel,
  enablePlaygroundOtel,
  isPlaygroundOtelEnabled
} from "./otel-demo.js";

const searchHandle = "app://playground/search/main" as const;
const tableHandle = "app://playground/table/main" as const;
const settingsHandle = "app://playground/settings/main" as const;
const contactHandle = "app://playground/contact/main" as const;

const runtime = createAgentRuntime({
  defaultPolicy: {
    mode: "defaultDeny",
    rules: [
      { roles: ["agent"], actions: ["search", "applyFilters", "updateSettings", "fillContact"] }
    ]
  }
});

if (import.meta.env.DEV) {
  (window as Window & { __AGENT_READY_RUNTIME__?: typeof runtime }).__AGENT_READY_RUNTIME__ =
    runtime;
}

interface AgentLogEntry {
  id: number;
  timestamp: number;
  handle: string;
  actionName: string;
  ok: boolean;
  durationMs?: number;
}

function createAgentLogStore() {
  const entries: AgentLogEntry[] = [];
  const listeners = new Set<() => void>();
  let nextId = 1;

  const notify = () => listeners.forEach((listener) => listener());

  const off = runtime.on("action:invoked", (payload) => {
    entries.push({
      id: nextId++,
      timestamp: Date.now(),
      handle: payload.handle,
      actionName: payload.action,
      ok: payload.ok
    });
    if (entries.length > 100) entries.shift();
    notify();
  });

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => [...entries],
    destroy: off
  };
}

const agentLogStore = createAgentLogStore();

function useAgentLog() {
  return useSyncExternalStore(
    agentLogStore.subscribe,
    agentLogStore.getSnapshot,
    agentLogStore.getSnapshot
  );
}

function AgentLogPanel() {
  const entries = useAgentLog();

  return (
    <section style={panelStyle}>
      <h2>Agent Log</h2>
      <p>Live action invocations from the runtime (including MCP / Cursor calls).</p>
      {entries.length === 0 ? (
        <p style={{ color: "#666" }}>No invocations yet. Connect Cursor and call a tool.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[...entries].reverse().map((entry) => (
            <li
              key={entry.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "8px 0",
                fontFamily: "monospace",
                fontSize: 13
              }}
            >
              <strong style={{ color: entry.ok ? "#22863a" : "#cb2431" }}>
                {entry.ok ? "ok" : "error"}
              </strong>{" "}
              {new Date(entry.timestamp).toLocaleTimeString()} · {entry.handle} ·{" "}
              {entry.actionName}
              {entry.durationMs != null ? ` (${entry.durationMs.toFixed(1)}ms)` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SearchSurface() {
  const [query, setQuery] = useState("");
  useAgentSurface({
    handle: searchHandle,
    title: "Search",
    capabilities: ["act", "read"]
  });

  useAgentAction(
    searchHandle,
    defineAction({
      name: "search",
      description: "Run a search query",
      input: z.object({ query: z.string().min(1) })
    }),
    (input) => {
      setQuery(input.query);
      return { query: input.query, results: [`Result for "${input.query}"`] };
    }
  );

  useAgentObservation(
    searchHandle,
    defineObservation({
      name: "query",
      description: "Current search query",
      schema: z.object({ query: z.string() })
    }),
    () => ({ query })
  );

  return (
    <section style={panelStyle}>
      <h2>Search</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        style={{ width: "100%", padding: 8 }}
      />
      <p>Handle: {searchHandle}</p>
    </section>
  );
}

function TableSurface() {
  const [status, setStatus] = useState("all");
  const [rows] = useState([
    { id: 1, name: "Alpha", status: "active" },
    { id: 2, name: "Beta", status: "draft" },
    { id: 3, name: "Gamma", status: "active" }
  ]);

  useAgentSurface({
    handle: tableHandle,
    title: "Data Table",
    capabilities: ["act", "read"]
  });

  useAgentAction(
    tableHandle,
    defineAction({
      name: "applyFilters",
      description: "Filter table rows by status",
      input: z.object({ status: z.enum(["all", "active", "draft"]) })
    }),
    (input) => {
      setStatus(input.status);
      return { status: input.status, visible: rows.filter((r) => input.status === "all" || r.status === input.status).length };
    }
  );

  const filtered =
    status === "all" ? rows : rows.filter((row) => row.status === status);

  return (
    <section style={panelStyle}>
      <h2>Data Table</h2>
      <p>Filter: {status}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SettingsSurface() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);

  useAgentSurface({
    handle: settingsHandle,
    title: "Settings",
    capabilities: ["act", "read"]
  });

  useAgentAction(
    settingsHandle,
    defineAction({
      name: "updateSettings",
      description: "Update app settings",
      input: z.object({
        theme: z.enum(["light", "dark"]).optional(),
        notifications: z.boolean().optional()
      })
    }),
    (input) => {
      if (input.theme) setTheme(input.theme);
      if (input.notifications != null) setNotifications(input.notifications);
      return { theme: input.theme ?? theme, notifications: input.notifications ?? notifications };
    }
  );

  return (
    <section style={panelStyle}>
      <h2>Settings</h2>
      <label>
        Theme{" "}
        <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label style={{ display: "block", marginTop: 8 }}>
        <input
          type="checkbox"
          checked={notifications}
          onChange={(e) => setNotifications(e.target.checked)}
        />{" "}
        Notifications
      </label>
    </section>
  );
}

function ContactSurface() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useAgentSurface({
    handle: contactHandle,
    title: "Contact Form",
    capabilities: ["act", "read"]
  });

  useAgentAction(
    contactHandle,
    defineAction({
      name: "fillContact",
      description: "Fill the contact form with test data",
      input: z.object({
        name: z.string(),
        email: z.string().email(),
        message: z.string()
      })
    }),
    (input) => {
      setForm(input);
      return { filled: true };
    }
  );

  return (
    <section style={panelStyle}>
      <h2>Contact Form</h2>
      <p>Ask Cursor: &quot;Fill the contact form with test data&quot;</p>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      <textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
    </section>
  );
}

function OtelPanel() {
  const [enabled, setEnabled] = useState(isPlaygroundOtelEnabled());

  function toggle() {
    if (enabled) {
      disablePlaygroundOtel();
      setEnabled(false);
      return;
    }
    enablePlaygroundOtel(runtime);
    setEnabled(true);
  }

  return (
    <section style={panelStyle}>
      <h2>OpenTelemetry</h2>
      <label>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        Enable console span exporter
      </label>
    </section>
  );
}

const panelStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  marginBottom: 16
};

export function App() {
  return (
    <AgentReadyProvider
      runtime={runtime}
      session={{ sessionId: "playground", roles: ["agent"] }}
    >
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
        <h1>Agent Ready Playground</h1>
        <p>
          Demo app for the MCP dev bridge. Run <code>pnpm dev</code>, then connect Cursor using
          the MCP config printed in the terminal.
        </p>
        <AgentLogPanel />
        <ContactSurface />
        <SearchSurface />
        <TableSurface />
        <SettingsSurface />
        <OtelPanel />
      </main>
    </AgentReadyProvider>
  );
}

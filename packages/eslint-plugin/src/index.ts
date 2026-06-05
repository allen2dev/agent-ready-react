import requireSurfaceForInteractive from "./rules/require-surface-for-interactive.js";
import noRawHandle from "./rules/no-raw-handle.js";
import schemaSync from "./rules/schema-sync.js";

export const rules = {
  "require-surface-for-interactive": requireSurfaceForInteractive,
  "no-raw-handle": noRawHandle,
  "schema-sync": schemaSync
};

export const configs = {
  recommended: {
    plugins: {
      "agent-ready": {
        rules
      }
    },
    rules: {
      "agent-ready/require-surface-for-interactive": "warn",
      "agent-ready/no-raw-handle": "warn",
      "agent-ready/schema-sync": "off"
    }
  }
};

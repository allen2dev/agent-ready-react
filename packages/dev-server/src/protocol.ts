export type BridgeClientRole = "browser" | "mcp";

export interface BridgeRequestMessage {
  type: "request";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface BridgeResponseMessage {
  type: "response";
  id: string;
  result?: unknown;
  error?: { message: string; code?: string };
}

export interface BridgeRegisterMessage {
  type: "register";
  role: BridgeClientRole;
}

export interface BridgeReadyMessage {
  type: "ready";
  role: BridgeClientRole;
}

export interface BridgeErrorMessage {
  type: "error";
  message: string;
}

export type BridgeMessage =
  | BridgeRequestMessage
  | BridgeResponseMessage
  | BridgeRegisterMessage
  | BridgeReadyMessage
  | BridgeErrorMessage;

export function parseBridgeMessage(raw: string): BridgeMessage | undefined {
  try {
    return JSON.parse(raw) as BridgeMessage;
  } catch {
    return undefined;
  }
}

export function serializeBridgeMessage(message: BridgeMessage): string {
  return JSON.stringify(message);
}

import type { AgentHandle } from "@agent-ready/schema";
import type { RegisteredAction } from "../types.js";

export class ActionRegistry {
  private actions = new Map<AgentHandle, Map<string, RegisteredAction>>();

  register(handle: AgentHandle, action: RegisteredAction): () => void {
    let bucket = this.actions.get(handle);
    if (!bucket) {
      bucket = new Map();
      this.actions.set(handle, bucket);
    }
    if (bucket.has(action.definition.name)) {
      throw new Error(
        `Action already registered: ${handle}::${action.definition.name}`
      );
    }
    bucket.set(action.definition.name, action);
    return () => {
      bucket!.delete(action.definition.name);
      if (bucket!.size === 0) this.actions.delete(handle);
    };
  }

  get(handle: AgentHandle, name: string): RegisteredAction | undefined {
    return this.actions.get(handle)?.get(name);
  }

  listForHandle(handle: AgentHandle): string[] {
    const bucket = this.actions.get(handle);
    return bucket ? [...bucket.keys()] : [];
  }

  removeAllForHandle(handle: AgentHandle): void {
    this.actions.delete(handle);
  }
}

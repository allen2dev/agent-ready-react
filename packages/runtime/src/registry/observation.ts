import type { ObservationDefinition } from "@agent-ready/schema";
import type { AgentHandle } from "@agent-ready/schema";
import type { RegisteredObservation } from "../types.js";

export class ObservationRegistry {
  private observations = new Map<
    AgentHandle,
    Map<string, RegisteredObservation>
  >();

  register(handle: AgentHandle, obs: RegisteredObservation): () => void {
    let bucket = this.observations.get(handle);
    if (!bucket) {
      bucket = new Map();
      this.observations.set(handle, bucket);
    }
    if (bucket.has(obs.definition.name)) {
      throw new Error(
        `Observation already registered: ${handle}::${obs.definition.name}`
      );
    }
    bucket.set(obs.definition.name, obs);
    return () => {
      bucket!.delete(obs.definition.name);
      if (bucket!.size === 0) this.observations.delete(handle);
    };
  }

  get(handle: AgentHandle, name: string): RegisteredObservation | undefined {
    return this.observations.get(handle)?.get(name);
  }

  listForHandle(handle: AgentHandle): string[] {
    const bucket = this.observations.get(handle);
    return bucket ? [...bucket.keys()] : [];
  }

  removeAllForHandle(handle: AgentHandle): void {
    this.observations.delete(handle);
  }
}

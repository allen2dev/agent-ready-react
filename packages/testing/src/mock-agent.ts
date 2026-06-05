import type { AgentRuntime, CatalogQuery } from "@agent-ready/runtime";
import type {
  AgentResult,
  AgentSessionContext,
  InvokeActionRequest,
  ReadObservationRequest
} from "@agent-ready/schema";

export function createMockAgent(
  runtime: AgentRuntime,
  session?: AgentSessionContext
) {
  return {
    invoke(request: InvokeActionRequest): Promise<AgentResult<unknown>> {
      return runtime.invokeAction({
        ...request,
        context: request.context ?? session
      });
    },
  listCatalog(query?: CatalogQuery) {
      return runtime.getCatalog(query);
    },
    read(_request: ReadObservationRequest): Promise<AgentResult<unknown>> {
      return Promise.resolve(runtime.readObservation(_request));
    }
  };
}

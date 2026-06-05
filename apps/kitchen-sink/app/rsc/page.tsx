import {
  declareAgentManifest,
  resetDeclaredManifests,
  serializeAgentManifests
} from "@agent-ready/react/rsc";
import { RscDemoClient } from "./client";

const handle = "app://kitchen/rsc/main" as const;

export default function RscPage() {
  resetDeclaredManifests();
  declareAgentManifest({
    handle,
    title: "Kitchen RSC Surface",
    description: "Declared on the server via declareAgentManifest",
    capabilities: ["act", "read"]
  });

  const manifests = serializeAgentManifests();

  return (
    <main>
      <h1>RSC Manifest Demo</h1>
      <p>
        This page calls <code>declareAgentManifest</code> in a Server Component and
        hydrates the catalog via <code>AgentReadyProvider manifests</code>.
      </p>
      <RscDemoClient manifests={manifests} />
    </main>
  );
}

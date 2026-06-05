# agent-ready-react

Agent Ready React SDK — schema-first, opt-in registration for AI agent discoverability and actions.

## Quick Start

```bash
pnpm install
pnpm build
```

```tsx
import { AgentReadyProvider, useAgentSurface, useAgentAction } from "@agent-ready/react";
import { defineAction } from "@agent-ready/schema";
import { z } from "zod";

const handle = "app://forms/contact/main" as const;

function ContactForm() {
  useAgentSurface({
    handle,
    title: "Contact Form",
    capabilities: ["act"]
  });

  useAgentAction(
    handle,
    defineAction({
      name: "submitForm",
      description: "Submit the contact form",
      input: z.object({ email: z.string().email() })
    }),
    async (input) => {
      return { submitted: true, email: input.email };
    }
  );

  return <form>{/* your UI */}</form>;
}

export function App() {
  return (
    <AgentReadyProvider session={{ sessionId: "web-1", roles: ["agent"] }}>
      <ContactForm />
    </AgentReadyProvider>
  );
}
```

## Playground

```bash
pnpm --filter playground dev
```

## Docs

- [用户指南 / User Guide](./docs/user-guide.md) · [在线页面](https://allen2dev.github.io/agent-ready-react/)
- [Architecture](./docs/architecture.md)
- [SDK API](./docs/sdk-api.md)
- [Tasks](./docs/tasks/README.md)

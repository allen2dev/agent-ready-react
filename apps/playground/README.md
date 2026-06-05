# Playground

Local demo for Agent Ready React SDK.

## OpenTelemetry console spans

1. Run `pnpm --filter playground dev`
2. Open browser devtools → Console
3. Enable **console span exporter** in the OTel panel
4. Click **Invoke greet** — each invoke prints an `agent.action.invoke` span via `ConsoleSpanExporter`

Implementation uses `@opentelemetry/sdk-trace-web` + `attachOtelTracing` from `@agent-ready/observability`.

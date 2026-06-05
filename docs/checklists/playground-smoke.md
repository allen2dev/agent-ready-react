# Playground Smoke Checklist

Manual smoke before npm pre-release (`rc` / `beta` / `latest`).

- [ ] `pnpm --filter playground dev` starts without errors
- [ ] Surface line shows registered handle
- [ ] Catalog panel lists the demo surface
- [ ] **Invoke greet** returns `{ ok: true, data: { message: ... } }`
- [ ] Policy: invoke with wrong role returns `AGENT_POLICY_DENIED` (optional negative test via runtime)
- [ ] Enable **OpenTelemetry → console span exporter**
- [ ] Invoke again — browser console shows `agent.action.invoke` span
- [ ] Disable OTel toggle — invoke still succeeds
- [ ] `pnpm --filter playground build` passes

≤10 steps — record commit SHA and npm tag in release notes.

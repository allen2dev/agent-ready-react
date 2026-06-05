# Security Audit Checklist (OWASP-aligned)

| # | Threat / control | Status | Notes |
|---|------------------|--------|-------|
| 1 | **Broken access control** — Policy defaultDeny + explicit role rules | Pass | `createPolicyEngine`, OIDC/tenant providers |
| 2 | **Injection** — Zod validation on all action inputs | Pass | `validateAgentInput` before handlers |
| 3 | **Sensitive data exposure** — Observability redaction middleware | Pass | `createRedactionMiddleware` |
| 4 | **Authentication gaps** — Session context required for policy | Pass | `AgentSessionContext.sessionId` |
| 5 | **Rate limiting / DoS** — Session + action rate limiters | Pass | `AGENT_RATE_LIMITED` |
| 6 | **Logging & monitoring** — Audit sink + OTel spans | Pass | `attachAuditSink`, `attachOtelTracing` |

> Maintainer checklist — mark **Pass** / **Todo** each release.

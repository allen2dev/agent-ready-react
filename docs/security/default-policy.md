# Default Policy Compliance Notes

Agent Ready SDK ships with **`defaultDeny`** as the recommended production default. This document describes capability-level controls suitable for SOC2-style control narratives (not legal advice).

## Control summary

| Control | SDK mechanism |
|---------|----------------|
| Least privilege | `PolicyConfig.rules` map roles → actions/handles |
| Separation of duties | Distinct roles per action via policy rules |
| Tenant isolation | `createTenantPolicyProvider` + `metadata.tenantId` |
| Identity federation | `createOidcRolePolicyProvider` maps JWT claims → roles |
| Deny by default | Unmatched sessions receive `AGENT_POLICY_DENIED` |

## Recommended baseline

```typescript
createAgentRuntime({
  defaultPolicy: {
    mode: "defaultDeny",
    rules: [
      { roles: ["agent"], actions: ["readOnlyAction"] }
    ]
  }
});
```

## Evidence artifacts

- Policy unit tests (`policy.test.ts`, `policy.oidc.test.ts`, `policy.tenant.test.ts`)
- Audit entries via `attachAuditSink`
- OpenTelemetry spans via `attachOtelTracing`

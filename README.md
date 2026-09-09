# OpsPilot

Self-hosted, Kubernetes-native autonomous SRE control plane.

**Detect → Investigate → Diagnose → Recommend → Approve → Remediate → Verify → Remember**

The LLM reasons. Deterministic systems observe, authorize, execute, and verify.

## Stack

| App | Role |
|-----|------|
| `apps/web` | Next.js SRE control plane UI |
| `apps/api` | Fastify aggregation + SSE (never expose kubeconfig to the browser) |
| `agent/` | Python LangGraph runtime (propose only) |

## Run locally

Prerequisites: Node 20+, Docker, Kind, kubectl.

```bash
npm install

# Optional: local cluster with demo workload
make kind-up
make kind-apply

# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web
```

- UI: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

If Kind is down, the API stays up in degraded mode. Incident **INC-1042** still powers the Command Center.

## First screens

- `/overview` — is production healthy?
- `/incidents/INC-1042` — incident command center
- `/infrastructure/pods` — live pods
- `/deployments` — revision history

## Security

Kubeconfig and Kubernetes credentials never leave the Node.js control plane. Mutation endpoints are not implemented yet.

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

## Prerequisites

Install these once on your machine:

```bash
# macOS (Homebrew)
brew install node@20 docker kind kubectl

# Optional later phases
brew install python@3.12 poetry   # Phase 5 LangGraph agent
# Docker Desktop / OrbStack must be running for compose + Kind
```

| Need | Tool | Why |
|------|------|-----|
| Runtime | Node 20+ | web + API |
| Cluster | Docker, Kind, kubectl | live pods/deployments/events |
| Metrics/logs | Docker Compose (Prometheus, Loki) | Phase 4 observability |
| Persistence | Postgres 16, Redis 7 (compose) | Phase 7 memory/RAG — optional now |
| Agent | Python 3.12 + Poetry | Phase 5 LangGraph — not required yet |

## Run locally

```bash
npm install

# Optional: local Kind cluster + demo workload
make kind-up
make kind-apply

# Phase 4: Prometheus (:9090), Loki (:3100), demo telemetry (:9101)
make obs-up

# Optional Phase 7 data plane (not wired into API yet)
# make data-up
# export DATABASE_URL=postgres://opspilot:opspilot@localhost:5432/opspilot
# export REDIS_URL=redis://localhost:6379

# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web
```

- UI: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/api/health
- Observability UI: http://localhost:3000/observability
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100

If Kind is down, the API stays up in degraded mode. Incident **INC-1042** still powers the Command Center.  
If Prometheus/Loki are down, `/observability` and incident charts fall back to seed data.

Stop stacks:

```bash
make obs-down
make data-down
```

## First screens

- `/overview` — is production healthy?
- `/incidents/INC-1042` — incident command center (live metrics when `make obs-up`)
- `/observability` — Prometheus + Loki overview
- `/infrastructure/pods` — live pods
- `/deployments` — revision history

## Phased delivery

See [docs/architecture.md](docs/architecture.md).

1. K8s → API → SSE → dashboard — **done**
2. Incident Command Center — **done**
3. Deployment snapshots — **done**
4. Prometheus / Loki — **in progress** (`make obs-up`)
5. LangGraph agent
6. Policy / Executor / Verifier — **started** (approve → allowlisted mutate → verify)
7. Memory / RAG (Postgres + Redis)

## Security

Kubeconfig and Kubernetes credentials never leave the Node.js control plane. Mutations are allowlisted (`restart` / `rollback` in `MUTATION_NAMESPACES`) and run only after policy approval.

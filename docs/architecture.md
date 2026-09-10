# OpsPilot Architecture

## Control plane vs agent runtime

| Layer | Runtime | Responsibility |
|-------|---------|----------------|
| `apps/web` | Next.js | SRE control plane UI |
| `apps/api` | Node.js / Fastify | Aggregation, REST, SSE, authz gateway |
| `agent/` | Python / LangGraph | Investigation & recommendation (propose only) |

**LLM reasons. Deterministic systems observe, authorize, execute, and verify.**

```
Detect → Investigate → Diagnose → Recommend → Approve → Remediate → Verify → Remember
```

```
LLM proposes → Policy authorizes → Executor executes → Verifier verifies
```

The LLM never runs arbitrary kubectl. The browser never talks to the Kubernetes API.

## Real-time

Node.js owns Kubernetes watches and fans out SSE:

- `GET /api/health/stream`
- `GET /api/incidents/stream`
- `GET /api/agent/stream`

## Phased delivery

1. K8s → API → SSE → dashboard (pods, deployments, events, overview) — **done**
2. Incident Command Center — **done**
3. Deployment snapshots — **done**
4. Prometheus / Loki — **in progress**
   - Local stack: `make obs-up` (Prometheus `:9090`, Loki `:3100`, demo telemetry)
   - API: `/api/observability/*`, `/api/incidents/:id/telemetry`
   - UI: `/observability` + live error-rate/evidence on INC-1042 when backends are up
5. LangGraph agent — replace `agent-simulator.ts`; Python runtime under `agent/`
6. Policy / Executor / Verifier — approve → execute → verify (no free-form kubectl)
7. Memory / RAG — Postgres + Redis (`make data-up`); persist incidents and similar recall

## Local dependencies by phase

| Phase | Bring up with | Ports |
|-------|---------------|-------|
| 1–3 | `make kind-up && make kind-apply` | Kind API via kubeconfig |
| 4 | `make obs-up` | 9090, 3100, 9101 |
| 7 | `make data-up` | 5432, 6379 |

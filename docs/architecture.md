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

1. K8s → API → SSE → dashboard (pods, deployments, events, overview)
2. Incident Command Center
3. Deployment snapshots
4. Prometheus / Loki
5. LangGraph agent
6. Policy / Executor / Verifier
7. Memory / RAG

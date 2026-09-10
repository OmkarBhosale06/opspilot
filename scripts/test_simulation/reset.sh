#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/test_simulation/config.env"

log() { printf '[sim-reset] %s\n' "$*"; }

log "restoring ${NAMESPACE}/${DEPLOYMENT} from test-app.yaml"
kubectl --context "$KUBE_CONTEXT" apply -f "$ROOT/infrastructure/kubernetes/base/test-app.yaml"
kubectl --context "$KUBE_CONTEXT" -n "$NAMESPACE" scale \
  "deployment/${DEPLOYMENT}" --replicas="${HEALTHY_REPLICAS}" || true

if curl -fsS -X POST "${TELEMETRY_URL}/simulate" \
  -H "Content-Type: application/json" \
  -d '{"okDelta":82,"errorDelta":18}' >/dev/null 2>&1; then
  log "reset demo telemetry error ratio"
fi

log "cluster restored. Incidents in the API stay until the API process restarts."

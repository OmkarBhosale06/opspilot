#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/test_simulation/config.env"

SCENARIO="${1:-$SCENARIO}"

log() { printf '[sim] %s\n' "$*"; }

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing dependency: $1" >&2
    exit 1
  fi
}

apply_crashloop() {
  log "patching ${NAMESPACE}/${DEPLOYMENT} into CrashLoopBackOff (${CRASH_IMAGE})"
  kubectl --context "$KUBE_CONTEXT" -n "$NAMESPACE" patch deployment "$DEPLOYMENT" --type strategic -p "{
    \"spec\": {
      \"template\": {
        \"spec\": {
          \"containers\": [{
            \"name\": \"${DEPLOYMENT}\",
            \"image\": \"${CRASH_IMAGE}\",
            \"command\": [\"sh\", \"-c\", \"${CRASH_COMMAND}\"]
          }]
        }
      }
    }
  }"
}

apply_imagepull() {
  log "setting ${DEPLOYMENT} image to ${BAD_IMAGE}"
  kubectl --context "$KUBE_CONTEXT" -n "$NAMESPACE" set image \
    "deployment/${DEPLOYMENT}" "${DEPLOYMENT}=${BAD_IMAGE}"
}

apply_kill() {
  log "deleting pods for app=${APP_LABEL}"
  kubectl --context "$KUBE_CONTEXT" -n "$NAMESPACE" delete pod \
    -l "app=${APP_LABEL}" --wait=false
}

apply_scale() {
  log "scaling ${DEPLOYMENT} to ${SCALE_REPLICAS}"
  kubectl --context "$KUBE_CONTEXT" -n "$NAMESPACE" scale \
    "deployment/${DEPLOYMENT}" --replicas="${SCALE_REPLICAS}"
}

apply_telemetry() {
  log "spiking demo telemetry error ratio (${ERROR_DELTA} 5xx / ${OK_DELTA} 2xx per tick)"
  if ! curl -fsS -X POST "${TELEMETRY_URL}/simulate" \
    -H "Content-Type: application/json" \
    -d "{\"okDelta\":${OK_DELTA},\"errorDelta\":${ERROR_DELTA}}" >/dev/null; then
    log "telemetry /simulate not available — run make obs-up after pulling this change"
  fi
}

post_incident() {
  local scenario="$1"
  log "POST ${API_URL}/api/incidents (${scenario})"
  local payload body
  payload=$(python3 - "$INCIDENT_TITLE" "$INCIDENT_SUMMARY" "$SEVERITY" "$DEPLOYMENT" "$NAMESPACE" "$scenario" "$ERROR_RATE" "$AFFECTED_REPLICAS" <<'PY'
import json, sys
title, summary, severity, service, namespace, scenario, error_rate, replicas = sys.argv[1:]
print(json.dumps({
    "title": title,
    "summary": summary,
    "severity": severity,
    "service": service,
    "namespace": namespace,
    "scenario": scenario,
    "errorRate": float(error_rate),
    "affectedReplicas": int(replicas),
}))
PY
)
  body="$(curl -fsS -X POST "${API_URL}/api/incidents" \
    -H "Content-Type: application/json" \
    -d "$payload")"
  python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print("[sim] opened %s  ui: http://localhost:3000/incidents/%s" % (d.get("id"), d.get("id")))' "$body"
}

apply_scenario() {
  local s="$1"
  case "$s" in
    crashloop) apply_crashloop ;;
    imagepull) apply_imagepull ;;
    kill) apply_kill ;;
    scale) apply_scale ;;
    telemetry) apply_telemetry ;;
    all)
      apply_crashloop
      apply_telemetry
      ;;
    *)
      echo "unknown SCENARIO=$s (crashloop|imagepull|kill|scale|telemetry|all)" >&2
      exit 1
      ;;
  esac
}

need curl
if [[ "$APPLY_K8S" == "true" && "$SCENARIO" != "telemetry" ]]; then
  need kubectl
  kubectl --context "$KUBE_CONTEXT" get ns "$NAMESPACE" >/dev/null
fi

if [[ "$APPLY_K8S" == "true" ]]; then
  apply_scenario "$SCENARIO"
fi

if [[ "$POST_INCIDENT" == "true" && "$SCENARIO" != "telemetry" ]]; then
  post_incident "$SCENARIO"
elif [[ "$POST_INCIDENT" == "true" && "$SCENARIO" == "telemetry" ]]; then
  INCIDENT_TITLE="${INCIDENT_TITLE/crash loop/5xx spike}"
  post_incident telemetry
fi

log "done. edit scripts/test_simulation/config.env and re-run to recreate."
log "reset with: make sim-reset"

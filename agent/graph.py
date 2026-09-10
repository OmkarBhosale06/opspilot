from __future__ import annotations

from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def investigate(payload: dict) -> dict:
    """Sequential investigation graph (LangGraph-shaped; swap runtime later)."""
    incident = payload.get("incident") or {}
    pods = payload.get("pods") or []
    incident_id = incident.get("id") or "INC-unknown"
    service = incident.get("service") or "unknown"
    namespace = incident.get("namespace") or "opspilot"
    at = _now()

    unhealthy = [
        pod
        for pod in pods
        if not pod.get("ready")
        or any(
            (cs or {}).get("reason")
            in {
                "CrashLoopBackOff",
                "ImagePullBackOff",
                "ErrImagePull",
                "Error",
                "OOMKilled",
            }
            for cs in pod.get("containerStatuses") or []
        )
    ]
    reasons = []
    for pod in unhealthy:
        for cs in pod.get("containerStatuses") or []:
            if cs.get("reason"):
                reasons.append(cs["reason"])
    reason = reasons[0] if reasons else "unknown"

    return {
        "message": "phase-5 local graph (no LLM yet)",
        "investigation": [
            {
                "id": f"{incident_id}-agent-k8s",
                "step": "inspect_pods",
                "status": "completed",
                "tool": "k8s",
                "startedAt": at,
                "completedAt": at,
                "summary": (
                    f"{len(unhealthy)}/{len(pods)} pods unhealthy in {namespace} "
                    f"(reason={reason})"
                ),
                "details": {"unhealthy": [p.get("name") for p in unhealthy[:8]]},
            },
            {
                "id": f"{incident_id}-agent-hyp",
                "step": "form_hypothesis",
                "status": "completed",
                "tool": "memory",
                "startedAt": at,
                "completedAt": at,
                "summary": f"{service} likely failing due to {reason}",
            },
            {
                "id": f"{incident_id}-agent-gate",
                "step": "await_approval",
                "status": "running",
                "tool": "policy",
                "startedAt": at,
                "completedAt": None,
                "summary": "Policy gate: approve rollback/restart before executor runs",
            },
        ],
        "rootCause": {
            "summary": f"{service} unhealthy: {reason}",
            "confidence": 0.78 if unhealthy else 0.4,
            "service": service,
            "change": reason,
            "contributingFactors": list(dict.fromkeys(reasons)) or [reason],
        },
        "remediation": {
            "action": "restart" if reason in {"CrashLoopBackOff", "Error"} else "rollback",
            "target": f"deployment/{service}",
            "fromVersion": "current",
            "toVersion": "last-healthy",
            "rationale": "Return workload to last Ready replica set after on-call approval.",
            "risk": "low",
            "estimatedImpact": "Pod recycle in namespace; no cluster-wide change until approved",
        },
    }

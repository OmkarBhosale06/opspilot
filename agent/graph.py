from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from runtime.llm import chat_model, llm_settings
from runtime.log import info, warn

UNHEALTHY = {
    "CrashLoopBackOff",
    "ImagePullBackOff",
    "ErrImagePull",
    "Error",
    "OOMKilled",
}
PROMPT_DIR = Path(__file__).resolve().parent / "prompts"


class InvestigationState(TypedDict, total=False):
    incident: dict
    pods: list
    at: str
    observation: dict
    llm: dict
    llm_error: str
    investigation: list
    rootCause: dict
    remediation: dict


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _observe(state: InvestigationState) -> dict:
    info("_observe", "called")
    incident = state.get("incident") or {}
    pods = state.get("pods") or []
    service = incident.get("service") or "unknown"
    related = [
        pod
        for pod in pods
        if (pod.get("labels") or {}).get("app") == service
        or str(pod.get("name") or "").startswith(service)
    ]
    scoped = related or pods
    unhealthy = []
    reasons: list[str] = []
    for pod in scoped:
        statuses = pod.get("containerStatuses") or []
        pod_reasons = [
            cs.get("reason")
            for cs in statuses
            if cs.get("reason") in UNHEALTHY
        ]
        if not pod.get("ready") or pod_reasons:
            unhealthy.append(pod)
            reasons.extend(pod_reasons)
    reason = reasons[0] if reasons else "unknown"
    info(
        "_observe",
        "pod inspection complete",
        incidentId=incident.get("id"),
        service=service,
        pods=len(scoped),
        unhealthy=len(unhealthy),
        reason=reason,
    )
    at = state.get("at") or _now()
    incident_id = incident.get("id") or "INC-unknown"
    namespace = incident.get("namespace") or "opspilot"
    return {
        "at": at,
        "observation": {
            "service": service,
            "namespace": namespace,
            "reason": reason,
            "reasons": list(dict.fromkeys(reasons)) or [reason],
            "pod_count": len(scoped),
            "unhealthy_count": len(unhealthy),
            "unhealthy_names": [p.get("name") for p in unhealthy[:8]],
            "title": incident.get("title") or "",
            "summary": incident.get("summary") or "",
            "severity": incident.get("severity") or "",
        },
        "investigation": [
            {
                "id": f"{incident_id}-agent-k8s",
                "step": "inspect_pods",
                "status": "completed",
                "tool": "k8s",
                "startedAt": at,
                "completedAt": at,
                "summary": (
                    f"{len(unhealthy)}/{len(scoped)} pods unhealthy in {namespace} "
                    f"(reason={reason})"
                ),
                "details": {"unhealthy": [p.get("name") for p in unhealthy[:8]]},
            }
        ],
    }


def _extract_json(text: str) -> dict:
    info("_extract_json", "called")
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("model did not return JSON")
    parsed = json.loads(text[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("model JSON was not an object")
    return parsed


def _fallback_llm(observation: dict) -> dict:
    info("_fallback_llm", "called", reason=observation.get("reason"))
    reason = observation["reason"]
    service = observation["service"]
    action = "restart" if reason in {"CrashLoopBackOff", "Error", "OOMKilled"} else "rollback"
    return {
        "summary": f"{service} unhealthy: {reason}",
        "confidence": 0.78 if observation["unhealthy_count"] else 0.4,
        "change": reason,
        "contributingFactors": observation["reasons"],
        "hypothesis": f"{service} likely failing due to {reason}",
        "action": action,
        "rationale": "Return the workload to a healthy replica set after on-call approval.",
        "risk": "low",
        "estimatedImpact": "Pod recycle in the incident namespace after approval",
        "source": "fallback",
    }


def _normalize_llm(raw: dict, observation: dict) -> dict:
    info("_normalize_llm", "called")
    fallback = _fallback_llm(observation)
    action = raw.get("action") if raw.get("action") in {"restart", "rollback"} else fallback["action"]
    risk = raw.get("risk") if raw.get("risk") in {"low", "medium", "high"} else "low"
    try:
        confidence = float(raw.get("confidence", fallback["confidence"]))
    except (TypeError, ValueError):
        confidence = fallback["confidence"]
    confidence = max(0.0, min(1.0, confidence))
    factors = raw.get("contributingFactors") or raw.get("contributing_factors") or fallback["contributingFactors"]
    if not isinstance(factors, list):
        factors = [str(factors)]
    factors = [str(item) for item in factors if str(item).strip()] or fallback["contributingFactors"]
    return {
        "summary": str(raw.get("summary") or fallback["summary"])[:400],
        "confidence": confidence,
        "change": str(raw.get("change") or fallback["change"])[:120],
        "contributingFactors": factors[:6],
        "hypothesis": str(raw.get("hypothesis") or fallback["hypothesis"])[:400],
        "action": action,
        "rationale": str(raw.get("rationale") or fallback["rationale"])[:400],
        "risk": risk,
        "estimatedImpact": str(raw.get("estimatedImpact") or raw.get("estimated_impact") or fallback["estimatedImpact"])[:240],
        "source": "llm",
    }


def _reason(state: InvestigationState) -> dict:
    info("_reason", "called")
    started = time.perf_counter()
    observation = state["observation"]
    incident = state.get("incident") or {}
    incident_id = incident.get("id") or "INC-unknown"
    at = state["at"]
    system = (PROMPT_DIR / "system.txt").read_text(encoding="utf-8").strip()
    user = (
        "Given this incident observation, return JSON with keys "
        "summary, confidence (0-1), change, contributingFactors (array of strings), "
        "hypothesis, action (restart|rollback), rationale, risk (low|medium|high), estimatedImpact.\n"
        f"{json.dumps(observation, default=str)}"
    )
    failure = ""
    try:
        message = chat_model().invoke(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )
        content = message.content if isinstance(message.content, str) else str(message.content)
        parsed = _normalize_llm(_extract_json(content), observation)
    except Exception as exc:  # noqa: BLE001 — keep the HTTP contract if the model is down
        failure = str(exc)
        warn("_reason", "model call failed, using fallback", error=failure)
        parsed = _fallback_llm(observation)

    service = observation["service"]
    steps = list(state.get("investigation") or [])
    steps.extend(
        [
            {
                "id": f"{incident_id}-agent-hyp",
                "step": "form_hypothesis",
                "status": "completed",
                "tool": "memory",
                "startedAt": at,
                "completedAt": at,
                "summary": parsed["hypothesis"],
                "details": {"model": llm_settings()["model"], "source": parsed["source"]},
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
        ]
    )
    info(
        "_reason",
        "diagnosis complete",
        incidentId=incident_id,
        source=parsed["source"],
        action=parsed["action"],
        ms=round((time.perf_counter() - started) * 1000),
    )
    return {
        "llm": parsed,
        "llm_error": failure,
        "investigation": steps,
        "rootCause": {
            "summary": parsed["summary"],
            "confidence": parsed["confidence"],
            "service": service,
            "change": parsed["change"],
            "contributingFactors": parsed["contributingFactors"],
        },
        "remediation": {
            "action": parsed["action"],
            "target": f"deployment/{service}",
            "fromVersion": "current",
            "toVersion": "last-healthy",
            "rationale": parsed["rationale"],
            "risk": parsed["risk"],
            "estimatedImpact": parsed["estimatedImpact"],
        },
    }


def _compile():
    info("_compile", "called")
    graph = StateGraph(InvestigationState)
    graph.add_node("observe", _observe)
    graph.add_node("reason", _reason)
    graph.add_edge(START, "observe")
    graph.add_edge("observe", "reason")
    graph.add_edge("reason", END)
    return graph.compile()


_GRAPH = _compile()


def investigate(payload: dict) -> dict:
    """LangGraph investigation: observe pods, then an LLM proposes diagnosis and remediation."""
    incident = (payload.get("incident") or {})
    info("investigate", "called", incidentId=incident.get("id"), pods=len(payload.get("pods") or []))
    result = _GRAPH.invoke(
        {
            "incident": payload.get("incident") or {},
            "pods": payload.get("pods") or [],
            "at": _now(),
        }
    )
    settings = llm_settings()
    source = (result.get("llm") or {}).get("source", "fallback")
    message = f"langgraph ({settings['model']})"
    if source != "llm":
        message = f"langgraph fallback ({settings['model']} unavailable)"
    info("investigate", "complete", incidentId=incident.get("id"), source=source, message=message)
    return {
        "message": message,
        "investigation": result.get("investigation") or [],
        "rootCause": result.get("rootCause") or {},
        "remediation": result.get("remediation") or {},
    }

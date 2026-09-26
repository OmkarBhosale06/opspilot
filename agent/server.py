#!/usr/bin/env python3
"""Phase 5 investigation server. LangGraph proposes; it does not mutate the cluster."""

from pathlib import Path
import json
import socket
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent))
from graph import investigate
from runtime.llm import llm_settings

# Bind IPv6 dual-stack so Node's localhost (::1) and 127.0.0.1 both connect.
HOST = "::"
PORT = 8090


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True

    def server_bind(self) -> None:
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


def _llm_reachable() -> bool:
    settings = llm_settings()
    # OpenAI-compatible base is .../v1; Ollama tags live on the origin.
    origin = settings["base_url"].removesuffix("/v1")
    try:
        with urlopen(f"{origin}/api/tags", timeout=1.5) as response:
            return response.status == 200
    except Exception:
        return False


class Handler(BaseHTTPRequestHandler):
    def _json(self, code: int, body: dict) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in {"/", "/health"}:
            settings = llm_settings()
            self._json(
                200,
                {
                    "ok": True,
                    "runtime": "langgraph",
                    "model": settings["model"],
                    "llmBaseUrl": settings["base_url"],
                    "llmReachable": _llm_reachable(),
                    "investigate": "POST /investigate",
                    "health": "GET /health",
                },
            )
            return
        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid_json"})
            return
        if path == "/investigate":
            try:
                self._json(200, investigate(payload))
            except Exception as exc:  # noqa: BLE001
                self._json(500, {"error": "investigate_failed", "detail": str(exc)})
            return
        self._json(404, {"error": "not_found"})

    def log_message(self, fmt: str, *args) -> None:
        line = fmt % args
        # Chrome/Cursor probes :8090 as a DevTools endpoint; ignore those.
        if "/json/version" in line:
            return
        sys.stderr.write("[agent] " + line + "\n")


def main() -> None:
    settings = llm_settings()
    server = DualStackServer((HOST, PORT), Handler)
    print(f"OpsPilot LangGraph agent listening on http://127.0.0.1:{PORT}")
    print(f"  model: {settings['model']} via {settings['base_url']}")
    print("  GET  /health")
    print("  POST /investigate   (called by the API when an incident is created)")
    server.serve_forever()


if __name__ == "__main__":
    main()

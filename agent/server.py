#!/usr/bin/env python3
"""Phase 5 investigation HTTP stub. Replace with LangGraph + LLM later."""

from pathlib import Path
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from graph import investigate

HOST = "127.0.0.1"
PORT = 8090


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
        if path == "/health":
            self._json(200, {"ok": True, "runtime": "phase5-stub"})
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
            self._json(200, investigate(payload))
            return
        self._json(404, {"error": "not_found"})

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[agent] " + (fmt % args) + "\n")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"OpsPilot agent stub listening on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()

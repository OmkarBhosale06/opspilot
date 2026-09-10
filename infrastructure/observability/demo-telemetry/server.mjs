#!/usr/bin/env node
/**
 * Emits checkout-api Prometheus metrics and pushes panic-style lines to Loki.
 * Used only for local Phase 4 demos — not production telemetry.
 */
import http from "node:http";

const PORT = Number(process.env.PORT || 9101);
const LOKI_URL = (process.env.LOKI_URL || "http://loki:3100").replace(/\/$/, "");
const SERVICE = process.env.SERVICE_NAME || "checkout-api";

let ok = 10_000;
let err = 2_200;
let tick = 0;

function metricsBody() {
  return [
    "# HELP http_requests_total Total HTTP requests",
    "# TYPE http_requests_total counter",
    `http_requests_total{service="${SERVICE}",status="200"} ${ok}`,
    `http_requests_total{service="${SERVICE}",status="500"} ${err}`,
    "# HELP process_start_time_seconds Start time of the process",
    "# TYPE process_start_time_seconds gauge",
    `process_start_time_seconds ${Math.floor(Date.now() / 1000) - 3600}`,
    "",
  ].join("\n");
}

const server = http.createServer((req, res) => {
  if (req.url === "/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
    res.end(metricsBody());
    return;
  }
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: SERVICE }));
    return;
  }
  res.writeHead(404).end("not found");
});

async function pushLoki() {
  const nowNs = `${BigInt(Date.now()) * 1_000_000n}`;
  const line =
    tick % 3 === 0
      ? `panic: runtime error: invalid memory address or nil pointer dereference in ValidatePaymentToken service=${SERVICE}`
      : `ERROR payment token validation failed service=${SERVICE} request_id=req-${tick}`;

  const body = {
    streams: [
      {
        stream: { app: SERVICE, service: SERVICE, level: "error", job: "demo-telemetry" },
        values: [[nowNs, line]],
      },
    ],
  };

  try {
    const res = await fetch(`${LOKI_URL}/loki/api/v1/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`loki push failed: ${res.status}`);
    }
  } catch (err) {
    console.warn(`loki push error: ${err instanceof Error ? err.message : err}`);
  }
}

setInterval(() => {
  tick += 1;
  // Keep ~18% 5xx ratio while counters keep moving for rate().
  ok += 82;
  err += 18;
  void pushLoki();
}, 2000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`demo-telemetry listening on :${PORT} → Loki ${LOKI_URL}`);
});

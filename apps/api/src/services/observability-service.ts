import type { Config } from "../config/env.js";
import type { PrometheusClient } from "../clients/prometheus/client.js";
import type { LokiClient, LokiLogLine } from "../clients/loki/client.js";
import type { EvidenceItem } from "../repositories/incidents.js";
import { incidentStore } from "../repositories/incidents.js";

export type MetricPoint = { t: string; value: number; timestamp: number };

export type ObservabilityStatus = {
  status: "live" | "degraded";
  prometheus: { available: boolean; url: string };
  loki: { available: boolean; url: string };
  timestamp: string;
};

export type AlertDto = {
  name: string;
  state: string;
  severity: string | null;
  summary: string | null;
  labels: Record<string, string>;
  activeAt: string | null;
  value: string | null;
};

export type ObservabilityOverview = {
  status: "live" | "degraded";
  prometheusAvailable: boolean;
  lokiAvailable: boolean;
  service: string;
  errorRate: {
    live: boolean;
    query: string;
    current: number | null;
    unit: "%";
    series: MetricPoint[];
  };
  alerts: AlertDto[];
  recentLogs: Array<{
    timestamp: string;
    line: string;
    labels: Record<string, string>;
  }>;
  timestamp: string;
  message?: string;
};

export type IncidentTelemetry = {
  incidentId: string;
  service: string;
  live: boolean;
  prometheusAvailable: boolean;
  lokiAvailable: boolean;
  errorRate: {
    live: boolean;
    query: string;
    current: number | null;
    series: MetricPoint[];
  };
  liveEvidence: EvidenceItem[];
  timestamp: string;
};

function errorRateQuery(service: string): string {
  return (
    `100 * (` +
    `sum(rate(http_requests_total{service="${service}",status=~"5.."}[1m]))` +
    ` / ` +
    `clamp_min(sum(rate(http_requests_total{service="${service}"}[1m])), 1e-9)` +
    `)`
  );
}

function logQuery(service: string): string {
  return `{service="${service}"} |~ "(?i)panic|error|ValidatePaymentToken"`;
}

function parseInstantValue(result: unknown): number | null {
  const body = result as {
    data?: { result?: Array<{ value?: [number, string] }> };
  };
  const raw = body.data?.result?.[0]?.value?.[1];
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseRangeSeries(result: unknown): MetricPoint[] {
  const body = result as {
    data?: {
      result?: Array<{ values?: Array<[number, string]> }>;
    };
  };
  const values = body.data?.result?.[0]?.values ?? [];
  return values
    .map(([ts, raw]) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) return null;
      const date = new Date(ts * 1000);
      return {
        timestamp: ts,
        t: date.toISOString(),
        value: Number(value.toFixed(3)),
      };
    })
    .filter((p): p is MetricPoint => p !== null);
}

function parseAlerts(result: unknown): AlertDto[] {
  const body = result as {
    data?: {
      alerts?: Array<{
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        state?: string;
        activeAt?: string;
        value?: string;
      }>;
    };
  };
  return (body.data?.alerts ?? []).map((alert) => {
    const labels = alert.labels ?? {};
    return {
      name: labels.alertname ?? "unnamed",
      state: alert.state ?? "unknown",
      severity: labels.severity ?? null,
      summary: alert.annotations?.summary ?? alert.annotations?.description ?? null,
      labels,
      activeAt: alert.activeAt ?? null,
      value: alert.value ?? null,
    };
  });
}

function toIsoFromNs(ns: string): string {
  try {
    const ms = Number(BigInt(ns) / 1_000_000n);
    return new Date(ms).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export class ObservabilityService {
  constructor(
    private readonly prometheus: PrometheusClient,
    private readonly loki: LokiClient,
    private readonly config: Config
  ) {}

  async status(): Promise<ObservabilityStatus> {
    const [prometheusOk, lokiOk] = await Promise.all([
      this.prometheus.health(),
      this.loki.health(),
    ]);
    return {
      status: prometheusOk || lokiOk ? "live" : "degraded",
      prometheus: {
        available: prometheusOk,
        url: this.config.PROMETHEUS_URL,
      },
      loki: {
        available: lokiOk,
        url: this.config.LOKI_URL,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async rangeErrorRate(
    service: string,
    windowMinutes = 30,
    step = "30s"
  ): Promise<{ live: boolean; query: string; current: number | null; series: MetricPoint[] }> {
    const query = errorRateQuery(service);
    const end = Math.floor(Date.now() / 1000);
    const start = end - windowMinutes * 60;
    try {
      const [range, instant] = await Promise.all([
        this.prometheus.rangeQuery(
          query,
          String(start),
          String(end),
          step
        ),
        this.prometheus.instantQuery(query),
      ]);
      return {
        live: true,
        query,
        current: parseInstantValue(instant),
        series: parseRangeSeries(range),
      };
    } catch {
      return { live: false, query, current: null, series: [] };
    }
  }

  async listAlerts(): Promise<{ live: boolean; items: AlertDto[] }> {
    try {
      const result = await this.prometheus.activeAlerts();
      return { live: true, items: parseAlerts(result) };
    } catch {
      return { live: false, items: [] };
    }
  }

  async recentLogs(
    service: string,
    limit = 40
  ): Promise<{ live: boolean; query: string; items: LokiLogLine[] }> {
    const query = logQuery(service);
    const endNs = `${BigInt(Date.now()) * 1_000_000n}`;
    const startNs = `${BigInt(Date.now() - 30 * 60_000) * 1_000_000n}`;
    try {
      const items = await this.loki.queryRange(query, startNs, endNs, limit);
      return { live: true, query, items: items.reverse() };
    } catch {
      return { live: false, query, items: [] };
    }
  }

  async overview(service = "checkout-api"): Promise<ObservabilityOverview> {
    const [status, errorRate, alerts, logs] = await Promise.all([
      this.status(),
      this.rangeErrorRate(service),
      this.listAlerts(),
      this.recentLogs(service),
    ]);

    const live = status.prometheus.available || status.loki.available;
    return {
      status: live ? "live" : "degraded",
      prometheusAvailable: status.prometheus.available,
      lokiAvailable: status.loki.available,
      service,
      errorRate: {
        live: errorRate.live,
        query: errorRate.query,
        current: errorRate.current,
        unit: "%",
        series: errorRate.series,
      },
      alerts: alerts.items,
      recentLogs: logs.items.map((line) => ({
        timestamp: toIsoFromNs(line.timestamp),
        line: line.line,
        labels: line.labels,
      })),
      timestamp: new Date().toISOString(),
      message: live
        ? undefined
        : "Prometheus/Loki unreachable — run `make obs-up`. Incident seed data still available.",
    };
  }

  async incidentTelemetry(incidentId: string): Promise<IncidentTelemetry | null> {
    const incident = incidentStore.get(incidentId);
    if (!incident) return null;

    const [status, errorRate, logs] = await Promise.all([
      this.status(),
      this.rangeErrorRate(incident.service),
      this.recentLogs(incident.service, 20),
    ]);

    const liveEvidence: EvidenceItem[] = [];
    const now = new Date().toISOString();

    if (errorRate.live && errorRate.current != null) {
      liveEvidence.push({
        id: `live-metric-${incident.id}`,
        kind: "metric",
        title: `${incident.service} 5xx rate (live)`,
        summary: `Live error rate ${errorRate.current.toFixed(1)}% over the last scrape window`,
        source: "prometheus",
        timestamp: now,
        data: {
          value: errorRate.current / 100,
          query: errorRate.query,
          window: "1m rate",
          live: true,
        },
      });
    }

    if (logs.live && logs.items.length > 0) {
      const sample = logs.items[logs.items.length - 1];
      liveEvidence.push({
        id: `live-log-${incident.id}`,
        kind: "log",
        title: `${incident.service} panic / error logs (live)`,
        summary: `${logs.items.length} matching lines in the last 30m`,
        source: "loki",
        timestamp: toIsoFromNs(sample.timestamp),
        data: {
          query: logs.query,
          snippet: sample.line,
          sampleCount: logs.items.length,
          live: true,
        },
      });
    }

    return {
      incidentId: incident.id,
      service: incident.service,
      live: errorRate.live || logs.live,
      prometheusAvailable: status.prometheus.available,
      lokiAvailable: status.loki.available,
      errorRate: {
        live: errorRate.live,
        query: errorRate.query,
        current: errorRate.current,
        series: errorRate.series,
      },
      liveEvidence,
      timestamp: now,
    };
  }
}

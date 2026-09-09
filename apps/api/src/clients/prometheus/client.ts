import type { Config } from "../../config/env.js";

export type PrometheusQueryResult = {
  status: string;
  data: unknown;
};

export class PrometheusClient {
  constructor(private readonly baseUrl: string) {}

  static fromConfig(config: Config): PrometheusClient {
    return new PrometheusClient(config.PROMETHEUS_URL.replace(/\/$/, ""));
  }

  async instantQuery(query: string): Promise<PrometheusQueryResult> {
    const url = `${this.baseUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
    return this.get(url);
  }

  async rangeQuery(
    query: string,
    start: string,
    end: string,
    step: string
  ): Promise<PrometheusQueryResult> {
    const params = new URLSearchParams({ query, start, end, step });
    return this.get(`${this.baseUrl}/api/v1/query_range?${params}`);
  }

  async activeAlerts(): Promise<PrometheusQueryResult> {
    return this.get(`${this.baseUrl}/api/v1/alerts`);
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/-/ready`);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async get(url: string): Promise<PrometheusQueryResult> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Prometheus request failed (${res.status})`);
    }
    return (await res.json()) as PrometheusQueryResult;
  }
}

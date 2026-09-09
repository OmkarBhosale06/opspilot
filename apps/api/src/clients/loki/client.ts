import type { Config } from "../../config/env.js";
import type { AppLogger } from "../../logging.js";
import { loggedFetch } from "../http.js";

export type LokiLogLine = {
  timestamp: string;
  line: string;
  labels: Record<string, string>;
};

export class LokiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly log?: AppLogger
  ) {}

  static fromConfig(config: Config, log?: AppLogger): LokiClient {
    return new LokiClient(config.LOKI_URL.replace(/\/$/, ""), log);
  }

  async queryRange(
    query: string,
    startNs: string,
    endNs: string,
    limit = 100
  ): Promise<LokiLogLine[]> {
    const params = new URLSearchParams({
      query,
      start: startNs,
      end: endNs,
      limit: String(limit),
    });
    const res = await loggedFetch(
      this.log,
      `${this.baseUrl}/loki/api/v1/query_range?${params}`,
      undefined,
      "loki"
    );
    if (!res.ok) {
      throw new Error(`Loki request failed (${res.status})`);
    }
    const body = (await res.json()) as {
      data?: {
        result?: Array<{
          stream?: Record<string, string>;
          values?: Array<[string, string]>;
        }>;
      };
    };
    const lines: LokiLogLine[] = [];
    for (const stream of body.data?.result ?? []) {
      for (const [timestamp, line] of stream.values ?? []) {
        lines.push({
          timestamp,
          line,
          labels: stream.stream ?? {},
        });
      }
    }
    return lines;
  }

  async labelNames(): Promise<string[]> {
    const res = await loggedFetch(
      this.log,
      `${this.baseUrl}/loki/api/v1/labels`,
      undefined,
      "loki"
    );
    if (!res.ok) {
      throw new Error(`Loki label discovery failed (${res.status})`);
    }
    const body = (await res.json()) as { data?: string[] };
    return body.data ?? [];
  }

  async health(): Promise<boolean> {
    try {
      const res = await loggedFetch(
        this.log,
        `${this.baseUrl}/ready`,
        undefined,
        "loki"
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

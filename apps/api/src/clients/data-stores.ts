import pg from "pg";
import { createClient, type RedisClientType } from "redis";
import type { Config } from "../config/env.js";
import type { Incident } from "../repositories/incidents.js";
import type { AppLogger } from "../logging.js";
import { createFnLog } from "../logging.js";

const LOCAL_PG = "postgres://opspilot:opspilot@localhost:5432/opspilot";
const LOCAL_REDIS = "redis://localhost:6379";

function defaultPgUrl(config: Config): string | undefined {
  if (config.DATABASE_URL) return config.DATABASE_URL;
  if (config.NODE_ENV === "test") return undefined;
  return LOCAL_PG;
}

function defaultRedisUrl(config: Config): string | undefined {
  if (config.REDIS_URL) return config.REDIS_URL;
  if (config.NODE_ENV === "test") return undefined;
  return LOCAL_REDIS;
}

export class PostgresClient {
  connected = false;
  private pool: pg.Pool | null = null;
  private readonly flog;

  constructor(
    private readonly url: string | undefined,
    log?: AppLogger
  ) {
    this.flog = createFnLog(log);
  }

  static fromConfig(config: Config, log?: AppLogger): PostgresClient {
    return new PostgresClient(defaultPgUrl(config), log);
  }

  async connect(): Promise<void> {
    if (!this.url) return;
    try {
      this.pool = new pg.Pool({
        connectionString: this.url,
        max: 4,
        connectionTimeoutMillis: 1500,
      });
      await this.pool.query("select 1");
      await this.pool.query(`
        create table if not exists incidents (
          id text primary key,
          service text not null,
          namespace text not null,
          title text not null,
          summary text not null,
          status text not null,
          severity text not null,
          payload jsonb not null,
          updated_at timestamptz not null
        )
      `);
      await this.pool.query(
        `create index if not exists incidents_service_idx on incidents (service)`
      );
      this.connected = true;
      this.flog.info("PostgresClient.connect", "Postgres ready", {
        database: "opspilot",
      });
    } catch (err) {
      this.connected = false;
      await this.pool?.end().catch(() => undefined);
      this.pool = null;
      this.flog.warn("PostgresClient.connect", "Postgres unavailable — in-memory only", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async health(): Promise<boolean> {
    if (!this.pool) return false;
    try {
      await this.pool.query("select 1");
      this.connected = true;
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async listIncidents(): Promise<Incident[]> {
    if (!this.pool || !this.connected) return [];
    const res = await this.pool.query<{ payload: Incident | string }>(
      "select payload from incidents order by updated_at desc"
    );
    return res.rows.map((row) =>
      typeof row.payload === "string"
        ? (JSON.parse(row.payload) as Incident)
        : row.payload
    );
  }

  async upsertIncident(incident: Incident): Promise<void> {
    if (!this.pool || !this.connected) return;
    await this.pool.query(
      `insert into incidents (id, service, namespace, title, summary, status, severity, payload, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::timestamptz)
       on conflict (id) do update set
         service = excluded.service,
         namespace = excluded.namespace,
         title = excluded.title,
         summary = excluded.summary,
         status = excluded.status,
         severity = excluded.severity,
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
      [
        incident.id,
        incident.service,
        incident.namespace,
        incident.title,
        incident.summary,
        incident.status,
        incident.severity,
        JSON.stringify(incident),
        incident.updatedAt,
      ]
    );
  }

  async close(): Promise<void> {
    await this.pool?.end().catch(() => undefined);
    this.pool = null;
    this.connected = false;
  }
}

export class RedisClient {
  connected = false;
  private client: RedisClientType | null = null;
  private readonly flog;

  constructor(
    private readonly url: string | undefined,
    log?: AppLogger
  ) {
    this.flog = createFnLog(log);
  }

  static fromConfig(config: Config, log?: AppLogger): RedisClient {
    return new RedisClient(defaultRedisUrl(config), log);
  }

  async connect(): Promise<void> {
    if (!this.url) return;
    try {
      this.client = createClient({ url: this.url, socket: { connectTimeout: 1500 } });
      this.client.on("error", () => {
        this.connected = false;
      });
      await this.client.connect();
      await this.client.ping();
      this.connected = true;
      this.flog.info("RedisClient.connect", "Redis ready");
    } catch (err) {
      this.connected = false;
      await this.client?.quit().catch(() => undefined);
      this.client = null;
      this.flog.warn("RedisClient.connect", "Redis unavailable — recall uncached", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async health(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.ping();
      this.connected = true;
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSec = 120): Promise<void> {
    if (!this.client || !this.connected) return;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSec });
    } catch {
      // ignore cache write failures
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.connected) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async close(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
    this.client = null;
    this.connected = false;
  }
}

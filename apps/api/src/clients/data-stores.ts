import type { Config } from "../config/env.js";

export class PostgresClient {
  connected = false;

  constructor(private readonly url?: string) {}

  static fromConfig(config: Config): PostgresClient {
    return new PostgresClient(config.DATABASE_URL);
  }

  async connect(): Promise<void> {
    if (!this.url) return;
    // Connection is deferred until the persistence phase; URL presence is recorded.
    this.connected = false;
  }

  async health(): Promise<boolean> {
    return this.connected;
  }

  async close(): Promise<void> {
    this.connected = false;
  }
}

export class RedisClient {
  connected = false;

  constructor(private readonly url?: string) {}

  static fromConfig(config: Config): RedisClient {
    return new RedisClient(config.REDIS_URL);
  }

  async connect(): Promise<void> {
    if (!this.url) return;
    this.connected = false;
  }

  async health(): Promise<boolean> {
    return this.connected;
  }

  async close(): Promise<void> {
    this.connected = false;
  }
}

import type { PostgresClient, RedisClient } from "../clients/data-stores.js";
import type { AppLogger } from "../logging.js";
import { createFnLog } from "../logging.js";
import { incidentStore, type Incident } from "../repositories/incidents.js";
import { recallSimilar, type SimilarHit } from "./similar.js";

export class MemoryService {
  private readonly flog;

  constructor(
    private readonly postgres: PostgresClient,
    private readonly redis: RedisClient,
    log?: AppLogger
  ) {
    this.flog = createFnLog(log);
  }

  async start(): Promise<void> {
    incidentStore.onWrite((incident) => {
      void this.persist(incident);
    });
    if (!this.postgres.connected) {
      this.flog.info(
        "MemoryService.start",
        "Persistence degraded — incidents stay in memory until make data-up"
      );
      return;
    }
    try {
      const rows = await this.postgres.listIncidents();
      for (const incident of rows) {
        incidentStore.upsert(incident, { silent: true });
      }
      this.flog.info("MemoryService.start", "Hydrated incidents from Postgres", {
        count: rows.length,
      });
    } catch (err) {
      this.flog.warn("MemoryService.start", "Hydrate failed", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async persist(incident: Incident): Promise<void> {
    try {
      await this.postgres.upsertIncident(incident);
      await this.redis.del(`similar:${incident.id}`);
    } catch (err) {
      this.flog.warn("MemoryService.persist", "Failed to persist incident", {
        incidentId: incident.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async similar(incident: Incident): Promise<SimilarHit[]> {
    const cacheKey = `similar:${incident.id}`;
    const cached = await this.redis.getJson<SimilarHit[]>(cacheKey);
    if (cached && cached.length) return cached;
    const hits = recallSimilar(incident, incidentStore.list());
    await this.redis.setJson(cacheKey, hits, 120);
    return hits;
  }

  overview() {
    const items = incidentStore.list();
    const remembered = items.filter(
      (i) => i.status === "resolved" || i.status === "closed"
    );
    return {
      status: this.postgres.connected ? ("live" as const) : ("degraded" as const),
      postgres: this.postgres.connected,
      redis: this.redis.connected,
      remembered: remembered.length,
      total: items.length,
      recent: remembered.slice(0, 12).map((i) => ({
        id: i.id,
        title: i.title,
        service: i.service,
        namespace: i.namespace,
        status: i.status,
        resolution: `${i.remediation.action} ${i.remediation.toVersion}`,
        updatedAt: i.updatedAt,
      })),
      message: this.postgres.connected
        ? undefined
        : "Postgres is down. Run `make data-up` to remember incidents across API restarts.",
    };
  }
}

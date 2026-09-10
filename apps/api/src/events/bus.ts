import type { AppLogger } from "../logging.js";
import { createFnLog } from "../logging.js";
import type { EventHandler, OpsPilotEvent } from "../types/events.js";

export class EventBus {
  private handlers = new Set<EventHandler>();
  private readonly flog;

  constructor(private readonly log?: AppLogger) {
    this.flog = createFnLog(log);
  }

  publish(event: OpsPilotEvent): void {
    this.flog.debug("EventBus.publish", `bus ${event.type}`, {
      type: event.type,
      incidentId: event.incidentId,
      subscribers: this.handlers.size,
      message: event.message,
    });
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        this.flog.error("EventBus.publish", "event-bus handler error", {
          err,
          type: event.type,
        });
      }
    }
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    this.flog.debug("EventBus.subscribe", "bus subscriber added", {
      subscribers: this.handlers.size,
    });
    return () => {
      this.handlers.delete(handler);
      this.flog.debug("EventBus.subscribe", "bus subscriber removed", {
        subscribers: this.handlers.size,
      });
    };
  }

  get subscriberCount(): number {
    return this.handlers.size;
  }
}

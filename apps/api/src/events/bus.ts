import type { AppLogger } from "../logging.js";
import type { EventHandler, OpsPilotEvent } from "../types/events.js";

export class EventBus {
  private handlers = new Set<EventHandler>();

  constructor(private readonly log?: AppLogger) {}

  publish(event: OpsPilotEvent): void {
    this.log?.debug(
      {
        type: event.type,
        incidentId: event.incidentId,
        subscribers: this.handlers.size,
        message: event.message,
      },
      `bus ${event.type}`
    );
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        this.log?.error({ err, type: event.type }, "event-bus handler error");
      }
    }
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    this.log?.debug(
      { subscribers: this.handlers.size },
      "bus subscriber added"
    );
    return () => {
      this.handlers.delete(handler);
      this.log?.debug(
        { subscribers: this.handlers.size },
        "bus subscriber removed"
      );
    };
  }

  get subscriberCount(): number {
    return this.handlers.size;
  }
}

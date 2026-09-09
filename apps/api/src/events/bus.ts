import type { EventHandler, OpsPilotEvent } from "../types/events.js";

export class EventBus {
  private handlers = new Set<EventHandler>();

  publish(event: OpsPilotEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error("[event-bus] handler error:", err);
      }
    }
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  get subscriberCount(): number {
    return this.handlers.size;
  }
}

import type { EventHandler, OpsEvent } from "./types.js";

class EventBus {
  private handlers = new Set<EventHandler>();

  publish(event: OpsEvent): void {
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
}

export const eventBus = new EventBus();

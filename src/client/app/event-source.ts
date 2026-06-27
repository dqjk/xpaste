import type { ServerEvent } from "../../shared/index.js";

type EventHandler = (event: ServerEvent) => void;

/**
 * Opens the shared SSE stream and normalizes browser MessageEvents into typed server events.
 */
export function connectEventStream(handler: EventHandler): EventSource {
  const eventSource = new EventSource("/events");
  const eventNames = ["device-list", "device-connected", "device-offline", "data-created"];

  for (const eventName of eventNames) {
    eventSource.addEventListener(eventName, (event) => {
      const messageEvent = event as MessageEvent<string>;
      const parsedEvent = JSON.parse(messageEvent.data) as ServerEvent;
      handler(parsedEvent);
    });
  }

  return eventSource;
}

import type { Response } from "express";
import type { ServerEvent } from "../../shared/index.js";

export type SseConnection = {
  connectionId: string;
  deviceId: string;
  response: Response;
};

/**
 * Holds active SSE responses and provides a small broadcast API for runtime events.
 */
export class SseService {
  private readonly connections = new Map<string, SseConnection>();

  /**
   * Registers a newly opened SSE connection so later events can be pushed to it.
   */
  addConnection(connection: SseConnection): void {
    this.connections.set(connection.connectionId, connection);
  }

  /**
   * Removes a closed SSE connection from the in-memory registry.
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /**
   * Pushes the same event payload to every active browser session.
   */
  broadcast(event: ServerEvent): void {
    const payload = serializeSseEvent(event);
    for (const connection of this.connections.values()) {
      connection.response.write(payload);
    }
  }

  /**
   * Sends a single event to one connection, typically for first-load snapshots.
   */
  send(connectionId: string, event: ServerEvent): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    connection.response.write(serializeSseEvent(event));
  }
}

/**
 * Converts a typed event object into the SSE wire format expected by EventSource.
 */
function serializeSseEvent(event: ServerEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

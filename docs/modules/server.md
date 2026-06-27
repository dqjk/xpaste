# Server Module

[简体中文](./server.zh-CN.md)

## Goal

The server module hosts the browser app, tracks online devices, accepts shared content, and streams runtime changes through SSE.

## Responsibilities

- Parse the lightweight foreground CLI options
- Print local and LAN access URLs
- Serve static assets
- Register SSE connections
- Track device presence by `deviceId`
- Accept text and binary uploads
- Expose current data resources over HTTP
- Remove device-owned data when the last session disconnects

## Internal Boundaries

- `routes/`: HTTP and SSE entry points
- `services/`: runtime state and business logic
- `utils/`: stateless helpers

## Current Scope

- `app.ts`: npm executable, CLI parsing, and application composition root
- `routes/events.ts`
- `routes/data.ts`
- `routes/static.ts`
- `services/device-service.ts`
- `services/data-service.ts`
- `services/sse-service.ts`

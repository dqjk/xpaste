# Client Module

## Goal

The client module provides a responsive browser UI without a frontend framework.

## Responsibilities

- Ensure `deviceId` cookie exists
- Open and consume the SSE stream
- Submit text and file data
- Keep page state separate from DOM rendering
- Render a responsive multi-device dashboard

## Internal Boundaries

- `api/`: HTTP requests
- `app/`: application bootstrap and browser lifecycle helpers
- `state/`: in-memory page state
- `ui/`: rendering logic

## Current Scope

- `index.ts`
- `api/http-client.ts`
- `app/device-cookie.ts`
- `app/event-source.ts`
- `state/store.ts`
- `ui/render.ts`

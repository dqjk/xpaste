# Client Module

[简体中文](./client.zh-CN.md)

## Goal

The client module provides a responsive browser UI without a frontend framework.

## Responsibilities

- Ensure `deviceId` cookie exists
- Open and consume the SSE stream
- Submit text and file data
- Resolve English or Simplified Chinese from browser language preferences
- Keep page state separate from DOM rendering
- Render a responsive multi-device dashboard

## Internal Boundaries

- `api/`: HTTP requests
- `app/`: application bootstrap and browser lifecycle helpers
- `i18n/`: typed locale negotiation and message catalogs
- `state/`: in-memory page state
- `ui/`: rendering logic

## Current Scope

- `index.ts`
- `api/http-client.ts`
- `app/device-cookie.ts`
- `app/event-source.ts`
- `i18n/locale.ts`
- `state/store.ts`
- `ui/render.ts`

## Localization Lifecycle

The client negotiates a locale once during startup from the browser's ordered language
preferences. Chinese language tags use the `zh-CN` catalog, supported English tags use `en`,
and all other languages fall back to English. The resolved locale updates the document language
and an immutable translator is passed into rendering; no locale preference is stored.

## Browser Compatibility

Device identity uses `Crypto.randomUUID()` when available and creates the same UUID v4 shape
with `Crypto.getRandomValues()` on plain LAN HTTP. Clipboard actions detect secure-context APIs
at runtime and fall back to manual paste or selection-based copy when those APIs are unavailable.

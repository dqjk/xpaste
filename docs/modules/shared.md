# Shared Module

[简体中文](./shared.zh-CN.md)

## Goal

The shared module defines the protocol contract between client and server.

## Responsibilities

- Device models
- Data summary models
- SSE event payloads
- Shared request payloads

## Rules

- Keep the module platform-neutral.
- Do not add Express, DOM, or Node filesystem logic here.
- Prefer plain types and small constants.

## Current Scope

- `types/device.ts`
- `types/data.ts`
- `types/sse.ts`

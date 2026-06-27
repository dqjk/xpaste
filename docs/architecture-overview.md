# Architecture Overview

[简体中文](./architecture-overview.zh-CN.md)

## System Shape

`xpaste` is a centralized browser/server application:

- One server process runs on a single host.
- Other devices open the web page from a browser.
- The server keeps device presence in memory.
- The server pushes state updates to clients with SSE.
- Clients publish text, images, and files through HTTP.

## Runtime Flow

1. The browser loads `index.html`.
2. The client ensures a persistent `deviceId` cookie exists.
3. The client opens `GET /events`.
4. The server registers the connection and immediately sends `device-list`.
5. Clients publish text through JSON `POST /data`.
6. Clients publish files and images through multipart `POST /data`.
7. The server broadcasts `data-created`, `device-connected`, and `device-offline`.

## Storage Model

- Online devices: in memory
- SSE connections: in memory
- Recent per-device data: in memory
- Binary payloads: operating system temporary directory

The server keeps only the latest `N` items per device and removes device state when the last active session disconnects.

## Layering Rules

- `shared`: protocol and type contracts shared by client and server
- `server`: HTTP, SSE, presence, data lifecycle, temporary file handling
- `client`: browser state, rendering, upload actions, event handling

Business logic and view logic stay separate. Server routes do not own business state, and the client renderer does not own data fetching logic.

# xpaste

`xpaste` is a lightweight browser-based local sharing service. One machine runs the Node.js server, and other devices on the same network open the web page to exchange text, images, and files.

The project uses:

- Node.js + Express on the server
- TypeScript on both client and server
- TypeScript Project References for `shared`, `server`, and `client`
- Server-Sent Events for online presence and live updates
- In-memory runtime state with temporary binary storage in the operating system temp directory

See [`docs/architecture-overview.md`](./docs/architecture-overview.md) for the system design and [`docs/modules/`](./docs/modules/) for per-module notes.

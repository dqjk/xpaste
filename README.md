# xpaste

[简体中文](./README.zh-CN.md)

`xpaste` is a lightweight browser-based service for sharing text, images, videos, and files
between devices on the same local network. One computer runs the foreground Node.js server;
phones, tablets, and other computers use a browser and require no installation.

## Requirements

- Node.js 20 or newer
- Devices that can reach the host computer over the local network

## Install And Run

```sh
npm install --global xpaste
xpaste
```

The command prints a local URL and every detected LAN URL. Open a `Network` URL on another
device. Keep the terminal open while sharing and press `Ctrl+C` when finished.

Use a different port when needed:

```sh
xpaste --port 8080
```

```text
Usage: xpaste [options]

Options:
  -p, --port <port>  Port to listen on (default: 3000)
  -h, --help         Show usage
  -v, --version      Show version
```

## Features

- Paste-first text and clipboard sharing
- Image, video, and file upload
- Drag-and-drop upload on desktop
- Live device and DataItem updates over Server-Sent Events
- Responsive layouts for desktop, tablet, and mobile
- Automatic English and Simplified Chinese interface selection
- Light and dark color schemes following system preference
- No database and no daemon process

## Runtime And Security

Device presence and recent metadata live only in process memory. Binary payloads use the
operating system temporary directory and are removed during the normal DataItem/device lifecycle.
Stopping `xpaste` immediately makes all runtime data unavailable.

There is no authentication in the current release. Every device that can access the listening
port can view and publish shared content. Run xpaste only on a trusted network and review local
firewall prompts before allowing access.

Automatic Clipboard API reads may be unavailable when another device opens xpaste over plain
LAN HTTP because browsers restrict powerful APIs to secure contexts. Manual paste, file selection,
album selection, and drag-and-drop remain available as fallbacks.

## Development

```sh
npm install
npm run build
npm test
npm start
```

The project uses TypeScript project references for `shared`, `server`, and `client`, native ESM,
Express, and a framework-free browser client.

See [Architecture Overview](./docs/architecture-overview.md) and [module documentation](./docs/modules/).

## License

[MIT](./LICENSE)

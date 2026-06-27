# Server Architecture

The server is an Express application with three main responsibilities:

- receive browser presence through SSE
- manage per-device shared data in memory
- expose current data resources over HTTP

Routes stay thin. Services own runtime state. Utilities stay stateless.

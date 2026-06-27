# Client Architecture

The client is a TypeScript browser application built on native ESM.

The module split is intentional:

- `api`: network requests
- `app`: startup and browser integration
- `state`: page state transitions
- `ui`: DOM rendering

UI rendering must stay separate from event transport and state mutation.

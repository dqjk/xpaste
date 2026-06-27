# Package Distribution

## Responsibility

The npm package is the installation boundary for xpaste. It contains the compiled server,
compiled browser modules, and static web assets required at runtime. Development sources,
design references, TypeScript build metadata, and local tooling are not published.

## Published Files

The `files` allowlist in `package.json` publishes these runtime directories:

- `dist`: compiled server, client, and shared JavaScript modules
- `static`: the HTML shell, stylesheet, and browser assets

npm also includes `package.json`, `README.md`, and `LICENSE` automatically.

## Build Lifecycle

`npm pack` and `npm publish` invoke `prepack`. The lifecycle asks TypeScript to clean the
project-reference outputs and build metadata, removes the output directory, and then runs a
complete build. Clearing both outputs and incremental metadata prevents TypeScript from
mistaking a missing `dist` directory for an up-to-date build. The clean command uses portable
TypeScript and Node.js commands instead of shell-specific operations, so the lifecycle behaves
consistently on Windows, macOS, and Linux.

## Runtime Contract

The package requires Node.js 20 or newer and uses native ESM. A global installation maps the
`xpaste` command directly to `dist/server/app.js`. The same file contains the small foreground
CLI and the Express composition root, avoiding a CLI framework or a daemon process.

## Release Metadata

The package uses the MIT license and public npm access. Its canonical source repository,
issue tracker, and project homepage are hosted at `https://github.com/dqjk/xpaste`.

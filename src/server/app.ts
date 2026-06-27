#!/usr/bin/env node

import express from "express";
import { readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerDataRoutes } from "./routes/data.js";
import { registerEventRoutes } from "./routes/events.js";
import { registerStaticRoutes } from "./routes/static.js";
import { DataService } from "./services/data-service.js";
import { DeviceService } from "./services/device-service.js";
import { SseService } from "./services/sse-service.js";
import { isTransportPayloadTooLargeError, sendPayloadTooLarge } from "./utils/errors.js";

const DEFAULT_PORT = 3000;
const LISTEN_HOST = "0.0.0.0";
const PACKAGE_ROOT = fileURLToPath(new URL("../..", import.meta.url));

type RunCommand = {
  type: "run";
  port: number;
};

type CliCommand = RunCommand | { type: "help" } | { type: "version" };

class CliUsageError extends Error {}

/**
 * Parses the intentionally small xpaste command surface.
 *
 * A command-line port overrides the `PORT` environment variable. No positional arguments
 * or daemon controls are accepted because the server is designed to run in the foreground.
 */
function parseCommand(arguments_: readonly string[], environmentPort: string | undefined): CliCommand {
  if (arguments_.length === 0) {
    return { type: "run", port: parsePort(environmentPort ?? String(DEFAULT_PORT), "PORT") };
  }

  if (arguments_.length === 1) {
    const [argument] = arguments_;
    if (argument === "--help" || argument === "-h") {
      return { type: "help" };
    }

    if (argument === "--version" || argument === "-v") {
      return { type: "version" };
    }
  }

  if (arguments_.length === 2 && (arguments_[0] === "--port" || arguments_[0] === "-p")) {
    return { type: "run", port: parsePort(arguments_[1] ?? "", "--port") };
  }

  throw new CliUsageError(`unknown or incomplete arguments: ${arguments_.join(" ")}`);
}

/**
 * Converts a user-provided port into a valid TCP port and reports configuration errors early.
 */
function parsePort(value: string, source: string): number {
  if (!/^\d+$/.test(value)) {
    throw new CliUsageError(`${source} must be an integer between 1 and 65535`);
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new CliUsageError(`${source} must be an integer between 1 and 65535`);
  }

  return port;
}

/**
 * Creates the process-owned Express application and its in-memory service graph.
 */
function createApplication(): express.Express {
  const application = express();
  const deviceService = new DeviceService();
  const dataService = new DataService();
  const sseService = new SseService();

  registerStaticRoutes(application, PACKAGE_ROOT);
  registerEventRoutes({
    app: application,
    deviceService,
    dataService,
    sseService
  });
  registerDataRoutes({
    app: application,
    deviceService,
    dataService,
    sseService
  });

  /**
   * Final error boundary for uncaught route failures.
   * Expected protocol errors should already be handled before reaching this point.
   */
  application.use(
    (error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
      if (isTransportPayloadTooLargeError(error)) {
        sendPayloadTooLarge(response, "payload exceeds allowed limit");
        return;
      }

      console.error(error);
      response.status(500).json({ error: "internal server error" });
    }
  );

  return application;
}

/**
 * Returns the local IPv4 URLs that another device on the network can open.
 */
function getNetworkUrls(port: number): string[] {
  const addresses = new Set<string>();
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.add(entry.address);
      }
    }
  }

  return Array.from(addresses, (address) => `http://${address}:${port}`).sort();
}

/**
 * Reads the package version without importing JSON as an executable module.
 */
function readPackageVersion(): string {
  const document: unknown = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")) as unknown;
  if (typeof document !== "object" || document === null || !("version" in document)) {
    throw new Error("package.json does not contain a version");
  }

  const version = document.version;
  if (typeof version !== "string") {
    throw new Error("package.json version must be a string");
  }

  return version;
}

/**
 * Prints the compact command reference used by both `--help` and argument errors.
 */
function printUsage(): void {
  console.log(`Usage: xpaste [options]

Options:
  -p, --port <port>  Port to listen on (default: ${DEFAULT_PORT})
  -h, --help         Show usage
  -v, --version      Show version`);
}

/**
 * Starts xpaste in the foreground or handles a metadata-only CLI command.
 */
function main(): void {
  let command: CliCommand;
  try {
    command = parseCommand(process.argv.slice(2), process.env.PORT);
  } catch (error) {
    if (!(error instanceof CliUsageError)) {
      throw error;
    }

    console.error(`xpaste: ${error.message}\n`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command.type === "help") {
    printUsage();
    return;
  }

  if (command.type === "version") {
    console.log(readPackageVersion());
    return;
  }

  const server = createApplication().listen(command.port, LISTEN_HOST);
  server.once("listening", () => {
    console.log(`xpaste is ready\n\nLocal:   http://localhost:${command.port}`);
    for (const url of getNetworkUrls(command.port)) {
      console.log(`Network: ${url}`);
    }
    console.log("\nPress Ctrl+C to stop.");
  });

  server.once("error", (error: Error & { code?: string }) => {
    const message = error.code === "EADDRINUSE" ? `port ${command.port} is already in use` : error.message;
    console.error(`xpaste: ${message}`);
    process.exitCode = 1;
  });
}

main();

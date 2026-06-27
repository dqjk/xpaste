import type { Express } from "express";
import express from "express";
import { join } from "node:path";

/**
 * Serves compiled client code, shared runtime modules, and static assets from one origin.
 */
export function registerStaticRoutes(app: Express, packageRoot: string): void {
  app.use("/client", express.static(join(packageRoot, "dist", "client")));
  app.use("/shared", express.static(join(packageRoot, "dist", "shared")));
  app.use("/", express.static(join(packageRoot, "static")));
}

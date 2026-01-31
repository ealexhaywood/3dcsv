#!/usr/bin/env node
/**
 * 3dcsv CLI — visualize subcommand runs a local server and React UI.
 */

import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "./index.js";

const DEFAULT_PORT = 3847;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STATIC_DIR = path.join(__dirname, "visualize");

function safePath(cwd: string, file: string): string | null {
  const requested = path.resolve(cwd, file);
  const cwdAbs = path.resolve(cwd);
  const normalized = path.normalize(requested);
  const cwdNorm = path.normalize(cwdAbs);
  if (normalized !== cwdNorm && !normalized.startsWith(cwdNorm + path.sep)) return null;
  return requested;
}

function serveStatic(
  res: http.ServerResponse,
  filePath: string,
  contentType: string
): boolean {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

export function createHandler(
  cwd: string,
  staticDir: string = DEFAULT_STATIC_DIR
): (req: http.IncomingMessage, res: http.ServerResponse) => void {
  return (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = req.url ?? "/";
    const [pathname, search] = url.split("?");
    const params = new URLSearchParams(search ?? "");

    if (pathname === "/api/data") {
      const file = params.get("file");
      if (!file) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "missing file param" }));
        return;
      }
      const safe = safePath(cwd, file);
      if (!safe) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid path" }));
        return;
      }
      try {
        const raw = fs.readFileSync(safe, "utf-8");
        const result = parse(raw);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ headers: result.headers, rows: result.toObjects() }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
      return;
    }

    const safePathname = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.join(staticDir, safePathname.replace(/^\//, ""));
    const ext = path.extname(filePath);
    const contentType = MIME[ext] ?? "application/octet-stream";

    if (serveStatic(res, filePath, contentType)) return;

    const indexPath = path.join(staticDir, "index.html");
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(fs.readFileSync(indexPath));
      return;
    }

    res.writeHead(404).end();
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const fileArg = args[1] ?? null;

  if (cmd !== "visualize") {
    console.log("Usage: 3dcsv visualize [file.csv]");
    process.exit(1);
  }

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const server = http.createServer(createHandler(process.cwd()));

  server.listen(port, () => {
    const url = fileArg
      ? `http://localhost:${port}/?file=${encodeURIComponent(fileArg)}`
      : `http://localhost:${port}/`;
    console.log("3D CSV visualize:");
    console.log(url);
  });
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}

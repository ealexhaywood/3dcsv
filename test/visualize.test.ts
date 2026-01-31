import { describe, expect, test } from "bun:test";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { createHandler } from "../src/cli.js";

const staticDir = path.join(process.cwd(), "dist", "visualize");

describe("visualize", () => {
  test("GET / returns HTML with title 3D CSV", async () => {
    if (!fs.existsSync(staticDir)) return;
    const cwd = process.cwd();
    const server = http.createServer(createHandler(cwd, staticDir));
    const port = await new Promise<number>((resolve, reject) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") resolve(addr.port);
        else reject(new Error("no port"));
      });
    });
    try {
      const res = await fetch(`http://localhost:${port}/`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
      const html = await res.text();
      expect(html).toContain("3D CSV");
    } finally {
      server.close();
    }
  });

  test("GET /api/data?file=... returns 400 when file param missing", async () => {
    const cwd = process.cwd();
    const server = http.createServer(createHandler(cwd));
    const port = await new Promise<number>((resolve, reject) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") resolve(addr.port);
        else reject(new Error("no port"));
      });
    });
    try {
      const res = await fetch(`http://localhost:${port}/api/data`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("file");
    } finally {
      server.close();
    }
  });

  test("GET /api/data?file=.. returns 403 for path traversal", async () => {
    const cwd = process.cwd();
    const server = http.createServer(createHandler(cwd));
    const port = await new Promise<number>((resolve, reject) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") resolve(addr.port);
        else reject(new Error("no port"));
      });
    });
    try {
      const res = await fetch(`http://localhost:${port}/api/data?file=../package.json`);
      expect(res.status).toBe(403);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("path");
    } finally {
      server.close();
    }
  });

  test("GET /api/data?file=fixture.csv returns parsed JSON when file exists", async () => {
    const tmpDir = path.join(process.cwd(), "test", "fixtures");
    fs.mkdirSync(tmpDir, { recursive: true });
    const fixturePath = path.join(tmpDir, "visualize-fixture.csv");
    const csv = `name,tags
Alice,"a|b"
Bob,x`;
    fs.writeFileSync(fixturePath, csv, "utf-8");
    const server = http.createServer(createHandler(tmpDir));
    const port = await new Promise<number>((resolve, reject) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") resolve(addr.port);
        else reject(new Error("no port"));
      });
    });
    try {
      const res = await fetch(
        `http://localhost:${port}/api/data?file=${encodeURIComponent("visualize-fixture.csv")}`
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as { headers: string[]; rows: unknown[] };
      expect(data.headers).toEqual(["name", "tags"]);
      expect(data.rows).toHaveLength(2);
      expect(data.rows[0]).toEqual({ name: "Alice", tags: ["a", "b"] });
      expect(data.rows[1]).toEqual({ name: "Bob", tags: "x" });
    } finally {
      server.close();
      try {
        fs.unlinkSync(fixturePath);
      } catch (_) {}
    }
  });

  test("GET /api/data?file=nonexistent.csv returns 500", async () => {
    const cwd = process.cwd();
    const server = http.createServer(createHandler(cwd));
    const port = await new Promise<number>((resolve, reject) => {
      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") resolve(addr.port);
        else reject(new Error("no port"));
      });
    });
    try {
      const res = await fetch(`http://localhost:${port}/api/data?file=nonexistent.csv`);
      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBeDefined();
    } finally {
      server.close();
    }
  });
});

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { createApi } from "./api.js";
import { handleWorld, setupWorld } from "./world.js";

const dist = resolve("dist");
if (!existsSync(resolve(dist, "index.html"))) {
  console.error("Run npm run build before starting the server.");
  process.exit(1);
}

const { handler, close } = createApi({
  secureCookies: process.env.SECURE_COOKIES === "true",
  extra: handleWorld,
  setup: setupWorld,
});
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
};

const server = createServer((req, res) => {
  if (req.url === "/api" || req.url?.startsWith("/api/"))
    return void handler(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = resolve(
    dist,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  const contentType = types[extname(file)];
  if (
    !file.startsWith(dist + sep) ||
    !contentType ||
    !statSync(file, { throwIfNoEntry: false })?.isFile()
  ) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "default-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  });
  if (req.method === "HEAD") res.end();
  else
    createReadStream(file)
      .on("error", () => res.destroy())
      .pipe(res);
});
server.on("close", close);
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
server.listen(port, host, () =>
  console.log(`Rootspiree running at http://${host}:${server.address().port}`),
);

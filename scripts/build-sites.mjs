import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { optimizeContentImages } from "./optimize-content-images.mjs";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = join(root, "dist");
const staticDir = join(dist, "static");
const serverDir = join(dist, "server");
const hostingDir = join(dist, ".openai");

const contentTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8"
};

const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt", ".xml"]);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return files.flat();
}

await rm(dist, { force: true, recursive: true });
await build({
  root,
  build: {
    outDir: staticDir,
    emptyOutDir: true
  }
});
await optimizeContentImages(staticDir);

const routes = {};
for (const file of await listFiles(staticDir)) {
  const relativePath = relative(staticDir, file).split(sep).join("/");
  const extension = extname(file).toLowerCase();
  const body = await readFile(file);
  const route = `/${relativePath}`;
  routes[route] = {
    body: textExtensions.has(extension) ? body.toString("utf8") : body.toString("base64"),
    encoding: textExtensions.has(extension) ? "text" : "base64",
    type: contentTypes[extension] ?? "application/octet-stream"
  };
}
routes["/"] = routes["/index.html"];

const server = `const routes = ${JSON.stringify(routes)};

function bytesFromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\\/$/, "") || "/";
    const route = routes[path] ?? (request.method === "GET" ? routes["/"] : undefined);
    if (!route) {
      return new Response("Nicht gefunden", {
        status: 404,
        headers: { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const isHtml = route.type.startsWith("text/html");
    const isHashedAsset = /^\\/assets\\/[^/]+-[A-Za-z0-9_-]+\\./.test(path);
    return new Response(route.encoding === "base64" ? bytesFromBase64(route.body) : route.body, {
      headers: {
        ...securityHeaders,
        "Content-Type": route.type,
        "Cache-Control": isHtml ? "no-cache" : isHashedAsset ? "public, max-age=31536000, immutable" : "public, max-age=3600"
      }
    });
  }
};
`;

await mkdir(serverDir, { recursive: true });
await mkdir(hostingDir, { recursive: true });
await writeFile(join(serverDir, "index.js"), server);
await writeFile(join(hostingDir, "hosting.json"), await readFile(join(root, ".openai/hosting.json"), "utf8"));

console.log("Sites artifact written to dist/");

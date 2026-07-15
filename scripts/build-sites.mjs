import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = join(root, "dist");
const serverDir = join(dist, "server");
const hostingDir = join(dist, ".openai");

const [html, css, js, logo, hosting] = await Promise.all([
  readFile(join(root, "index.html"), "utf8"),
  readFile(join(root, "src/styles.css"), "utf8"),
  readFile(join(root, "src/main.js"), "utf8"),
  readFile(join(root, "public/assets/hno-logo.png")),
  readFile(join(root, ".openai/hosting.json"), "utf8")
]);

const routes = {
  "/": {
    body: html,
    type: "text/html; charset=utf-8"
  },
  "/index.html": {
    body: html,
    type: "text/html; charset=utf-8"
  },
  "/src/styles.css": {
    body: css,
    type: "text/css; charset=utf-8"
  },
  "/src/main.js": {
    body: js,
    type: "text/javascript; charset=utf-8"
  }
};

const server = `const textRoutes = ${JSON.stringify(routes, null, 2)};
const logoBase64 = "${logo.toString("base64")}";

function bytesFromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\\/$/, "") || "/";

    if (path === "/assets/hno-logo.png") {
      return new Response(bytesFromBase64(logoBase64), {
        headers: {
          ...headers,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    }

    const route = textRoutes[path] ?? (request.method === "GET" ? textRoutes["/"] : undefined);
    if (!route) {
      return new Response("Nicht gefunden", {
        status: 404,
        headers: {
          ...headers,
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    return new Response(route.body, {
      headers: {
        ...headers,
        "Content-Type": route.type,
        "Cache-Control": path === "/" || path === "/index.html" ? "no-cache" : "public, max-age=3600"
      }
    });
  }
};
`;

await rm(dist, { force: true, recursive: true });
await mkdir(serverDir, { recursive: true });
await mkdir(hostingDir, { recursive: true });
await writeFile(join(serverDir, "index.js"), server);
await writeFile(join(hostingDir, "hosting.json"), hosting);

console.log("Sites artifact written to dist/");

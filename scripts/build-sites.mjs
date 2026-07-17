import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = join(root, "dist");
const serverDir = join(dist, "server");
const hostingDir = join(dist, ".openai");

const binaryAssets = [
  {
    cacheControl: "public, max-age=31536000, immutable",
    file: "hno-logo.png",
    path: "/assets/hno-logo.png",
    type: "image/png"
  },
  {
    cacheControl: "public, max-age=31536000, immutable",
    file: "praxis-treatment-room.jpg",
    path: "/assets/praxis-treatment-room.jpg",
    type: "image/jpeg"
  },
  {
    cacheControl: "public, max-age=31536000, immutable",
    file: "praxis-ear-exam.jpg",
    path: "/assets/praxis-ear-exam.jpg",
    type: "image/jpeg"
  },
  {
    cacheControl: "public, max-age=31536000, immutable",
    file: "praxis-child-exam.jpg",
    path: "/assets/praxis-child-exam.jpg",
    type: "image/jpeg"
  },
  {
    cacheControl: "public, max-age=31536000, immutable",
    file: "praxis-otoscope.jpg",
    path: "/assets/praxis-otoscope.jpg",
    type: "image/jpeg"
  }
];

const [html, css, js, binaryEntries, hosting] = await Promise.all([
  readFile(join(root, "index.html"), "utf8"),
  readFile(join(root, "src/styles.css"), "utf8"),
  readFile(join(root, "src/main.js"), "utf8"),
  Promise.all(
    binaryAssets.map(async (asset) => [
      asset.path,
      {
        body: (await readFile(join(root, "public/assets", asset.file))).toString("base64"),
        cacheControl: asset.cacheControl,
        type: asset.type
      }
    ])
  ),
  readFile(join(root, ".openai/hosting.json"), "utf8")
]);
const binaryRoutes = Object.fromEntries(binaryEntries);

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
const binaryRoutes = ${JSON.stringify(binaryRoutes, null, 2)};

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

    const binaryRoute = binaryRoutes[path];
    if (binaryRoute) {
      return new Response(bytesFromBase64(binaryRoute.body), {
        headers: {
          ...headers,
          "Content-Type": binaryRoute.type,
          "Cache-Control": binaryRoute.cacheControl
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

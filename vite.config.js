import { defineConfig } from "vite";
import { contentFile, loadSiteContent, renderSiteHtml } from "./scripts/site-content.mjs";

function cmsContentPlugin() {
  return {
    name: "hno-cms-content",
    configureServer(server) {
      server.watcher.add(contentFile);
    },
    handleHotUpdate(context) {
      if (context.file === contentFile) {
        context.server.ws.send({ type: "full-reload", path: "/" });
        return [];
      }
    },
    async transformIndexHtml(html) {
      return renderSiteHtml(html, await loadSiteContent());
    }
  };
}

export default defineConfig({
  plugins: [cmsContentPlugin()]
});

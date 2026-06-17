/**
 * Vite config for Tabocalypse host: run Projocalypse UI + serve .projocalypse/ JSON bridge.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { resolveProjocalypseBridgeFile } from "./lib/projocalypse-bridge-serve.mjs";
import { checkPmStale } from "./lib/pm-stale-check.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tabocalypseRoot = path.join(__dirname, "..");
const projRoot = path.join(tabocalypseRoot, "packages/projocalypse");

function projocalypseBridgePlugin() {
  return {
    name: "tabocalypse-projocalypse-bridge",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url === "/.projocalypse/stale-check.json") {
          const result = checkPmStale(tabocalypseRoot);
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(`${JSON.stringify(result)}\n`);
          return;
        }

        const resolved = resolveProjocalypseBridgeFile(tabocalypseRoot, req.url ?? "");
        if (!resolved.ok) {
          if (resolved.status === 404) return next();
          res.statusCode = resolved.status;
          res.end(resolved.status === 403 ? "Forbidden" : "Not found");
          return;
        }
        if (!fs.existsSync(resolved.file) || fs.statSync(resolved.file).isDirectory()) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        fs.createReadStream(resolved.file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: projRoot,
  plugins: [
    react(),
    tailwindcss(),
    projocalypseBridgePlugin(),
    {
      name: "tabocalypse-pm-board-entry",
      transformIndexHtml(html) {
        return html.replace("/src/main.tsx", "/src/tabocalypse-pm-board-main.tsx");
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    open: process.env.TABOCALYPSE_NO_OPEN !== "1" && !process.env.CI,
    fs: {
      allow: [tabocalypseRoot, projRoot],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(projRoot, "./src"),
      "/src/tabocalypse-pm-board-main.tsx": path.resolve(
        tabocalypseRoot,
        "scripts/tabocalypse-pm-board-main.tsx",
      ),
      "@projocalypse/plan": path.resolve(projRoot, "./packages/plan/src/index.ts"),
      "@projocalypse/core": path.resolve(projRoot, "./packages/core/src/index.ts"),
      "@projocalypse/gap": path.resolve(projRoot, "./packages/gap/src/index.ts"),
    },
  },
});

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const jsonBinPlugin = (): Plugin => ({
  name: "jsonbin-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === "/api/wallpapers") {
        const binId = process.env.WALLPAPERS_BIN_ID || "6adf382fffd5d160538c8a63";
        const key = process.env.JSONBIN_MASTER_KEY || "$2a$10$pb5xLem3GhkJMrCrCnbypuFPzhC4FCQqZg6UcD85L9WJgXFKrntsu";

        if (req.method === "GET") {
          try {
            const resp = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
              headers: { "X-Master-Key": key, "X-Bin-Meta": "false" },
            });
            const data = await resp.json();
            const record = data && typeof data === "object" && "record" in data ? (data as { record: unknown }).record : data;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(record));
            return;
          } catch (err: unknown) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: (err as Error).message }));
            return;
          }
        } else if (req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const resp = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "X-Master-Key": key },
                body,
              });
              const result = await resp.json();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (err: unknown) {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: (err as Error).message }));
            }
          });
          return;
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), jsonBinPlugin()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@wallora/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: { port: 5180, host: "0.0.0.0" },
});

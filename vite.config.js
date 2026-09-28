import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

function mimeType(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.json': return 'application/json';
    case '.txt': return 'text/plain';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

function serveResourcepackPlugin() {
  return {
    name: "serve-resourcepack",
    configureServer(server) {
      server.middlewares.use("/resourcepack", (req, res, next) => {
        const filePath = path.join(__dirname, "resourcepack", req.url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader("Content-Type", mimeType(path.extname(filePath)));
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
    closeBundle() {
      const srcDir = path.join(__dirname, "resourcepack");
      const distDir = path.join(__dirname, "dist", "resourcepack");
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, distDir, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveResourcepackPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});

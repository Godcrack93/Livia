import basicSsl from "@vitejs/plugin-basic-ssl";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const https = mode === "https";
  const port = https ? 8443 : 8080;
  return {
    plugins: https ? [basicSsl()] : [],
    server: { host: true, port, strictPort: true },
    preview: { host: true, port },
    build: {
      // Os jogos rodam todos em index.html; bolhas.html e labirinto.html só redirecionam atalhos antigos.
      rollupOptions: {
        input: {
          index: resolve(root, "index.html"),
          bolhas: resolve(root, "bolhas.html"),
          labirinto: resolve(root, "labirinto.html"),
        },
      },
      chunkSizeWarningLimit: 900,
    },
  };
});

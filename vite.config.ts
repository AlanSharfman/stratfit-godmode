import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "127.0.0.1",
    port: 62000,
    strictPort: true,
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**", "**/.vercel/**"],
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/three/") || id.includes("node_modules/@react-three/")) {
            return "vendor-three"
          }
          if (id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router")) {
            return "vendor-react"
          }
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-motion"
          }
        },
      },
    },
  },
});

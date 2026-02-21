import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 62000,
    strictPort: false, // Allow fallback to another port if 62000 is in use
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
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite resolves the "@" alias natively (no extra runtime package needed,
// unlike the backend where we intentionally kept relative imports).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});

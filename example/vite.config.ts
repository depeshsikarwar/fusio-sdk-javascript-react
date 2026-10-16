import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "fusio-sdk-javascript-react": path.resolve(__dirname, "../src"),
      "fusio-sdk-javascript-react/styles.css": path.resolve(__dirname, "../src/components/styles.css"),
    },
  },
  server: {
    port: 3000,
  },
});

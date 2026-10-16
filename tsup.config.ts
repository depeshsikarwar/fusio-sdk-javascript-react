import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  external: ["react", "react-dom"],
  onSuccess: async () => {
    const srcCss = path.resolve(__dirname, "src/components/styles.css");
    const destCss = path.resolve(__dirname, "dist/styles.css");
    if (fs.existsSync(srcCss)) {
      fs.copyFileSync(srcCss, destCss);
      console.log("Copied styles.css to dist/styles.css");
    }
  },
});

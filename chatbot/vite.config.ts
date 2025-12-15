import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    target: "es2019",
    lib: {
      entry: path.resolve(__dirname, "src/entry.ts"),
      name: "ChatWidgetBundle",
      formats: ["iife"],
      fileName: () => "chat-widget.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    minify: "esbuild"
  }
});

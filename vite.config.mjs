import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "src/renderer", // where index.html lives
  publicDir: "public",
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../../dist/renderer", // build into dist/renderer
    emptyOutDir: true,
  },
});

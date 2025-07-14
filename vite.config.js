import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/renderer", // where index.html lives
  publicDir: "public",
  plugins: [react()],
  build: {
    outDir: "../../dist/renderer", // build into dist/renderer
    emptyOutDir: true,
  },
});

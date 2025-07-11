import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import replace from "@rollup/plugin-replace";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(mode !== "production"),
        "process.env.NODE_ENV": JSON.stringify(mode),
      },
    }),
    react(),
    ...(mode === "production"
      ? [
          viteCompression(),
          visualizer({
            filename: "./dist/stats.html",
            open: false, // false agar gak bikin CI fail
          }),
        ]
      : []),
  ],
  server: {
    host: "localhost",
    port: 3001,
    open: true,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 500,
      ignored: ["**/node_modules/**"],
    },
  },
  build: {
    sourcemap: false,
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
  esbuild: {
    sourcemap: true,
    target: "esnext",
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    esbuildOptions: {
      target: "esnext",
    },
  },
}));

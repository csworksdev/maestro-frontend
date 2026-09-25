import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import replace from "@rollup/plugin-replace";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    mode === "development"
      ? env.VITE_DEV_API_URL || env.VITE_API_URL
      : env.VITE_API_URL;
  const storageProxyTarget =
    env.VITE_STORAGE_API_URL || "https://woven-affecting-accuracy.ngrok-free.dev";

  return {
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
      host: "127.0.0.1",
      port: 3001,
      open: false,
      strictPort: true,
      proxy: {
        "/__api": {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__api/, ""),
        },
        "/__storage_api": {
          target: storageProxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__storage_api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyRequest) => {
              proxyRequest.setHeader("ngrok-skip-browser-warning", "true");
            });
          },
        },
        "/__trainer_documents_api": {
          target: "https://woven-affecting-accuracy.ngrok-free.dev",
          changeOrigin: true,
          secure: true,
          rewrite: (proxyPath) =>
            proxyPath.replace(/^\/__trainer_documents_api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyRequest) => {
              proxyRequest.setHeader("ngrok-skip-browser-warning", "true");
            });
          },
        },
      },
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
  };
});

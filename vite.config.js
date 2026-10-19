import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import replace from "@rollup/plugin-replace";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode = "production" }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_URL;
  const storageProxyTarget = env.VITE_API_URL;
  const careerExportProxyTarget = env.VITE_API_URL;

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
        "/__access-api": {
          target: env.VITE_ACCESS_API_URL || apiProxyTarget,
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/__access-api/, ""),
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
        "/__career_export_api": {
          target: careerExportProxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (proxyPath) =>
            proxyPath.replace(/^\/__career_export_api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyRequest) => {
              proxyRequest.setHeader("ngrok-skip-browser-warning", "true");
            });
          },
        },
        "/__trainer_document_files": {
          target: "https://media.maestroswim.com",
          changeOrigin: true,
          secure: true,
          rewrite: (proxyPath) =>
            proxyPath.replace(/^\/__trainer_document_files/, ""),
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

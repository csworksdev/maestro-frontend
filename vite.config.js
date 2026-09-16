import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import replace from "@rollup/plugin-replace";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDevelopment = mode !== "production";
  const apiTarget = isDevelopment
    ? env.VITE_DEV_API_URL || env.VITE_API_URL
    : env.VITE_API_URL;
  const accessApiTarget = isDevelopment
    ? env.VITE_DEV_ACCESS_API_URL || apiTarget
    : env.VITE_ACCESS_API_URL || apiTarget;
  const backendProxy = apiTarget
    ? {
        target: apiTarget,
        changeOrigin: true,
        secure: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    : undefined;
  const accessBackendProxy = accessApiTarget
    ? {
        target: accessApiTarget,
        changeOrigin: true,
        secure: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    : undefined;

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
      host: true,
      port: 3001,
      open: false,
      strictPort: true,
      proxy: backendProxy
        ? {
            "/__api": {
              ...backendProxy,
              rewrite: (requestPath) => requestPath.replace(/^\/__api/, ""),
            },
            ...(accessBackendProxy
              ? {
                  "/__access-api": {
                    ...accessBackendProxy,
                    rewrite: (requestPath) =>
                      requestPath.replace(/^\/__access-api/, ""),
                  },
                }
              : {}),
            "/api": backendProxy,
            "/auth": backendProxy,
            "/hydro": backendProxy,
            "/opx": backendProxy,
            "/report": backendProxy,
            "/wati": backendProxy,
            "/xendit": backendProxy,
            "/orderdetail": backendProxy,
          }
        : undefined,
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

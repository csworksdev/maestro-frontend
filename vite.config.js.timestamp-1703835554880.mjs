// vite.config.js
import { defineConfig } from "file:///C:/Users/user/Documents/frontend/dashcode/node_modules/vite/dist/node/index.js";
import reactRefresh from "file:///C:/Users/user/Documents/frontend/dashcode/node_modules/@vitejs/plugin-react-refresh/index.js";
import react from "file:///C:/Users/user/Documents/frontend/dashcode/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import rollupReplace from "file:///C:/Users/user/Documents/frontend/dashcode/node_modules/@rollup/plugin-replace/dist/es/index.js";
var __vite_injected_original_dirname = "C:\\Users\\user\\Documents\\frontend\\dashcode";
var vite_config_default = defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__vite_injected_original_dirname, "./src")
      }
    ]
  },
  plugins: [
    rollupReplace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(true),
        "process.env.NODE_ENV": JSON.stringify("development")
      }
    }),
    react(),
    reactRefresh()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxmcm9udGVuZFxcXFxkYXNoY29kZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdXNlclxcXFxEb2N1bWVudHNcXFxcZnJvbnRlbmRcXFxcZGFzaGNvZGVcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3VzZXIvRG9jdW1lbnRzL2Zyb250ZW5kL2Rhc2hjb2RlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0UmVmcmVzaCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3QtcmVmcmVzaFwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCByb2xsdXBSZXBsYWNlIGZyb20gXCJAcm9sbHVwL3BsdWdpbi1yZXBsYWNlXCI7XHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IFtcclxuICAgICAge1xyXG4gICAgICAgIC8vIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICAgIGZpbmQ6IFwiQFwiLFxyXG4gICAgICAgIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9LFxyXG5cclxuICBwbHVnaW5zOiBbXHJcbiAgICByb2xsdXBSZXBsYWNlKHtcclxuICAgICAgcHJldmVudEFzc2lnbm1lbnQ6IHRydWUsXHJcbiAgICAgIHZhbHVlczoge1xyXG4gICAgICAgIF9fREVWX186IEpTT04uc3RyaW5naWZ5KHRydWUpLFxyXG4gICAgICAgIFwicHJvY2Vzcy5lbnYuTk9ERV9FTlZcIjogSlNPTi5zdHJpbmdpZnkoXCJkZXZlbG9wbWVudFwiKSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgcmVhY3QoKSxcclxuICAgIHJlYWN0UmVmcmVzaCgpLFxyXG4gIF0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlULFNBQVMsb0JBQW9CO0FBQ3RWLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxtQkFBbUI7QUFKMUIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0w7QUFBQSxRQUVFLE1BQU07QUFBQSxRQUNOLGFBQWEsS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUM5QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxjQUFjO0FBQUEsTUFDWixtQkFBbUI7QUFBQSxNQUNuQixRQUFRO0FBQUEsUUFDTixTQUFTLEtBQUssVUFBVSxJQUFJO0FBQUEsUUFDNUIsd0JBQXdCLEtBQUssVUFBVSxhQUFhO0FBQUEsTUFDdEQ7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

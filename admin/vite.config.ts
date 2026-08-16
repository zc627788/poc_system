import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-quill") || id.includes("/quill/")) return "editor-vendor";
          if (id.includes("antd") || id.includes("@ant-design") || id.includes("/rc-")) return "antd-vendor";
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
          return "vendor";
        }
      }
    }
  },
  server: {
    port: 5174,
    host: "0.0.0.0"
  }
}));

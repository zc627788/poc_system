import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/admin/" : "/",
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0"
  }
}));

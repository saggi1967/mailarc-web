import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-Server auf 5173 (muss in WEB_ORIGINS des mailarc-servers stehen).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});

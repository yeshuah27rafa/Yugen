// vite.config.js
// Vite sirve la app en el puerto 5173, el mismo que permite el CORS del backend.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});

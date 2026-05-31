import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const ORCHESTRATOR = 'http://localhost:8787';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: ORCHESTRATOR, changeOrigin: true },
      '/ws': { target: ORCHESTRATOR, changeOrigin: true, ws: true },
    },
  },
});

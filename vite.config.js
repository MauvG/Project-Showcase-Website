import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: './',
  server: {
    /* host = true allows forwarding an IP from the main namespace to another in docker container
      https://stackoverflow.com/questions/70012970/running-a-vite-dev-server-inside-a-docker-container
    */
    host: true,
    port: 4621,
    open: false,
    cors: true,
  },
});

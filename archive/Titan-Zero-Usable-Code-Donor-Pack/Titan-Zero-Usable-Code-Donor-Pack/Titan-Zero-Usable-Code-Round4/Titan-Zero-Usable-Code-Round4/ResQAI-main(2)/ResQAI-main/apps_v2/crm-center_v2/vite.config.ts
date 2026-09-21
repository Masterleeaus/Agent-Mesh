import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5185 },
  test: { globals: true, environment: 'jsdom' }
});

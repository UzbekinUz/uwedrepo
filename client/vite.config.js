import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API porti server/.env dagi PORT dan olinadi (standart 5000), shunda ikki fayl ixtilof qilmaydi
function apiPort() {
  if (process.env.API_PORT) return process.env.API_PORT;
  try {
    const m = fs.readFileSync(new URL('../server/.env', import.meta.url), 'utf8').match(/^PORT=(\d+)/m);
    if (m) return m[1];
  } catch { /* .env yo'q */ }
  return '5000';
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': `http://localhost:${apiPort()}` } },
});

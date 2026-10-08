import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves this repo under /Hikone/.
  // Vercel serves the app from the domain root, including /api/hikone-ai.
  base: process.env.VERCEL ? '/' : '/Hikone/',
  plugins: [react()],
});

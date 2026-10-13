import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves this repo under /Hikone/.
  // Vercel builds only the backend; the public React app remains on Pages.
  base: '/Hikone/',
  plugins: [react()],
});

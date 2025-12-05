import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is crucial for Capacitor: it ensures assets are loaded 
  // relatively (./) instead of from root (/)
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});

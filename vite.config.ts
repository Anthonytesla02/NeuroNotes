import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // This is crucial for Capacitor & Vercel: it ensures assets are loaded 
    // relatively (./) instead of from root (/)
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // Expose the API Key to the client
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
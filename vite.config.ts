import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Changed to '/' for standard Vercel web deployment
    base: '/', 
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // JSON.stringify handles the value securely. 
      // The || "" ensures it doesn't crash if the key is missing during build time.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "") 
    }
  };
});
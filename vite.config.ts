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
      // Check API_KEY first, then VITE_GEMINI_API_KEY, then default to empty string
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || "") 
    }
  };
});
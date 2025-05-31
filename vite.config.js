// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Output directory
    rollupOptions: {
      input: {
        // Main entry point for the popup HTML
        popup: resolve(__dirname, 'popup.html'), // Assuming popup.html is in the root
        
        // Explicitly define your JavaScript entry points for background and content scripts
        // These will be bundled into files named 'background.js' and 'content.js' in 'outDir'
        background: resolve(__dirname, 'src/background/main.js'),
        content: resolve(__dirname, 'src/content/main.js'),
      },
      output: {
        // Custom naming for entry files to match manifest.json expectations
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js'; // Output as dist/background.js
          }
          if (chunkInfo.name === 'content') {
            return 'content.js'; // Output as dist/content.js
          }
          // For other entry chunks (like the JS bundled for popup.html), use a hashed name in assets
          return 'assets/[name]-[hash].js';
        },
        // Naming for chunks (code-split modules)
        chunkFileNames: 'assets/[name]-[hash].js',
        // Naming for static assets (images, fonts, etc.)
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
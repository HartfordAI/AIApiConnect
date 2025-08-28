import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// GitHub Pages deployment config
export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../docs', // GitHub Pages serves from /docs folder
    emptyOutDir: true,
  },
  base: './', // Use relative paths for GitHub Pages
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    // Remove server dependencies for frontend-only build
    'process.env': {}
  }
})
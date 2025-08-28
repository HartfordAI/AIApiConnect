import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// Frontend-only build config for GitHub Pages
export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  base: './', // Use relative paths for GitHub Pages
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
})
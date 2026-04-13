//Lê Nhựt Hào
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React và routing libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          
          // UI libraries (icons, toast, etc.)
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/react-toastify')) {
            return 'ui-vendor';
          }
          
          // Utility libraries (lodash, etc.)
          if (id.includes('node_modules/lodash')) {
            return 'utils-vendor';
          }
          
          // Admin components
          if (id.includes('/src/pages/admin/') || 
              id.includes('/src/components/admin/')) {
            return 'admin-chunk';
          }
          
          // User components
          if (id.includes('/src/pages/') && 
              !id.includes('/src/pages/admin/')) {
            return 'user-pages';
          }
          
          // Common components
          if (id.includes('/src/components/')) {
            return 'common-components';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // Tất cả /api/* → Monolith API (port 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      // Static uploads (avatars, ...)
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})

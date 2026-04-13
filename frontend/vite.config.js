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
      // Uploads from auth-service (avatars, etc.)
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      // Auth routes → auth-service (port 5001)
      '/api/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      // Product routes → product-service (port 5002)
      '/api/products': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      // Category routes → product-service (port 5002)
      '/api/categories': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      // Review routes → product-service (port 5002)
      '/api/reviews': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      // Cart routes → product-service (port 5002)
      '/api/cart': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      // Stock routes → product-service (port 5002)
      '/api/stock': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      // Warehouse routes → product-service (port 5002)
      '/api/warehouses': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      // Post routes → post-service (port 5003)
      '/api/posts': {
        target: 'http://localhost:5003',
        changeOrigin: true
      },
      // Tag routes → post-service (port 5003)
      '/api/tags': {
        target: 'http://localhost:5003',
        changeOrigin: true
      },
      // Account Management routes → account-management-service (port 5005)
      '/api/admin/account-management': {
        target: 'http://localhost:5005',
        changeOrigin: true
      },
      // Order routes → order-service (port 5006)
      '/api/orders': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      // Payment routes → order-service (port 5006)
      '/api/payments': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      // Other routes → backend (port 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})

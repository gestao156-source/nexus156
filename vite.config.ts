import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separar bibliotecas grandes
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor';
          }
          // Separar utilitários de exportação
          if (id.includes('exportCSV') || id.includes('exportExcel')) {
            return 'exportUtils';
          }
          // Separar componentes de gráficos
          if (id.includes('recharts')) {
            return 'charts';
          }
          // Separar Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
});

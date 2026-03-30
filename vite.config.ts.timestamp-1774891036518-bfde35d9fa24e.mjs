// vite.config.ts
import { defineConfig } from "file:///C:/Users/Anderson/Desktop/nexus156-nova-versao/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Anderson/Desktop/nexus156-nova-versao/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///C:/Users/Anderson/Desktop/nexus156-nova-versao/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///C:/Users/Anderson/Desktop/nexus156-nova-versao/node_modules/autoprefixer/lib/autoprefixer.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
            return "vendor";
          }
          if (id.includes("exportCSV") || id.includes("exportExcel")) {
            return "exportUtils";
          }
          if (id.includes("recharts")) {
            return "charts";
          }
          if (id.includes("@supabase")) {
            return "supabase";
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBbmRlcnNvblxcXFxEZXNrdG9wXFxcXG5leHVzMTU2LW5vdmEtdmVyc2FvXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBbmRlcnNvblxcXFxEZXNrdG9wXFxcXG5leHVzMTU2LW5vdmEtdmVyc2FvXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9BbmRlcnNvbi9EZXNrdG9wL25leHVzMTU2LW5vdmEtdmVyc2FvL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ3RhaWx3aW5kY3NzJztcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgY3NzOiB7XG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW3RhaWx3aW5kY3NzLCBhdXRvcHJlZml4ZXJdLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgLy8gU2VwYXJhciBiaWJsaW90ZWNhcyBncmFuZGVzXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyLWRvbScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFNlcGFyYXIgdXRpbGl0XHUwMEUxcmlvcyBkZSBleHBvcnRhXHUwMEU3XHUwMEUzb1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZXhwb3J0Q1NWJykgfHwgaWQuaW5jbHVkZXMoJ2V4cG9ydEV4Y2VsJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnZXhwb3J0VXRpbHMnO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBTZXBhcmFyIGNvbXBvbmVudGVzIGRlIGdyXHUwMEUxZmljb3NcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlY2hhcnRzJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnY2hhcnRzJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gU2VwYXJhciBTdXBhYmFzZVxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnc3VwYWJhc2UnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDBcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNVLFNBQVMsb0JBQW9CO0FBQ25XLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLGtCQUFrQjtBQUd6QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsS0FBSztBQUFBLElBQ0gsU0FBUztBQUFBLE1BQ1AsU0FBUyxDQUFDLGFBQWEsWUFBWTtBQUFBLElBQ3JDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYyxDQUFDLE9BQU87QUFFcEIsY0FBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGtCQUFrQixHQUFHO0FBQ3ZGLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsYUFBYSxHQUFHO0FBQzFELG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLFVBQVUsR0FBRztBQUMzQixtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDNUIsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

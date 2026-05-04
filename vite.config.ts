import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true
  },

  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false
  },

  resolve: {
    alias: {
      $lib: '/src/lib',
      $components: '/src/lib/components',
      $services: '/src/lib/services',
      $entities: '/src/lib/entities'
    }
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});

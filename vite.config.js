import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Tailwind + PostCSS are wired here (not via a standalone postcss.config.js)
// so Vite runs the plugins directly. The standalone PostCSS config was
// mis-resolved through postcss-import and choked on the tailwind plugin,
// which left every utility class missing from the build.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

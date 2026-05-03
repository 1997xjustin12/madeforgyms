import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'madeforgyms_mobile.png'],
      manifest: {
        name: 'MadeForGyms',
        short_name: 'MadeForGyms',
        description: 'Gym management software for the Philippines',
        theme_color: '#16a34a',
        background_color: '#030712',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/madeforgyms_mobile.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/madeforgyms_mobile.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}', '**/*.png'],
        globIgnores: ['madeforgyms.png', 'madeforgyms_desktop.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/supabase/, /^\/functions/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
});

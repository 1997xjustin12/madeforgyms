import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MadeForGyms',
        short_name: 'MFGsApp',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: '/madeforgyms_mobile.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/madeforgyms_mobile.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Le proxy connecte directement l'interface à la base de données unique en ligne (Render) pour éviter toute désynchronisation entre onglets locaux et Vercel.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://iml-digital.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});

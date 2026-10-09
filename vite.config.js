import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['5173-iusl5ts84myys92yncmyk-b7fc1cfd.us1.manus.computer'],
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
});

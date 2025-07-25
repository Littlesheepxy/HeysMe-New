import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'LibreChatIntegrationComponents',
      fileName: (format) => `librechat-integration-components.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'recoil',
        '@tanstack/react-query'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          recoil: 'Recoil',
          '@tanstack/react-query': 'ReactQuery'
        },
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
  },
}); 
import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
import vue from '@vitejs/plugin-vue'

   export default defineConfig({
     plugins: [
      vue(),
      copy({
        targets: [
          { src: 'public/fonts/*', dest: 'dist/assets/fonts' }, // Укажите путь к шрифтам
        ],
        verbose: true, // Для получения информации о копировании
        hook: 'writeBundle', // Копируем после сборки
        apply: 'build', // Применяется только в режиме сборки
      })
    ],
    test: {
      browser: {
        enabled: true,
        name: 'chromium',
      },
    },
     server: {
       https: {
         key: './private.key',
         cert: './cert.pem',
       },
        proxy: {
        '/requests.json': {
          target: 'https://dev2.smartbusinessclub.ru/timofei/b24_iw2sts_bitrix24_ru/requests.json',
          changeOrigin: true,
          secure: false,
        },
      },
        host: '127.0.0.1', // Адрес сервера
        port: 5173          // Порт сервера
     },
     /*
     build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/index.js',
          assetFileNames: 'assets/index.css',
          manualChunks(id) {
            // Проверяем наличие 'mdi' в пути модуля
            if (id.includes('node_modules/@fortawesome')) {
              return 'icons'; // Имя чанка
            }
          },
          chunkFileNames: (chunkInfo) => {
            // Установка имени файла для чанков
            if (chunkInfo.name === 'icons') {
              return 'assets/icons.js'; // Установка имени файла для чанка иконок
            }
            return 'assets/[name].js'; // Для остальных чанков
          },
        },
      },
     },
     */
   });


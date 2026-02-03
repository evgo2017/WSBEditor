import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
    plugins: [vue(), viteSingleFile()],
    build: {
        target: 'esnext',
        assetsInlineLimit: 100000000, // 确保所有资源都内联
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
})

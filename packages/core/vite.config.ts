import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({ insertTypesEntry: true })
    ],
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'StrikeCore',
            formats: ['es', 'umd'],
            fileName: (format) => {
                if (format === 'es') return 'index.mjs'
                if (format === 'umd') return 'index.umd.cjs'
            }
        },
        rollupOptions: {
            external: [],
        },
        sourcemap: true,
        emptyOutDir: true,
    }
})
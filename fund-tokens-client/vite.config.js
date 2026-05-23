import { defineConfig } from "vite";
import { fileURLToPath, URL } from 'node:url';
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@@components': fileURLToPath(new URL('./src/components', import.meta.url)),
            '@@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
            '@@services': fileURLToPath(new URL('./src/services', import.meta.url)),
            '@@config': fileURLToPath(new URL('./src/config', import.meta.url)),
            '@@misc': fileURLToPath(new URL('./src/misc', import.meta.url)),
        },
    },
});

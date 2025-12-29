import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Crucial for Electron/Tauri/Offline - ensures assets are loaded relatively
    base: './',
    server: {
        port: 3000,
    }
})

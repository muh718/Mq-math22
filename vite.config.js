import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// هذا الملف ضروري جداً ليقوم Vercel ببناء الموقع بشكل صحيح بدون شاشة بيضاء
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // GitHub Pages project sites are served from /<repo-name>/.
    // The deploy workflow sets VITE_BASE_PATH automatically; use "/" otherwise.
    base: env.VITE_BASE_PATH || '/ekumusta/',
    plugins: [
      react(),
      babel({ presets: ['@babel/preset-env', '@babel/preset-react'] })
    ],
  }
})

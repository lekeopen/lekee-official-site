import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  ssr: {
    noExternal: ['react-helmet-async'],
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: command === 'serve' ? ['react-dev-locator'] : [],
      },
    }),
    tsconfigPaths()
  ],
}))

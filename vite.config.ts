import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { DEFAULT_API_BASE_URL, DEFAULT_MIN_PERCENTAGE } from "./src/lib/defaults"

export default defineConfig(({ mode }) => {
  const apiBase = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL || DEFAULT_API_BASE_URL
  const hints = ["archetype-matrix", "win-loss-records"].map(endpoint => ({
    tag: "link",
    attrs: {
      rel: "preload",
      as: "fetch",
      crossorigin: "anonymous",
      href: `${apiBase}/analysis/${endpoint}?min_percentage=${DEFAULT_MIN_PERCENTAGE}`,
    },
    injectTo: "head" as const,
  }))
  return {
    plugins: [react(), { name: "preload-default-analytics", transformIndexHtml: () => hints }],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: DEFAULT_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})

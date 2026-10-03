/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

/**
 * The browser only ever talks to `/api/<provider>`; the dev server forwards
 * those requests upstream and attaches the API key, so keys never reach the
 * client bundle. `docker/nginx.conf.template` mirrors this for production.
 */
function keyedProxy(
  prefix: string,
  target: string,
  auth: { queryParam: string } | { header: string },
  apiKey = '',
): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => {
      const stripped = path.replace(new RegExp(`^${prefix}`), '')
      if (!('queryParam' in auth)) return stripped
      const separator = stripped.includes('?') ? '&' : '?'
      return `${stripped}${separator}${auth.queryParam}=${encodeURIComponent(apiKey)}`
    },
    headers: 'header' in auth ? { [auth.header]: apiKey } : undefined,
    configure: (proxy) => {
      // NewsAPI's free tier rejects browser origins other than localhost.
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin')
        proxyReq.removeHeader('referer')
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load every variable (not just VITE_*) for use in this config only.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      proxy: {
        '/api/guardian': keyedProxy(
          '/api/guardian',
          'https://content.guardianapis.com',
          { queryParam: 'api-key' },
          env.GUARDIAN_API_KEY,
        ),
        '/api/nyt': keyedProxy(
          '/api/nyt',
          'https://api.nytimes.com/svc/search/v2',
          { queryParam: 'api-key' },
          env.NYT_API_KEY,
        ),
        '/api/newsapi': keyedProxy(
          '/api/newsapi',
          'https://newsapi.org/v2',
          { header: 'X-Api-Key' },
          env.NEWS_API_KEY,
        ),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})

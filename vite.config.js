import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.resolve(__dirname, 'api')

// Resolve a request path like /api/orders/abc123/status to the matching
// file under /api, supporting Vercel-style dynamic segments such as
// api/orders/[orderId]/status.js. Returns { filePath, params } or null.
function resolveApiFile(segments) {
  let currentDir = apiDir
  const params = {}

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]
    const isLast = i === segments.length - 1

    if (isLast) {
      const literalFile = path.join(currentDir, `${segment}.js`)
      if (fs.existsSync(literalFile)) return { filePath: literalFile, params }

      const entries = fs.existsSync(currentDir) ? fs.readdirSync(currentDir, { withFileTypes: true }) : []
      const dynamicFile = entries.find((entry) => entry.isFile() && /^\[.+\]\.js$/.test(entry.name))
      if (dynamicFile) {
        params[dynamicFile.name.slice(1, -4)] = segment
        return { filePath: path.join(currentDir, dynamicFile.name), params }
      }
      return null
    }

    const literalDir = path.join(currentDir, segment)
    if (fs.existsSync(literalDir) && fs.statSync(literalDir).isDirectory()) {
      currentDir = literalDir
      continue
    }

    const entries = fs.existsSync(currentDir) ? fs.readdirSync(currentDir, { withFileTypes: true }) : []
    const dynamicDir = entries.find((entry) => entry.isDirectory() && /^\[.+\]$/.test(entry.name))
    if (dynamicDir) {
      params[dynamicDir.name.slice(1, -1)] = segment
      currentDir = path.join(currentDir, dynamicDir.name)
      continue
    }

    return null
  }

  return null
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

// Vite's own dev server only serves the frontend, so requests to /api/*
// (which normally run as Vercel serverless functions) 404 with `vite dev`
// and the payment flow silently fails to move past PaymentPage. This
// plugin runs those same /api handlers in-process during local dev so
// `npm run dev` works end-to-end without requiring the Vercel CLI.
function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-shim',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        const urlObj = new URL(req.url, 'http://localhost')
        const segments = urlObj.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)
        const resolved = resolveApiFile(segments)
        if (!resolved) return next()

        try {
          const mod = await server.ssrLoadModule(resolved.filePath)
          const handler = mod.default
          if (typeof handler !== 'function') return next()

          const query = Object.fromEntries(urlObj.searchParams.entries())
          Object.assign(query, resolved.params)
          req.query = query

          req.body = {}
          if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
            const raw = await readRequestBody(req)
            if (raw) {
              try {
                req.body = JSON.parse(raw)
              } catch {
                req.body = {}
              }
            }
          }

          res.status = (code) => { res.statusCode = code; return res }
          res.json = (data) => {
            if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }
          res.send = (data) => res.end(typeof data === 'string' ? data : JSON.stringify(data))

          await handler(req, res)
        } catch (error) {
          console.error(`[vercel-api-dev-shim] ${req.url} failed:`, error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ message: error?.message || 'Internal server error' }))
          }
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
})

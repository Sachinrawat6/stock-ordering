/**
 * Production server — serves the built React app (dist/) and
 * proxies /proxy/nocodb/* and /proxy/raw-material/* to avoid CORS.
 *
 * Usage:
 *   npm run build        ← build the React app first
 *   npm start            ← then start this server
 */

import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

// ── Proxy: NocoDB ─────────────────────────────────────────────
app.use(
  '/proxy/nocodb',
  createProxyMiddleware({
    target: 'https://nocodb.qurvii.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/proxy/nocodb': '' },
    on: {
      error: (err, req, res) => {
        console.error('[proxy/nocodb] error:', err.message)
        res.status(502).json({ msg: 'NocoDB proxy error: ' + err.message })
      },
    },
  })
)

// ── Proxy: Raw Material backend ───────────────────────────────
app.use(
  '/proxy/raw-material',
  createProxyMiddleware({
    target: 'https://raw-material-backend.onrender.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/proxy/raw-material': '' },
    on: {
      error: (err, req, res) => {
        console.error('[proxy/raw-material] error:', err.message)
        res.status(502).json({ msg: 'Raw-material proxy error: ' + err.message })
      },
    },
  })
)

// ── Serve built React static files ───────────────────────────
app.use(express.static(join(__dirname, 'dist')))

// ── SPA fallback — all other routes serve index.html ─────────
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✅  Fabric Analysis server running on http://localhost:${PORT}`)
  console.log(`   Proxying /proxy/nocodb      → https://nocodb.qurvii.com`)
  console.log(`   Proxying /proxy/raw-material → https://raw-material-backend.onrender.com`)
})

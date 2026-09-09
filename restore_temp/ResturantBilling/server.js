// ══════════════════════════════════════════════════════════════════════════════
// Mehfil-E-Nihari POS — Production Static Server
// ══════════════════════════════════════════════════════════════════════════════
// Serves the Vite production build from dist/ on port 5181.
// Zero external dependencies — uses only Node.js built-ins.
//
// Features:
//   • SPA routing — all non-file paths fall back to index.html
//   • Proper MIME types for every asset
//   • gzip / brotli compression for text assets
//   • CORS headers — required by Vite's crossorigin attribute
//   • Cache headers — immutable for hashed assets, no-cache for HTML
//   • Health-check endpoint at /health
//   • Graceful shutdown on SIGINT / SIGTERM
//
// Usage:
//   node server.js                 — starts on port 5181
//   PORT=3000 node server.js       — starts on custom port
//   node server.js --port 3000     — starts on custom port
// ══════════════════════════════════════════════════════════════════════════════

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip, createBrotliCompress } from 'node:zlib';
import { fileURLToPath } from 'node:url';

// ── Paths ───────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = resolve(__filename, '..');
const DIST_DIR  = join(__dirname, 'dist');
const PORT      = parsePort();

function parsePort() {
  const args = process.argv.slice(2);
  const flagIdx = args.indexOf('--port');
  if (flagIdx !== -1 && args[flagIdx + 1]) return Number(args[flagIdx + 1]);
  return Number(process.env.PORT) || 5181;
}

// ── MIME Types ──────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.pdf':  'application/pdf',
  '.map':  'application/json; charset=utf-8',
};

const COMPRESSIBLE = new Set([
  'text/html', 'text/css', 'text/plain', 'text/xml',
  'application/javascript', 'application/json', 'application/xml',
  'image/svg+xml', 'application/manifest+json',
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function acceptsEncoding(req, encoding) {
  const ae = req.headers['accept-encoding'] || '';
  return ae.includes(encoding);
}

function getMime(filePath) {
  return MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function isHashedAsset(name) {
  // Vite emits names like index-BtzsUE_S.js — the part before the dot
  // contains an underscore, indicating a content hash.
  return /-[A-Za-z0-9_-]{6,}\.\w+$/.test(name);
}

// ── Response Helpers ────────────────────────────────────────────────────────

function setCommonHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CORS — required because Vite adds crossorigin="" to <script> and <link>
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Encoding');
}

function setCacheHeaders(res, filePath, mime) {
  if (mime === 'text/html; charset=utf-8') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (isHashedAsset(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}

/**
 * Serve a file with optional gzip/brotli compression.
 * Uses raw readFile + buffer approach instead of stream.pipeline
 * to avoid hanging on edge cases.
 */
async function serveFile(res, filePath, mime, req) {
  setCommonHeaders(res);
  setCacheHeaders(res, filePath, mime);

  // Read the raw file into a buffer
  let fileBuffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch (err) {
    console.error(`[ERROR] Failed to read ${filePath}:`, err.message);
    res.writeHead(500);
    res.end('Internal Server Error');
    return;
  }

  const canCompress = COMPRESSIBLE.has(mime.split(';')[0].trim());

  if (canCompress && acceptsEncoding(req, 'br')) {
    const { brotliCompressSync } = await import('node:zlib');
    const compressed = brotliCompressSync(fileBuffer);
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Encoding': 'br',
      'Content-Length': compressed.byteLength,
    });
    res.end(compressed);
  } else if (canCompress && acceptsEncoding(req, 'gzip')) {
    const { gzipSync } = await import('node:zlib');
    const compressed = gzipSync(fileBuffer);
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Encoding': 'gzip',
      'Content-Length': compressed.byteLength,
    });
    res.end(compressed);
  } else {
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': fileBuffer.byteLength,
    });
    res.end(fileBuffer);
  }
}

// ── Request Handler ─────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    setCommonHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  // ── Health check ─────────────────────────────────────────────
  if (pathname === '/health') {
    setCommonHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // ── Try to serve exact file from dist/ ───────────────────────
  let filePath = join(DIST_DIR, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      const mime = getMime(filePath);
      await serveFile(res, filePath, mime, req);
      return;
    }

    // If it's a directory, try index.html inside it
    if (fileStat.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      const indexStat = await stat(indexPath);
      if (indexStat.isFile()) {
        await serveFile(res, indexPath, 'text/html; charset=utf-8', req);
        return;
      }
    }
  } catch {
    // File not found — fall through to SPA fallback
  }

  // ── SPA fallback — serve index.html for any non-file path ────
  try {
    const indexFile = join(DIST_DIR, 'index.html');
    await stat(indexFile);
    await serveFile(res, indexFile, 'text/html; charset=utf-8', req);
  } catch {
    res.writeHead(500);
    res.end('index.html not found in dist/');
  }
}

// ── Server ──────────────────────────────────────────────────────────────────

const server = createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║        Mehfil-E-Nihari POS — Production Server           ║
╠══════════════════════════════════════════════════════════╣
║  🌐  http://localhost:${PORT}                               ║
║  📂  Serving: ${DIST_DIR}
║  🔒  Compression: gzip + brotli                         ║
║  🌍  CORS: enabled (Access-Control-Allow-Origin: *)     ║
║  ⚡  SPA fallback: enabled                               ║
║  🏥  Health: http://localhost:${PORT}/health                ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ───────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force kill after 5s
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Prevent unhandled errors from crashing the process
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

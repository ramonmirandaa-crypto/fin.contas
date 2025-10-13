import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const defaultPort = 4173;
const parsedPort = Number.parseInt(process.env.PORT ?? String(defaultPort), 10);
const port = Number.isNaN(parsedPort) ? defaultPort : parsedPort;

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
]);

function resolveContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES.get(ext) ?? 'application/octet-stream';
}

async function resolveFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const safePath = path.normalize(decodedPath).replace(/^\.\/+/, '');
  let candidate = path.join(distDir, safePath);

  if (!candidate.startsWith(distDir)) {
    return null;
  }

  try {
    const stats = await stat(candidate);
    if (stats.isDirectory()) {
      candidate = path.join(candidate, 'index.html');
    }
    return candidate;
  } catch {
    const fallback = path.join(distDir, 'index.html');
    try {
      await access(fallback);
      return fallback;
    } catch {
      return null;
    }
  }
}

const server = http.createServer(async (req, res) => {
  const filePath = await resolveFilePath(req?.url ?? '/');

  if (!filePath) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  res.setHeader('content-type', resolveContentType(filePath));

  const stream = createReadStream(filePath);
  stream.on('error', (error) => {
    console.error('[preview] Failed to read file:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    }
    res.end('Internal Server Error');
  });

  stream.pipe(res);
});

async function ensureDistDir() {
  try {
    await access(distDir);
  } catch {
    console.error('[preview] Missing dist directory. Run "npm run build" before previewing.');
    process.exit(1);
  }
}

ensureDistDir().then(() => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`[preview] Serving dist directory on http://0.0.0.0:${port}`);
  });
});

const shutdown = (signal) => {
  console.log(`[preview] Received ${signal}. Shutting down preview server.`);
  server.close(() => process.exit(0));
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(signal));
}

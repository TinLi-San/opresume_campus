/**
 * serve-dist.mjs — 无 esbuild 的静态预览服务器（用于无头导出测试）
 * 仅服务 opresume/dist 构建产物，模拟 vite preview 的 SPA/多页回退，
 * 规避受限沙箱下 esbuild spawn EPERM 问题。零第三方依赖。
 *
 * 用法：node scripts/serve-dist.mjs [port=4173]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const port = Number(process.argv[2] || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  if (clean === '/' || clean === '') return path.join(DIST, 'index.html');
  if (clean === '/editor') return path.join(DIST, 'editor.html');
  const rel = clean.startsWith('/') ? clean.slice(1) : clean;
  if (rel.startsWith('api/')) return null;
  const candidate = path.join(DIST, rel);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  return path.join(DIST, 'index.html');
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url.startsWith('/api/resume') && req.method === 'GET') {
    const d = path.join(DIST, 'data/resume.json');
    if (fs.existsSync(d)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(d));
      return;
    }
  }
  const file = resolvePath(url);
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found: ' + url);
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  res.end(fs.readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log('[serve-dist] http://127.0.0.1:' + port + ' (dist=' + DIST + ')');
});

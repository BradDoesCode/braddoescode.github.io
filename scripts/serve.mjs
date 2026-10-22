// Tiny static file server for the built site. Used by the check script so the
// link checker and the accessibility pass see the site the way GitHub Pages
// serves it: directory index files, and 404.html for anything missing.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function resolveFile(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const target = resolve(join(root, normalize(decoded)));
  if (target !== root && !target.startsWith(root + sep)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, 'index.html');
      await stat(index);
      return index;
    }
    return target;
  } catch {
    return null;
  }
}

export function startServer(dir) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost');
      let file = await resolveFile(root, pathname);
      let status = 200;
      if (!file) {
        file = join(root, '404.html');
        status = 404;
      }
      const body = await readFile(file);
      res.writeHead(status, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500);
      res.end('Server error');
    }
  });
  return new Promise((done, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      done({
        port,
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

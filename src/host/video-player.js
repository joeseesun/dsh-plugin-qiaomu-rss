import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { articleVideoEmbed } from '../video.js';

// A loopback HTML document gives the official player a real browser Referer,
// including in desktop shells whose outer page uses a custom URL scheme.
export class VideoPlayerServer {
  constructor() { this.token = randomBytes(24).toString('hex'); }
  async url(article) {
    const embed = articleVideoEmbed(article);
    if (!embed) return undefined;
    if (!this.ready) {
      this.server = createServer((req, res) => {
        const address = this.server.address();
        const host = `127.0.0.1:${address.port}`;
        if (req.headers.host !== host || req.method !== 'GET') { res.writeHead(403).end(); return; }
        const url = new URL(req.url, `http://${host}`);
        const match = new RegExp(`^/${this.token}/([A-Za-z0-9_-]{11})$`).exec(url.pathname);
        if (!match) { res.writeHead(404).end(); return; }
        res.writeHead(200, {
          'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store',
          'Referrer-Policy':'strict-origin-when-cross-origin', 'X-Content-Type-Options':'nosniff',
          'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-src https://www.youtube.com",
        });
        res.end(`<!doctype html><html><head><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;width:100%;height:100%;background:#000}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe src="https://www.youtube.com/embed/${match[1]}" title="YouTube 视频播放器" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`);
      });
      this.ready = new Promise((resolve, reject) => { this.server.once('error', reject); this.server.listen(0, '127.0.0.1', resolve); });
      this.ready.catch(() => { this.ready = undefined; });
    }
    await this.ready;
    return `http://127.0.0.1:${this.server.address().port}/${this.token}/${embed.split('/').pop()}`;
  }
  async dispose() { if (this.ready) await this.ready.catch(() => {}); if (this.server?.listening) await new Promise(resolve => this.server.close(resolve)); }
}

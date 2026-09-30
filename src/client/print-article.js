import { sanitizeHtml } from '../host/sanitize.js';

/** Browser print dialog supports Save as PDF where the host browser exposes it. */
export function printArticle({ title, html, url, version }, hostDocument = document) {
  const frame = hostDocument.createElement('iframe');
  frame.title = '文章打印预览';
  frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10000px;border:0';
  hostDocument.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) { frame.remove(); throw new Error('当前环境无法创建打印文档'); }
  doc.title = title || 'RSS 文章';
  const style = doc.createElement('style');
  style.textContent = '@page{margin:20mm}body{font:16px/1.8 serif;color:#111;background:#fff;max-width:44em;margin:auto}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:26px}a{overflow-wrap:anywhere}iframe,audio,video,button{display:none}';
  doc.head.appendChild(style);
  const heading = doc.createElement('h1'); heading.textContent = title; doc.body.appendChild(heading);
  const meta = doc.createElement('p'); meta.textContent = `阅读版本：${version}`; doc.body.appendChild(meta);
  try {
    const source = new URL(url);
    if (['http:','https:'].includes(source.protocol)) {
      const link = doc.createElement('a'); link.href = source.href; link.textContent = source.href; doc.body.appendChild(link);
    }
  } catch {}
  const body = doc.createElement('article'); body.innerHTML = sanitizeHtml(html, { baseUrl:url }); doc.body.appendChild(body);
  let timer;
  const dispose = () => { clearTimeout(timer); frame.remove(); };
  win.addEventListener('afterprint',dispose,{once:true});
  // Printing may not emit afterprint in every embedded webview.
  timer = setTimeout(dispose,120000);
  win.focus();
  try { win.print(); } catch (error) { dispose(); throw error; }
  return dispose;
}

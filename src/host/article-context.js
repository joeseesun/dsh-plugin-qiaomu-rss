import { htmlToText } from './sanitize.js';
export function articleContext(article, limit = 12000) {
  const heading = article.title ? `标题: ${String(article.title).slice(0,500)}\n\n` : '';
  const plain = typeof article.text === 'string' ? article.text : htmlToText(article.html ?? '', limit + 1);
  const available = Math.max(0,limit - heading.length);
  const truncated = plain.length > available;
  const suffix = truncated ? '\n（上下文已截断）' : '';
  return heading + plain.slice(0,Math.max(0,available - suffix.length)) + suffix;
}

/**
 * Allowlist HTML sanitizer shared by article ingestion (host) and rendering
 * (client copy). The sanitizer rebuilds the document from a token walk, so
 * anything not explicitly allowed — scripts, event handlers, exotic URL
 * schemes — never reaches the output string.
 */

const VOID_TAGS = new Set([
  'br', 'hr', 'img', 'wbr', 'input', 'col', 'source',
]);

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'em', 'i', 'strong', 'b',
  'u', 's', 'del', 'a', 'img', 'figure', 'figcaption', 'table', 'thead',
  'tbody', 'tfoot', 'tr', 'th', 'td', 'sup', 'sub', 'small', 'mark',
  'details', 'summary', 'span', 'div', 'abbr', 'time', 'kbd', 'samp',
]);

/** Tags whose entire content is dropped, not merely the tag itself. */
const DROP_CONTENT_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'form',
  'textarea', 'select', 'button', 'svg', 'math', 'template', 'title',
  'head', 'link', 'meta', 'base',
]);

const SAFE_URL_ATTRS = new Set(['href', 'src', 'cite', 'poster']);
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

export function decodeHtmlEntities(text) {
  if (!text.includes('&')) return text;
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»',
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', copy: '©',
    reg: '®', trade: '™', middot: '·', bull: '•', times: '×', deg: '°',
  };
  return text.replace(/&(#[0-9]{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,30});/g, (raw, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0x20 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return raw;
      try {
        return String.fromCodePoint(code);
      } catch {
        return raw;
      }
    }
    return named[body.toLowerCase()] ?? raw;
  });
}

function escapeText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}

function isSafeUrl(raw) {
  const value = raw.trim();
  if (value === '' || value.startsWith('#')) return true;
  if (/^(?:https?:|mailto:)/i.test(value)) return true;
  // Scheme-relative and relative URLs are safe: resolved against the article
  // base by the consumer.
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true;
  return false;
}

function safeUrl(raw, baseUrl) {
  const value = raw.trim();
  if (!isSafeUrl(value)) return undefined;
  if (baseUrl) {
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return undefined;
    }
  }
  return value;
}

/**
 * Sanitize one HTML fragment.
 * @param {string} html - untrusted markup.
 * @param {{baseUrl?: string, maxLength?: number}} [options] - base for relative URLs and an output cap.
 * @returns {string} sanitized markup.
 */
export function sanitizeHtml(html, options = {}) {
  const { baseUrl, maxLength = 400_000 } = options;
  let out = '';
  const stack = [];
  let i = 0;
  const n = html.length;
  let droppedDepth = 0;
  while (i < n && out.length < maxLength) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      if (droppedDepth === 0) out += escapeText(decodeHtmlEntities(html.slice(i)));
      break;
    }
    if (lt > i && droppedDepth === 0) out += escapeText(decodeHtmlEntities(html.slice(i, lt)));
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
      const end = html.indexOf('>', lt);
      i = end === -1 ? n : end + 1;
      continue;
    }
    const gt = findTagEnd(html, lt);
    if (gt === -1) break;
    const source = html.slice(lt + 1, gt);
    i = gt + 1;
    if (source.startsWith('/')) {
      const name = source.slice(1).trim().toLowerCase();
      const openIdx = stack.lastIndexOf(name);
      if (openIdx !== -1) {
        while (stack.length > openIdx) {
          const closing = stack.pop();
          if (droppedDepth > 0) {
            // Leaving a dropped subtree.
            if (closing === '__drop__') droppedDepth -= 1;
            else out += `</${closing}>`;
          } else {
            out += `</${closing}>`;
          }
        }
      }
      continue;
    }
    const selfClosing = source.endsWith('/');
    const header = selfClosing ? source.slice(0, -1) : source;
    const nameMatch = /^[^\s/>]+/.exec(header);
    if (!nameMatch) continue;
    const tag = nameMatch[0].toLowerCase();
    if (DROP_CONTENT_TAGS.has(tag)) {
      if (!selfClosing && !VOID_TAGS.has(tag)) droppedDepth += 1;
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) continue;
    const attrs = parseAttrs(header.slice(nameMatch[0].length));
    const rendered = [];
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('on') || key === 'style' || key === 'class' && false) continue;
      if (!SAFE_URL_ATTRS.has(key)) {
        if (key === 'alt' || key === 'title' || key === 'colspan' || key === 'rowspan' || key === 'datetime') {
          rendered.push(`${key}="${escapeAttr(value.slice(0, 300))}"`);
        }
        continue;
      }
      const url = safeUrl(decodeHtmlEntities(value), baseUrl);
      if (url !== undefined) rendered.push(`${key}="${escapeAttr(url)}"`);
    }
    const attrText = rendered.length > 0 ? ` ${rendered.join(' ')}` : '';
    if (tag === 'img') {
      out += `<img${attrText} loading="lazy">`;
      continue;
    }
    if (VOID_TAGS.has(tag)) {
      out += `<${tag}>`;
      continue;
    }
    out += `<${tag}${attrText}>`;
    if (!selfClosing) stack.push(tag);
  }
  while (stack.length > 0) out += `</${stack.pop()}>`;
  return out.slice(0, maxLength);
}

function findTagEnd(source, from) {
  let quote = '';
  for (let i = from + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (quote !== '') {
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') return i;
  }
  return -1;
}

const ATTR = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')?/g;

function parseAttrs(header) {
  const attrs = {};
  ATTR.lastIndex = 0;
  let match;
  while ((match = ATTR.exec(header)) !== null) {
    attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? '';
  }
  return attrs;
}

/** Extract the first safe <img> source from an HTML fragment. */
export function firstImageUrl(html, baseUrl) {
  const img = /<img\s[^>]*src\s*=\s*("([^"]*)"|'([^']*)')/i.exec(html);
  if (!img) return undefined;
  const raw = img[2] ?? img[3] ?? '';
  return safeUrl(decodeHtmlEntities(raw), baseUrl);
}

/**
 * Reduce sanitized HTML to plain text with paragraph structure.
 * @param {string} html - already-sanitized markup.
 * @param {number} [maxLength] - output cap.
 */
export function htmlToText(html, maxLength = 20_000) {
  const blocks = [];
  const push = (text) => {
    const trimmed = text.replace(/[ \t]+/g, ' ').trim();
    if (trimmed.length > 0) blocks.push(trimmed);
  };
  const withoutBlocks = html
    .replace(/<(?:script|style)[\s\S]*?<\/(?:script|style)>/gi, ' ')
    .replace(/<(?:p|div|section|article|blockquote|h[1-6]|li|tr|figcaption|pre)[^>]*>/gi, '\n')
    .replace(/<\/(?:p|div|section|article|blockquote|h[1-6]|li|tr|figcaption|pre)>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n——\n');
  push(withoutBlocks.replace(/<[^>]+>/g, ' ').replace(/\n{2,}/g, '\n'));
  const text = blocks.join('\n').replace(/\n{3,}/g, '\n\n');
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

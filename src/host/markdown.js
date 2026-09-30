/**
 * Compact Markdown → HTML renderer for AI-generated rewrite/translation text,
 * plus an HTML → Markdown converter used when saving articles as notes.
 * Both are intentionally small: headings, emphasis, links, images, fenced and
 * inline code, lists, blockquotes, and tables-lite.
 */

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttrPart(value) {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  let out = escapeHtml(text);
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => `<img src="${escapeAttrPart(src)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
      const safe = /^(?:https?:|mailto:|\/|#)/i.test(href) ? href : '#';
      return `<a href="${escapeAttrPart(safe)}" target="_blank" rel="noreferrer">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\s][^_]*)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, index) => codes[Number(index)]);
}

/**
 * Render a Markdown document to HTML.
 * @param {string} markdown
 * @returns {string}
 */
export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let listType;
  let inQuote = false;
  let codeFence = false;
  let codeBuffer = [];

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType !== undefined) {
      out.push(`</${listType}>`);
      listType = undefined;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    if (codeFence) {
      if (/^```/.test(line)) {
        out.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        codeFence = false;
      } else {
        codeBuffer.push(rawLine);
      }
      continue;
    }
    if (/^```/.test(line)) {
      closeParagraph();
      closeList();
      closeQuote();
      codeFence = true;
      continue;
    }
    if (line.trim() === '') {
      closeParagraph();
      closeList();
      closeQuote();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeParagraph();
      closeList();
      closeQuote();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (/^(?:-{3,}|\*{3,})$/.test(line.trim())) {
      closeParagraph();
      closeList();
      closeQuote();
      out.push('<hr>');
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      closeParagraph();
      closeList();
      if (!inQuote) {
        out.push('<blockquote>');
        inQuote = true;
      }
      out.push(`<p>${inline(quote[1])}</p>`);
      continue;
    }
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ordered || unordered) {
      closeParagraph();
      closeQuote();
      const wanted = ordered ? 'ol' : 'ul';
      if (listType !== wanted) {
        closeList();
        out.push(`<${wanted}>`);
        listType = wanted;
      }
      out.push(`<li>${inline((ordered ?? unordered)[1])}</li>`);
      continue;
    }
    paragraph.push(line.trim());
  }
  if (codeFence && codeBuffer.length > 0) out.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  closeParagraph();
  closeList();
  closeQuote();
  return out.join('\n');
}

const INLINE_TAG_PATTERN = /<img\s[^>]*src="([^"]*)"[^>]*>|<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<strong>([\s\S]*?)<\/strong>|<b>([\s\S]*?)<\/b>|<em>([\s\S]*?)<\/em>|<i>([\s\S]*?)<\/i>|<del>([\s\S]*?)<\/del>|<code>([\s\S]*?)<\/code>|<br\s*\/?>/gi;

function inlineToMarkdown(html, baseUrl) {
  return html.replace(INLINE_TAG_PATTERN, (match, imgSrc, href, label, strong, bold, em, italic, del, code) => {
    if (imgSrc !== undefined) return `![image](${absolute(imgSrc, baseUrl)})`;
    if (href !== undefined) return `[${stripTags(label)}](${absolute(href, baseUrl)})`;
    if (strong !== undefined) return `**${stripTags(strong)}**`;
    if (bold !== undefined) return `**${stripTags(bold)}**`;
    if (em !== undefined) return `*${stripTags(em)}*`;
    if (italic !== undefined) return `*${stripTags(italic)}*`;
    if (del !== undefined) return `~~${stripTags(del)}~~`;
    if (code !== undefined) return `\`${decodeEntities(code)}\``;
    return '\n';
  });
}

function absolute(url, baseUrl) {
  if (!baseUrl || /^(?:https?:|mailto:|data:)/i.test(url)) return url;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/**
 * Convert sanitized article HTML into Markdown for note saving. Ordered
 * regex passes: block structure first (pre/heading/list/quote/paragraph),
 * then inline semantics. Nested lists flatten — acceptable for note export.
 * @param {string} html - sanitized markup.
 * @param {string} [baseUrl] - base for relative URLs.
 * @returns {string}
 */
export function htmlToMarkdown(html, baseUrl) {
  let text = html;
  const fence = (body, lang = '') => `\n\`\`\`${lang}\n${decodeEntities(body.replace(/<[^>]+>/g, ''))}\n\`\`\`\n`;
  text = text.replace(/<pre(?:\s[^>]*)?>\s*(?:<code(?:\s+class="language-([^"]*)")?\s*>)([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, lang, body) => fence(body, lang ?? ''));
  text = text.replace(/<pre(?:\s[^>]*)?>\s*<code(?:\s[^>]*)?>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, body) => fence(body));
  text = text.replace(/<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_, level, body) => `\n${'#'.repeat(Number(level))} ${stripTags(body).trim()}\n`);
  text = text.replace(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>\s*/gi, (_, body) => `\n- ${inlineToMarkdown(body, baseUrl).trim()}`);
  text = text.replace(/<\/?(?:ul|ol)(?:\s[^>]*)?>/gi, '\n');
  text = text.replace(/<blockquote(?:\s[^>]*)?>([\s\S]*?)<\/blockquote>/gi, (_, body) => {
    const quoted = inlineToMarkdown(body, baseUrl)
      .split('\n')
      .map((line) => `> ${line.trim()}`.trimEnd())
      .join('\n');
    return `\n${quoted}\n`;
  });
  text = text.replace(/<hr(?:\s[^>]*)?>/gi, '\n---\n');
  text = text.replace(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi, (_, body) => `\n${inlineToMarkdown(body, baseUrl).trim()}\n`);
  text = text.replace(/<img\s[^>]*>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  return decodeEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

/**
 * Feed normalization: RSS 2.x, RSS 1.0 (RDF), and Atom 1.0 documents become a
 * common entry shape. IDs are stable within one feed URL: GUID / Atom id,
 * falling back to the link, then the title+date hash.
 */
import { createHash } from 'node:crypto';
import { attrOf, childrenOf, find, findAll, localName, parseXml, textOf } from './xml.js';
import { firstImageUrl, sanitizeHtml } from './sanitize.js';

const MAX_BODY_CHARS = 100_000;
const MAX_ENTRIES_INSPECTED = 200;
const MAX_ENTRIES_KEPT = 50;
const MAX_BODY_BYTES_TOTAL = 1_000_000;

export function hashKey(...parts) {
  return createHash('sha256').update(parts.join('\u0000'), 'utf8').digest('hex').slice(0, 32);
}

/** Pick the article URL from a normalized entry node. */
function linkOf(node, isAtom) {
  if (isAtom) {
    for (const link of childrenOf(node, 'link')) {
      const rel = attrOf(link, 'rel');
      const href = attrOf(link, 'href');
      if (href && (rel === undefined || rel === 'alternate')) return href;
    }
    return attrOf(find(node, 'link'), 'href');
  }
  const link = find(node, 'link');
  const text = textOf(link).trim();
  if (text !== '') return text;
  return attrOf(find(node, 'link'), 'href');
}

function contentOf(node, isAtom) {
  const encoded = find(node, 'encoded'); // content:encoded
  const content = find(node, 'content');
  if (isAtom && content) {
    const type = attrOf(content, 'type') ?? 'text';
    const body = textOf(content);
    return type.includes('html') || type.includes('xhtml') ? body : `<p>${escapeHtml(body)}</p>`;
  }
  if (encoded) return textOf(encoded);
  if (content) return textOf(content);
  const description = find(node, 'description') ?? find(node, 'summary');
  return description ? textOf(description) : '';
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Plain-text list excerpt: strip tags, collapse whitespace, cap the length. */
export function excerptOf(html, limit = 180) {
  const text = String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

function mediaAssetOf(node) {
  for (const name of ['thumbnail', 'content']) {
    for (const media of findAll(node, name)) {
      const url = attrOf(media, 'url');
      const medium = attrOf(media, 'medium');
      const type = attrOf(media, 'type') ?? '';
      if (url && (medium === 'image' || type.startsWith('image/') || name === 'thumbnail')) return { image: url };
      if (url && (medium === 'audio' || type.startsWith('audio/'))) return { audio: url };
    }
  }
  const enclosure = find(node, 'enclosure');
  if (enclosure) {
    const url = attrOf(enclosure, 'url');
    const type = attrOf(enclosure, 'type') ?? '';
    if (url && type.startsWith('audio/')) return { audio: url };
    if (url && type.startsWith('image/')) return { image: url };
  }
  return {};
}

function dateOf(node, isAtom) {
  const raw = textOf(isAtom ? find(node, 'updated') ?? find(node, 'published') : find(node, 'pubdate') ?? find(node, 'date'));
  const parsed = raw ? new Date(raw) : undefined;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
}

function authorOf(node) {
  const atom = find(node, 'author');
  if (atom) {
    const name = find(atom, 'name');
    if (name) return textOf(name).trim();
  }
  return textOf(find(node, 'creator')).trim() || undefined; // dc:creator
}

function normalizeItem(node, isAtom, feedUrl) {
  const title = textOf(find(node, 'title')).trim();
  const link = linkOf(node, isAtom);
  const id = textOf(isAtom ? find(node, 'id') : find(node, 'guid')).trim() || link || `${title}|${dateOf(node, isAtom) ?? ''}`;
  if (title === '' && !link) return undefined;
  const rawHtml = contentOf(node, isAtom);
  const asset = mediaAssetOf(node);
  const html = sanitizeHtml(rawHtml, { baseUrl: link, maxLength: MAX_BODY_CHARS });
  const key = `feed:${hashKey(feedUrl, id)}`;
  return {
    key,
    id,
    title: title || '(untitled)',
    titleZh: undefined,
    author: authorOf(node),
    publishedAt: dateOf(node, isAtom),
    url: link,
    image: asset.image ?? firstImageUrl(html, link),
    audio: asset.audio,
    summary: excerptOf(html),
    html,
    truncated: rawHtml.length > MAX_BODY_CHARS,
  };
}

/**
 * Parse one feed document into entries plus the feed's own metadata.
 * @param {string} xmlText - raw feed XML (≤ 5 MB, DTD-free).
 * @param {string} feedUrl - subscription URL, part of the stable entry id.
 * @returns {{title: string, link?: string, description?: string, entries: object[]}}
 */
export function parseFeed(xmlText, feedUrl) {
  const root = parseXml(xmlText);
  const rss = find(root, 'rss') ?? root;
  const channel = find(rss, 'channel') ?? find(root, 'channel');
  const atomFeed = find(root, 'feed');
  const rdf = find(root, 'rdf');

  let title = '';
  let link;
  let description;
  let items;

  if (channel) {
    title = textOf(find(channel, 'title')).trim();
    link = linkOf(channel, false);
    description = textOf(find(channel, 'description')).trim() || undefined;
    items = findAll(channel, 'item');
    // RSS 1.0 RDF keeps <item> as a sibling of <channel>.
    if (items.length === 0 && rdf) items = findAll(rdf, 'item');
  } else if (atomFeed) {
    title = textOf(find(atomFeed, 'title')).trim();
    link = linkOf(atomFeed, true);
    const subtitle = find(atomFeed, 'subtitle');
    description = subtitle ? textOf(subtitle).trim() || undefined : undefined;
    items = findAll(atomFeed, 'entry');
  } else {
    throw new Error('qiaomu-rss: feed contains no channel/entry records');
  }

  const entries = [];
  let totalBytes = 0;
  for (const item of items.slice(0, MAX_ENTRIES_INSPECTED)) {
    const entry = normalizeItem(item, Boolean(atomFeed), feedUrl);
    if (!entry) continue;
    totalBytes += entry.html.length;
    if (totalBytes > MAX_BODY_BYTES_TOTAL) break;
    entries.push(entry);
    if (entries.length >= MAX_ENTRIES_KEPT) break;
  }
  return {
    title: title || feedUrl,
    link,
    description,
    entries,
  };
}

/**
 * Parse an OPML 2.0 outline into subscription stubs.
 * Nested group outlines become path names (`Tech / AI`).
 * @param {string} xmlText - OPML document.
 * @returns {{name?: string, group?: string, url: string}[]}
 */
export function parseOpml(xmlText) {
  const root = parseXml(xmlText);
  const body = find(root, 'body');
  const out = [];
  const visit = (node, group) => {
    for (const child of childrenOf(node, 'outline')) {
      const url = attrOf(child, 'xmlurl');
      const text = attrOf(child, 'text') ?? attrOf(child, 'title');
      if (url) {
        out.push({ url, name: text?.trim() || undefined, group: group?.trim() || undefined });
      } else if (text) {
        visit(child, group ? `${group} / ${text.trim()}` : text.trim());
      }
    }
  };
  visit(body ?? root, undefined);
  const seen = new Set();
  return out.filter((item) => {
    const normalized = item.url.replace(/\/+$/, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return /^https?:\/\//i.test(item.url);
  });
}

/** Render current subscriptions into an OPML 2.0 document. */
export function buildOpml(subscriptions) {
  const escape = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head><title>qiaomu-rss subscriptions</title></head>',
    '  <body>',
  ];
  const groups = new Map();
  for (const sub of subscriptions) {
    const key = sub.group ?? '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(sub);
  }
  for (const [group, subs] of groups) {
    if (group !== '') lines.push(`    <outline text="${escape(group)}">`);
    for (const sub of subs) {
      const indent = group !== '' ? '      ' : '    ';
      const name = sub.name ?? sub.url;
      lines.push(`${indent}<outline type="rss" text="${escape(name)}" title="${escape(name)}" xmlUrl="${escape(sub.url)}"/>`);
    }
    if (group !== '') lines.push('    </outline>');
  }
  lines.push('  </body>', '</opml>');
  return lines.join('\n');
}

export const FEED_LIMITS = {
  maxSubscriptions: 100,
  maxEntriesKept: MAX_ENTRIES_KEPT,
  maxBodyChars: MAX_BODY_CHARS,
  localName,
};

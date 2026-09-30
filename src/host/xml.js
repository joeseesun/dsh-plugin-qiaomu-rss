/**
 * Minimal tolerant XML parser for RSS 2.x / RSS 1.0 (RDF) / Atom 1.0 feeds.
 * Security posture follows the qiaomu reader: DTD / entity declarations are
 * rejected outright; the parser never expands custom entities.
 *
 * The parser produces a lightweight tree. Namespace-prefixed tag names are
 * kept verbatim (`content:encoded`, `media:thumbnail`, …) so feed code can
 * match them by suffix.
 */

/** Maximum nesting depth accepted before the parser gives up. */
const MAX_DEPTH = 128;

export class XmlParseError extends Error {
  constructor(message) {
    super(`qiaomu-rss: ${message}`);
    this.name = 'XmlParseError';
  }
}

/** Decode the five predefined entities plus numeric character references. */
export function decodeEntities(text) {
  if (!text.includes('&')) return text;
  return text.replace(/&(#[0-9]{1,7}|#x[0-9a-fA-F]{1,6}|amp|lt|gt|quot|apos);/g, (raw, body) => {
    if (body === 'amp') return '&';
    if (body === 'lt') return '<';
    if (body === 'gt') return '>';
    if (body === 'quot') return '"';
    if (body === 'apos') return "'";
    const code = body.charCodeAt(1) === 120 || body[1] === 'X'
      ? parseInt(body.slice(2), 16)
      : parseInt(body.slice(1), 10);
    if (!Number.isFinite(code) || code < 0x20 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return raw;
    try {
      return String.fromCodePoint(code);
    } catch {
      return raw;
    }
  });
}

function endsWithNonWs(html, offset) {
  for (let i = offset - 1; i >= 0; i -= 1) {
    const code = html.charCodeAt(i);
    if (code !== 32 && code !== 10 && code !== 13 && code !== 9) return true;
  }
  return false;
}

/**
 * Parse a feed document into a node tree.
 * @param {string} xml - the raw document (UTF-8 decoded by the caller).
 * @returns {XmlNode} the synthetic root holding the document element.
 */
export function parseXml(xml) {
  if (xml.includes('<!DOCTYPE') || xml.includes('<!doctype')) {
    throw new XmlParseError('DTD declarations are rejected');
  }
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  let i = 0;
  const n = xml.length;
  let textStart = 0;
  const flushText = (end) => {
    if (end <= textStart) return;
    const raw = xml.slice(textStart, end);
    if (raw.trim().length > 0 || endsWithNonWs(xml, end)) {
      stack[stack.length - 1].children.push(decodeEntities(raw));
    }
  };
  while (i < n) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) break;
    flushText(lt);
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4);
      i = end === -1 ? n : end + 3;
      textStart = i;
      continue;
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9);
      const body = xml.slice(lt + 9, end === -1 ? n : end);
      stack[stack.length - 1].children.push(body);
      i = end === -1 ? n : end + 3;
      textStart = i;
      continue;
    }
    if (xml.startsWith('<?', lt)) {
      const end = xml.indexOf('?>', lt + 2);
      i = end === -1 ? n : end + 2;
      textStart = i;
      continue;
    }
    const gt = findTagEnd(xml, lt);
    if (gt === -1) break;
    const source = xml.slice(lt + 1, gt);
    i = gt + 1;
    textStart = i;
    if (source.startsWith('/')) {
      const name = source.slice(1).trim();
      const top = stack[stack.length - 1];
      if (stack.length > 1 && top.tag === name) stack.pop();
      continue;
    }
    const selfClosing = source.endsWith('/');
    const header = selfClosing ? source.slice(0, -1) : source;
    const { tag, attrs } = parseTagHeader(header);
    if (tag.length === 0) continue;
    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) {
      stack.push(node);
      if (stack.length > MAX_DEPTH) throw new XmlParseError(`nesting deeper than ${MAX_DEPTH}`);
    }
  }
  return root;
}

/** Find the closing `>` of a tag, skipping quoted attribute values. */
function findTagEnd(xml, from) {
  let quote = '';
  for (let i = from + 1; i < xml.length; i += 1) {
    const ch = xml[i];
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

const TAG_NAME = /^[^\s/>]+/;
const ATTR = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

function parseTagHeader(header) {
  const nameMatch = TAG_NAME.exec(header);
  if (!nameMatch) return { tag: '', attrs: {} };
  const attrs = {};
  ATTR.lastIndex = nameMatch[0].length;
  let match;
  while ((match = ATTR.exec(header)) !== null) {
    const value = match[3] ?? match[4] ?? '';
    attrs[match[1]] = decodeEntities(value);
  }
  return { tag: nameMatch[0], attrs };
}

/** All descendants (including self) whose tag matches, comparing local names. */
export function findAll(node, wanted) {
  const out = [];
  const wantedLocal = localName(wanted);
  const visit = (current) => {
    for (const child of current.children) {
      if (typeof child === 'string') continue;
      if (localName(child.tag) === wantedLocal) out.push(child);
      visit(child);
    }
  };
  if (node) visit(node);
  return out;
}

/** First descendant whose tag matches, or undefined. */
export function find(node, wanted) {
  return findAll(node, wanted)[0];
}

/** Direct children only, matched by local tag name. */
export function childrenOf(node, wanted) {
  if (!node) return [];
  const wantedLocal = localName(wanted);
  return node.children.filter((child) => typeof child !== 'string' && localName(child.tag) === wantedLocal);
}

/** The local (namespace-stripped) part of a tag name. */
export function localName(tag) {
  const colon = tag.indexOf(':');
  return colon === -1 ? tag.toLowerCase() : tag.slice(colon + 1).toLowerCase();
}

/** Concatenated text content of a node, CDATA and entities resolved. */
export function textOf(node) {
  if (!node) return '';
  let out = '';
  for (const child of node.children) {
    if (typeof child === 'string') out += child;
    else out += textOf(child);
  }
  return out;
}

/** One attribute value, matched by local attribute name. */
export function attrOf(node, wanted) {
  if (!node) return undefined;
  const wantedLocal = localName(wanted);
  for (const [name, value] of Object.entries(node.attrs)) {
    if (localName(name) === wantedLocal) return value;
  }
  return undefined;
}

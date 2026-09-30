/**
 * Read-only client for the public Qiaomu Reader API (https://rss.qiaomu.ai).
 * Every endpoint is an anonymous GET; a 20-second timeout applies and a
 * missing AI asset is a distinct outcome from a request failure.
 */

import { excerptOf } from './feeds.js';

const TIMEOUT_MS = 20_000;

async function getJson(origin, path) {
  const url = `${origin.replace(/\/+$/, '')}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`qiaomu api ${path} failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSources(origin) {
  const body = await getJson(origin, '/api/sources');
  if (!Array.isArray(body?.sources)) throw new Error('qiaomu api /api/sources returned an unexpected shape');
  return body.sources
    .filter((source) => typeof source?.id === 'string' && typeof source?.name === 'string')
    .map((source) => ({ id: source.id, name: source.name, enabled: source.enabled !== false }));
}

export async function fetchStream(origin, limit = 100) {
  const body = await getJson(origin, `/api/entries?limit=${limit}`);
  if (!Array.isArray(body?.entries)) throw new Error('qiaomu api /api/entries returned an unexpected shape');
  return body.entries;
}

export async function fetchSourceEntries(origin, sourceId, { limit = 40, cursor } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const body = await getJson(origin, `/api/sources/${encodeURIComponent(sourceId)}/entries?${params}`);
  if (!Array.isArray(body?.entries)) throw new Error('qiaomu api source entries returned an unexpected shape');
  return {
    entries: body.entries,
    hasMore: body.hasMore === true,
    nextCursor: typeof body.nextCursor === 'string' ? body.nextCursor : undefined,
  };
}

export async function fetchEntry(origin, entryId) {
  const body = await getJson(origin, `/api/entry/${encodeURIComponent(entryId)}`);
  if (!body?.entry || typeof body.entry.id !== 'string') throw new Error('qiaomu api /api/entry returned an unexpected shape');
  return body.entry;
}

/** @returns {{status: 'ok'|'missing', title?: string, markdown?: string}} */
export async function fetchRewrite(origin, entryId) {
  try {
    const body = await getJson(origin, `/api/entry/${encodeURIComponent(entryId)}/rewrite`);
    if (!body?.rewrite) return { status: 'missing' };
    return {
      status: 'ok',
      title: typeof body.rewrite.title === 'string' ? body.rewrite.title : undefined,
      markdown: typeof body.rewrite.body === 'string' ? body.rewrite.body : '',
    };
  } catch (error) {
    if (isMissingAsset(error)) return { status: 'missing' };
    throw error;
  }
}

/** @returns {{status: 'ok'|'missing', title?: string, paragraphs?: string[]}} */
export async function fetchTranslation(origin, entryId) {
  try {
    const body = await getJson(origin, `/api/entry/${encodeURIComponent(entryId)}/translation`);
    const parts = body?.translation?.content;
    if (!Array.isArray(parts) || parts.length === 0) return { status: 'missing' };
    const paragraphs = parts
      .map((part) => (typeof part?.target === 'string' ? part.target : ''))
      .filter((text) => text !== '');
    if (paragraphs.length === 0) return { status: 'missing' };
    return { status: 'ok', paragraphs };
  } catch (error) {
    if (isMissingAsset(error)) return { status: 'missing' };
    throw error;
  }
}

function isMissingAsset(error) {
  const status = /HTTP (\d{3})/.exec(String(error?.message))?.[1];
  return status !== undefined && ['404', '410'].includes(status);
}

/** Normalize a Qiaomu stream/source entry into the plugin's article shape. */
export function normalizeQiaomuEntry(raw, channelKey) {
  if (!raw || typeof raw.id !== 'string') return undefined;
  const content = typeof raw.content === 'string' ? raw.content : '';
  return {
    key: `qiaomu:${raw.id}`,
    id: raw.id,
    channelKey: typeof raw.sourceId === 'string' && raw.sourceId !== '' && channelKey !== 'qiaomu' ? `qiaomu:${raw.sourceId}` : channelKey,
    title: typeof raw.title === 'string' ? raw.title : '(untitled)',
    titleZh: typeof raw.titleZh === 'string' && raw.titleZh !== '' ? raw.titleZh : undefined,
    author: typeof raw.author === 'string' ? raw.author : undefined,
    publishedAt: normalizeDate(raw.publishedTs ?? raw.published),
    url: typeof raw.link === 'string' ? raw.link : undefined,
    image: typeof raw.image === 'string' && raw.image !== '' ? raw.image : undefined,
    audio: typeof raw.audio === 'string' && raw.audio !== '' ? raw.audio : typeof raw.audio?.url === 'string' ? raw.audio.url : undefined,
    videoUrl: typeof raw.videoUrl === 'string' ? raw.videoUrl : undefined,
    html: content,
    summary: excerptOf(typeof raw.summaryZh === 'string' && raw.summaryZh !== '' ? raw.summaryZh : typeof raw.summary === 'string' ? raw.summary : content),
    truncated: false,
  };
}

function normalizeDate(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const fromTs = new Date(raw);
    return Number.isNaN(fromTs.getTime()) ? undefined : fromTs.toISOString();
  }
  if (typeof raw !== 'string') return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

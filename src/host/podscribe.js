/** Public Qiaomu transcript directory. Slugs come from this API, never URLs. */
const BASE = 'https://api.qiaomu.ai/podscribe/v1';
const slug = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,119}$/.test(value);

async function get(path) {
  const response = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(25_000) });
  const body = await response.json();
  if (!response.ok || body?.ok !== true) {
    const code = body?.error?.code;
    if (code === 'rate_limited') throw new Error('播客接口请求过于频繁，请稍后重试');
    if (code === 'not_found') throw new Error('这期节目已无法获取，请刷新列表');
    throw new Error(`播客接口暂时不可用（${response.status}）`);
  }
  return body.data;
}

export async function searchShows(query) {
  const q = String(query ?? '').trim();
  if (q.length < 2 || q.length > 100) throw new Error('请输入 2–100 个字符搜索播客');
  const data = await get(`/search?q=${encodeURIComponent(q)}&type=podcasts`);
  return Array.isArray(data?.podcasts) ? data.podcasts.filter(show => slug(show.slug)) : [];
}

export async function listEpisodes(show, page = 1) {
  if (!slug(show) || !Number.isInteger(page) || page < 1 || page > 100) throw new Error('无效的播客或页码');
  const data = await get(`/podcasts/${show}/episodes?page=${page}`);
  return Array.isArray(data?.episodes) ? data.episodes.filter(ep => slug(ep.episode_slug)) : [];
}

export async function fetchTranscript(show, episode) {
  if (!slug(show) || !slug(episode)) throw new Error('无效的播客单集');
  const data = await get(`/episodes/${show}/${episode}/transcript?segments=false`);
  const text = data?.transcript?.full_text;
  if (typeof text !== 'string' || !text.trim()) throw new Error('这期节目暂无原文转写');
  return { text, episode: data.episode, podcast: data.podcast };
}

export function transcriptArticle(show, episode, result) {
  const title = result.episode?.title || episode;
  const showName = result.podcast?.name || show;
  const escaped = result.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = escaped.split(/\n\s*\n/).filter(Boolean).map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`).join('');
  return {
    key: `podscribe:${show}/${episode}`, id: `${show}/${episode}`, channelKey: 'podscribe', channelName: showName,
    title, author: showName, url: `https://podcasts.happyscribe.com/${show}/${episode}`,
    publishedAt: result.episode?.published_at || undefined,
    summary: `${showName} · 原文转写`, html, transcriptText: result.text, truncated: false,
  };
}

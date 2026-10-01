/**
 * Durable plugin data: one JSON document under the harness home's storages
 * directory, written atomically with a short debounce. Read state, favorites,
 * AI-generated versions, and the recent-article cache live here — vault-free,
 * like the Obsidian plugin's own data.json.
 */
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';

const MAX_ARTICLE_BODIES = 300;
const MAX_READ_IDS = 5_000;

export function dataFilePath() {
  return join(resolveDshHome(), 'storages', 'qiaomu-rss', 'data.json');
}

function defaults() {
  return {
    version: 1,
    settings: {
      origin: 'https://rss.qiaomu.ai',
      aiAssist: true,
      showImages: true,
    },
    subscriptions: [],
    qiaomuSources: { fetchedAt: undefined, sources: [] },
    qiaomuStream: { fetchedAt: undefined, entries: [] },
    qiaomuChannels: {},
    podcastEntries: [],
    collection: { enabled: false, accounts: {}, jobs: [] },
    articles: {},
    favorites: {},
    read: {},
    ai: {},
    recent: [],
    annotations: [],
    companionContexts: {},
  };
}

export class RssStore {
  constructor(logger) {
    this.logger = logger;
    this.path = dataFilePath();
    this.data = defaults();
    this.saveTimer = undefined;
    this.saving = Promise.resolve();
  }

  async load() {
    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw);
      this.data = { ...defaults(), ...parsed };
      this.data.settings = { ...defaults().settings, ...(parsed.settings ?? {}) };
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw new Error('qiaomu-rss: cannot read saved data; refusing to overwrite it', { cause: error });
      }
      this.data = defaults();
    }
  }

  /** Schedule a debounced atomic save (500 ms). */
  touch() {
    if (this.saveTimer !== undefined) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      void this.flush().catch(() => {});
    }, 500);
  }

  /** Write the document through a temp file + rename, serialized. */
  async flush() {
    this.saving = this.saving.catch(() => {}).then(async () => {
      try {
        await mkdir(dirname(this.path), { recursive: true });
        const temp = `${this.path}.${process.pid}.tmp`;
        await writeFile(temp, JSON.stringify(this.data), { encoding: 'utf8', mode: 0o600 });
        await rename(temp, this.path);
      } catch (error) {
        this.logger?.warn?.('qiaomu-rss: failed to save data: %s', String(error));
        throw error;
      }
    });
    return this.saving;
  }

  async dispose() {
    if (this.saveTimer !== undefined) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    await this.flush();
  }

  // ---- read / favorites -------------------------------------------------

  markRead(keys, read) {
    for (const key of keys) {
      if (read) this.data.read[key] = Date.now();
      else delete this.data.read[key];
    }
    this.trimRead();
    this.touch();
  }

  trimRead() {
    const keys = Object.keys(this.data.read);
    if (keys.length <= MAX_READ_IDS) return;
    keys.sort((a, b) => this.data.read[a] - this.data.read[b]);
    for (const key of keys.slice(0, keys.length - MAX_READ_IDS)) delete this.data.read[key];
  }

  setFavorite(key, favorite, article) {
    if (favorite) this.data.favorites[key] = { savedAt: Date.now() };
    else delete this.data.favorites[key];
    this.touch();
  }

  isFavorite(key) {
    return this.data.favorites[key] !== undefined;
  }

  // ---- article cache ----------------------------------------------------

  putArticle(article) {
    const existing = this.data.articles[article.key];
    this.data.articles[article.key] = { ...article, fetchedAt: Date.now() };
    const recentIndex = this.data.recent.indexOf(article.key);
    if (recentIndex !== -1) this.data.recent.splice(recentIndex, 1);
    this.data.recent.push(article.key);
    this.trimArticles();
    this.touch();
    return existing;
  }

  getArticle(key) {
    return this.data.articles[key];
  }

  trimArticles() {
    const pinned = new Set([...Object.keys(this.data.favorites), ...this.data.recent.slice(-40), ...(this.data.annotations ?? []).filter(n => !n.deletedAt).map(n => n.key)]);
    const keys = Object.keys(this.data.articles);
    if (keys.length <= MAX_ARTICLE_BODIES) return;
    const byFetch = keys.sort((a, b) => (this.data.articles[b].fetchedAt ?? 0) - (this.data.articles[a].fetchedAt ?? 0));
    for (const key of byFetch.slice(MAX_ARTICLE_BODIES)) {
      if (pinned.has(key)) continue;
      delete this.data.articles[key];
    }
    this.data.recent = this.data.recent.filter((key) => this.data.articles[key] !== undefined || pinned.has(key));
    this.touch();
  }

  // ---- AI versions ------------------------------------------------------

  putAiVersion(key, kind, version) {
    const record = this.data.ai[key] ?? {};
    record[kind] = version;
    this.data.ai[key] = record;
    this.touch();
  }

  getAiVersion(key, kind) {
    return this.data.ai[key]?.[kind];
  }

  // ---- subscriptions ----------------------------------------------------

  addSubscription(sub) {
    this.data.subscriptions.push(sub);
    this.touch();
  }

  removeSubscription(id) {
    const before = this.data.subscriptions.length;
    this.data.subscriptions = this.data.subscriptions.filter((sub) => sub.id !== id);
    this.touch();
    return this.data.subscriptions.length !== before;
  }

  findSubscriptionByUrl(url) {
    const normalized = url.replace(/\/+$/, '');
    return this.data.subscriptions.find((sub) => sub.url.replace(/\/+$/, '') === normalized);
  }

  subscriptionById(id) {
    return this.data.subscriptions.find((sub) => sub.id === id);
  }

  /** Find a personal-feed entry by its article key across all subscriptions. */
  findFeedEntry(key) {
    for (const sub of this.data.subscriptions) {
      const hit = (sub.entries ?? []).find((entry) => entry.key === key);
      if (hit) return hit;
    }
    return undefined;
  }

  async reset() {
    this.data = defaults();
    await this.flush();
  }
}

/** Remove the data file entirely (used by the reset-to-factory tool path). */
export async function deleteDataFile() {
  await rm(dataFilePath(), { force: true });
}

export { defaults as defaultData, MAX_ARTICLE_BODIES };

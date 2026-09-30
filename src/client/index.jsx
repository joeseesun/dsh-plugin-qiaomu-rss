/**
 * qiaomu-rss client half: mounts the `rss` Remote namespace and registers the
 * reading panel (sidebar icon + `main` page). Built into a single
 * `window.__ModuleLoader__` bundle; react / primitives stay external.
 */
import { NativeConversation } from './NativeConversation.jsx';
import { nativeChatBridge } from './native-chat.js';
import { ReaderIcon } from './ReaderPage.jsx';
import { ReaderPanel } from './ReaderBoundary.jsx';

const PLUGIN_ID = 'dsh-plugin-qiaomu-rss';
export const PANEL_ID = 'qiaomu-rss';

/** Duck-typed codec stub: the client never parses payloads, it forwards JSON. */
const codec = () => ({
  mode: 'strict',
  typeSymbol: `${PLUGIN_ID}#json`,
  create: () => ({ parse: (value) => value, safeParse: (value) => ({ success: true, data: value }) }),
});

function method(method, params = true) {
  return {
    id: `${PLUGIN_ID}#rss/${method}`,
    service: 'rss',
    namespace: 'rss',
    method,
    invocation: { kind: 'direct' },
    ...(params ? { parameters: [{ name: 'request', wire: 'request', source: 'json', codec: codec() }] } : { parameters: [] }),
    result: { mode: 'src-json' },
    cancellation: { parameter: 'signal' },
  };
}

const TYPERT_REMOTE = {
  package: PLUGIN_ID,
  descriptors: [
    method('listChannels', false),
    method('listEntries'),
    method('searchArticles'),
    method('getArticle'),
    method('getVersionContent'),
    method('generateVersion'),
    method('refresh'),
    method('listSubscriptions', false),
    method('addSubscription'),
    method('removeSubscription'),
    method('updateSubscription'),
    method('opmlPreview'),
    method('opmlImport'),
    method('opmlExport', false),
    method('setRead'),
    method('setFavorite'),
    method('getSettings', false),
    method('saveSettings'),
    ...['prepareChat','setReadingContext'].map(name => method(name)),
  ],
};

export const inject = ['slots', 'layout', 'remote'];

/**
 * Register the reader panel.
 * @param ctx - browser Cordis root with slots/layout/remote services.
 */
export async function apply(ctx) {
  try {
    await ctx.remote.$mount(TYPERT_REMOTE);
  } catch (error) {
    ctx.logger?.error?.('qiaomu-rss: failed to mount the rss Remote namespace: %o', error);
    throw error;
  }

  // Mounting publishes the namespace; it does not grant this context access.
  // Wait in a child fiber so the provider can mount before its consumer starts.
  ctx.inject(['remote.rss'], (child) => registerReader(child));
}

function registerReader(ctx) {
  const call = async (name, ...args) => {
    const namespace = ctx.remote.rss;
    if (!namespace || typeof namespace[name] !== 'function') {
      throw new Error('qiaomu-rss 阅读服务未就绪,请稍后重试');
    }
    const result = await namespace[name](...args);
    if (result.ok) return result.value;
    throw result.error;
  };

  const api = {
    ...nativeChatBridge(ctx),
    prepareChat: (params) => call('prepareChat', params),
    setReadingContext: (params) => call('setReadingContext', params),
    listChannels: () => call('listChannels'),
    listEntries: (params) => call('listEntries', params),
    getArticle: (key) => call('getArticle', { key }),
    generateVersion: (key, kind) => call('generateVersion', { key, kind }),
    refresh: (channel) => call('refresh', { channel }),
    addSubscription: (params) => call('addSubscription', params),
    removeSubscription: (id) => call('removeSubscription', { id }),
    listSubscriptions: () => call('listSubscriptions'),
    updateSubscription: (params) => call('updateSubscription', params),
    opmlPreview: (params) => call('opmlPreview', params),
    opmlImport: (xml, urls) => call('opmlImport', { xml, urls }),
    opmlExport: () => call('opmlExport'),
    setRead: (keys, read) => call('setRead', { keys, read }),
    setFavorite: (key, favorite) => call('setFavorite', { key, favorite }),
    getSettings: () => call('getSettings'),
    saveSettings: (patch) => call('saveSettings', { patch }),
  };

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    children: { 'qiaomu-rss.chat': { kind: 'single', scope: 'session' } },
    inject: () => ({ api }),
  }, ReaderPanel));
  ctx.slots.inject('qiaomu-rss.chat', () => ctx.slots.register({ name:'qiaomu-rss.chat' }, NativeConversation));
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 15,
    label: '乔木 RSS',
  }, ReaderIcon));
}

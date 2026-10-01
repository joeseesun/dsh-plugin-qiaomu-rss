/**
 * Client panel render tests: load lib/client.js in a fake __ModuleLoader__,
 * run apply() against a fake ctx, then drive the reader UI with jsdom + React
 * and assert the original layout structure. Needs dev deps; point
 * QMR_TEST_DEPENDENCIES at a package.json that resolves react/react-dom/jsdom.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const dependencyRequire = createRequire(process.env.QMR_TEST_DEPENDENCIES || import.meta.url);
const { JSDOM } = dependencyRequire('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true,
});
const define = (name, value) => { try { Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); } catch {} };
globalThis.window = dom.window;
define('document', dom.window.document);
define('navigator', dom.window.navigator);
define('localStorage', dom.window.localStorage);
define('HTMLElement', dom.window.HTMLElement);
define('Element', dom.window.Element);
define('Node', dom.window.Node);
define('getComputedStyle', dom.window.getComputedStyle);
define('requestAnimationFrame', (cb) => setTimeout(cb, 0));
define('cancelAnimationFrame', (id) => clearTimeout(id));

const req = dependencyRequire;
const React = req('react');
const ReactDOMClient = req('react-dom/client');

let pluginExports;
globalThis.window.__ModuleLoader__ = {
  load({ factory }) {
    pluginExports = factory((name) => {
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return req('react/jsx-runtime');
      if (name === 'react-dom') return req('react-dom');
      if (name === 'react-dom/client') return ReactDOMClient;
      throw new Error(`unexpected client require: ${name}`);
    });
  },
};

await req(fileURLToPath(new URL('../lib/client.js', import.meta.url)));
if (!pluginExports?.apply) throw new Error('client bundle did not expose apply');

const registrations = {};
const mounted = [];
const fakeCtx = {
  logger: { info() {}, warn() {}, error(...args) { console.error('LOGGER.ERROR', ...args); } },
  remote: {
    async $mount(descriptor) { mounted.push(descriptor); },
    get rss() { throw new Error('cannot get property "remote.rss" without inject'); },
  },
  inject(dependencies, callback) {
    if (dependencies.includes('sessions')) return;
    if (!dependencies.includes('remote.rss')) throw new Error('missing rss namespace dependency');
    return callback({ ...this, remote: { rss: new Proxy({}, {
      get(_target, name) {
        return async (...args) => ({ ok: true, value: await api[name](...args) });
      },
    }) } });
  },
  slots: {
    inject(_name, registrar) { return registrar(); },
    register(props, component) { registrations[props.name] = { props, component }; return props; },
  },
  effect(fn) { return fn(); },
};
await pluginExports.apply(fakeCtx);
if (mounted[0].descriptors.length < 20) throw new Error('remote descriptors missing');
if (registrations['sidebar.panellist']?.props?.id !== 'qiaomu-rss') throw new Error('sidebar registration wrong');
console.log('bundle: descriptors', mounted[0].descriptors.length, '| sidebar id', registrations['sidebar.panellist'].props.id, '| order', registrations['sidebar.panellist'].props.order);

const ARTICLES = [
  { key: 'qiaomu:1', channelKey: 'qiaomu:blog', channelName: "Simon Willison's Weblog", title: 'The Strangest Idea in the World', titleZh: '研究加速：OpenAI 内部视角', publishedAt: '2026-09-07T10:00:00.000Z', read: false, favorite: false, summary: 'OpenAI 今天发布了《Research acceleration》…', image: undefined },
  { key: 'qiaomu:2', channelKey: 'qiaomu:blog', channelName: 'Gary Marcus', title: 'Typewriter interview', publishedAt: '2026-09-06T10:00:00.000Z', read: true, favorite: true, summary: '几个钟头前，黄仁勋公开宣布…', image: 'https://example.org/x.png' },
];

const apiCalls = [];
const apiArgs = [];
let generatedOnce = false;
let delayNextArticle = false;
let unblockArticle;
const api = new Proxy({}, {
  get(_target, name) {
    return (...args) => {
      apiCalls.push(name); apiArgs.push({ name, args });
      if (name === 'listChannels') return Promise.resolve({ channels: [
        { key: 'all', kind: 'aggregate', name: '全部订阅', unread: 1, total: 0 },
        { key: 'qiaomu', kind: 'qiaomu', name: '乔木精选', unread: 1, total: 2 },
        { key: 'qiaomu:blog', kind: 'qiaomu', name: '乔木博客', unread: 1, total: 2 },
        { key: 'feeds:all', kind: 'aggregate', name: '我的订阅', unread: 0, total: 0 },
        { key: 'group:AI 与技术', kind: 'aggregate', name: 'AI 与技术', unread: 0, total: 0 },
        { key: 'feed:abc', kind: 'feed', name: '测试源', group: 'AI 与技术', url: 'https://example.org/rss', unread: 0, total: 0 },
        { key: 'feed:featured', kind: 'feed', name: '潮流周刊 · Tw93', url: 'https://weekly.tw93.fun/rss.xml', unread: 0, total: 2 },
      ] });
      if (name === 'getSettings') return Promise.resolve({ settings: { origin: 'https://rss.qiaomu.ai', defaultVersion: 'original', fontSize: 19, lineHeight: 1.9, textWidth: 36, readingFont: 'serif', readingTheme: 'auto', showImages: true, aiAssist: true } });
      if (name === 'listSubscriptions') return Promise.resolve({ subscriptions: [{ id: 'abc', name: '测试源', url: 'https://example.org/rss', group: 'AI 与技术' }, { id:'featured', name:'潮流周刊 · Tw93', url:'https://weekly.tw93.fun/rss.xml' }] });
      if (name === 'listEntries') return Promise.resolve(args[0]?.cursor
        ? { entries: [{ key: 'qiaomu:3', channelName: '乔木博客', title: 'Earlier article', publishedAt: '2026-09-01T10:00:00.000Z', read: true }], hasMore: false }
        : { entries: ARTICLES, hasMore: true, nextCursor: 'older' });
      if (name === 'getArticle') { const result = {
        article: name === 'getArticle' && args[0]?.key === 'qiaomu:2'
          ? { key: 'qiaomu:2', title: ARTICLES[1].title, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', read: true, favorite: true }
          : { key: 'qiaomu:1', title: ARTICLES[0].title, titleZh: ARTICLES[0].titleZh, channelName: '乔木博客', url: 'https://example.org/a', audio: 'https://example.org/episode.mp3', author: 'Adam', publishedAt: '2026-09-07T10:00:00.000Z', read: false, favorite: false },
        html: '<p>Full <strong>body</strong> text</p>',
        versions: {
          translation: generatedOnce ? { available: true, source: 'local', markdown: '# 本地译文标题\n\n本地生成的译文正文' } : { available: false, status: 'missing' },
          rewrite: { available: true, source: 'qiaomu', markdown: '# 乔木改写标题\n\n改写正文段落' },
        },
      }; return delayNextArticle ? new Promise(resolve => { unblockArticle = () => { delayNextArticle = false; resolve(result); }; }) : Promise.resolve(result); }
      if (name === 'generateVersion') { generatedOnce = true; return Promise.resolve({ title: '本地译文标题', markdown: '# 本地译文标题\n\n本地生成的译文正文', source: 'local' }); }
      if (name === 'saveSettings') return Promise.resolve({ settings: args[0] });
      if (name === 'opmlPreview') return Promise.resolve({ xml: '<opml/>', entries: [{ name: 'New feed', url: 'https://new.example/rss' }, { name: 'Dup', url: 'https://example.org/rss', duplicate: true }] });
      if (name === 'opmlImport') return Promise.resolve({ added: 1, skipped: 0 });
      return Promise.resolve({});
    };
  },
});

const container = document.getElementById('root');
ReactDOMClient.createRoot(container).render(React.createElement(registrations.main.component, registrations.main.props.inject()));
const tick = () => new Promise((resolve) => setTimeout(resolve, 30));
for (let i = 0; i < 8; i += 1) await tick();
const text = () => container.textContent;
const button = (label, root = container) => [...root.querySelectorAll('button')].find((element) => element.textContent.trim() === label);
const buttonHas = (label, root = container) => [...root.querySelectorAll('button')].find((element) => element.textContent.includes(label));

// ---- layout ---------------------------------------------------------------
for (const selector of ['.qrs-root', '.qrs-layout', '.qrs-sidebar', '.qrs-sidebar-toolbar', '.qrs-channel', '.qrs-filters', '.qrs-list', '.qrs-resize', '.qrs-reader']) {
  if (!container.querySelector(selector)) throw new Error(`missing layout element ${selector}`);
}
if (!container.querySelector('.qrs-welcome')) throw new Error('welcome empty state missing');
const channelLabel = container.querySelector('.qrs-channel-label')?.textContent;
if (channelLabel !== '乔木精选') throw new Error(`channel button label wrong: ${channelLabel}`);
for (const label of ['全部', '未读', '收藏']) if (!button(label)) throw new Error(`filter pill missing: ${label}`);
if (!container.querySelector('.qrs-settings-button')) throw new Error('settings icon missing');
console.log('LAYOUT OK — channel button, filter pills, resize handle, reader, welcome state');

// ---- list rows ------------------------------------------------------------
const rows = [...container.querySelectorAll('.qrs-entry')];
if (rows.length !== 2) throw new Error(`expected 2 entries, got ${rows.length}`);
if (rows[0].querySelector('.qrs-source-name')?.textContent !== ARTICLES[0].channelName || rows[1].querySelector('.qrs-source-name')?.textContent !== ARTICLES[1].channelName) throw new Error('different sources sharing a channel key must remain visible');
if (!rows[0].querySelector('.qrs-entry-meta .qrs-date')?.textContent) throw new Error('date missing in entry meta');
if (!rows[0].querySelector('h3')?.textContent.includes('研究加速')) throw new Error('localized title missing');
if (!rows[0].querySelector('.qrs-summary')?.textContent.includes('Research acceleration')) throw new Error('summary excerpt missing');
if (!rows[0].querySelector('.qrs-unread-dot')) throw new Error('unread dot missing');
if (!rows[1].querySelector('.qrs-read-dot')) throw new Error('read dot missing');
if (!rows[1].querySelector('.qrs-bookmarked')) throw new Error('bookmark marker missing');
if (!rows[1].querySelector('.qrs-entry-thumb img')) throw new Error('thumbnail missing');
console.log('LIST ROWS OK — meta/date, unread+read dots, bookmark, summary, thumbnail');

// ---- open article + reader toolbar ----------------------------------------
delayNextArticle = true;
rows[0].click();
await tick();
if (!container.querySelector('.qrs-article-loading[aria-label="正在加载文章"]') || container.querySelector('.qrs-welcome')) throw new Error('article skeleton did not replace welcome while loading');
unblockArticle();
for (let i = 0; i < 6; i += 1) await tick();
if (!container.querySelector('.qrs-article h1')?.textContent.includes('研究加速')) throw new Error('article title missing');
if (!container.querySelector('.qrs-prose')?.textContent.includes('Full')) throw new Error('article body missing');
if (!container.querySelector('.qrs-article-head .qrs-mode-chip')) throw new Error('version chip missing');
const mode = container.querySelector('.qrs-mode-select');
if (!mode || mode.options.length !== 3) throw new Error('reading-version select missing');
for (const selector of ['.qrs-reader-toolbar', '.qrs-reader-nav', '.qrs-actions']) if (!container.querySelector(selector)) throw new Error(`missing ${selector}`);
if (container.querySelectorAll('.qrs-actions .qrs-icon').length !== 4) throw new Error('reader action icons missing');
if (!apiCalls.includes('setRead')) throw new Error('opening an unread article did not mark it read');
if (container.querySelector('.qrs-article .qrs-article-audio audio')?.getAttribute('src') !== 'https://example.org/episode.mp3') throw new Error('podcast player did not open with article');
console.log('READER OK — head chip, h1, prose, version select, nav, four reader actions');

// ---- version switching ----------------------------------------------------
mode.value = 'rewrite';
mode.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
await tick();
if (!container.querySelector('.qrs-prose')?.textContent.includes('改写正文段落')) throw new Error('rewrite version not rendered');
mode.value = 'translation';
mode.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
await tick();
if (!text().includes('Harness 默认模型生成')) throw new Error('missing-version prompt not shown');
buttonHas('Harness 默认模型生成').click();
for (let i = 0; i < 10; i += 1) await tick();
if (!container.querySelector('.qrs-prose')?.textContent.includes('本地生成的译文正文')) throw new Error('generated translation not rendered');
console.log('VERSIONS OK — published rewrite, missing prompt, local generation');

// ---- more menu / reading settings ----------------------------------------
container.querySelector('.qrs-actions button[aria-label="更多操作"]').click();
await tick();
for (const item of ['阅读设置', '问 AI', '打印 / 存为 PDF', '打开原文']) if (!button(item)) throw new Error(`more-menu item missing: ${item}`);
button('阅读设置').click();
await tick();
const appearance = container.querySelector('.qrs-reading-settings');
if (!appearance) throw new Error('reading settings popover missing');
for (const label of ['字体', '字号', '行距', '版心宽度']) if (!appearance.textContent.includes(label)) throw new Error(`appearance field missing: ${label}`);
if (!appearance.querySelector('input[type=range]')) throw new Error('appearance range control missing');
button('完成', appearance).click();
await tick();
console.log('MENU + APPEARANCE OK — more menu items and 阅读设置 popover fields');

// ---- channel picker -------------------------------------------------------
container.querySelector('.qrs-channel').click();
await tick();
const picker = container.querySelector('.qrs-channel-picker');
if (!picker) throw new Error('channel picker missing');
for (const section of ['聚合', '订阅分组', '乔木频道', '我的订阅源']) if (!picker.textContent.includes(section)) throw new Error(`picker section missing: ${section}`);
if (!picker.querySelector('[aria-current="true"]')) throw new Error('current channel not marked in picker');
const search = picker.querySelector('input[type=search]');
Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(search, '测试源');
search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
await tick();
if (container.querySelectorAll('.qrs-channel-option').length !== 1) throw new Error('picker search did not filter');
container.querySelectorAll('.qrs-channel-option')[0].click();
for (let i = 0; i < 3; i += 1) await tick();
if (localStorage.getItem('qrs.channel') !== 'feed:abc') throw new Error('picker selection did not switch channel');
if (!apiArgs.some((call) => call.name === 'refresh' && call.args[0]?.channel === 'feed:abc')) throw new Error('empty channel did not refresh automatically');
console.log('CHANNEL PICKER OK — sections, current marker, search, selection');

// ---- pagination + focus ---------------------------------------------------
button('加载更早文章').click();
await tick(); await tick();
if (!text().includes('Earlier article')) throw new Error('pagination did not append');
container.querySelector('.qrs-entry').click();
for (let i = 0; i < 4; i += 1) await tick();
container.querySelector('.qrs-reader-toolbar button[aria-label="专注阅读"]').click();
await tick();
if (!container.querySelector('.qrs-root').className.includes('qrs-focus')) throw new Error('focus mode not applied');
container.querySelector('.qrs-reader-toolbar button[aria-label="显示列表"]').click();
await tick();
console.log('PAGINATION + FOCUS OK');

// Selecting article text opens the companion directly; the old floating bar is gone.
const prose = container.querySelector('.qrs-prose');
const firstText = prose?.querySelector('p')?.firstChild;
if (!firstText?.textContent) throw new Error('article selection fixture missing');
const range = document.createRange();
range.setStart(firstText, 0);
range.setEnd(firstText, Math.min(8, firstText.textContent.length));
window.getSelection().removeAllRanges();
window.getSelection().addRange(range);
prose.dispatchEvent(new dom.window.MouseEvent('mouseup', { bubbles: true }));
await tick();
if (!container.querySelector('.qrs-companion')) throw new Error('selection did not open companion');
if (!container.querySelector('.qrs-workarea.has-companion .qrs-sidebar')) throw new Error('article list unmounted when companion opened');
if (container.querySelector('.qrs-selection-bar')) throw new Error('legacy selection toolbar still visible');
if (!container.querySelector('.qrs-actions .lucide-wand-sparkles')) throw new Error('Lucide wand icon missing');
container.querySelector('.qrs-reader-toolbar button[aria-label="选择频道"]').click();
await tick();
if (!container.querySelector('.qrs-channel-picker')) throw new Error('reader top-left did not open channels in companion mode');
container.querySelector('.qrs-channel-close').click();
container.querySelector('.qrs-companion-header button[aria-label="关闭伴读"]').click();
await tick();
console.log('COMPANION OK — text selection, Lucide wand, channel entry, no floating toolbar');

// The Harness edition has no note or daily-journal actions.
for (const label of ['存为 Markdown','阅读笔记','摘录选中文字到工作区日记','导出文章到工作区日记']) {
  if (container.querySelector(`[aria-label="${label}"]`) || button(label)) throw new Error(`legacy note action still visible: ${label}`);
}
console.log('NOTELESS HARNESS UI OK');

// ---- settings dialog (subscriptions + OPML) -------------------------------
container.querySelector('.qrs-settings-button').click();
for (let i = 0; i < 4; i += 1) await tick();
if (!container.querySelector('.qrs-settings-page[aria-label="乔木 RSS 设置"]')) throw new Error('settings dialog missing');
if (!text().includes('文章外观')) throw new Error('reading settings missing');
const tabs = container.querySelectorAll('.qrs-settings-tabs button');
if (tabs.length !== 4) throw new Error('settings navigation incomplete');
button('订阅管理', container.querySelector('.qrs-settings-tabs')).click();
await tick();
if (!container.querySelector('.qrs-subscriptions[aria-label="管理订阅"]')) throw new Error('subscription manager missing from settings');
if (container.querySelector('.qrs-subscriptions-toolbar').textContent.includes('获取失败')) throw new Error('failed-fetch filter should not appear without failed subscriptions');
if (!text().includes('导入 OPML')) throw new Error('OPML import missing from settings');
container.querySelector('button[aria-label="编辑 测试源"]').click();
await tick();
if (!container.querySelector('.qrs-subscription-editor[aria-modal="true"] input[aria-label="订阅名称"]')) throw new Error('subscription editor must open as a modal');
container.querySelector('button[aria-label="关闭编辑"]').click();
await tick();
container.querySelector('button[aria-label="编辑分组 AI 与技术"]').click();
await tick();
if (!container.querySelector('.qrs-subscription-editor[aria-label="编辑订阅分组"]')) throw new Error('group editor missing');
container.querySelector('button[aria-label="关闭分组编辑"]').click();
await tick();
button('快捷提示词', container.querySelector('.qrs-settings-tabs')).click();
await tick();
if (!text().includes('概括要点') || !container.querySelector('.qrs-prompt-manager')) throw new Error('quick prompt management missing');
container.querySelector('button[aria-label="编辑 概括要点"]').click();
await tick();
if (!container.querySelector('.qrs-subscription-editor[aria-label="编辑提示词"] textarea')) throw new Error('prompt editor missing');
container.querySelector('.qrs-subscription-editor button[aria-label="关闭"]').click();
await tick();
button('关于', container.querySelector('.qrs-settings-tabs')).click();
await tick();
if (!text().includes('打赏支持') || !container.querySelector('img[alt="向阳乔木打赏二维码"]')) throw new Error('about/support settings missing');
console.log('SETTINGS OK — reading, subscriptions/OPML, quick prompts, about/support');

// Discovery keeps filtering and the add action within a compact, scrollable list.
container.querySelector('.qrs-settings-head button[aria-label="关闭设置"]').click();
await tick();
container.querySelector('.qrs-channel').click();
await tick();
container.querySelector('button[aria-label="探索订阅"]').click();
await tick();
const discover = container.querySelector('.qrs-discover');
if (!discover?.querySelector('.qrs-discover-results')) throw new Error('discovery list missing');
if (container.querySelector('.qrs-channel-picker')) throw new Error('channel picker overlaps discovery');
if (discover.querySelectorAll('.qrs-discover-row').length < 10) throw new Error('too few discovery results');
if (!discover.querySelector('.qrs-discover-row .qrs-discover-add')) throw new Error('feed action is outside its row');
const featuredTab = [...discover.querySelectorAll('.qrs-discover-categories button')].find((node) => node.textContent === '精选作者');
featuredTab.click();
await tick();
if (discover.querySelectorAll('.qrs-discover-row').length !== 9) throw new Error('featured category did not filter');
if (discover.querySelector('.qrs-discover-row .qrs-discover-info span')?.textContent.includes('https://')) throw new Error('feed URL is not compact');
const readSubscribed = discover.querySelector('button[aria-label="阅读 潮流周刊 · Tw93"]');
if (!readSubscribed || !readSubscribed.nextElementSibling?.textContent.includes('已订阅')) throw new Error('subscribed feed lacks a reading action');
readSubscribed.click();
await tick();
if (container.querySelector('.qrs-discover') || localStorage.getItem('qrs.channel') !== 'feed:featured') throw new Error('reading a subscribed feed did not switch channels');
container.querySelector('button[aria-label="探索订阅"]').click();
await tick();
const reopened = container.querySelector('.qrs-discover');
const podcastTab = [...reopened.querySelectorAll('.qrs-discover-categories button')].find((node) => node.textContent === '播客');
if (!podcastTab) throw new Error('podcast discovery category missing');
podcastTab.click();
await tick();
if (!reopened.textContent.includes('73 个结果') || !reopened.querySelector('.qrs-discover-row .qrs-discover-add')) throw new Error('podcast feeds are not available to subscribe');
const transcriptTab = [...reopened.querySelectorAll('.qrs-discover-categories button')].find((node) => node.textContent === '海外播客原文');
if (!transcriptTab) throw new Error('transcript discovery category missing');
transcriptTab.click();
await tick();
if (!reopened.querySelector('input[aria-label="搜索海外播客"]') || !reopened.textContent.includes('获取完整原文')) throw new Error('transcript search is not available');
console.log('DISCOVERY OK — compact rows, category filtering, inline action');

container.querySelector('.qrs-discover .qrs-discover-close')?.click();
container.querySelectorAll('.qrs-entry')[1].click();
for (let i = 0; i < 4; i += 1) await tick();
if (container.querySelector('.qrs-video-frame')?.getAttribute('src') !== 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ') throw new Error('YouTube article link did not render video player');
if (container.querySelector('audio')) throw new Error('previous article audio must be removed when switching articles');
if (!container.querySelector('.qrs-article .qrs-video-frame')) throw new Error('video player must be inside article details');

console.log('CLIENT RENDER TESTS PASSED');
process.exit(0);

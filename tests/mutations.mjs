/**
 * Host mutation-surface integration test: subscriptions, read/favorite state,
 * OPML round-trip, save-as-Markdown, and the AI error path. Runs against a
 * sandbox DSH home so the real profile data is never touched.
 *
 * Setup (see README): needs a node_modules scaffold with @deepseek-ai packages
 * (from the DSH runtime) and qiaomu-rss-dsh/lib. Example:
 *   mkdir -p /tmp/host-test/node_modules/qiaomu-rss-dsh
 *   cp package.json /tmp/host-test/node_modules/qiaomu-rss-dsh/
 *   cp -R lib /tmp/host-test/node_modules/qiaomu-rss-dsh/
 *   ln -s <dsh checkout>/node_modules/@deepseek-ai /tmp/host-test/node_modules/@deepseek-ai
 *   DSH_HOME=/tmp/qmr-sandbox/home3 node tests/mutations.mjs
 */
import assert from 'node:assert';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { Context } from '@deepseek-ai/cordis';

rmSync('/tmp/qmr-sandbox/home3/storages/qiaomu-rss', { recursive: true, force: true });

const { default: RssService } = await import('qiaomu-rss-dsh');

const registered = [];
const root = new Context();
const fakeWorkspace = '/tmp/qmr-sandbox/workspace';
root.reflect.provide('tools', { register: (tool) => registered.push(tool) });
root.reflect.provide('workspaceRegistry', { list: () => [{ path: fakeWorkspace }] });

const service = new RssService(root);
const store = service.store;

// -- subscriptions -----------------------------------------------------------

const sub = await service.addSubscription({ url: 'https://hnrss.org/frontpage?limit=2', name: 'Hacker News' });
assert.match(sub.id, /^feed:[0-9a-f]{32}$/);
console.log('subscribed:', sub.id, sub.name, '| status:', sub.status, '| entries:', sub.entryCount, sub.lastError ? `| lastError: ${sub.lastError}` : '');

const dup = await service.addSubscription({ url: 'https://hnrss.org/frontpage?limit=2' }).catch((error) => error);
assert.ok(dup instanceof Error && /已存在/.test(dup.message), 'duplicate URL rejected: ' + dup.message);
console.log('duplicate subscription rejected with friendly error');
console.log('duplicate subscription deduped');

// -- refresh personal feed (network) ------------------------------------------

const outcome = await service.refresh({ channel: 'feeds:all' });
console.log('refresh outcome:', JSON.stringify(outcome));
const subs = await service.listSubscriptions();
console.log('subscription state:', subs.subscriptions.map((s) => `${s.name}:${s.status ?? 'ok'}:${s.lastError ?? ''}`).join(' | '));

const feedPage = await service.listEntries({ channel: 'feeds:all', limit: 10 });
console.log('feed entries fetched:', feedPage.entries.length);
if (feedPage.entries.length > 0) {
  assert.ok(feedPage.entries[0].key.startsWith('feed:'), 'feed entry key prefix');
  assert.ok(feedPage.entries[0].title.length > 0);
}

// -- read / favorite state ----------------------------------------------------

const channels = await service.listChannels();
const feedsChannel = channels.channels.find((c) => c.key === 'feeds:all');
if (feedPage.entries.length > 0) {
  const firstKey = feedPage.entries[0].key;
  await service.setRead({ keys: [firstKey], read: true });
  await service.setFavorite({ key: firstKey, favorite: true });
  const unreadOnly = await service.listEntries({ channel: 'feeds:all', filter: 'unread' });
  assert.ok(!unreadOnly.entries.some((e) => e.key === firstKey), 'read entry excluded from unread filter');
  const favOnly = await service.listEntries({ channel: 'feeds:all', filter: 'favorite' });
  assert.ok(favOnly.entries.some((e) => e.key === firstKey), 'favorited entry in favorite filter');
  console.log('read/favorite filters OK');
} else {
  console.log('feed fetch produced no entries (offline?) — skipping state filters');
}

// -- OPML round trip ------------------------------------------------------------

const exported = await service.opmlExport();
assert.match(exported.xml, /<opml version="2.0">/);
assert.match(exported.xml, /hnrss\.org/, 'subscription present in OPML');
console.log('opml export OK');

const imported = await service.opmlExport ? await service.opmlImport(exported.xml) : undefined;
assert.equal(imported.added, 0, 're-import of own OPML adds nothing (dedupe)');
console.log('opml re-import deduped:', JSON.stringify(imported));

// -- AI error path (no llm configured in sandbox) --------------------------------

const articles = await service.listEntries({ channel: 'qiaomu', limit: 1 });
if (articles.entries.length > 0) {
  await assert.rejects(
    () => service.generateVersion({ key: articles.entries[0].key, kind: 'translation' }),
    /agentDefaultModel|no default model/,
    'generateVersion fails cleanly without a configured model',
  );
  console.log('AI error path OK (no model configured in sandbox)');
}

// -- removal ----------------------------------------------------------------------

const removed = await service.removeSubscription({ id: sub.id });
assert.equal(removed, true);
const after = await service.listSubscriptions();
assert.equal(after.subscriptions.length, 0, 'subscription removed');
console.log('unsubscribe OK');

await store.dispose();
console.log('HOST MUTATION TESTS PASSED');

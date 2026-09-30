/**
 * Agent-tool end-to-end test: exercises the tool DSL execute() wrappers the
 * same way the host agent would invoke them. Needs the same scaffold as
 * tests/mutations.mjs (DSH_HOME sandbox + node_modules with @deepseek-ai).
 *   DSH_HOME=/tmp/qmr-sandbox/home3 node tests/tools.mjs
 */
import assert from 'node:assert';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { Context } from '@deepseek-ai/cordis';

rmSync('/tmp/qmr-sandbox/home3/storages/qiaomu-rss', { recursive: true, force: true });

const { default: RssService } = await import('qiaomu-rss-dsh');

const registered = [];
const root = new Context();
root.reflect.provide('tools', { register: (tool) => registered.push(tool) });
root.reflect.provide('workspaceRegistry', { list: () => [{ path: '/tmp/qmr-sandbox/workspace' }] });
root.reflect.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'fake', model: 'fake-1' }) });
root.reflect.provide('llm', {
  async *stream() {
    yield { type: 'text-delta', text: '# 伪模型译文\n\n工具触发的本地生成。' };
    yield { type: 'finish', reason: { kind: 'stop' } };
  },
});

new RssService(root);

const expected = ['rss_list_channels', 'rss_list_articles', 'rss_read_article', 'rss_generate_version', 'rss_search_articles', 'rss_add_subscription', 'rss_remove_subscription', 'rss_refresh'];
assert.equal(registered.length, 8, `expected 8 tools, got ${registered.length}`);
for(const name of expected) assert.ok(registered.some(t=>t.name===name));
for (const tool of registered) {
  assert.equal(typeof tool.execute, 'function', `${tool.name}: execute missing`);
  assert.ok(tool.description, `${tool.name}: description missing`);
  assert.ok(tool.parameters && typeof tool.parameters === 'object', `${tool.name}: parameters missing`);
}
const tools = Object.fromEntries(registered.map((tool) => [tool.name, tool]));
console.log('8 tools registered with execute/description/parameters');

// -- channels -----------------------------------------------------------------

const channelsOut = await tools.rss_list_channels.execute({});
assert.match(channelsOut, /qiaomu \| 乔木精选/);
console.log('rss_list_channels OK');

// -- refresh + list -----------------------------------------------------------

const refreshOut = await tools.rss_refresh.execute({ channel: 'qiaomu' });
assert.ok(refreshOut.length > 0);
const listOut = await tools.rss_list_articles.execute({ channel: 'qiaomu', limit: 3 });
assert.match(listOut, /Articles \(3/);
const key = /- (qiaomu:[0-9a-f]+)/.exec(listOut)[1];
console.log('rss_refresh + rss_list_articles OK, first key:', key);

// -- read ---------------------------------------------------------------------

const readOut = await tools.rss_read_article.execute({ key, version: 'original' });
assert.match(readOut, /^# /);
assert.ok(readOut.length > 200, 'read returns body text');
const readZh = await tools.rss_read_article.execute({ key, version: 'translation' });
assert.match(readZh, /not available|rss_generate_version/);
console.log('rss_read_article OK (original + missing-version guidance)');

// -- search -------------------------------------------------------------------

const searchOut = await tools.rss_search_articles.execute({ query: 'the', limit: 5 });
assert.match(searchOut, /Results:/);
console.log('rss_search_articles OK');

// -- subscribe + read via tools ----------------------------------------

const addOut = await tools.rss_add_subscription.execute({ url: 'https://hnrss.org/frontpage?limit=2', name: 'HN' });
assert.match(addOut, /feed:[0-9a-f]{32}/, 'add returns subscription id');
const feedList = await tools.rss_list_articles.execute({ channel: 'feeds:all', limit: 5 });
const feedArticleKey = /- (feed:[0-9a-f]+)/.exec(feedList)?.[1];
const subId = /feed:[0-9a-f]{32}/.exec(addOut)?.[0];
if (!feedArticleKey) {
  console.log('feed produced no entries (network flake) — skipping feed read, subId:', subId);
} else {
  const feedRead = await tools.rss_read_article.execute({ key: feedArticleKey });
  assert.match(feedRead, /^# /);
  console.log('rss_add_subscription + feed read via tools OK');

}

// -- generate via tool ----------------------------------------------------------

const genOut = await tools.rss_generate_version.execute({ key, kind: 'translation' });
assert.match(genOut, /source: local/);
assert.match(genOut, /伪模型译文/);
console.log('rss_generate_version OK (via tool wrapper)');

// -- unsubscribe -----------------------------------------------------------------

if (!subId) throw new Error('no subscription id from add tool');
await tools.rss_remove_subscription.execute({ id: subId });
const afterOut = await tools.rss_list_channels.execute({});
const feedsLine = afterOut.split('\n').find((line) => line.includes('feeds:all'));
assert.match(feedsLine, /unread 0\/0/, 'feed aggregate empty after unsubscribe');
console.log('rss_remove_subscription OK (aggregate empty again)');

console.log('AGENT TOOL TESTS PASSED');

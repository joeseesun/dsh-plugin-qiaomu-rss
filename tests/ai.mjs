/**
 * AI assist path test with a fake llm service: verifies prompt construction,
 * stream consumption, markdown cleanup, caching with source 'local', and the
 * versions merge in getArticle. Run like tests/mutations.mjs.
 *   DSH_HOME=/tmp/qmr-sandbox/home3 node tests/ai.mjs   (from the scaffold dir)
 */
import assert from 'node:assert';
import { rmSync, readFileSync } from 'node:fs';
import { Context } from '@deepseek-ai/cordis';

rmSync('/tmp/qmr-sandbox/home3/storages/qiaomu-rss', { recursive: true, force: true });

const { default: RssService } = await import('qiaomu-rss-dsh');

const calls = [];
let streamScript = [
  { type: 'text-delta', text: '# 世界上最奇特的想法（译文）\n\n' },
  { type: 'text-delta', text: '这是本地模型生成的第一段译文。\n\n' },
  { type: 'text-delta', text: '```markdown\n' },
  { type: 'text-delta', text: '意外进入正文的代码围栏应当保留，但外层围栏会被剥掉。\n' },
  { type: 'text-delta', text: '```\n' },
  { type: 'text-delta', text: '```\n' },
  { type: 'finish', reason: { kind: 'stop' } },
];

const root = new Context();
root.reflect.provide('tools', { register: () => {} });
root.reflect.provide('workspaceRegistry', { list: () => [{ path: '/tmp/qmr-sandbox/workspace' }] });
root.reflect.provide('agentDefaultModel', {
  currentSelection: () => ({ provider: 'fake-provider', model: 'fake-1' }),
});
let streamImpl = async function* (request) {
  calls.push(request);
  for (const chunk of streamScript) yield chunk;
};
root.reflect.provide('llm', {
  stream(request) { return streamImpl(request); },
});

const service = new RssService(root);
const outcome = await service.refresh({ channel: 'qiaomu' });
assert.ok(outcome.qiaomu > 0, 'qiaomu entries seeded');
const page = await service.listEntries({ channel: 'qiaomu', limit: 20 });
const candidates = page.entries.filter((e) => !e.titleZh);
assert.ok(candidates.length > 0, 'found articles without published translations');
// prefer the article with the longest summary so the prompt-body assertion is meaningful
const target = candidates.sort((a, b) => (b.summary?.length ?? 0) - (a.summary?.length ?? 0))[0];
console.log('target article:', target.key, target.title);

const generated = await service.generateVersion({ key: target.key, kind: 'translation' });
assert.equal(generated.source, 'local');
assert.equal(generated.title, '世界上最奇特的想法（译文）');
console.log('generated:', JSON.stringify({ title: generated.title, source: generated.source, chars: generated.markdown.length }));

// prompt sanity: the user content carries the article text
const promptText = calls[0].messages[1].content[0].text;
assert.ok(promptText.includes(target.title), 'prompt includes the article title');
if (target.summary && target.summary.length > 40) {
  assert.ok(promptText.length > 100, 'prompt includes body text');
}
console.log('prompt chars:', promptText.length);
console.log('prompt chars:', promptText.length);

// cached: getArticle now reports the local translation
const article = await service.getArticle({ key: target.key });
assert.equal(article.versions.translation.available, true);
assert.equal(article.versions.translation.source, 'local');
assert.match(article.versions.translation.markdown, /本地模型生成的第一段译文/);
console.log('getArticle merges local translation: OK');

// in-flight dedupe: two concurrent generations share one llm call
let slow = 0;
streamScript = null;
streamImpl = async function* () {
  slow += 1;
  await new Promise((resolve) => setTimeout(resolve, 80));
  yield { type: 'text-delta', text: '# 慢速改写\n\n内容' };
  yield { type: 'finish', reason: { kind: 'stop' } };
};
service.store.putArticle({...target,key:'feed:ai-concurrency',kind:'feed',html:'<p>Local article for concurrency regression.</p>'});
const [a, b] = await Promise.all([
  service.generateVersion({ key: 'feed:ai-concurrency', kind: 'rewrite' }),
  service.generateVersion({ key: 'feed:ai-concurrency', kind: 'rewrite' }),
]);
assert.equal(slow, 1, 'concurrent same-key generation deduped to one llm call');
assert.equal(a.source, 'local');
assert.equal(b.source, 'local');
console.log('concurrent generation dedupe: OK');

// persisted with source local
await service.store.dispose();
const raw = JSON.parse(readFileSync('/tmp/qmr-sandbox/home3/storages/qiaomu-rss/data.json', 'utf8'));
assert.equal(raw.ai[target.key].translation.source, 'local');
assert.equal(raw.ai['feed:ai-concurrency'].rewrite.source, 'local');
console.log('persisted ai cache: OK');
console.log('AI PATH TESTS PASSED');

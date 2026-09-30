import assert from 'node:assert/strict';
// Pass an absolute built Host module path whose directory resolves DSH peers.
const { default: RssService } = await import(process.env.QMR_HOST_MODULE);
const service = Object.create(RssService.prototype);
service.ready = Promise.resolve();
service.store = {
  data: { settings: { aiAssist:false }, ai:{} },
  putAiVersion(key,kind,value) { (this.data.ai[key] ??= {})[kind] = value; },
  getAiVersion(key,kind) { return this.data.ai[key]?.[kind]; },
};
service.guard = (_key,_kind,run) => run();
const article = {key:'qiaomu:test',title:'Test',html:'<p>Original</p>'};
service.ensureArticle = async () => article;
let calls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  calls++;
  return { ok:true, json:async () => String(url).endsWith('/translation')
    ? {translation:{content:[{target:'第一段'},{target:'第二段'}]}}
    : {rewrite:{title:'改写',body:'已发布改写'}} };
};
try {
  const first = await service.loadVersions(article);
  assert.equal(first.translation.markdown,'第一段\n\n第二段');
  assert.equal(calls,2,'published assets fetched with AI disabled');
  const second = await service.loadVersions(article);
  assert.equal(second.translation.markdown,first.translation.markdown);
  assert.equal(calls,2,'cached versions do not refetch');
  const reused = await service.generateVersion({key:article.key,kind:'translation'});
  assert.equal(reused.source,'qiaomu');
  assert.equal(reused.markdown,'第一段\n\n第二段');
  service.store.data.ai = {};
  globalThis.fetch = async () => { throw new Error('network unavailable'); };
  await assert.rejects(() => service.generateVersion({key:article.key,kind:'translation'}),/无法确认/);
  globalThis.fetch = async () => ({ok:false,status:404});
  await assert.rejects(() => service.generateVersion({key:article.key,kind:'translation'}),/disabled/);
  console.log('Published versions: disabled AI fetch, cache reread, reuse, network failure and missing version passed');
} finally { globalThis.fetch = originalFetch; }

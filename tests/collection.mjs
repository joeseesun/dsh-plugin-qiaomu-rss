import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CollectionClient, CollectionManager, collectionUrl } from '../src/host/collection.js';
const origin = 'https://rss.example.org'; let currentOrigin = origin, deny = false, lost = false, posts = 0;
const remote = new Map(), requests = [];
const transport = async (url, options) => {
  requests.push({ url, ...options }); const body = options.body && JSON.parse(options.body);
  if (deny) return new Response('{}', { status: 403 });
  const path = new URL(url).pathname;
  if (path.endsWith('/verify')) return Response.json({ verified: true });
  if (options.method === 'POST') {
    posts++; if (!remote.has(body.id)) remote.set(body.id, { id: body.id, url: body.url, createdAt: Date.now(), status: 'queued', title: '' });
    if (lost) { lost = false; throw new Error('lost response'); }
    return Response.json(remote.get(body.id));
  }
  if (path.endsWith('/collection-jobs')) return Response.json({ jobs: [...remote.values()], hasMore: false, nextCursor: '' });
  const job = remote.get(path.split('/').at(-1)); return job ? Response.json(job) : new Response('{}', { status: 404 });
};
let persisted;
const store = { data: { subscriptions: [{ id:'keep' }], favorites:{keep:{}}, read:{keep:123} }, async flush() { persisted = structuredClone(this.data); } };
const schedule = () => () => {};
const manager = new CollectionManager(store, () => currentOrigin, { transport, schedule });
await assert.rejects(manager.submit('https://example.org'), /启用/);
deny = true; await assert.rejects(manager.configure({ enabled:true, invite:'bad' }), /邀请码/); assert.equal(manager.settings().verified, false); deny = false;
await manager.configure({ enabled:true, invite:'test-secret' });
assert.ok(!JSON.stringify(manager.settings()).includes('test-secret'));
assert.ok(!JSON.stringify(manager.snapshot()).includes('test-secret'));
const [first, same] = await Promise.all([manager.submit('https://example.org/article#x'), manager.submit('https://example.org/article#y')]);
assert.equal(first.id, same.id); assert.equal(posts, 1); assert.equal(persisted.collection.jobs[0].id, first.id);
// Restart restores identity and UUID; a missing server job is resubmitted with the same UUID.
manager.dispose(); remote.clear();
const restoredStore = { data: structuredClone(persisted), async flush() { persisted = structuredClone(this.data); } };
const restored = new CollectionManager(restoredStore, () => currentOrigin, { transport, schedule });
await restored.check(); assert.ok(remote.has(first.id)); assert.deepEqual(restoredStore.data.subscriptions, [{ id:'keep' }]); assert.equal(restoredStore.data.read.keep,123);
remote.get(first.id).status='complete'; remote.get(first.id).title='中文标题'; remote.get(first.id).originalTitle='English title'; remote.get(first.id).entryId='entry-one';
await restored.check(); const result=await restored.resolve(first.id); assert.equal(result.title,'中文标题');
await restored.list(); assert.equal(restored.snapshot().jobs[0].originalTitle,'English title');
await restored.acknowledge([first.id]); assert.equal(restored.snapshot().jobs[0].notified,true);
currentOrigin='https://other.example.org'; assert.equal(restored.settings().verified,false); assert.equal(restored.snapshot().jobs.length,0); await assert.rejects(restored.resolve(first.id));
currentOrigin=origin;
lost=true; await assert.rejects(restored.submit('https://example.org/lost'),/lost response/); const lostJob=restoredStore.data.collection.jobs.find(job=>job.url.endsWith('/lost')); await restored.check(); assert.equal(remote.get(lostJob.id).id,lostJob.id);
remote.get(lostJob.id).status='failed'; await restored.check(); const retried=await restored.submit(lostJob.url,lostJob.id); assert.notEqual(retried.id,lostJob.id);
await restored.configure({enabled:false}); assert.equal(restored.settings().enabled,false); restored.dispose();
for(const value of ['javascript:alert(1)','https://user:pw@example.org','not a url','file:///tmp/file']) assert.throws(()=>collectionUrl(value));
const identity={id:randomUUID(),key:'key'};
for(const status of [400,403,404,409,429,503]) {
  const client=new CollectionClient(origin,'secret',identity,async()=>new Response('{}',{status}));
  await assert.rejects(client.status(first.id), error=>error.status===status);
}
await assert.rejects(new CollectionClient(origin,'secret',identity,async()=>Response.json({status:'complete',title:'x'})).status(first.id), /格式/);
await assert.rejects(new CollectionClient(origin,'secret',identity,async()=>new Response('x'.repeat(2_000_001))).status(first.id), /过大/);
assert.ok(requests.every(request=>request.redirect==='error'));
assert.ok(requests.every(request=>!request.url.includes('test-secret')));
console.log('Collection: invitation, isolation, idempotency, lost response, restart, retry, titles, notification and error bounds passed');

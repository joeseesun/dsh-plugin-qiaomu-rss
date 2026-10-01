/** Invitation-protected public link collection. Credentials remain in the Host. */
import { randomUUID } from 'node:crypto';
const STATES = new Set(['queued', 'running', 'complete', 'failed']);
const UUID = /^[a-f0-9-]{36}$/i;
const pending = job => ['queued', 'running'].includes(job.status);
export function collectionUrl(value) {
  if (typeof value !== 'string' || value.length > 4096) throw new Error('无效链接');
  let url; try { url = new URL(value.trim()); } catch { throw new Error('无效链接'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('无效链接');
  url.hash = ''; return url.href;
}
export class CollectionClient {
  constructor(origin, invite, identity, transport = fetch) { Object.assign(this, { origin, invite, identity, transport }); }
  async request(path, body, signal) {
    const response = await this.transport(this.origin + path, {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${this.invite}`, Accept: 'application/json', 'Content-Type': 'application/json',
        'X-Qiaomu-Client': this.identity.id, 'X-Qiaomu-Client-Key': this.identity.key },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      const messages = { 400: '无效链接或请求', 401: '邀请码无效，请重新验证', 403: '邀请码无效，请重新验证', 404: '申请不存在', 409: '申请冲突，请重新提交', 429: '请求过于频繁，请稍后重试' };
      const error = new Error(messages[response.status] || '收录服务暂时不可用'); error.status = response.status; throw error;
    }
    // Bound the streamed response before parsing; abort on oversized payloads.
    let text = '';
    if (response.body?.getReader) {
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let bytes = 0;
      try { for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength;
        if (bytes > 2_000_000) { await reader.cancel(); throw new Error('收录响应过大'); } text += decoder.decode(value, { stream: true }); }
        text += decoder.decode();
      } finally { reader.releaseLock(); }
    } else { text = await response.text(); if (text.length > 2_000_000) throw new Error('收录响应过大'); }
    try { return JSON.parse(text); } catch { throw new Error('收录响应格式无效'); }
  }
  async verify(signal) { const result = await this.request('/api/lab/verify', { clientId: this.identity.id, clientKey: this.identity.key }, signal); if (result.verified !== true) throw new Error('邀请码验证失败'); }
  result(result) {
    if (!result || !STATES.has(result.status) || typeof result.title !== 'string' || (result.status === 'complete' && (typeof result.entryId !== 'string' || !result.entryId))) throw new Error('收录响应格式无效');
    return { status: result.status, title: result.title.slice(0, 500), ...(typeof result.originalTitle === 'string' ? { originalTitle: result.originalTitle.slice(0, 500) } : {}), ...(typeof result.entryId === 'string' ? { entryId: result.entryId } : {}) };
  }
  async submit(id, url, signal) { return this.result(await this.request('/api/lab/collection-jobs', { id, url: collectionUrl(url) }, signal)); }
  async status(id, signal) { return this.result(await this.request(`/api/lab/collection-jobs/${encodeURIComponent(id)}`, undefined, signal)); }
  async list(cursor = '', signal) {
    const result = await this.request(`/api/lab/collection-jobs?cursor=${encodeURIComponent(cursor)}`, undefined, signal);
    if (!Array.isArray(result.jobs) || result.jobs.length > 100 || typeof result.hasMore !== 'boolean' || typeof result.nextCursor !== 'string') throw new Error('收录列表格式无效');
    return { ...result, jobs: result.jobs.map(job => {
      if (!UUID.test(job.id) || typeof job.createdAt !== 'number') throw new Error('收录列表格式无效');
      return { id: job.id, url: collectionUrl(job.url), createdAt: job.createdAt, ...this.result(job) };
    }) };
  }
}
export class CollectionManager {
  constructor(store, origin, options = {}) {
    this.store = store; this.origin = origin; this.transport = options.transport;
    this.schedule = options.schedule || ((fn, ms) => { const timer = setTimeout(fn, ms); timer.unref?.(); return () => clearTimeout(timer); });
    this.stopped = false; this.controller = new AbortController(); this.verified = new Map(); this.inflight = new Map(); this.delay = 15_000;
  }
  state() { return this.store.data.collection ??= { enabled: false, accounts: {}, jobs: [] }; }
  account() { return this.state().accounts[this.origin()]; }
  settings() { return { enabled: this.state().enabled, verified: Boolean(this.account()?.invite), pending: this.state().jobs.filter(job => job.origin === this.origin() && pending(job)).length }; }
  async configure({ enabled, invite } = {}) {
    if (typeof enabled !== 'boolean' || (invite !== undefined && (typeof invite !== 'string' || !invite.trim() || invite.length > 200))) throw new Error('无效实验室设置');
    const origin = this.origin(); const state = this.state();
    if (invite !== undefined) {
      const account = { ...(state.accounts[origin] || { identity: { id: randomUUID(), key: randomUUID() + randomUUID() } }), invite: invite.trim() };
      await new CollectionClient(origin, account.invite, account.identity, this.transport).verify(this.controller.signal);
      if (this.stopped) throw new Error('收录服务已停用');
      state.accounts[origin] = account; this.verified.set(origin, account.invite);
    }
    if (enabled && !state.accounts[origin]?.invite) throw new Error('请先验证邀请码');
    state.enabled = enabled; await this.store.flush(); this.wake(); return this.settings();
  }
  async client(origin) {
    const account = this.state().accounts[origin]; if (!account?.invite) throw new Error('请先在实验室验证邀请码');
    const client = new CollectionClient(origin, account.invite, account.identity, this.transport);
    if (this.verified.get(origin) !== account.invite) { await client.verify(this.controller.signal); this.verified.set(origin, account.invite); }
    return client;
  }
  async submit(value, retryId) {
    if (!this.state().enabled) throw new Error('请先启用实验室');
    const url = collectionUrl(value), origin = this.origin(); const lock = origin + '|' + url;
    if (this.inflight.has(lock)) return this.inflight.get(lock);
    const operation = (async () => {
      const client = await this.client(origin); const jobs = this.state().jobs;
      if (retryId && !jobs.some(job => job.id === retryId && job.origin === origin && job.url === url && job.status === 'failed')) throw new Error('无效的重试申请');
      let job = jobs.find(job => job.origin === origin && job.url === url && job.status !== 'failed');
      if (job?.status === 'complete') return this.publicJob(job);
      if (!job) { job = { id: randomUUID(), url, origin, status: 'queued', title: '', createdAt: Date.now(), notified: false }; jobs.unshift(job); }
      // Save identity and UUID before the POST: a lost response can be recovered idempotently.
      await this.store.flush();
      try { Object.assign(job, await client.submit(job.id, url, this.controller.signal)); }
      catch (error) { if ([400, 409].includes(error.status)) job.status = 'failed'; throw error; }
      finally { await this.store.flush(); this.wake(); }
      return this.publicJob(job);
    })(); this.inflight.set(lock, operation);
    try { return await operation; } finally { this.inflight.delete(lock); }
  }
  publicJob(job) { return { id: job.id, url: job.url, status: job.status, title: job.title, originalTitle: job.originalTitle, createdAt: job.createdAt, entryId: job.entryId, notified: job.notified === true }; }
  async list(cursor = '') {
    const origin = this.origin(); const client = await this.client(origin); const page = await client.list(cursor, this.controller.signal);
    for (const remote of page.jobs) {
      let job = this.state().jobs.find(item => item.origin === origin && item.id === remote.id);
      if (job) Object.assign(job, remote);
      else this.state().jobs.push({ ...remote, origin, notified: true });
    }
    await this.store.flush(); this.wake(); return { ...page, jobs: page.jobs.map(job => this.publicJob(this.state().jobs.find(item => item.origin === origin && item.id === job.id))) };
  }
  snapshot() { return { ...this.settings(), jobs: this.state().jobs.filter(job => job.origin === this.origin()).sort((a,b) => b.createdAt-a.createdAt).map(job => this.publicJob(job)) }; }
  async acknowledge(ids) { for (const job of this.state().jobs) if (job.origin === this.origin() && ids.includes(job.id) && !pending(job)) job.notified = true; await this.store.flush(); return { ok: true }; }
  async resolve(id) { const job = this.state().jobs.find(item => item.id === id && item.origin === this.origin()); if (job?.status !== 'complete' || !job.entryId) throw new Error('申请尚未完成'); return job; }
  wake(delay = 0) {
    this.cancelTimer?.(); this.cancelTimer = undefined;
    if (this.stopped || !this.state().enabled || !this.state().jobs.some(job => pending(job) && this.state().accounts[job.origin]?.invite)) return;
    this.cancelTimer = this.schedule(() => { this.cancelTimer = undefined; void this.check(); }, delay);
  }
  async check() {
    if (this.stopped || this.checking || !this.state().enabled) return;
    this.checking = true; let failed = false;
    try {
      for (const job of this.state().jobs.filter(pending).slice(0, 30)) {
        if (this.stopped || !this.state().enabled) break;
        try {
          const client = await this.client(job.origin);
          let result; try { result = await client.status(job.id, this.controller.signal); }
          catch (error) { if (error.status !== 404) throw error; result = await client.submit(job.id, job.url, this.controller.signal); }
          if (this.stopped) break; Object.assign(job, result); await this.store.flush();
        } catch { failed = true; }
      }
    } finally { this.checking = false; this.delay = failed ? Math.min(this.delay * 2, 300_000) : 15_000; this.wake(this.delay); }
  }
  dispose() { this.stopped = true; this.cancelTimer?.(); this.controller.abort(); }
}

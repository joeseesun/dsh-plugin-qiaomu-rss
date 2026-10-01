import { useEffect, useRef, useState } from 'react';
import { Copy, Link2, RefreshCw, ExternalLink, RotateCcw, Settings } from 'lucide-react';
import { collectionCopy } from './collection-copy.js';

export function CollectionSettings({ api, notify, onOpenRequests }) {
  const copy = collectionCopy(); const [state, setState] = useState(null); const [invite, setInvite] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { let live = true; api.getCollectionSettings().then(result => { if (live) setState(result); }).catch(error => { if (live) setError(error.message); }); return () => { live = false; }; }, [api]);
  return <section aria-label={copy.lab}><div className="qrs-settings-intro"><h2>{copy.title}</h2><p>{copy.intro}</p></div>
    <div className="qrs-settings-card"><p>{copy.disclosure}</p>
      {state && <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try {
        const result = await api.configureCollection({ enabled: state.enabled, ...(invite.trim() ? { invite: invite.trim() } : {}) });
        setState(result); setInvite(''); window.dispatchEvent(new Event('qrs-collection-changed')); notify(copy.configured);
      } catch (error) { setError(error.message); } finally { setBusy(false); } }}>
        <label className="qrs-collection-toggle"><input type="checkbox" checked={state.enabled} disabled={busy} onChange={event => setState({ ...state, enabled: event.target.checked })} />{copy.enabled}</label>
        <label className="qrs-settings-url"><span>{copy.invite}</span><input type="password" autoComplete="off" aria-label={copy.invite} placeholder={copy.inviteHint} value={invite} disabled={busy} onChange={event => setInvite(event.target.value)} /></label>
        <p role="status">{state.verified ? copy.verified : copy.unverified}</p>
        <button className="qrs-collection-button" type="submit" disabled={busy || (!state.verified && !invite.trim())}>{busy ? copy.saving : invite.trim() ? copy.verify : copy.save}</button>
      </form>}
      {state?.verified && onOpenRequests && <button className="qrs-collection-button" onClick={onOpenRequests}>{copy.jobs}</button>}
      {error && <p role="alert" className="qrs-collection-error">{error}</p>}
    </div>
  </section>;
}
export function CollectionPanel({ api, onOpen, onSettings, notify, revision = 0 }) {
  const copy = collectionCopy(); const [jobs, setJobs] = useState([]); const [url, setUrl] = useState(''); const [query, setQuery] = useState('');
  const [page, setPage] = useState({ hasMore: false }); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [settings, setSettings] = useState({}); const serial = useRef(0);
  const load = async (cursor) => {
    const ticket = ++serial.current; setBusy(true); setError('');
    try { const snapshot = await api.collectionSnapshot(); if (ticket !== serial.current) return; setSettings(snapshot); if (!cursor) setJobs(snapshot.jobs);
      if (snapshot.verified) { const result = await api.listCollectionJobs({ cursor }); if (ticket !== serial.current) return;
        setPage(result); setJobs(previous => cursor ? [...previous, ...result.jobs.filter(job => !previous.some(item => item.id === job.id))] : [...result.jobs, ...snapshot.jobs.filter(job => !result.jobs.some(item => item.id === job.id) && ['queued', 'running'].includes(job.status))]); }
    } catch (error) { if (ticket === serial.current) setError(`${copy.offline}：${error.message}`); }
    finally { if (ticket === serial.current) setBusy(false); }
  };
  useEffect(() => { void load(); return () => { serial.current++; }; }, [api]);
  useEffect(() => { let live = true; api.collectionSnapshot().then(result => { if (live) { setSettings(result); setJobs(previous => [...previous.map(job => result.jobs.find(item => item.id === job.id) || job), ...result.jobs.filter(job => !previous.some(item => item.id === job.id))]); } }).catch(() => {}); return () => { live = false; }; }, [api, revision]);
  const submit = async (value, retryId) => { setBusy(true); setError(''); try { await api.submitCollection({ url: value, ...(retryId ? { retryId } : {}) }); setUrl(''); notify(copy.submitted); window.dispatchEvent(new Event('qrs-collection-changed')); await load(); } catch (error) { setError(error.message); } finally { setBusy(false); } };
  return <div className="qrs-collection-panel">
    <div className="qrs-collection-heading"><h2>{copy.jobs}</h2><button className="qrs-icon" aria-label={copy.settings} title={copy.settings} onClick={onSettings}><Settings size={17} /></button></div>
    <p className="qrs-collection-disclosure">{copy.disclosure}</p>
    <form className="qrs-collection-submit" onSubmit={event => { event.preventDefault(); void submit(url); }}><input type="url" aria-label={copy.url} placeholder="https://…" required value={url} disabled={busy} onChange={event => setUrl(event.target.value)} /><button className="qrs-icon" type="submit" aria-label={busy ? copy.submitting : copy.submit} title={copy.submit} disabled={busy || !url.trim() || !settings.enabled || !settings.verified}><Link2 size={17} /></button></form>
    {(!settings.enabled || !settings.verified) && <button className="qrs-collection-button" onClick={onSettings}>{copy.settings}</button>}
    <div className="qrs-collection-submit"><input type="search" aria-label={copy.search} placeholder={copy.search} value={query} onChange={event => setQuery(event.target.value)} /><button className="qrs-icon" aria-label={copy.refresh} title={copy.refresh} disabled={busy} onClick={() => void load()}><RefreshCw size={16} /></button></div>
    {error && <p className="qrs-collection-error" role="alert">{error}</p>}
    <div className="qrs-collection-jobs" aria-busy={busy}>
      {!jobs.length && !busy && <p>{copy.empty}</p>}
      {jobs.filter(job => `${job.title} ${job.originalTitle || ''} ${job.url}`.toLowerCase().includes(query.toLowerCase())).map(job => <div className="qrs-entry qrs-collection-job" key={job.id}>
        <div><h3>{job.title || job.url}</h3><small>{copy[job.status]} · {new Date(job.createdAt).toLocaleDateString()}</small></div>
        <div className="qrs-collection-job-actions"><button className="qrs-icon" aria-label={copy.copy} title={copy.copy} onClick={() => void navigator.clipboard.writeText(job.url).then(() => notify(copy.copied)).catch(error => setError(error.message))}><Copy size={15} /></button>
          {job.status === 'complete' && <button className="qrs-icon" aria-label={copy.open} title={copy.open} disabled={busy} onClick={() => void onOpen(job.id)}><ExternalLink size={16} /></button>}
          {job.status === 'failed' && <button className="qrs-icon" aria-label={copy.retry} title={copy.retry} disabled={busy || !settings.enabled} onClick={() => void submit(job.url, job.id)}><RotateCcw size={16} /></button>}
        </div></div>)}
      {page.hasMore && <button className="qrs-more" disabled={busy} onClick={() => void load(page.nextCursor)}>{copy.more}</button>}
    </div>
  </div>;
}

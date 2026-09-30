import { useState } from 'react';

export function OpmlImport({ api, onDone }) {
  const [xml, setXml] = useState('');
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async (fn) => {
    setBusy(true); setMessage('');
    try { await fn(); } catch (error) { setMessage(error?.message ?? String(error)); }
    finally { setBusy(false); }
  };
  const inspect = (params) => run(async () => {
    const result = await api.opmlPreview(params);
    setPreview(result);
    setSelected(result.entries.filter((entry) => !entry.duplicate).map((entry) => entry.url));
  });
  const reset = () => { setPreview(null); setSelected([]); };
  const visible = preview?.entries.filter((entry) => `${entry.name} ${entry.group ?? ''} ${entry.url}`.toLowerCase().includes(query.toLowerCase())) ?? [];
  return <fieldset disabled={busy} style={{ display:'grid', gap:8 }}>
    <legend>导入 OPML</legend>
    <input type="file" aria-label="选择 OPML 文件" accept=".opml,.xml,text/xml" onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) void run(async () => {
        if (file.size > 5 * 1024 * 1024) throw new Error('文件超过 5 MB');
        const text = await file.text(); setXml(text); reset();
      });
    }} />
    <textarea aria-label="OPML 内容" placeholder="粘贴 OPML，或选择文件" rows={4} value={xml} onChange={(e) => { setXml(e.target.value); reset(); }} />
    <button type="button" className="qmrss-btn" disabled={!xml.trim()} onClick={() => void inspect({ xml })}>预览内容</button>
    <input aria-label="OPML 地址" placeholder="https://example.org/subscriptions.opml" value={url} onChange={(e) => { setUrl(e.target.value); reset(); }} />
    <button type="button" className="qmrss-btn" disabled={!url.trim()} onClick={() => void inspect({ url: url.trim() })}>从地址预览</button>
    {preview && <>
      <input aria-label="筛选导入订阅" placeholder="筛选名称、分组、地址" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="qmrss-row">
        <button type="button" className="qmrss-btn" onClick={() => setSelected(visible.filter((entry) => !entry.duplicate).map((entry) => entry.url))}>选择筛选结果</button>
        <button type="button" className="qmrss-btn" onClick={() => setSelected([])}>清空选择</button>
      </div>
      <div style={{ maxHeight:200, overflowY:'auto' }}>{visible.map((entry) => <label key={entry.url} style={{ display:'block' }}>
        <input type="checkbox" disabled={entry.duplicate} checked={selected.includes(entry.url)} onChange={(e) => setSelected(e.target.checked ? [...selected,entry.url] : selected.filter((url) => url !== entry.url))} />
        {entry.name || entry.url} {entry.group && ` · ${entry.group}`} {entry.duplicate && '（已订阅）'}
      </label>)}</div>
      <button type="button" className="qmrss-btn" disabled={!selected.length} onClick={() => void run(async () => {
        const result = await api.opmlImport(preview.xml, selected);
        setMessage(`已导入 ${result.added} 项，跳过 ${result.skipped} 项。刷新订阅以获取文章。`);
        reset(); await onDone();
      })}>导入所选（{selected.length}）</button>
    </>}
    {busy && <div role="status">处理中…</div>}
    {message && <div role="status">{message}</div>}
  </fieldset>;
}

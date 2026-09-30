import { useState } from 'react';

export function SubscriptionManager({ api, subscriptions, onChange, notify }) {
  const [query, setQuery] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [selected, setSelected] = useState([]);
  const [group, setGroup] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const visible = subscriptions.filter((sub) => (!errorsOnly || sub.lastError) && `${sub.name} ${sub.group ?? ''} ${sub.url}`.toLowerCase().includes(query.toLowerCase()));
  const execute = async (operation) => {
    setBusy(true);
    try { await operation(); } catch (error) { notify(`操作失败：${error?.message ?? String(error)}`, true); }
    finally {
      try { const result = await api.listSubscriptions(); onChange(result.subscriptions); }
      catch (error) { notify(`重新读取订阅失败：${error?.message ?? String(error)}`, true); }
      setBusy(false);
    }
  };
  const batch = async (operation) => {
    const failed = [];
    for (const id of selected) {
      try { await operation(id); } catch (error) { failed.push(`${id}: ${error?.message ?? String(error)}`); }
    }
    setSelected([]);
    if (failed.length) throw new Error(failed.join('; '));
    notify('批量操作完成');
  };
  return <section aria-label="管理订阅" style={{ display:'grid', gap:8 }}>
    <h3>管理订阅（{subscriptions.length}）</h3>
    <input aria-label="搜索订阅" placeholder="搜索名称、分组、地址" value={query} onChange={(e) => setQuery(e.target.value)} />
    <label><input type="checkbox" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />只看获取失败</label>
    <button type="button" className="qmrss-btn" disabled={busy} onClick={() => setSelected(visible.map((sub) => sub.id))}>选择当前结果</button>
    {selected.length > 0 && <fieldset disabled={busy}>
      <legend>已选 {selected.length} 项</legend>
      <input aria-label="批量移动分组" placeholder="分组名称，留空移至未分组" value={group} onChange={(e) => setGroup(e.target.value)} />
      <div className="qmrss-row">
        <button type="button" className="qmrss-btn" onClick={() => void execute(() => batch((id) => api.updateSubscription({ id, group })))}>移动分组</button>
        <button type="button" className="qmrss-btn" onClick={() => void execute(() => batch((id) => api.refresh(id)))}>刷新所选</button>
        <button type="button" className="qmrss-btn" onClick={() => setConfirmDelete(true)}>退订所选</button>
        <button type="button" className="qmrss-btn" onClick={() => setSelected([])}>取消选择</button>
      </div>
      {confirmDelete && <div role="alert">确认退订这 {selected.length} 个源？
        <button type="button" className="qmrss-btn" onClick={() => { setConfirmDelete(false); void execute(() => batch((id) => api.removeSubscription(id))); }}>确认退订</button>
        <button type="button" className="qmrss-btn" onClick={() => setConfirmDelete(false)}>取消</button>
      </div>}
    </fieldset>}
    <div style={{ maxHeight:280, overflowY:'auto' }}>
      {visible.map((sub) => <div key={sub.id} style={{ padding:'8px 0', borderBottom:'1px solid var(--dsw-alias-border-l1)' }}>
        <label><input type="checkbox" disabled={busy} checked={selected.includes(sub.id)} onChange={(e) => setSelected(e.target.checked ? [...selected,sub.id] : selected.filter((id) => id !== sub.id))} />{sub.name} {sub.group && ` · ${sub.group}`}</label>
        <div style={{ fontSize:12, overflowWrap:'anywhere' }}>{sub.url}</div>
        {sub.lastError && <div role="status">获取失败：{sub.lastError}</div>}
        <button type="button" className="qmrss-btn" disabled={busy} onClick={() => setEditing({ id:sub.id, name:sub.name, group:sub.group ?? '' })}>编辑</button>
        <button type="button" className="qmrss-btn" onClick={() => void navigator.clipboard.writeText(sub.url).then(() => notify('地址已复制')).catch((error) => notify(`复制失败：${error.message}`,true))}>复制地址</button>
      </div>)}
      {!visible.length && <p>没有匹配的订阅。</p>}
    </div>
    {editing && <fieldset disabled={busy}><legend>编辑订阅</legend>
      <input aria-label="订阅名称" value={editing.name} onChange={(e) => setEditing({ ...editing,name:e.target.value })} />
      <input aria-label="订阅分组" value={editing.group} onChange={(e) => setEditing({ ...editing,group:e.target.value })} />
      <button type="button" className="qmrss-btn" disabled={!editing.name.trim()} onClick={() => void execute(async () => { await api.updateSubscription(editing); setEditing(null); notify('订阅已更新'); })}>保存订阅</button>
      <button type="button" className="qmrss-btn" onClick={() => setEditing(null)}>取消编辑</button>
    </fieldset>}
  </section>;
}

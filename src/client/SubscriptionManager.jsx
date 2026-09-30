import { useEffect, useState } from 'react';
import { Search, Pencil, Copy, RefreshCw, Trash2, X, Folder } from 'lucide-react';

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

export function SubscriptionManager({ api, subscriptions, onChange, notify }) {
  const [query, setQuery] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [selected, setSelected] = useState([]);
  const [group, setGroup] = useState('');
  const [editing, setEditing] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errorCount = subscriptions.filter(sub => sub.lastError).length;
  useEffect(() => { if (!errorCount) setErrorsOnly(false); }, [errorCount]);
  const visible = subscriptions.filter((sub) => (!errorsOnly || sub.lastError) && `${sub.name} ${sub.group ?? ''} ${sub.url}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const groups = [...new Set(subscriptions.map(sub => sub.group).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'zh-CN'));
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
  const toggleSelected = (id, checked) => setSelected(current => checked ? [...current,id] : current.filter(item => item !== id));
  return <section className="qrs-subscriptions" aria-label="管理订阅">
    <div className="qrs-subscriptions-toolbar">
      <label className="qrs-subscriptions-search"><Search size={16} /><input aria-label="搜索订阅" placeholder="搜索名称、分组或地址" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {errorCount > 0 && <div className="qrs-segmented" role="group" aria-label="订阅状态"><button type="button" aria-pressed={!errorsOnly} onClick={() => setErrorsOnly(false)}>全部</button><button type="button" aria-pressed={errorsOnly} title="筛选获取失败的订阅源" onClick={() => setErrorsOnly(true)}>异常 {errorCount}</button></div>}
    </div>
    <div className="qrs-subscriptions-selection"><button type="button" disabled={busy || !visible.length} onClick={() => setSelected(visible.map(sub => sub.id))}>选择当前结果</button><span>{visible.length} 个结果</span></div>
    {selected.length > 0 && <div className="qrs-subscriptions-batch" aria-label="批量操作">
      <strong>已选 {selected.length} 项</strong>
      <label><Folder size={15} /><input aria-label="批量移动分组" placeholder="目标分组，留空为未分组" value={group} onChange={event => setGroup(event.target.value)} /></label>
      <button type="button" disabled={busy} onClick={() => void execute(() => batch(id => api.updateSubscription({ id, group })))}>移动分组</button>
      <button type="button" disabled={busy} onClick={() => void execute(() => batch(id => api.refresh(id)))}><RefreshCw size={14} />刷新</button>
      <button type="button" disabled={busy} className="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />退订</button>
      <button type="button" className="icon" aria-label="取消选择" onClick={() => { setSelected([]); setConfirmDelete(false); }}><X size={16} /></button>
    </div>}
    {confirmDelete && <div className="qrs-subscriptions-confirm" role="alert">确认退订这 {selected.length} 个订阅源？<button type="button" className="danger" onClick={() => { setConfirmDelete(false); void execute(() => batch(id => api.removeSubscription(id))); }}>确认退订</button><button type="button" onClick={() => setConfirmDelete(false)}>取消</button></div>}
    <div className="qrs-subscriptions-list">
      {visible.map(sub => <div key={sub.id} className="qrs-subscription-row">
        <input type="checkbox" aria-label={`选择 ${sub.name}`} disabled={busy} checked={selected.includes(sub.id)} onChange={event => toggleSelected(sub.id,event.target.checked)} />
        <div className="qrs-subscription-avatar" aria-hidden="true">{sub.name.trim().slice(0,1) || 'R'}</div>
        <div className="qrs-subscription-copy"><strong>{sub.name}</strong><span title={sub.url}>{host(sub.url)}{sub.group && <> · {sub.group}</>}</span>{sub.lastError && <small role="status">获取失败：{sub.lastError}</small>}</div>
        <div className="qrs-subscription-actions">
          <button type="button" aria-label={`编辑 ${sub.name}`} title="编辑" disabled={busy} onClick={() => setEditing({ id:sub.id, name:sub.name, group:sub.group ?? '' })}><Pencil size={15} /></button>
          <button type="button" aria-label={`复制 ${sub.name} 地址`} title="复制地址" onClick={() => void navigator.clipboard.writeText(sub.url).then(() => notify('地址已复制')).catch(error => notify(`复制失败：${error.message}`,true))}><Copy size={15} /></button>
        </div>
      </div>)}
      {!visible.length && <div className="qrs-subscriptions-empty">{errorsOnly ? '没有获取失败的订阅源' : '没有匹配的订阅源'}</div>}
    </div>
    {groups.length > 0 && <div className="qrs-group-manager"><div className="qrs-group-heading"><strong>订阅分组</strong><span>{groups.length} 个分组</span></div>
      {groups.map(name => <div className="qrs-group-row" key={name}><Folder size={15} /><span>{name}</span><small>{subscriptions.filter(sub => sub.group === name).length} 个订阅源</small><button type="button" aria-label={`编辑分组 ${name}`} onClick={() => setEditingGroup({ oldName:name, name })}><Pencil size={15} /></button></div>)}
    </div>}
    {editing && <div className="qrs-subscription-editor-backdrop" onClick={() => setEditing(null)}><form className="qrs-subscription-editor" role="dialog" aria-modal="true" aria-label="编辑订阅" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setEditing(null); } }} onSubmit={event => { event.preventDefault(); if (!busy && editing.name.trim()) void execute(async () => { await api.updateSubscription(editing); setEditing(null); notify('订阅已更新'); }); }}>
      <div><strong>编辑订阅</strong><button type="button" aria-label="关闭编辑" onClick={() => setEditing(null)}><X size={16} /></button></div>
      <label>名称<input autoFocus aria-label="订阅名称" value={editing.name} onChange={event => setEditing({ ...editing,name:event.target.value })} /></label>
      <label>分组<input aria-label="订阅分组" list="qrs-existing-groups" value={editing.group} onChange={event => setEditing({ ...editing,group:event.target.value })} /><datalist id="qrs-existing-groups">{groups.map(name => <option key={name} value={name} />)}</datalist></label>
      <div className="qrs-subscription-editor-actions"><button type="button" onClick={() => setEditing(null)}>取消</button><button type="submit" disabled={busy || !editing.name.trim()}>保存更改</button></div>
    </form></div>}
    {editingGroup && <div className="qrs-subscription-editor-backdrop" onClick={() => setEditingGroup(null)}><form className="qrs-subscription-editor" role="dialog" aria-modal="true" aria-label="编辑订阅分组" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setEditingGroup(null); } }} onSubmit={event => { event.preventDefault(); if (busy) return; void execute(async () => { const targets = subscriptions.filter(sub => sub.group === editingGroup.oldName); for (const sub of targets) await api.updateSubscription({ id:sub.id, group:editingGroup.name.trim() }); setEditingGroup(null); notify('分组已更新'); }); }}>
      <div><strong>编辑分组</strong><button type="button" aria-label="关闭分组编辑" onClick={() => setEditingGroup(null)}><X size={16} /></button></div>
      <p>修改分组名会移动该分组中的全部订阅源。留空可取消分组，订阅源会保留。</p>
      <label>分组名称<input autoFocus aria-label="分组名称" value={editingGroup.name} onChange={event => setEditingGroup({ ...editingGroup, name:event.target.value })} /></label>
      <div className="qrs-subscription-editor-actions"><button type="button" onClick={() => setEditingGroup(null)}>取消</button><button type="submit" disabled={busy || editingGroup.name.trim() === editingGroup.oldName}>保存分组</button></div>
    </form></div>}
  </section>;
}

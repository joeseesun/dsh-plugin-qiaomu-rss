import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { readQuickPrompts, saveQuickPrompts } from './quick-prompts.js';

export function PromptManager({ notify }) {
  const [items, setItems] = useState(readQuickPrompts);
  const [editing, setEditing] = useState(null);
  const save = () => {
    const title = editing.title.trim();
    const body = editing.body.trim();
    if (!title || !body) return;
    const next = editing.id ? items.map(item => item.id === editing.id ? { id:item.id, title, body } : item)
      : [...items, { id:crypto.randomUUID(), title, body }];
    saveQuickPrompts(next);
    setItems(next);
    setEditing(null);
    notify('快捷提示词已保存');
  };
  return <div className="qrs-prompt-manager">
    <div className="qrs-settings-card-head qrs-settings-source-head"><div><h3>快捷提示词</h3><p>显示在伴读输入框上方，点击后直接发送。输入框已有草稿时会保留草稿。</p></div>
      <button type="button" className="qrs-prompt-add" disabled={items.length >= 20} onClick={() => setEditing({ title:'', body:'' })}><Plus size={15} />新增</button></div>
    <div className="qrs-prompt-list">{items.map(item => <div className="qrs-prompt-row" key={item.id}>
      <div><strong>{item.title}</strong><span>{item.body}</span></div>
      <button type="button" aria-label={`编辑 ${item.title}`} onClick={() => setEditing(item)}><Pencil size={15} /></button>
      <button type="button" aria-label={`删除 ${item.title}`} onClick={() => { const next = items.filter(prompt => prompt.id !== item.id); saveQuickPrompts(next); setItems(next); notify('提示词已删除'); }}><Trash2 size={15} /></button>
    </div>)}{!items.length && <p>还没有快捷提示词。</p>}</div>
    {editing && <div className="qrs-subscription-editor-backdrop" onClick={() => setEditing(null)}>
      <form className="qrs-subscription-editor" role="dialog" aria-modal="true" aria-label={editing.id ? '编辑提示词' : '新增提示词'} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setEditing(null); } }} onSubmit={event => { event.preventDefault(); save(); }}>
        <div><strong>{editing.id ? '编辑提示词' : '新增提示词'}</strong><button type="button" aria-label="关闭" onClick={() => setEditing(null)}><X size={16} /></button></div>
        <label>名称<input autoFocus maxLength={60} value={editing.title} onChange={event => setEditing({ ...editing, title:event.target.value })} /></label>
        <label>提示词<textarea rows={5} maxLength={5000} value={editing.body} onChange={event => setEditing({ ...editing, body:event.target.value })} /></label>
        <div className="qrs-subscription-editor-actions"><button type="button" onClick={() => setEditing(null)}>取消</button><button type="submit" disabled={!editing.title.trim() || !editing.body.trim()}>保存</button></div>
      </form>
    </div>}
  </div>;
}

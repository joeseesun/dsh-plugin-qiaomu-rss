import { useState } from 'react';

function Modal({ label, onClose, children, wide = false }) {
  return (
    <div className="qrs-modal-backdrop" onClick={onClose}>
      <div className={`qrs-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-label={label} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function AddFeedDialog({ api, onClose, onDone, notify }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal label="添加订阅" onClose={onClose}>
      <h2>添加订阅</h2>
      <input aria-label="订阅地址" placeholder="RSS / Atom 地址 (https://…)" value={url} onChange={(event) => setUrl(event.target.value)} autoFocus />
      <input aria-label="订阅名称" placeholder="名称(可选,默认读取源标题)" value={name} onChange={(event) => setName(event.target.value)} />
      <input aria-label="订阅分组" placeholder="分组(可选)" value={group} onChange={(event) => setGroup(event.target.value)} />
      <div className="qrs-modal-actions">
        <button type="button" onClick={onClose}>取消</button>
        <button type="button" disabled={busy || !/^https?:\/\//i.test(url.trim())} onClick={async () => {
          setBusy(true);
          try {
            await api.addSubscription({ url: url.trim(), name: name.trim() || undefined, group: group.trim() || undefined });
            await onDone();
            onClose();
          } catch (error) {
            notify(`添加失败：${error?.message ?? String(error)}`, true);
          } finally { setBusy(false); }
        }}>{busy ? '订阅中…' : '订阅'}</button>
      </div>
    </Modal>
  );
}

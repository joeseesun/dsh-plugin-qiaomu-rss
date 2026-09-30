import { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';
import { SubscriptionManager } from './SubscriptionManager.jsx';
import { OpmlImport } from './OpmlImport.jsx';

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

export function SettingsDialog({ api, onClose, notify }) {
  const [settings, setSettings] = useState(undefined);
  const [subscriptions, setSubscriptions] = useState([]);
  const [origin, setOrigin] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    void (async () => {
      try {
        const settingsResult = await api.getSettings();
        setSettings(settingsResult.settings);
        setOrigin(settingsResult.settings.origin ?? '');
        const list = await api.listSubscriptions();
        setSubscriptions(list.subscriptions);
      } catch (error) {
        notify(`读取设置失败：${error?.message ?? String(error)}`, true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const reload = async () => {
    const list = await api.listSubscriptions();
    setSubscriptions(list.subscriptions);
  };
  return (
    <Modal label="插件设置" onClose={onClose} wide>
      <div className="qrs-modal-head">
        <h2>乔木 RSS 设置</h2>
        <button type="button" onClick={onClose}>完成</button>
      </div>
      {settings === undefined ? <p className="qrs-modal-note">正在加载…</p> : (
        <div className="qrs-modal-body">
          <label className="qrs-field"><span>乔木服务地址</span>
            <input aria-label="乔木服务地址" value={origin} onChange={(event) => setOrigin(event.target.value)} />
          </label>
          <label className="qrs-field qrs-field-check">
            <input type="checkbox" checked={settings.aiAssist !== false}
              onChange={(event) => setSettings({ ...settings, aiAssist: event.target.checked })} />
            <span>缺失译文／改写时用 Harness 默认模型补全</span>
          </label>
          <div className="qrs-modal-row">
            <button type="button" onClick={async () => {
              try {
                await api.opmlExport().then((result) => {
                  const blob = new Blob([result.xml], { type: 'text/xml' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'qiaomu-rss-subscriptions.opml';
                  link.click();
                  URL.revokeObjectURL(link.href);
                });
              } catch (error) { setMessage(`导出失败：${error?.message ?? String(error)}`); }
            }}>导出 OPML</button>
            <button type="button" onClick={async () => {
              try {
                const result = await api.saveSettings({ ...settings, origin: origin.trim() });
                setSettings(result.settings);
                window.dispatchEvent(new Event('qrs-settings-changed'));
                setMessage('设置已保存');
              } catch (error) { setMessage(`保存失败：${error?.message ?? String(error)}`); }
            }}>保存设置</button>
          </div>
          {message && <p className="qrs-modal-note" role="status">{message}</p>}
          <OpmlImport api={api} onDone={reload} />
          <SubscriptionManager api={api} subscriptions={subscriptions} onChange={setSubscriptions} notify={(text, isError) => setMessage(isError ? text : text)} />
        </div>
      )}
      <div className="qrs-modal-actions">
        <button type="button" onClick={onClose}><Icon name="chevron-down" size={14} />关闭</button>
      </div>
    </Modal>
  );
}

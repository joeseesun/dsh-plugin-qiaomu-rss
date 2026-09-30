import { useEffect, useState } from 'react';
import packageInfo from '../../package.json';
import { Icon } from './icons.jsx';
import { ReadingControls } from './ReadingAppearance.jsx';
import { OpmlImport } from './OpmlImport.jsx';
import { SubscriptionManager } from './SubscriptionManager.jsx';

const TABS = [['reading', '阅读'], ['sources', '订阅'], ['about', '关于']];
const REWARD_QR = 'https://radio.qiaomu.ai/assets/qiaomu_reward_qr.png';
const FOLLOW_QR = 'https://radio.qiaomu.ai/assets/qiaomu_wechat_public_account_qr.jpg';

/** The Harness version keeps the original reading, source, and about surfaces. */
export function SettingsPage({ api, onClose, notify }) {
  const [tab, setTab] = useState('reading');
  const [settings, setSettings] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.getSettings(), api.listSubscriptions()]).then(([preferences, feeds]) => {
      if (!cancelled) { setSettings(preferences.settings); setSubscriptions(feeds.subscriptions); }
    }).catch(error => { if (!cancelled) setMessage(`读取设置失败：${error?.message ?? String(error)}`); });
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { cancelled = true; window.removeEventListener('keydown', onKey); };
  }, [api, onClose]);
  const change = patch => setSettings(previous => ({ ...previous, ...patch }));
  const reloadSubscriptions = async () => {
    const list = await api.listSubscriptions();
    setSubscriptions(list.subscriptions);
  };
  const save = async () => {
    setSaving(true);
    try {
      const result = await api.saveSettings({ ...settings, origin: settings.origin.trim() });
      setSettings(result.settings);
      window.dispatchEvent(new Event('qrs-settings-changed'));
      setMessage('设置已保存');
    } catch (error) { setMessage(`保存失败：${error?.message ?? String(error)}`); }
    finally { setSaving(false); }
  };
  const exportOpml = async () => {
    try {
      const result = await api.opmlExport();
      const url = URL.createObjectURL(new Blob([result.xml], { type: 'text/xml' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qiaomu-rss-subscriptions.opml';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(`导出失败：${error?.message ?? String(error)}`); }
  };
  return <div className="qrs-settings-backdrop" onClick={onClose}>
    <section className="qrs-settings-page" role="dialog" aria-modal="true" aria-label="乔木 RSS 设置" onClick={event => event.stopPropagation()}>
      <header className="qrs-settings-head"><div><strong>乔木 RSS 设置</strong></div><button type="button" className="qrs-icon" title="关闭设置" aria-label="关闭设置" onClick={onClose}><Icon name="x" /></button></header>
      <nav className="qrs-settings-tabs" aria-label="设置分类">{TABS.map(([key, label]) => <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}>{label}</button>)}</nav>
      <main className="qrs-settings-content">
        {!settings && <p role="status">{message || '正在加载设置…'}</p>}
        {settings && tab === 'reading' && <section aria-label="阅读设置">
          <h3>阅读外观</h3>
          <ReadingControls settings={settings} onChange={change} />
          <label className="qrs-field qrs-field-check qrs-settings-ai"><input type="checkbox" checked={settings.aiAssist !== false} onChange={event => change({ aiAssist: event.target.checked })} /><span>缺失译文或改写时使用 Harness 当前模型补全</span></label>
          <p className="qrs-modal-note">AI 伴读使用 Harness 的原生会话和默认工作区；对话模型在右侧输入框中选择。</p>
        </section>}
        {settings && tab === 'sources' && <section aria-label="订阅设置">
          <h3>乔木精选</h3>
          <label className="qrs-field"><span>服务地址</span><input type="url" aria-label="乔木服务地址" value={settings.origin ?? ''} onChange={event => change({ origin: event.target.value })} /></label>
          <p className="qrs-modal-note">使用兼容的 HTTPS 乔木 RSS 服务；个人订阅源直接在本机读取。</p>
          <h3>我的订阅</h3>
          <div className="qrs-modal-row"><button type="button" onClick={() => void exportOpml()}>导出 OPML</button></div>
          <OpmlImport api={api} onDone={reloadSubscriptions} />
          <SubscriptionManager api={api} subscriptions={subscriptions} onChange={setSubscriptions} notify={(text, isError) => { setMessage(text); if (isError) notify(text, true); }} />
        </section>}
        {tab === 'about' && <section aria-label="关于乔木 RSS">
          <h3>乔木 RSS for DeepSeek Harness</h3>
          <p>版本 {packageInfo.version} · GPL-3.0-only</p>
          <p>在 Harness 里阅读乔木精选与个人 RSS，并直接使用原生 AI 对话伴读文章。阅读数据保存在本机 Harness 目录中。</p>
          <div className="qrs-settings-links">
            <a href="https://github.com/joeseesun/dsh-plugin-qiaomu-rss" target="_blank" rel="noopener noreferrer">源码与更新</a>
            <a href="https://github.com/joeseesun/dsh-plugin-qiaomu-rss/issues" target="_blank" rel="noopener noreferrer">反馈问题</a>
            <a href="https://qiaomu.ai/" target="_blank" rel="noopener noreferrer">向阳乔木</a>
            <a href="https://blog.qiaomu.ai/" target="_blank" rel="noopener noreferrer">乔木博客</a>
          </div>
          <div className="qrs-settings-support">
            <div><h3>打赏支持</h3><p>感谢支持乔木持续维护这个插件。</p><img src={REWARD_QR} alt="向阳乔木打赏二维码" loading="lazy" width="160" height="160" referrerPolicy="no-referrer" /></div>
            <div><h3>关注公众号</h3><p>向阳乔木推荐看</p><img src={FOLLOW_QR} alt="向阳乔木推荐看公众号二维码" loading="lazy" width="160" height="160" referrerPolicy="no-referrer" /></div>
          </div>
        </section>}
      </main>
      <footer className="qrs-settings-footer"><span role="status">{message}</span>{tab !== 'about' && <button type="button" disabled={!settings || saving} onClick={() => void save()}>{saving ? '保存中…' : '保存设置'}</button>}</footer>
    </section>
  </div>;
}

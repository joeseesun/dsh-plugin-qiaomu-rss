import { useEffect, useState } from 'react';
import { BookOpen, Rss, Info, Download, Upload, ArrowUpRight, Heart, Sparkles } from 'lucide-react';
import packageInfo from '../../package.json';
import { Icon } from './icons.jsx';
import { ReadingControls } from './ReadingAppearance.jsx';
import { OpmlImport } from './OpmlImport.jsx';
import { SubscriptionManager } from './SubscriptionManager.jsx';
import { PromptManager } from './PromptManager.jsx';

const TABS = [['reading', '阅读体验', BookOpen], ['sources', '订阅管理', Rss], ['prompts', '快捷提示词', Sparkles], ['about', '关于', Info]];
const REWARD_QR = 'https://radio.qiaomu.ai/assets/qiaomu_reward_qr.png';
const FOLLOW_QR = 'https://radio.qiaomu.ai/assets/qiaomu_wechat_public_account_qr.jpg';

export function SettingsPage({ api, onClose, notify, initialTab = 'reading', startAddingPrompt = false }) {
  const [tab, setTab] = useState(initialTab);
  const [settings, setSettings] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
      <header className="qrs-settings-head">
        <div><span>QIAOMU RSS</span><strong>插件设置</strong></div>
        <button type="button" className="qrs-icon" title="关闭设置" aria-label="关闭设置" onClick={onClose}><Icon name="x" /></button>
      </header>
      <div className="qrs-settings-body">
        <nav className="qrs-settings-tabs" aria-label="设置分类">
          <span className="qrs-settings-nav-caption">设置</span>
          {TABS.map(([key, label, TabIcon]) => <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}><TabIcon size={17} strokeWidth={1.8} />{label}</button>)}
        </nav>
        <main className="qrs-settings-content">
          {!settings && <p role="status">{message || '正在加载设置…'}</p>}
          {settings && tab === 'reading' && <section aria-label="阅读设置">
            <div className="qrs-settings-intro"><h2>阅读体验</h2><p>让文章以你喜欢的节奏和样式呈现。</p></div>
            <div className="qrs-settings-card qrs-settings-reading-card">
              <div className="qrs-settings-card-head"><h3>文章外观</h3><p>字体、版心与颜色只影响阅读视图。</p></div>
              <ReadingControls settings={settings} onChange={change} variant="page" />
            </div>
            <div className="qrs-settings-card qrs-settings-toggle-row">
              <div><h3>AI 补全阅读版本</h3><p>文章缺少译文或乔木改写时，用 Harness 当前模型补全。</p></div>
              <label className="qrs-switch"><input type="checkbox" aria-label="AI 补全阅读版本" checked={settings.aiAssist !== false} onChange={event => change({ aiAssist: event.target.checked })} /><span aria-hidden="true" /></label>
            </div>
            <p className="qrs-settings-hint">AI 伴读使用 Harness 的原生对话与默认工作区。模型可在右侧对话框中切换。</p>
          </section>}
          {settings && tab === 'sources' && <section aria-label="订阅设置">
            <div className="qrs-settings-intro"><h2>订阅管理</h2><p>整理个人订阅源，或迁移现有 OPML 清单。</p></div>
            <div className="qrs-settings-card">
              <div className="qrs-settings-card-head"><h3>乔木精选</h3><p>公开内容服务的连接地址。个人订阅仍由本机读取。</p></div>
              <label className="qrs-settings-url"><span>服务地址</span><input type="url" aria-label="乔木服务地址" value={settings.origin ?? ''} onChange={event => change({ origin: event.target.value })} /></label>
            </div>
            <div className="qrs-settings-card qrs-settings-sources-card">
              <div className="qrs-settings-card-head qrs-settings-source-head"><div><h3>我的订阅</h3><p>{subscriptions.length} 个订阅源</p></div><div className="qrs-settings-source-actions">
                <button type="button" onClick={() => setShowImport(current => !current)} aria-expanded={showImport}><Upload size={15} />导入 OPML</button>
                <button type="button" onClick={() => void exportOpml()}><Download size={15} />导出</button>
              </div></div>
              {showImport && <div className="qrs-settings-import"><OpmlImport api={api} onDone={async () => { await reloadSubscriptions(); setShowImport(false); }} /></div>}
              <SubscriptionManager api={api} subscriptions={subscriptions} onChange={setSubscriptions} notify={(text, isError) => { setMessage(text); if (isError) notify(text, true); }} />
            </div>
          </section>}
          {tab === 'prompts' && <section aria-label="快捷提示词设置"><div className="qrs-settings-intro"><h2>快捷提示词</h2><p>把常用的阅读提问放在手边。</p></div><div className="qrs-settings-card"><PromptManager notify={setMessage} startAdding={startAddingPrompt} /></div></section>}
          {tab === 'about' && <section aria-label="关于乔木 RSS">
            <div className="qrs-settings-intro"><h2>关于乔木 RSS</h2><p>为 DeepSeek Harness 打造的安静阅读空间。</p></div>
            <div className="qrs-settings-card qrs-settings-about-card"><div className="qrs-settings-about-brand"><span>乔</span><div><h3>乔木 RSS</h3><p>版本 {packageInfo.version} · GPL-3.0-only</p></div></div><p>阅读乔木精选与个人 RSS，并用 Harness 原生 AI 对话伴读。阅读数据保存在本机 Harness 目录。</p></div>
            <div className="qrs-settings-card"><div className="qrs-settings-card-head"><h3>项目与反馈</h3></div><div className="qrs-settings-links">
              {[['源码与更新','https://github.com/joeseesun/dsh-plugin-qiaomu-rss'],['反馈问题','https://github.com/joeseesun/dsh-plugin-qiaomu-rss/issues'],['向阳乔木','https://qiaomu.ai/'],['乔木博客','https://blog.qiaomu.ai/']].map(([label,href]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={15} /></a>)}
            </div></div>
            <div className="qrs-settings-support">
              <div className="qrs-settings-card"><Heart size={18} /><h3>打赏支持</h3><p>感谢支持乔木持续维护这个插件。</p><img src={REWARD_QR} alt="向阳乔木打赏二维码" loading="lazy" width="140" height="140" referrerPolicy="no-referrer" /></div>
              <div className="qrs-settings-card"><Rss size={18} /><h3>关注公众号</h3><p>向阳乔木推荐看</p><img src={FOLLOW_QR} alt="向阳乔木推荐看公众号二维码" loading="lazy" width="140" height="140" referrerPolicy="no-referrer" /></div>
            </div>
          </section>}
        </main>
      </div>
      <footer className="qrs-settings-footer"><span role="status">{message}</span>{tab === 'reading' || tab === 'sources' ? <button type="button" disabled={!settings || saving} onClick={() => void save()}>{saving ? '保存中…' : '保存设置'}</button> : null}</footer>
    </section>
  </div>;
}

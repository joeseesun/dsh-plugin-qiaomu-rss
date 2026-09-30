import { useEffect, useMemo, useState } from 'react';
import blogCatalog from '../data/independent-blogs.json';
import podcastCatalog from '../data/podcast-feeds.json';
import { Icon } from './icons.jsx';

const featured = [
  ['潮流周刊 · Tw93','https://weekly.tw93.fun/rss.xml'],
  ['阮一峰的网络日志','https://www.ruanyifeng.com/blog/atom.xml'],
  ['云风','https://blog.codingnow.com/atom.xml'],
  ['和菜头','https://www.hecaitou.com/feeds/posts/default?alt=rss'],
  ['张鑫旭','https://www.zhangxinxu.com/wordpress/feed/'],
  ['小众软件','https://www.appinn.com/feed/'],
  ['月光博客','https://www.williamlong.info/rss.xml'],
  ['Reorx','https://reorx.com/feed.xml'],
  ['pseudoyu','https://www.pseudoyu.com/zh/index.xml'],
].map(([name,url]) => ({ name,url,category:'精选作者' }));
const wechat = [
  ['向阳乔木推荐看','3008229483'],['葬AI','3988614169'],['AGENT橘','3903697567'],
  ['赛博禅心','3934419561'],['数字生命卡兹克','3223096120'],['晚点LatePost','3572959446'],
  ['新智元','3271041950'],['elsewhere别处发生','3635075805'],
].map(([name,id]) => ({ name,url:`https://rss.t5t6.com/weread/MP_WXS_${id}.xml`,category:'微信公众号' }));
const catalog = [...featured,...wechat,...podcastCatalog.items.map((entry) => ({ ...entry, category:'播客' })),...blogCatalog.items.map((entry) => ({ ...entry, category:'独立博客' }))];
const topics = [...new Set(blogCatalog.items.flatMap((entry) => entry.tags ?? []))].sort();
const categories = ['全部','精选作者','微信公众号','播客','独立博客'];
function feedHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

export function Discover({ api, onClose, onAdded, onRead }) {
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('全部');
  const [topic,setTopic] = useState('');
  const [limit,setLimit] = useState(40);
  const [subscribed,setSubscribed] = useState([]);
  const [busy,setBusy] = useState('');
  const [message,setMessage] = useState('');
  useEffect(() => setLimit(40),[query,category,topic]);
  useEffect(() => { void api.listSubscriptions().then((result) => setSubscribed(result.subscriptions)).catch((error) => setMessage(error.message)); },[api]);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return catalog.filter((entry) => (category === '全部' || entry.category === category) && (!topic || entry.tags?.includes(topic)) && `${entry.name} ${entry.url} ${(entry.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(needle));
  }, [query,category,topic]);
  const add = async (entry) => {
    setBusy(entry.url); setMessage('');
    try {
      const result = await api.addSubscription({ name:entry.name,url:entry.url,group:entry.category });
      setSubscribed((current) => [...current,result]);
      setMessage(result.lastError ? `已添加，首次获取失败：${result.lastError}` : `已订阅 ${entry.name}`);
      await onAdded();
    } catch (error) { setMessage(error?.message ?? String(error)); }
    finally { setBusy(''); }
  };
  return <div className="qmrss-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="qmrss-dialog qrs-discover" role="dialog" aria-modal="true" aria-label="探索订阅">
      <header className="qrs-discover-head">
        <div><h3>探索订阅</h3><p>找到感兴趣的内容，加入你的频道。</p></div>
        <button type="button" className="qrs-icon" aria-label="关闭探索" title="关闭" onClick={onClose}><Icon name="x" /></button>
      </header>
      <div className="qrs-discover-filters">
        <label className="qrs-discover-search"><Icon name="search" /><input autoFocus aria-label="搜索推荐源" placeholder="搜索作者、播客或 RSS 地址" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="qrs-discover-categories" role="group" aria-label="推荐源分类">
          {categories.map((name) => <button key={name} type="button" className={category === name ? 'active' : ''} aria-pressed={category === name} onClick={() => { setCategory(name); if (name !== '全部' && name !== '独立博客') setTopic(''); }}>{name}</button>)}
        </div>
        <div className="qrs-discover-filter-line"><span>{visible.length} 个结果</span><select aria-label="主题标签" value={topic} onChange={(event) => setTopic(event.target.value)} disabled={category !== '全部' && category !== '独立博客'}><option value="">全部主题</option>{topics.map((tag) => <option key={tag}>{tag}</option>)}</select></div>
      </div>
      <div className="qrs-discover-results">
        {visible.slice(0,limit).map((entry,index) => {
          const subscription = subscribed.find((sub) => sub.url === entry.url);
          return <div key={`${entry.url}:${index}`} className="qrs-discover-row">
            <span className="qrs-discover-avatar" aria-hidden="true">{entry.category === '播客' ? <Icon name="podcast" size={17} /> : entry.name.slice(0,1)}</span>
            <div className="qrs-discover-info"><strong>{entry.name}</strong><span title={entry.url}>{feedHost(entry.url)}<span className="qrs-discover-dot"> · </span>{entry.category}</span></div>
            {subscription ? <div className="qrs-discover-actions"><button type="button" className="qrs-discover-read" aria-label={`阅读 ${entry.name}`} onClick={() => onRead(`feed:${subscription.id}`)}>阅读</button><span className="qrs-discover-subscribed">已订阅</span></div>
              : <button type="button" className="qrs-discover-add" disabled={Boolean(busy)} aria-label={`订阅 ${entry.name}`} onClick={() => void add(entry)}>{busy === entry.url ? '添加中…' : <><Icon name="plus" />订阅</>}</button>}
          </div>;
        })}
        {visible.length > limit && <button type="button" className="qrs-discover-more" onClick={() => setLimit((current) => current + 40)}>显示更多</button>}
        {!visible.length && <div className="qrs-discover-empty">没有找到匹配的订阅源</div>}
      </div>
      <footer className="qrs-discover-foot">
        {message && <div className="qrs-discover-message" role="status">{message}</div>}
        <span>独立博客来自 <a href={blogCatalog.source} target="_blank" rel="noreferrer">Tim Qian 目录</a> · MIT</span>
        <span>播客目录来自 <a href={podcastCatalog.source} target="_blank" rel="noreferrer">乔木 RSS</a></span>
        <span>公众号源由第三方提供，可能只有摘要</span>
      </footer>
    </div>
  </div>;
}

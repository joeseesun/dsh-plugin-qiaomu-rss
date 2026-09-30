import { useEffect, useState } from 'react';
import blogCatalog from '../data/independent-blogs.json';

// Feed names and public endpoints checked against upstream discovery.ts.
// https://github.com/joeseesun/qiaomu-ai-rss (db738ca)
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
const catalog = [...featured,...wechat,...blogCatalog.items.map((entry) => ({ ...entry, category:'独立博客' }))];
const topics = [...new Set(blogCatalog.items.flatMap((entry) => entry.tags ?? []))].sort();

export function Discover({ api, onClose, onAdded }) {
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('全部');
  const [topic,setTopic] = useState('');
  const [limit,setLimit] = useState(40);
  useEffect(() => setLimit(40),[query,category,topic]);
  const [subscribed,setSubscribed] = useState([]);
  const [busy,setBusy] = useState('');
  const [message,setMessage] = useState('');
  useEffect(() => { void api.listSubscriptions().then((result) => setSubscribed(result.subscriptions.map((sub) => sub.url))).catch((error) => setMessage(error.message)); },[api]);
  const visible = catalog.filter((entry) => (category === '全部' || entry.category === category) && (!topic || entry.tags?.includes(topic)) && `${entry.name} ${entry.url} ${(entry.tags ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="qmrss-dialog-backdrop"><div className="qmrss-dialog" role="dialog" aria-label="探索订阅">
    <h3>探索订阅</h3>
    <input aria-label="搜索推荐源" placeholder="搜索作者或地址" value={query} onChange={(e) => setQuery(e.target.value)} />
    <select aria-label="推荐源分类" value={category} onChange={(e) => setCategory(e.target.value)}>{['全部','精选作者','微信公众号','独立博客'].map((name) => <option key={name}>{name}</option>)}</select>
    <p style={{ fontSize:12 }}>公众号源由第三方公开服务提供；可能只有摘要。浏览目录不会自动添加订阅。</p>
    <select aria-label="主题标签" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">全部主题</option>{topics.map((tag) => <option key={tag}>{tag}</option>)}</select>
    <p style={{ fontSize:12 }}>独立博客 {blogCatalog.items.length} 个 · <a href={blogCatalog.source} target="_blank" rel="noreferrer">Tim Qian 目录</a> · MIT © 2019 Tim Qian。匹配 {visible.length} 项。</p>
    {visible.slice(0,limit).map((entry,index) => <div key={`${entry.url}:${index}`} style={{ padding:8,borderBottom:'1px solid var(--dsw-alias-border-l1)' }}>
      <strong>{entry.name}</strong><div style={{ fontSize:12,overflowWrap:'anywhere' }}>{entry.url}</div>
      <button type="button" className="qmrss-btn" disabled={Boolean(busy) || subscribed.includes(entry.url)} onClick={async () => {
        setBusy(entry.url); setMessage('');
        try {
          const result = await api.addSubscription({ name:entry.name,url:entry.url,group:entry.category });
          setSubscribed((current) => [...current,entry.url]);
          setMessage(result.lastError ? `已添加，首次获取失败：${result.lastError}` : `已订阅 ${entry.name}`);
          await onAdded();
        } catch (error) { setMessage(error?.message ?? String(error)); }
        finally { setBusy(''); }
      }}>{subscribed.includes(entry.url) ? '已订阅' : busy === entry.url ? '添加中…' : '订阅'}</button>
    </div>)}
    {visible.length > limit && <button type="button" className="qmrss-btn" onClick={() => setLimit(limit + 40)}>显示更多推荐</button>}
    {!visible.length && <p>没有匹配的推荐源。</p>}
    {message && <div role="status">{message}</div>}
    <button type="button" className="qmrss-btn" onClick={onClose}>关闭探索</button>
  </div></div>;
}

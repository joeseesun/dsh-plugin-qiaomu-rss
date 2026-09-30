import { useMemo, useState } from 'react';
import { Layers3, Sparkles, Rss, Folder, BookOpen } from 'lucide-react';
import { Icon } from './icons.jsx';

/** Split host channels into the same sections the original picker shows. */
export function groupChannels(channels) {
  const sections = { 聚合: [], 订阅分组: [], 乔木频道: [], 我的订阅源: [] };
  for (const channel of channels) {
    if (channel.key === 'all' || channel.key === 'qiaomu' || channel.key === 'feeds:all') {
      const subtitle = channel.key === 'qiaomu' ? '乔木精选的高质量内容'
        : channel.key === 'feeds:all' ? `${channels.filter((item) => item.kind === 'feed').length} 个个人订阅源`
          : `${channel.unread} 篇未读`;
      sections.聚合.push({ ...channel, subtitle });
    } else if (channel.kind === 'qiaomu') {
      sections.乔木频道.push({ ...channel, subtitle: `${channel.total} 篇文章`, monogram: channel.name.trim().slice(0, 1) });
    } else if (channel.key.startsWith('group:')) {
      sections.订阅分组.push({ ...channel, subtitle: `${channels.filter((item) => item.group === channel.name).length} 个订阅源` });
    } else {
      sections.我的订阅源.push({ ...channel, subtitle: channel.lastError ? `获取失败：${channel.lastError}` : channel.url, error: Boolean(channel.lastError) });
    }
  }
  return sections;
}

export function ChannelMark({ channel, size = 22 }) {
  const key = channel.key ?? '';
  const IconType = key === 'all' ? Layers3 : key === 'qiaomu' ? Sparkles : key === 'feeds:all' || key.startsWith('feed:') ? Rss : key.startsWith('group:') ? Folder : BookOpen;
  const variant = key === 'qiaomu' ? ' curated' : key === 'all' ? ' all' : '';
  return <span className={`qrs-channel-mark${variant}`} style={{ width:size, height:size, flex:`0 0 ${size}px` }} aria-hidden="true">
    {channel.monogram && key.startsWith('qiaomu:') ? <span>{channel.monogram}</span> : <IconType size={Math.max(16, Math.round(size*.72))} strokeWidth={1.8} />}
  </span>;
}

export function ChannelPicker({ channels, current, anchor, onSelect, onManage, onClose }) {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => groupChannels(channels), [channels]);
  const searching = query.trim() !== '';
  const matches = (channel) => `${channel.name} ${channel.subtitle ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
  const visible = searching
    ? channels.map((channel) => {
      const all = Object.values(sections).flat();
      return all.find((item) => item.key === channel.key) ?? channel;
    }).filter(matches)
    : [];
  const row = (channel) => (
    <div className="qrs-channel-option-wrap" key={channel.key}>
      <button type="button" className="qrs-channel-option" aria-current={channel.key === current}
        onClick={() => { onSelect(channel.key); onClose(); }}>
        <ChannelMark channel={channel} size={26} />
        <span className="qrs-channel-copy">
          <span className="qrs-channel-name">{channel.name}</span>
          {channel.subtitle && <span className="qrs-channel-subtitle">{channel.subtitle}</span>}
        </span>
        {channel.key === current && <span className="qrs-channel-check"><Icon name="circle-check" size={16} /></span>}
      </button>
    </div>
  );
  return (
    <div className="qrs-channel-backdrop" onClick={onClose}>
      <div className="qrs-channel-picker" style={anchor ? { left:anchor.left, top:anchor.top } : undefined} role="dialog" aria-label="选择频道" onClick={(event) => event.stopPropagation()}>
        <div className="qrs-channel-heading"><div><strong>切换频道</strong><small>选择想读的内容</small></div><button type="button" className="qrs-icon" aria-label="关闭频道列表" onClick={onClose}><Icon name="x" /></button></div>
        <div className="qrs-channel-top"><Icon name="search" size={16} /><input type="search" aria-label="搜索频道" placeholder="搜索频道、分组或订阅源…" value={query}
            onChange={(event) => setQuery(event.target.value)} autoFocus /></div>
        <div className="qrs-channel-options">
          {searching
            ? (visible.length ? visible.map(row) : <div className="qrs-channel-empty">没有匹配的频道</div>)
            : Object.entries(sections).map(([title, items]) => items.length === 0 ? null : (
              <div key={title}>
                <div className="qrs-channel-section">{title}</div>
                {items.map((channel) => row(channel))}
              </div>
            ))}
        </div>
        <div className="qrs-channel-footer"><button type="button" className="qrs-channel-manage" onClick={onManage}>
            <Icon name="settings" size={16} />管理订阅<Icon name="chevron-down" size={13} />
          </button><button type="button" className="qrs-channel-close" onClick={onClose}>完成</button></div>
      </div>
    </div>
  );
}

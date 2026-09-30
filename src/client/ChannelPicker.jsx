import { useMemo, useState } from 'react';
import { Icon } from './icons.jsx';

/** Split host channels into the same sections the original picker shows. */
export function groupChannels(channels) {
  const sections = { 聚合: [], 订阅分组: [], 乔木频道: [], 我的订阅源: [] };
  for (const channel of channels) {
    if (channel.key === 'all' || channel.key === 'qiaomu' || channel.key === 'feeds:all') {
      const subtitle = channel.key === 'qiaomu' ? '乔木精选的高质量内容'
        : channel.key === 'feeds:all' ? `${channels.filter((item) => item.kind === 'feed').length} 个个人订阅源`
          : `${channel.unread} 篇未读`;
      sections.聚合.push({ ...channel, subtitle, icon: channel.key === 'qiaomu' ? 'sparkles' : channel.key === 'feeds:all' ? 'rss' : 'tree-deciduous' });
    } else if (channel.kind === 'qiaomu') {
      sections.乔木频道.push({ ...channel, subtitle: `${channel.total} 篇文章`, monogram: channel.name.trim().slice(0, 1) });
    } else if (channel.key.startsWith('group:')) {
      sections.订阅分组.push({ ...channel, subtitle: `${channels.filter((item) => item.group === channel.name).length} 个订阅源`, icon: 'folder' });
    } else {
      sections.我的订阅源.push({ ...channel, subtitle: channel.lastError ? `获取失败：${channel.lastError}` : channel.url, icon: 'rss', error: Boolean(channel.lastError) });
    }
  }
  return sections;
}

export function ChannelMark({ channel, size = 22 }) {
  const style = {
    width: size, height: size, flex: `0 0 ${size}px`, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: 7, background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-base))',
    color: 'var(--dsw-alias-brand-primary)', fontSize: 11, fontWeight: 700,
  };
  if (channel.monogram) return <span style={style}>{channel.monogram}</span>;
  return <span style={style}><Icon name={channel.icon ?? 'rss'} size={13} strokeWidth={1.8} /></span>;
}

export function ChannelPicker({ channels, current, onSelect, onManage, onClose }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
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
        <ChannelMark channel={channel} size={20} />
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
      <div className="qrs-channel-picker" role="dialog" aria-label="选择频道" onClick={(event) => event.stopPropagation()}>
        <div className="qrs-channel-top">
          <input type="search" aria-label="搜索频道" placeholder="搜索频道、分组或订阅源…" value={query}
            onChange={(event) => setQuery(event.target.value)} autoFocus />
          <button type="button" className="qrs-channel-manage" onClick={onManage}>
            <Icon name="settings" size={15} />管理订阅
          </button>
        </div>
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
        <button type="button" className="qrs-channel-close" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

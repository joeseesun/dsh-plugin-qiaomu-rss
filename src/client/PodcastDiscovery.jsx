import { useState } from 'react';
import { Icon } from './icons.jsx';

export function PodcastDiscovery({ api, onImported }) {
  const [query, setQuery] = useState('');
  const [shows, setShows] = useState([]);
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    setBusy('search'); setError(''); setShow(null); setEpisodes([]); setSearched(true);
    try { setShows((await api.searchPodcastShows(query)).shows); }
    catch (cause) { setError(cause.message ?? String(cause)); }
    finally { setBusy(''); }
  };
  const openShow = async (item, nextPage = 1) => {
    setBusy('episodes'); setError('');
    try {
      const result = await api.listPodcastEpisodes(item.slug, nextPage);
      setShow(item); setEpisodes(result.episodes); setPage(nextPage);
    } catch (cause) { setError(cause.message ?? String(cause)); }
    finally { setBusy(''); }
  };
  const importEpisode = async (item) => {
    setBusy(item.episode_slug); setError('');
    try {
      const result = await api.importPodcastTranscript(show.slug, item.episode_slug);
      await onImported(result.key);
    } catch (cause) { setError(cause.message ?? String(cause)); }
    finally { setBusy(''); }
  };

  return <div className="qrs-podscribe">
    <form className="qrs-podscribe-search" onSubmit={search}>
      <Icon name="search" size={16} />
      <input autoFocus aria-label="搜索海外播客" placeholder="搜索英文播客节目，如 Acquired" value={query} onChange={event => setQuery(event.target.value)} />
      <button type="submit" disabled={busy === 'search' || query.trim().length < 2}>{busy === 'search' ? '搜索中…' : '搜索'}</button>
    </form>
    <p className="qrs-podscribe-hint">搜索公开播客转写目录。选一集后获取完整原文，可在阅读器中翻译或提问。</p>
    {error && <p role="alert" className="qrs-podscribe-error">{error}</p>}
    {show && <button type="button" className="qrs-podscribe-back" onClick={() => { setShow(null); setEpisodes([]); }}>‹ 返回节目列表</button>}
    <div className="qrs-podscribe-list">
      {show ? <>
        <h4>{show.name}</h4>
        {episodes.map(item => <div className="qrs-podscribe-row" key={item.episode_slug}>
          <div><strong>{item.title}</strong><small>{item.published_relative || ''}</small></div>
          <button type="button" disabled={Boolean(busy)} onClick={() => void importEpisode(item)}>{busy === item.episode_slug ? '获取中…' : '阅读原文'}</button>
        </div>)}
        {page > 1 && <button type="button" className="qrs-podscribe-next" disabled={Boolean(busy)} onClick={() => void openShow(show, page - 1)}>上一页</button>}
        {episodes.length > 0 && <button type="button" className="qrs-podscribe-next" disabled={Boolean(busy)} onClick={() => void openShow(show, page + 1)}>下一页</button>}
      </> : shows.map(item => <button type="button" className="qrs-podscribe-row qrs-podscribe-show" key={item.slug} disabled={Boolean(busy)} onClick={() => void openShow(item)}>
        {item.image && <img src={item.image} alt="" loading="lazy" />}
        <span><strong>{item.name}</strong><small>{item.episodes_with_transcripts ?? '—'} 期有转写</small></span>
        <Icon name="chevron-right" size={15} />
      </button>)}
      {!show && !shows.length && !busy && searched && !error && <p className="qrs-podscribe-hint">没有匹配的节目，可尝试英文节目名。</p>}
    </div>
  </div>;
}

import { useEffect, useRef, useState } from 'react';

export function MediaDock({ episode }) {
  const audio = useRef();
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    if (!episode || !navigator.mediaSession) return;
    const session = navigator.mediaSession;
    if (typeof MediaMetadata !== 'undefined') session.metadata = new MediaMetadata({ title: episode.titleZh || episode.title, artist: episode.author || episode.channelName || '乔木 RSS' });
    const handlers = {
      play: () => { void audio.current?.play().catch(() => setError('播放失败，请重试或打开原文')); },
      pause: () => audio.current?.pause(),
      seekbackward: () => { if (audio.current) audio.current.currentTime = Math.max(0,audio.current.currentTime - 15); },
      seekforward: () => { if (audio.current && Number.isFinite(audio.current.duration)) audio.current.currentTime = Math.min(audio.current.duration,audio.current.currentTime + 15); },
    };
    for (const [name, handler] of Object.entries(handlers)) { try { session.setActionHandler(name,handler); } catch {} }
    return () => {
      session.metadata = null;
      for (const name of Object.keys(handlers)) { try { session.setActionHandler(name,null); } catch {} }
    };
  }, [episode]);
  if (!episode) return null;
  return <div className="qrs-article-audio" aria-label="文章音频" style={{ margin:'0 0 26px' }}>
    <audio ref={audio} controls preload="metadata" src={episode.audio} style={{ display:'block', width:'100%' }} aria-label={`${episode.titleZh || episode.title} 音频`} onError={() => setError('音频暂不可用，请重试或打开原文')} />
    {error && <div role="alert" style={{ marginTop:8 }}>{error} <button type="button" className="qmrss-btn" onClick={() => { setError(''); audio.current?.load(); }}>重试音频</button>{episode.url && <a className="qmrss-btn" href={episode.url} target="_blank" rel="noopener noreferrer">打开原文</a>}</div>}
  </div>;
}

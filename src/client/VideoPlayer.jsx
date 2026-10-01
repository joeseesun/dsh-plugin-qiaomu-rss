import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';

export function VideoPlayer({ embed, playerUrl }) {
  const bridge = typeof window !== 'undefined' ? window.dshDesktop?.browser : undefined;
  const [lease, setLease] = useState(null);
  const [error, setError] = useState('');
  const watchUrl = `https://www.youtube.com/watch?v=${new URL(embed).pathname.split('/').pop()}`;
  const openYouTube = () => window.open(watchUrl, '_blank', 'noopener,noreferrer');
  const view = useRef(null);
  const loaded = useRef(false);
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.replace(/\sElectron\/\S+/g, '').replace(/\sDeepSeek[\w-]*\/\S+/g, '') : undefined;
  useEffect(() => {
    if (!bridge || !playerUrl) return;
    let cancelled = false;
    let acquired;
    let unsubscribe;
    void bridge.acquire('qiaomu-rss:youtube').then(value => {
      acquired = value;
      if (cancelled) { void bridge.release(value.lease); return; }
      // Sign-in and other popup actions go to the video in the user's browser.
      unsubscribe = bridge.onOpenRequested(value.lease, openYouTube);
      setLease(value);
    }).catch(e => setError(e.message));
    return () => { cancelled = true; unsubscribe?.(); if (acquired) void bridge.release(acquired.lease); };
  }, [bridge, playerUrl]);
  useEffect(() => {
    const element = view.current;
    if (!element || !lease) return;
    loaded.current = false;
    const ready = () => {
      if (loaded.current) return;
      loaded.current = true;
      element.setUserAgent(userAgent);
      void element.loadURL(playerUrl, { userAgent }).catch(e => setError(e.message));
    };
    element.addEventListener('dom-ready', ready);
    return () => element.removeEventListener('dom-ready', ready);
  }, [lease, playerUrl]);
  const externalLink = <a className="qmrss-btn" href={watchUrl} target="_blank" rel="noopener noreferrer"><Icon name="external-link" size={16} />在 YouTube 打开</a>;
  if (!bridge || !playerUrl || error) return <div style={{ marginBottom:26 }}><iframe className="qrs-video-frame" src={playerUrl || embed} title="YouTube 视频播放器" loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />{error && <div role="alert">播放器暂不可用</div>}{externalLink}</div>;
  return <div style={{ marginBottom:26 }}>
    {lease ? <webview ref={view} className="qrs-video-frame" style={{ marginBottom:8 }} src={`about:blank#${lease.lease}`} partition={lease.partition} allowpopups="true" useragent={userAgent} title="YouTube 视频播放器" /> : <div role="status">正在加载播放器…</div>}
    {externalLink}
  </div>;
}

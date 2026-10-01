import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { companionCopy } from './companion-copy.js';
import { Icon } from './icons.jsx';
import { readQuickPrompts, scopedQuickPrompts } from './quick-prompts.js';

/** Reader on the left; Harness's own conversation stays mounted on the right. */
export function AskArticle({ api, context, onClose, onManagePrompts, onClearSelection, SessionProvider, renderSlot }) {
  const copy = companionCopy();
  const [workspaceId, setWorkspaceId] = useState(() => api.defaultChatWorkspace?.());
  const [chat, setChat] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attached, setAttached] = useState('');
  const [attachedVersion, setAttachedVersion] = useState(context.version);
  const [prompts, setPrompts] = useState(readQuickPrompts);
  const [promptMount, setPromptMount] = useState(null);
  const [quoteMount, setQuoteMount] = useState(null);
  const [expandedQuote, setExpandedQuote] = useState(false);
  const [emptyConversation, setEmptyConversation] = useState(false);
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const chatRoot = useRef(null);
  const sending = useRef(false);
  const owned = useRef(null);
  const generation = useRef(0);
  const started = useRef(false);
  const bindingQueue = useRef(Promise.resolve());
  const bindContext = request => {
    const pending = bindingQueue.current.catch(() => {}).then(() => api.setReadingContext(request));
    bindingQueue.current = pending;
    return pending;
  };
  const contextKey = [context.key, context.version, context.selection || '', context.quoteId || ''].join('|');

  useEffect(() => {
    if (workspaceId) return;
    return api.watchChatWorkspaces?.(() => setWorkspaceId(api.defaultChatWorkspace?.()));
  }, [api, workspaceId]);
  useEffect(() => () => { generation.current += 1; owned.current?.release(); }, []);
  useEffect(() => { const reload = () => setPrompts(readQuickPrompts()); window.addEventListener('qrs-prompts-changed', reload); return () => window.removeEventListener('qrs-prompts-changed', reload); }, []);
  useEffect(() => { setActionError(''); setExpandedQuote(false); }, [contextKey]);
  useEffect(() => {
    if (!chat || !SessionProvider) return;
    const root = chatRoot.current;
    if (!root) return;
    const mount = document.createElement('div');
    mount.className = 'qrs-companion-prompt-anchor';
    const quote = document.createElement('div');
    quote.className = 'qrs-companion-quote-anchor';
    let placed = false;
    let quotePlaced = false;
    const place = () => {
      const seat = root.querySelector('[data-composer-seat]');
      if (seat?.parentNode) {
        if (mount.nextSibling !== seat) seat.parentNode.insertBefore(mount, seat);
        if (!placed) { placed = true; setPromptMount(mount); }
      }
      const card = root.querySelector('[data-composer-card]');
      if (card && quote.parentNode !== card) card.insertBefore(quote, card.firstChild);
      if (card && !quotePlaced) { quotePlaced = true; setQuoteMount(quote); }
      setEmptyConversation(root.querySelector('[data-content-phase]')?.getAttribute('data-content-phase') === 'hero');
    };
    const observer = new MutationObserver(place);
    observer.observe(root, { childList:true, subtree:true, attributes:true, attributeFilter:['data-content-phase'] });
    place();
    return () => { observer.disconnect(); mount.remove(); quote.remove(); setPromptMount(null); setQuoteMount(null); setEmptyConversation(false); };
  }, [chat, SessionProvider]);

  useEffect(() => {
    const card = quoteMount?.parentElement;
    if (!card) return;
    // A typed native submission must also wait for the current selection binding.
    card.inert = attached !== contextKey || Boolean(error);
    return () => { card.inert = false; };
  }, [quoteMount, attached, contextKey, error]);

  async function start(fresh = false) {
    if (!workspaceId) return;
    const current = ++generation.current;
    setBusy(true);
    setError('');
    setActionError('');
    let acquired;
    try {
      const saved = fresh ? null : localStorage.getItem(`qrs.chat.${workspaceId}.${context.key}`);
      try {
        acquired = await api.openChat({ workspaceId, sessionId: saved || undefined });
      } catch (cause) {
        if (!saved) throw cause;
        localStorage.removeItem(`qrs.chat.${workspaceId}.${context.key}`);
        acquired = await api.openChat({ workspaceId });
      }
      if (current !== generation.current) { acquired.release(); return; }
      const binding = await bindContext({ sessionId: acquired.sessionId, ...context });
      if (current !== generation.current) { acquired.release(); return; }
      owned.current?.release();
      owned.current = acquired;
      setChat(acquired);
      setAttached(contextKey);
      setAttachedVersion(binding?.version ?? context.version);
      localStorage.setItem(`qrs.chat.${workspaceId}.${context.key}`, acquired.sessionId);
      acquired = null;
    } catch (cause) {
      acquired?.release();
      setError(cause?.message ?? String(cause));
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  useEffect(() => {
    if (!workspaceId || started.current) return;
    started.current = true;
    void start();
  }, [workspaceId]);
  useEffect(() => {
    if (!chat || attached === contextKey) return;
    let stale = false;
    setError('');
    bindContext({ sessionId: chat.sessionId, ...context })
      .then((binding) => { if (!stale) { setAttached(contextKey); setAttachedVersion(binding?.version ?? context.version); } })
      .catch(cause => { if (!stale) setError(cause?.message ?? String(cause)); });
    return () => { stale = true; };
  }, [chat, contextKey]);
  async function sendQuickPrompt(item) {
    if (sending.current || !chat || attached !== contextKey) return;
    sending.current = true;
    setSendingPrompt(true);
    setActionError('');
    try { await chat.sendPrompt(item.body); }
    catch (cause) { setActionError(cause?.message?.includes('已有草稿') ? '输入框已有草稿，先发送或清空后再使用快捷提示词。' : `快捷发送失败：${cause?.message ?? String(cause)}`); }
    finally { setSendingPrompt(false); sending.current = false; }
  }

  return <aside className="qrs-companion" aria-label="AI 伴读">
    <header className="qrs-companion-header">
      <strong>AI 伴读</strong>
      <button className="qrs-icon" title="新伴读对话" aria-label="新伴读对话" onClick={() => void start(true)} disabled={busy || !workspaceId}><Icon name="plus" /></button>
      <button className="qrs-icon" title="关闭伴读" aria-label="关闭伴读" onClick={onClose}><Icon name="x" /></button>
    </header>
    <div className="qrs-companion-context">
      <strong>{context.title}</strong>
      <small>{({ original: '原文', translation: '译文', rewrite: '乔木改写' })[attached === contextKey ? attachedVersion : context.version]}{attached === contextKey && attachedVersion !== context.version ? '可用，当前版本暂缺' : ''} · {context.selection ? copy.background : copy.article}</small>
    </div>
    {error && <div className="qrs-companion-error" role="alert"><strong>{error.includes('没有可用正文') ? '暂时无法伴读这篇文章' : '伴读连接未完成'}</strong><p>{error.includes('没有可用正文') ? '这篇文章目前没有可引用的正文。你可以稍后再试，或先阅读其他文章。' : error}</p><button type="button" onClick={() => void start()}>重新连接</button></div>}
    {actionError && <div className="qrs-companion-notice" role="status"><span>{actionError}</span><button type="button" aria-label="关闭提示" onClick={() => setActionError('')}><Icon name="x" size={13} /></button></div>}
    {!chat && !error && <div className="qrs-companion-loading" role="status">{workspaceId ? '正在打开对话…' : '正在连接默认工作区…'}</div>}
    {chat && SessionProvider && <div className="qrs-native-chat" ref={chatRoot}>
      <SessionProvider session={chat.reference}>{renderSlot('qiaomu-rss.chat', {})}</SessionProvider>
      {emptyConversation && attached === contextKey && !error && <div className="qrs-companion-opening" aria-label="开始伴读">
        <div className="qrs-companion-book" aria-hidden="true">
          <svg viewBox="0 0 112 88" fill="none">
            <path d="M56 72c-10-7-21-10-37-9V19c16-1 27 2 37 9 10-7 21-10 37-9v44c-16-1-27 2-37 9Z" />
            <path d="M56 28v44M25 29c9 .3 17 2.5 24 6M25 38c9 .3 17 2.5 24 6M63 35c7-3.5 15-5.7 24-6M63 44c7-3.5 15-5.7 24-6" />
            <path d="M11 68c18-3 33 0 45 9 12-9 27-12 45-9" />
            <circle cx="77" cy="13" r="2.5" className="qrs-companion-book-spark" />
            <path d="M77 3v4M77 19v4M67 13h4M83 13h4" className="qrs-companion-book-spark" />
          </svg>
        </div>
        <span className="qrs-companion-opening-label">与文章对坐片刻</span>
        <h2>好奇，从这一页开始。</h2>
        <p>一个细节，一处疑问，或一句不同意的话。<br />写下来，我们接着读。</p>
      </div>}
    </div>}
    {quoteMount && context.selection && createPortal(<section className="qrs-companion-quote" aria-label={copy.passage} aria-busy={attached !== contextKey}>
      <div className="qrs-companion-quote-heading"><strong>{copy.selected} · {Array.from(context.selection).length} {copy.characters}</strong><span>{attached === contextKey ? copy.scope : copy.syncing}</span>
        <button type="button" aria-label={copy.remove} title={copy.removeHint} disabled={sendingPrompt || !onClearSelection} onClick={onClearSelection}><Icon name="x" size={14} /></button>
      </div>
      <blockquote className={expandedQuote ? 'is-expanded' : ''}>{context.selection}</blockquote>
      {context.selection.length > 100 && <button type="button" className="qrs-companion-quote-expand" aria-expanded={expandedQuote} onClick={() => setExpandedQuote(value => !value)}>{expandedQuote ? copy.collapse : copy.expand}</button>}
    </section>, quoteMount)}
    {promptMount && createPortal(<div className="qrs-companion-prompt-strip" role="group" aria-label="快捷提示词">
      <div className="qrs-companion-prompt-scroll">{scopedQuickPrompts(prompts, context.selection).map(item => <button type="button" className="qrs-companion-prompt-ghost" key={item.id} title={item.body} aria-label={`直接发送：${item.title}`} disabled={sendingPrompt || attached !== contextKey} onClick={() => void sendQuickPrompt(item)}>{item.title}</button>)}</div>
      <button type="button" className="qrs-companion-add-prompt" aria-label="新增快捷提示词" title="新增快捷提示词" onClick={onManagePrompts}><Icon name="plus" size={14} /></button>
    </div>, promptMount)}
  </aside>;
}

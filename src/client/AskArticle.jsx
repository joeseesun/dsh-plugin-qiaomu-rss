import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons.jsx';
import { readQuickPrompts } from './quick-prompts.js';

/** Reader on the left; Harness's own conversation stays mounted on the right. */
export function AskArticle({ api, context, onClose, SessionProvider, renderSlot }) {
  const [workspaceId, setWorkspaceId] = useState(() => api.defaultChatWorkspace?.());
  const [chat, setChat] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attached, setAttached] = useState('');
  const [prompts, setPrompts] = useState(readQuickPrompts);
  const [promptMount, setPromptMount] = useState(null);
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const chatRoot = useRef(null);
  const sending = useRef(false);
  const owned = useRef(null);
  const generation = useRef(0);
  const started = useRef(false);
  const insertedQuote = useRef('');
  const insertedQuoteText = useRef('');
  const contextKey = [context.key, context.version, context.selection || '', context.quoteId || ''].join('|');

  useEffect(() => {
    if (workspaceId) return;
    return api.watchChatWorkspaces?.(() => setWorkspaceId(api.defaultChatWorkspace?.()));
  }, [api, workspaceId]);
  useEffect(() => () => { generation.current += 1; owned.current?.release(); }, []);
  useEffect(() => { const reload = () => setPrompts(readQuickPrompts()); window.addEventListener('qrs-prompts-changed', reload); return () => window.removeEventListener('qrs-prompts-changed', reload); }, []);
  useEffect(() => { if (!context.selection) insertedQuoteText.current = ''; }, [contextKey]);
  useEffect(() => {
    if (!chat || attached !== contextKey || !SessionProvider) return;
    const root = chatRoot.current;
    if (!root) return;
    const mount = document.createElement('div');
    mount.className = 'qrs-companion-prompt-anchor';
    let placed = false;
    const place = () => {
      const seat = root.querySelector('[data-composer-seat]');
      if (!seat?.parentNode) return;
      if (mount.nextSibling !== seat) seat.parentNode.insertBefore(mount, seat);
      if (!placed) { placed = true; setPromptMount(mount); }
    };
    const observer = new MutationObserver(place);
    observer.observe(root, { childList:true, subtree:true });
    place();
    return () => { observer.disconnect(); mount.remove(); setPromptMount(null); };
  }, [chat, attached, contextKey, SessionProvider]);

  async function start(fresh = false) {
    if (!workspaceId) return;
    const current = ++generation.current;
    setBusy(true);
    setError('');
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
      await api.setReadingContext({ sessionId: acquired.sessionId, ...context });
      if (current !== generation.current) { acquired.release(); return; }
      owned.current?.release();
      owned.current = acquired;
      setChat(acquired);
      setAttached(contextKey);
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
    api.setReadingContext({ sessionId: chat.sessionId, ...context })
      .then(() => { if (!stale) setAttached(contextKey); })
      .catch(cause => { if (!stale) setError(cause?.message ?? String(cause)); });
    return () => { stale = true; };
  }, [chat, contextKey]);
  useEffect(() => {
    if (!chat || attached !== contextKey || !context.selection || !context.quoteId) return;
    const id = `${chat.sessionId}:${context.quoteId}`;
    if (insertedQuote.current === id) return;
    try {
      const excerpt = context.selection.replace(/\s+/g, ' ').trim();
      const preview = excerpt.length > 110 ? `${excerpt.slice(0, 110).trimEnd()}…` : excerpt;
      const quoteDraft = `引用选段：「${preview}」`;
      chat.insertContext(quoteDraft);
      insertedQuoteText.current = quoteDraft;
      insertedQuote.current = id;
    } catch (cause) {
      setError(`选文未加入输入框：${cause?.message ?? String(cause)}`);
    }
  }, [chat, attached, contextKey]);

  async function sendQuickPrompt(item) {
    if (sending.current || !chat || attached !== contextKey) return;
    sending.current = true;
    setSendingPrompt(true);
    setError('');
    try { await chat.sendPrompt(item.body, insertedQuoteText.current); }
    catch (cause) { setError(`快捷发送失败：${cause?.message ?? String(cause)}`); }
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
      <small>{({ original: '原文', translation: '译文', rewrite: '乔木改写' })[context.version]} · {context.selection ? '选段已关联' : '当前文章'}</small>
    </div>
    {error && <div className="qrs-companion-error" role="alert">{error}<button type="button" onClick={() => void start()}>重试</button></div>}
    {!chat && !error && <div className="qrs-companion-loading" role="status">{workspaceId ? '正在打开对话…' : '正在连接默认工作区…'}</div>}
    {chat && attached === contextKey && SessionProvider && <div className="qrs-native-chat" ref={chatRoot}>
      <SessionProvider session={chat.reference}>{renderSlot('qiaomu-rss.chat', {})}</SessionProvider>
    </div>}
    {promptMount && prompts.length > 0 && createPortal(<div className="qrs-companion-prompt-strip" role="group" aria-label="快捷提示词">
      {prompts.map(item => <button type="button" key={item.id} title={item.body} aria-label={`直接发送：${item.title}`} disabled={sendingPrompt} onClick={() => void sendQuickPrompt(item)}>{item.title}</button>)}
    </div>, promptMount)}
  </aside>;
}

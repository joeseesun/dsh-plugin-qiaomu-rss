import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';

/** Reader on the left; Harness's own conversation stays mounted on the right. */
export function AskArticle({ api, context, onClose, SessionProvider, renderSlot }) {
  const [workspaceId, setWorkspaceId] = useState(() => api.defaultChatWorkspace?.());
  const [chat, setChat] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attached, setAttached] = useState('');
  const owned = useRef(null);
  const generation = useRef(0);
  const started = useRef(false);
  const insertedQuote = useRef('');
  const contextKey = [context.key, context.version, context.selection || '', context.quoteId || ''].join('|');

  useEffect(() => {
    if (workspaceId) return;
    return api.watchChatWorkspaces?.(() => setWorkspaceId(api.defaultChatWorkspace?.()));
  }, [api, workspaceId]);
  useEffect(() => () => { generation.current += 1; owned.current?.release(); }, []);

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
      chat.insertContext(`选中文章内容：\n> ${context.selection.replace(/\n/g, '\n> ')}`);
      insertedQuote.current = id;
    } catch (cause) {
      setError(`选文未加入输入框：${cause?.message ?? String(cause)}`);
    }
  }, [chat, attached, contextKey]);

  return <aside className="qrs-companion" aria-label="AI 伴读">
    <header className="qrs-companion-header">
      <strong>AI 伴读</strong>
      <button className="qrs-icon" title="新伴读对话" aria-label="新伴读对话" onClick={() => void start(true)} disabled={busy || !workspaceId}><Icon name="plus" /></button>
      <button className="qrs-icon" title="关闭伴读" aria-label="关闭伴读" onClick={onClose}><Icon name="x" /></button>
    </header>
    <div className="qrs-companion-context">
      <strong>{context.title}</strong>
      <small>{({ original: '原文', translation: '译文', rewrite: '乔木改写' })[context.version]} · {context.selection ? '已选段落' : '当前文章'}</small>
      {context.selection && <blockquote>{context.selection}</blockquote>}
    </div>
    {error && <div className="qrs-companion-error" role="alert">{error}<button type="button" onClick={() => void start()}>重试</button></div>}
    {!chat && !error && <div className="qrs-companion-loading" role="status">{workspaceId ? '正在打开对话…' : '正在连接默认工作区…'}</div>}
    {chat && attached === contextKey && SessionProvider && <div className="qrs-native-chat">
      <SessionProvider session={chat.reference}>{renderSlot('qiaomu-rss.chat', {})}</SessionProvider>
    </div>}
  </aside>;
}

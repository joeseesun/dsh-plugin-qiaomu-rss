/** Retain Harness sessions for an embedded conversation without changing navigation. */
export function nativeChatBridge(ctx) {
  let scope;
  const watchers = new Set();
  ctx.inject(['sessions', 'uiSession', 'uiWorkspace'], child => {
    scope = child;
    for (const notify of watchers) notify();
    return () => { scope = undefined; for (const notify of watchers) notify(); };
  });
  return {
    defaultChatWorkspace() {
      const items = scope?.uiWorkspace.workspaces.list.getSnapshot().items ?? [];
      const preferred = items.find(w => w.title === 'default-workspace' || /(?:^|\/)default-workspace$/.test(w.path || ''));
      return (preferred ?? items[0])?.workspaceId;
    },
    watchChatWorkspaces(listener) {
      watchers.add(listener);
      const unsubscribe = scope?.uiWorkspace.workspaces.list.subscribe(listener) ?? (() => {});
      return () => { watchers.delete(listener); unsubscribe(); };
    },
    chatWorkspaces() {
      return scope?.uiWorkspace.workspaces.list.getSnapshot().items.map(w => ({ id:w.workspaceId, name:w.title || w.name || w.path, path:w.path })) ?? [];
    },
    async openChat({ workspaceId, sessionId }) {
      if (!scope) throw new Error('Harness 对话服务尚未就绪');
      const active=scope;
      if (!active.uiWorkspace.workspaces.list.getSnapshot().items.some(w=>w.workspaceId===workspaceId)) throw new Error('请选择工作区');
      const id=sessionId || await active.sessions.create({workspaceId});
      const reference=active.sessions.retain(id,{source:'qiaomu-rss'});
      try {
        const source=active.uiSession.bindingSource(reference);
        if(typeof source.value.props.inputActions?.setDraft!=='function') throw new Error('当前 Harness 版本不支持原生伴读');
        return {sessionId:id,reference,release:()=>reference.release(),
          insertContext(prompt){
            const actions=source.value.props.inputActions;
            const span=actions.captureInsertion();
            if(!actions.insertText(prompt+'\n\n',span)) throw new Error('输入框正在发送，请稍后添加阅读上下文');
          }};
      } catch(error){reference.release();throw error;}
    },
  };
}

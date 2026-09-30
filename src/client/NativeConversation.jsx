/** Harness's own conversation, composer, model picker and tool/approval UI. */
function ChatView({renderSlot}) { return renderSlot('conversation.session',{view:'chat'}); }
export function NativeConversation({sessionId,useSession,useConversation,useSessions,renderFactorySlot}) {
  const session=useSession(s=>s);
  const conversation=useConversation(s=>s);
  const blank=useSessions(s=>s.byId[sessionId]?.blank);
  const active=conversation.activeTargets.size>0 || (!session.blank&&!session.awaitingFirstTurn) || session.running;
  const settling=!active && session.openState==='loading' && blank!==true;
  const hero=!active && (session.openState==='open'||blank===true);
  return renderFactorySlot('conversation.content',{variant:'embedded',phase:settling?'settling':hero?'hero':'active',hero},{slots:{views:ChatView}});
}

/** Text quote anchors avoid mutating sanitized article HTML or breaking links. */
export function selectedPassage(root, selection = window.getSelection()) {
  if (!root || !selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const quote=selection.toString().trim();if(!quote||quote.length>6000)return null;
  const before=range.cloneRange();before.selectNodeContents(root);before.setEnd(range.startContainer,range.startOffset);
  const offset=before.toString().length;
  return {quote,prefix:root.textContent.slice(Math.max(0,offset-40),offset),suffix:root.textContent.slice(offset+selection.toString().length,offset+selection.toString().length+40)};
}
export function quoteRange(root, note) {
  const text=root.textContent;let start=text.indexOf(note.quote);if(start<0||!note.quote)return null;
  if(note.prefix){const anchored=text.indexOf(note.prefix+note.quote);if(anchored>=0)start=anchored+note.prefix.length;}
  const end=start+note.quote.length;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let offset=0,node,range=document.createRange(),begun=false;
  while((node=walker.nextNode())){const next=offset+node.length;if(!begun&&start<next){range.setStart(node,start-offset);begun=true;}if(begun&&end<=next){range.setEnd(node,end-offset);return range;}offset=next;}
  return null;
}

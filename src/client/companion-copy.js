const messages = {
  zh: {
    passage: '本次处理的选段', selected: '已选内容', characters: '字', scope: '仅处理选段', syncing: '正在同步…',
    remove: '移除选段', removeHint: '移除选段，返回文章问答', expand: '展开', collapse: '收起', background: '参考文章', article: '当前文章',
  },
  en: {
    passage: 'Passage to process', selected: 'Selected passage', characters: 'characters', scope: 'Selection only', syncing: 'Syncing…',
    remove: 'Remove selection', removeHint: 'Remove selection and return to article questions', expand: 'Expand', collapse: 'Collapse', background: 'Article background', article: 'Current article',
  },
};
export function companionCopy(language = globalThis.document?.documentElement?.lang || 'zh') {
  return messages[language.toLowerCase().split('-')[0]] || messages.zh;
}

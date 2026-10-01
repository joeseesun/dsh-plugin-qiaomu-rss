const KEY = 'qrs.quick-prompts.v1';

export const DEFAULT_PROMPTS = [
  { id: 'summary', title: '概括要点', body: '请用三点概括这篇文章的核心观点，并区分事实与作者判断。' },
  { id: 'translate', title: '翻译全文', body: '请将这篇文章全文翻译成中文，保留原文结构。' },
  { id: 'explain', title: '解释选段', body: '请结合上下文解释我选中的这段话，用通俗的中文说明。' },
  { id: 'question', title: '追问证据', body: '这篇文章的主要结论有哪些证据支持？哪些地方还需要核实？' },
];

export function readQuickPrompts() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.body === 'string').slice(0, 20);
  } catch { /* Damaged preferences must not block reading. */ }
  return DEFAULT_PROMPTS;
}

export function saveQuickPrompts(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('qrs-prompts-changed'));
}

/** Adapt built-in prompts only; preserve customized instructions, including explicit full-article requests. */
export function scopedQuickPrompts(items, selection = '') {
  const scoped = {
    summary: { title: '概括选段', body: '请用三点概括选中段落的核心观点，并区分事实与作者判断。只处理选段，文章仅作背景。' },
    translate: { title: '翻译选段', body: '请只将选中段落翻译成中文，保留原意和结构。文章仅作背景，不翻译全文。' },
    explain: { title: '解释选段', body: '请结合文章背景，用通俗的中文解释选中段落。只解释选段。' },
    question: { title: '追问证据', body: '选中段落的结论有哪些证据支持？哪些地方还需要核实？文章仅作背景，聚焦选段。' },
  };
  return items.map(item => {
    const original = DEFAULT_PROMPTS.find(prompt => prompt.id === item.id);
    if (!original || original.body !== item.body) return item;
    if (selection.trim()) return { ...item, ...scoped[item.id] };
    if (item.id === 'explain') return { ...item, title: '解释文章', body: '请用通俗的中文解释这篇文章的核心观点。' };
    return item;
  });
}

const KEY = 'qrs.quick-prompts.v1';

export const DEFAULT_PROMPTS = [
  { id: 'summary', title: '概括要点', body: '请用三点概括这篇文章的核心观点，并区分事实与作者判断。' },
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

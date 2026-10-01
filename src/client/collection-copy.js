const messages = {
  zh: {
    lab: '实验室', title: '链接收录与改写', intro: '把网页交给乔木服务收录，完成后在这里阅读和提问。',
    disclosure: '提交的链接会发送到当前乔木服务，生成的改写公开收录。这是网页收录与 AI 改写，不是音视频逐字稿。',
    enabled: '启用链接收录', invite: '邀请码', inviteHint: '输入邀请码；留空保留已验证配置', verify: '验证并保存', save: '保存', saving: '处理中…', verified: '邀请码已验证', unverified: '尚未验证邀请码',
    url: '网页链接', submit: '提交收录', submitting: '提交中…', submitted: '收录申请已保存', jobs: '申请收录',
    refresh: '刷新申请', more: '加载更多申请', empty: '还没有收录申请', open: '打开阅读', retry: '重试', close: '关闭',
    queued: '等待处理', running: '正在处理', complete: '收录完成', failed: '处理失败', copy: '复制链接', copied: '链接已复制', request: '申请收录改写', settings: '实验室设置', configured: '实验室设置已保存', offline: '暂时无法同步，已保留本机申请', original: '原标题', search: '搜索申请',
  },
  en: {
    lab: 'Labs', title: 'Collect and rewrite links', intro: 'Submit a web page to Qiaomu, then read and discuss the result here.',
    disclosure: 'Links are sent to the current Qiaomu service and rewrites are publicly collected. This creates web article rewrites, not audio/video transcripts.',
    enabled: 'Enable link collection', invite: 'Invitation code', inviteHint: 'Enter a code; leave blank to keep the verified configuration', verify: 'Verify and save', save: 'Save', saving: 'Working…', verified: 'Invitation verified', unverified: 'Invitation not verified',
    url: 'Web page link', submit: 'Submit link', submitting: 'Submitting…', submitted: 'Collection request saved', jobs: 'Collection requests',
    refresh: 'Refresh requests', more: 'Load more requests', empty: 'No collection requests yet', open: 'Read result', retry: 'Retry', close: 'Close',
    queued: 'Queued', running: 'Processing', complete: 'Collection complete', failed: 'Failed', copy: 'Copy link', copied: 'Link copied', request: 'Collect and rewrite', settings: 'Labs settings', configured: 'Labs settings saved', offline: 'Unable to sync; local requests are preserved', original: 'Original title', search: 'Search requests',
  },
};
export function collectionCopy(language = globalThis.document?.documentElement?.lang || 'zh') { return messages[language.toLowerCase().split('-')[0]] || messages.zh; }
export function clickedLink(event, root) {
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor || !root?.contains(anchor)) return undefined;
  try { const url = new URL(anchor.href); if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href; } catch {}
}

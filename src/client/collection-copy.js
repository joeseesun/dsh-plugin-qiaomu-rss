const messages = {
  zh: {
    lab: '实验室', enableFirst: '先验证下方邀请码，再开启。', enableHint: '开启后，右键文章中的链接，选择“申请收录转写”。更改自动保存。', inviteDraft: '点击“验证并保存”，确认邀请码可用。', replaceInvite: '已保存；输入可更换', myRequests: '我的申请', requestsHint: '粘贴链接、查看进度或打开结果。完成后会通知你。', viewRequests: '查看申请', loading: '正在加载…', enabledNotice: '链接收录转写已开启', disabledNotice: '链接收录转写已关闭', title: '链接收录转写', intro: '将网页收录到乔木 RSS，自动生成乔木改写。',
    disclosure: '提交的网页及生成的乔木改写将公开收录。',
    enabled: '开启链接收录转写', invite: '邀请码', inviteHint: '输入邀请码', verify: '验证并保存', save: '保存', saving: '验证中…', verified: '邀请码已验证', unverified: '输入邀请码，验证后即可开启。',
    url: '网页链接', submit: '提交收录', submitting: '提交中…', submitted: '收录申请已保存', jobs: '我的申请',
    refresh: '刷新申请', more: '加载更多申请', empty: '还没有收录申请', open: '打开阅读', retry: '重试', close: '关闭',
    queued: '等待处理', running: '正在处理', complete: '收录完成', failed: '处理失败', copy: '复制链接', copied: '链接已复制', request: '申请收录转写', settings: '实验室设置', configured: '实验室设置已保存', offline: '暂时无法同步，已保留本机申请', original: '原标题', search: '搜索申请',
  },
  en: {
    lab: 'Labs', enableFirst: 'Verify your invitation code below to enable this feature.', enableHint: 'Right-click a link in an article and choose “Collect and rewrite”. Changes save automatically.', inviteDraft: 'Choose “Verify and save” to check this code.', replaceInvite: 'Saved; enter a code to replace it', myRequests: 'My requests', requestsHint: 'Paste a link, check progress or read results. You will be notified on completion.', viewRequests: 'View requests', loading: 'Loading…', enabledNotice: 'Link collection enabled', disabledNotice: 'Link collection disabled', title: 'Collect and rewrite links', intro: 'Submit a web page to Qiaomu, then read and discuss the result here.',
    disclosure: 'Submitted web pages and generated rewrites are publicly collected.',
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

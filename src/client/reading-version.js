const ORDER = ['original', 'translation', 'rewrite'];

/** Apply the reader preference only when that article actually has content. */
export function resolveReadingVersion(preferred, article) {
  const readable = (kind) => kind === 'original'
    ? Boolean(article?.html?.trim())
    : article?.versions?.[kind]?.available === true && Boolean(article.versions[kind].markdown?.trim());
  const candidates = [preferred, ...ORDER.filter(kind => kind !== preferred && kind !== 'original'), 'original'];
  return candidates.find(kind => ORDER.includes(kind) && readable(kind)) ?? 'original';
}

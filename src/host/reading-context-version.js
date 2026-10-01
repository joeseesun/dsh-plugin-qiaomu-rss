/** Pick readable context for the companion even when the reader's selected tab is empty. */
export function chooseReadingContextVersion(preferred, versions) {
  return [preferred, ...['translation', 'rewrite', 'original'].filter(kind => kind !== preferred)]
    .find(kind => versions[kind]?.content?.trim());
}

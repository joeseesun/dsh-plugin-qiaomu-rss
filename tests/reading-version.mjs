import assert from 'node:assert/strict';
import { resolveReadingVersion } from '../src/client/reading-version.js';

const article = (html, translation, rewrite) => ({ html, versions: {
  translation: { available: Boolean(translation), markdown: translation },
  rewrite: { available: Boolean(rewrite), markdown: rewrite },
} });

assert.equal(resolveReadingVersion('rewrite', article('<p>Original</p>', '', '')), 'original');
assert.equal(resolveReadingVersion('rewrite', article('<p>Original</p>', '译文', '')), 'translation');
assert.equal(resolveReadingVersion('rewrite', article('<p>Original</p>', '译文', '改写')), 'rewrite');
assert.equal(resolveReadingVersion('translation', article('<p>Original</p>', '', '改写')), 'rewrite');
assert.equal(resolveReadingVersion('rewrite', article('<p>Original</p>', '', '  ')), 'original');
assert.equal(resolveReadingVersion('rewrite', article('', '', '改写')), 'rewrite');
assert.equal(resolveReadingVersion('rewrite', article('', '', '')), 'original');
assert.equal(resolveReadingVersion('unknown', article('<p>Original</p>', '', '')), 'original', 'unknown restored version must fall back');

console.log('Reading versions: preferred content, alternate content, and original fallback');

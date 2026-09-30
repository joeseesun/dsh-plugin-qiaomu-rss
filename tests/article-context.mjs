import assert from 'node:assert/strict';
import { articleContext } from '../src/host/article-context.js';
const translated = articleContext({title:'译文标题',text:'译文正文',html:'<p>Original body</p>'});
assert.equal(translated,'标题: 译文标题\n\n译文正文');
const original = articleContext({title:'Title',html:'<p>Original <strong>body</strong></p>'});
assert.ok(original.includes('Original body'));
assert.ok(!original.includes('<strong>'));
for (const article of [{title:'t'.repeat(5000),text:'a'.repeat(30000)},{html:'<p>'+ 'a'.repeat(30000)+'</p>'}]) {
  const input = articleContext(article);
  assert.ok(input.length <= 12000);
  assert.ok(input.endsWith('（上下文已截断）'));
}
console.log('Article context: version text, HTML cleanup, total size and truncation passed');

import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.MutationObserver = dom.window.MutationObserver;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
const compiled = resolve('.cache/AskArticle-test.mjs');
mkdirSync(resolve('.cache'), { recursive: true });
await esbuild.build({ entryPoints: ['src/client/AskArticle.jsx'], outfile: compiled, bundle: true,
  platform: 'node', format: 'esm', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom', 'lucide-react'] });
const { AskArticle } = await import(pathToFileURL(compiled));
const tick = () => new Promise(resolveTick => setTimeout(resolveTick, 20));
const inserted = [];
const sent = [];
const bound = [];
let nativeMounts = 0;
let managedPrompts = 0;
const chat = { sessionId: 'session-1', reference: {}, release() {}, insertContext(text) { inserted.push(text); }, async sendPrompt(text, allowed) { sent.push({ text, allowed }); } };
const api = {
  defaultChatWorkspace: () => 'default',
  openChat: async () => chat,
  setReadingContext: async context => { bound.push(context); },
};
const SessionProvider = ({ children }) => children;
function NativeView() {
  React.useEffect(() => { nativeMounts++; }, []);
  return React.createElement('div', { 'data-content-phase':'hero' }, React.createElement('div', { 'data-conversation-scroll':'' }, React.createElement('div', { 'data-composer-seat':'' }, '原生对话')));
}
const renderSlot = () => React.createElement(NativeView);
const root = createRoot(document.getElementById('root'));
const render = context => root.render(React.createElement(AskArticle, {
  api, context, SessionProvider, renderSlot, onClose() {}, onManagePrompts() { managedPrompts++; },
}));
render({ key: 'article-1', title: '文章', version: 'original', selection: '第一段', quoteId: 1 });
for (let i = 0; i < 6; i++) await tick();
assert.equal(bound.length, 1);
assert.equal(inserted.length, 0, 'selection must not fill the native composer');
assert.equal(bound[0].selection, '第一段', 'the model still receives the complete selection');
assert.ok(!document.querySelector('.qrs-companion-context').textContent.includes('第一段'), 'the header must not repeat selected text');
assert.ok(document.body.textContent.includes('原生对话'));
assert.equal(nativeMounts, 1);
assert.ok(document.querySelector('.qrs-companion-opening')?.textContent.includes('好奇，从这一页开始'), 'an empty native conversation shows the reading invitation');
document.querySelector('[data-content-phase]').setAttribute('data-content-phase', 'conversation');
await tick();
assert.equal(document.querySelector('.qrs-companion-opening'), null, 'the invitation leaves when conversation content appears');
document.querySelector('[data-content-phase]').setAttribute('data-content-phase', 'hero');
await tick();
assert.ok(document.querySelector('.qrs-companion-opening'), 'the invitation returns for a new empty conversation');
const strip = document.querySelector('.qrs-companion-prompt-strip');
assert.ok(strip, 'quick prompts should appear above the native composer');
assert.equal(strip.parentElement.nextElementSibling?.getAttribute('data-composer-seat'), '', 'prompt strip must precede composer seat');
assert.equal(strip.querySelector('.qrs-companion-selection-chip')?.textContent, '选段已加入上下文');
strip.querySelector('[aria-label="新增快捷提示词"]').click();
assert.equal(managedPrompts, 1, 'the trailing plus opens quick prompt management');
strip.querySelector('button').click();
await tick();
assert.ok(sent[0].text.includes('三点概括'), 'quick prompt sends directly');
assert.equal(sent[0].allowed, undefined, 'quick prompt does not replace a composer draft');
render({ key: 'article-1', title: '文章', version: 'original', selection: '第一段', quoteId: 1 });
await tick();
assert.equal(inserted.length, 0, 'a rerender must not write into the composer');
render({ key: 'article-1', title: '文章', version: 'original', selection: '第二段', quoteId: 2 });
for (let i = 0; i < 4; i++) await tick();
assert.equal(bound.length, 2);
assert.equal(inserted.length, 0);
assert.equal(nativeMounts, 1, 'selecting another passage must preserve the native conversation');
assert.equal(bound.at(-1).selection, '第二段');
const longSelection = '一段很长的文章内容'.repeat(30);
render({ key: 'article-1', title: '文章', version: 'original', selection: longSelection, quoteId: 3 });
for (let i = 0; i < 4; i++) await tick();
assert.equal(bound.at(-1).selection, longSelection);
assert.equal(inserted.length, 0, 'even a long selection stays exclusively in reading context');
root.unmount();
console.log('Companion draft: complete selection stays in context and leaves composer untouched');

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
const chat = { sessionId: 'session-1', reference: {}, release() {}, insertContext(text) { inserted.push(text); }, async sendPrompt(text, allowed) { sent.push({ text, allowed }); } };
const api = {
  defaultChatWorkspace: () => 'default',
  openChat: async () => chat,
  setReadingContext: async context => { bound.push(context); },
};
const SessionProvider = ({ children }) => children;
const renderSlot = () => React.createElement('div', { 'data-conversation-scroll':'' }, React.createElement('div', { 'data-composer-seat':'' }, '原生对话'));
const root = createRoot(document.getElementById('root'));
const render = context => root.render(React.createElement(AskArticle, {
  api, context, SessionProvider, renderSlot, onClose() {},
}));
render({ key: 'article-1', title: '文章', version: 'original', selection: '第一段', quoteId: 1 });
for (let i = 0; i < 6; i++) await tick();
assert.equal(bound.length, 1);
assert.equal(inserted.length, 1);
assert.ok(inserted[0].includes('引用选段：「第一段」'));
assert.equal(bound[0].selection, '第一段', 'the model still receives the complete selection');
assert.ok(!document.querySelector('.qrs-companion-context').textContent.includes('第一段'), 'the header must not repeat selected text');
assert.ok(document.body.textContent.includes('原生对话'));
const strip = document.querySelector('.qrs-companion-prompt-strip');
assert.ok(strip, 'quick prompts should appear above the native composer');
assert.equal(strip.parentElement.nextElementSibling?.getAttribute('data-composer-seat'), '', 'prompt strip must precede composer seat');
strip.querySelector('button').click();
await tick();
assert.ok(sent[0].text.includes('三点概括'), 'quick prompt sends directly');
assert.ok(sent[0].allowed.includes('引用选段'), 'only the generated selection preview may be replaced');
render({ key: 'article-1', title: '文章', version: 'original', selection: '第一段', quoteId: 1 });
await tick();
assert.equal(inserted.length, 1, 'a rerender must not duplicate the selected quote');
render({ key: 'article-1', title: '文章', version: 'original', selection: '第二段', quoteId: 2 });
for (let i = 0; i < 4; i++) await tick();
assert.equal(bound.length, 2);
assert.equal(inserted.length, 2);
assert.ok(inserted[1].includes('引用选段：「第二段」'));
const longSelection = '一段很长的文章内容'.repeat(30);
render({ key: 'article-1', title: '文章', version: 'original', selection: longSelection, quoteId: 3 });
for (let i = 0; i < 4; i++) await tick();
assert.equal(bound.at(-1).selection, longSelection);
assert.ok(inserted.at(-1).length < 140, 'the visible draft should only contain a short excerpt');
assert.ok(inserted.at(-1).includes('…'));
root.unmount();
console.log('Companion draft: complete quote stays in context, compact excerpt enters composer once');

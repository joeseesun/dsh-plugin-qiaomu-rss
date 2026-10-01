import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import { rm } from 'node:fs/promises';
const file = new URL('../.cache/video-player-test.cjs', import.meta.url);
await build({ entryPoints:['src/client/VideoPlayer.jsx'], outfile:file.pathname, bundle:true, jsx:'automatic', platform:'node', format:'cjs', external:['react','react/jsx-runtime'] });
const dom = new JSDOM('<div id="root"></div>', {url:'http://localhost/'});
globalThis.window = dom.window; globalThis.document = dom.window.document;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'Mozilla/5.0 Chrome/140.0.0.0 Electron/38.0.0 Safari/537.36'}});
let released = 0, popup, unsubscribed = false;
const opened=[];window.open=(...args)=>opened.push(args);
window.dshDesktop = {browser:{
  acquire: async () => ({lease:'test-lease',partition:'test-partition'}),
  release: async id => {assert.equal(id,'test-lease');released++;},
  onOpenRequested: (id, callback) => {assert.equal(id,'test-lease');popup=callback;return () => {unsubscribed=true;};},
}};
const require = createRequire(import.meta.url);
const React = require('react');
const {createRoot} = require('react-dom/client');
const {VideoPlayer} = require(file.pathname);
const root = createRoot(document.getElementById('root'));
const tick = () => new Promise(resolve=>setTimeout(resolve,25));
try {
  root.render(React.createElement(VideoPlayer,{embed:'https://www.youtube-nocookie.com/embed/dYPXINFcvmI',playerUrl:'http://127.0.0.1:1234/token/dYPXINFcvmI'}));
  for(let i=0;i<4;i++)await tick();
  const view = document.querySelector('webview');assert.ok(view);
  assert.equal(view.getAttribute('partition'),'test-partition');
  assert.equal(view.getAttribute('src'),'about:blank#test-lease');
  assert.equal(view.getAttribute('allowpopups'),'true');
  const urls=[];let ua;
  view.setUserAgent = value => {ua=value;};
  view.loadURL = async (url,options)=>{urls.push(url);assert.ok(!options.userAgent.includes('Electron'));assert.ok(options.userAgent.includes('Chrome/140.0.0.0'));};
  view.dispatchEvent(new dom.window.Event('dom-ready'));await tick();
  assert.ok(!ua.includes('Electron'));assert.equal(urls[0],'http://127.0.0.1:1234/token/dYPXINFcvmI');
  popup('https://accounts.google.com/ServiceLogin');await tick();
  assert.equal(urls.length,1,'login must not replace the inline video');
  assert.deepEqual(opened[0],['https://www.youtube.com/watch?v=dYPXINFcvmI','_blank','noopener,noreferrer']);
  assert.equal(document.querySelector('[aria-label="登录 YouTube"]'),null);
  const link=document.querySelector('a');assert.equal(link.href,'https://www.youtube.com/watch?v=dYPXINFcvmI');
  assert.equal(link.target,'_blank');assert.ok(link.textContent.includes('在 YouTube 打开'));
  root.unmount();await tick();
  assert.equal(released,1);assert.equal(unsubscribed,true);
  console.log('Desktop player: actual Chromium UA, external YouTube fallback without in-app login and lease cleanup passed');
} finally { await rm(file,{force:true}); }

import assert from 'node:assert/strict';
import { get } from 'node:http';
import { VideoPlayerServer } from '../src/host/video-player.js';
const player = new VideoPlayerServer();
try {
  assert.equal(await player.url({ url:'https://example.org/' }), undefined);
  const [a,b] = await Promise.all([player.url({url:'https://youtu.be/dQw4w9WgXcQ'}), player.url({url:'https://youtu.be/dYPXINFcvmI'})]);
  assert.equal(new URL(a).origin, new URL(b).origin);
  const response = await fetch(a);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
  assert.match(await response.text(), /www.youtube.com\/embed\/dQw4w9WgXcQ/);
  assert.equal((await fetch(new URL('/invalid/dQw4w9WgXcQ',a))).status,404);
  assert.equal((await fetch(a,{method:'POST'})).status,403);
  assert.equal(await new Promise((resolve,reject) => { get(a,{headers:{host:'evil.org'}}, response => { response.resume(); resolve(response.statusCode); }).on('error',reject); }),403);
  assert.equal((await fetch(a.replace('dQw4w9WgXcQ','bad'))).status,404);
} finally { await player.dispose(); }
assert.equal(player.server.listening,false);
console.log('Video player: loopback wrapper, source policy, capability URL, concurrent startup and shutdown passed');

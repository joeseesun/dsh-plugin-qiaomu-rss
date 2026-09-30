import assert from 'node:assert/strict';
import { youtubeEmbedUrl } from '../src/video.js';
const id = 'dQw4w9WgXcQ';
const expected = `https://www.youtube-nocookie.com/embed/${id}`;
for (const url of [`https://youtu.be/${id}`,`https://www.youtube.com/watch?v=${id}&t=10`,`https://m.youtube.com/shorts/${id}`,`https://www.youtube.com/live/${id}`]) assert.equal(youtubeEmbedUrl(url),expected);
for (const url of ['javascript:alert(1)','https://youtube.com.evil.org/watch?v='+id,'https://evil.org/'+id,'https://user:pass@youtube.com/watch?v='+id,'https://youtu.be/invalid','https://youtube.com/embed/'+id+'/extra',undefined]) assert.equal(youtubeEmbedUrl(url),null);
console.log('Video: supported URLs and hostile/invalid URLs passed');

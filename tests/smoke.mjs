/** Smoke tests for the dependency-free host modules. Run: node tests/smoke.mjs */
import assert from 'node:assert';
import { normalizeQiaomuEntry } from '../src/host/qiaomu.js';
const curated = normalizeQiaomuEntry({ id:'episode', sourceId:'latentspace', title:'Episode' }, 'qiaomu');
assert.equal(curated.channelKey, 'qiaomu:latentspace');
assert.equal(curated.sourceId, 'latentspace');
import { parseFeed, parseOpml, buildOpml } from '../src/host/feeds.js';
import { sanitizeHtml, htmlToText, firstImageUrl } from '../src/host/sanitize.js';
import { markdownToHtml, htmlToMarkdown } from '../src/host/markdown.js';
import { chooseReadingContextVersion } from '../src/host/reading-context-version.js';

assert.equal(chooseReadingContextVersion('translation', { translation:{content:''}, rewrite:{content:'改写正文'}, original:{content:'Original'} }), 'rewrite');
assert.equal(chooseReadingContextVersion('rewrite', { rewrite:{content:'  '}, original:{content:'Original'} }), 'original');
assert.equal(chooseReadingContextVersion('original', { original:{content:''} }), undefined);

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Test Feed &amp; More</title>
  <link>https://example.com/</link>
  <description>A test feed</description>
  <item>
    <title>First post</title>
    <link>https://example.com/first</link>
    <guid isPermaLink="false">post-1</guid>
    <pubDate>Wed, 24 Sep 2025 08:00:00 GMT</pubDate>
    <description><![CDATA[<p>Hello <b>world</b> <script>alert(1)</script></p>]]></description>
    <content:encoded><![CDATA[<p>Full <em>content</em> here <a href="/relative">link</a> <img src="x" onerror="alert(2)"></p>]]></content:encoded>
    <media:thumbnail url="https://example.com/thumb.jpg"/>
  </item>
  <item>
    <title>Second</title>
    <link>https://example.com/second</link>
    <guid>post-2</guid>
  </item>
</channel>
</rss>`;

const parsed = parseFeed(rss, 'https://example.com/feed.xml');
assert.equal(parsed.title, 'Test Feed & More');
assert.equal(parsed.entries.length, 2);
const first = parsed.entries[0];
assert.equal(first.title, 'First post');
assert.equal(first.url, 'https://example.com/first');
assert.match(first.key, /^feed:[0-9a-f]{32}$/);
assert.equal(first.image, 'https://example.com/thumb.jpg');
const mediaFeed = parseFeed(`<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><item><title>Episode</title><link>https://example.com/episode</link><media:thumbnail url="https://example.com/cover.jpg"/><enclosure url="https://example.com/episode.mp3" type="audio/mpeg"/></item></channel></rss>`, 'https://example.com/podcast.xml');
assert.equal(mediaFeed.entries[0].image, 'https://example.com/cover.jpg');
assert.equal(mediaFeed.entries[0].audio, 'https://example.com/episode.mp3');
assert.ok(!first.html.includes('script'), 'script stripped');
assert.ok(!first.html.includes('onerror'), 'onerror stripped');
assert.match(first.html, /<em>content<\/em>/);
assert.equal(first.html.includes('href="https://example.com/relative"'), true, 'relative URL resolved');

const atom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <link rel="alternate" href="https://atom.example/"/>
  <entry>
    <id>urn:uuid:aaa-bbb</id>
    <title>Atom entry</title>
    <link rel="alternate" href="https://atom.example/e1"/>
    <updated>2025-09-20T10:00:00Z</updated>
    <author><name>Ada</name></author>
    <summary type="html">&lt;p&gt;Summary&lt;/p&gt;</summary>
  </entry>
</feed>`;
const atomParsed = parseFeed(atom, 'https://atom.example/feed');
assert.equal(atomParsed.entries[0].url, 'https://atom.example/e1');
assert.equal(atomParsed.entries[0].author, 'Ada');
assert.ok(atomParsed.entries[0].publishedAt.startsWith('2025-09-20'));

const dtd = `<?xml version="1.0"?><!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><rss><channel><item><title>&xxe;</title></item></channel></rss>`;
assert.throws(() => parseFeed(dtd, 'https://x'), /DTD/);

const opml = `<?xml version="1.0"?><opml version="2.0"><head/><body>
  <outline text="Tech"><outline type="rss" text="Blog A" xmlUrl="https://a.example/feed"/><outline type="rss" text="Blog B" xmlUrl="https://b.example/feed"/></outline>
  <outline type="rss" text="Solo" xmlUrl="https://a.example/feed"/>
</body></opml>`;
const stubs = parseOpml(opml);
assert.equal(stubs.length, 2, 'duplicate url skipped');
assert.equal(stubs[0].group, 'Tech');
const opmlOut = buildOpml([{ url: 'https://a.example/feed', name: 'Blog A', group: 'Tech' }, { url: 'https://s.example/feed', name: 'Solo' }]);
assert.match(opmlOut, /<outline text="Tech">/);

const dirty = `<div><p onclick="x()">Para</p><style>.x{}</style><iframe src="https://evil"></iframe><a href="javascript:alert(1)">bad</a><a href="https://ok.example/page">good</a><img src="/img.png"><img src="data:text/html;base64,xxx"></div>`;
const clean = sanitizeHtml(dirty, { baseUrl: 'https://example.com/post' });
assert.ok(!clean.includes('onclick'), 'event handlers stripped');
assert.ok(!clean.includes('<style'), 'style dropped');
assert.ok(!clean.includes('<iframe'), 'iframe dropped');
assert.ok(!clean.includes('javascript:'), 'javascript URLs stripped');
assert.ok(clean.includes('href="https://ok.example/page"'));
assert.ok(clean.includes('src="https://example.com/img.png"'));
assert.ok(!clean.includes('data:text/html'));

assert.equal(firstImageUrl('<img src="/a.png">', 'https://x.com/p'), 'https://x.com/a.png');
assert.match(htmlToText('<p>One</p><p>Two</p>'), /One\nTwo/);

const md = '# Title\n\nHello **world** with [link](https://x.com) and `code`.\n\n- a\n- b\n\n> quote\n\n```js\nlet x = 1;\n```';
const mdHtml = markdownToHtml(md);
assert.match(mdHtml, /<h1>Title<\/h1>/);
assert.match(mdHtml, /<strong>world<\/strong>/);
assert.match(mdHtml, /<a href="https:\/\/x\.com"/);
assert.match(mdHtml, /<ul>\s*<li>a<\/li>\s*<li>b<\/li>\s*<\/ul>/);
assert.match(mdHtml, /<blockquote>/);
assert.match(mdHtml, /<pre><code>let x = 1;/);

const back = htmlToMarkdown('<h2>Head</h2><p>Text with <strong>bold</strong> and <a href="https://x.com">link</a>.</p><ul><li>item</li></ul>');
assert.match(back, /## Head/);
assert.match(back, /\*\*bold\*\*/);
assert.match(back, /\[link\]\(https:\/\/x\.com\)/);
assert.match(back, /- item/);

console.log('smoke tests passed');

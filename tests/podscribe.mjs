import assert from 'node:assert/strict';
import * as podscribe from '../src/host/podscribe.js';

const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url) => {
  calls.push(String(url));
  let data;
  if (String(url).includes('/search?')) data = { podcasts: [{ slug:'acquired', name:'Acquired' }] };
  else if (String(url).includes('/podcasts/acquired/episodes')) data = { episodes: [{ episode_slug:'vanguard', title:'Vanguard' }] };
  else if (String(url).includes('/transcript?')) data = {
    episode: { title:'Vanguard', url:'https://podcasts.happyscribe.com/acquired/vanguard' },
    podcast: { name:'Acquired' },
    transcript: { full_text:`Start <script>bad</script> & continue\n\n${'Long text. '.repeat(22000)}` },
  };
  else throw new Error(`Unexpected request ${url}`);
  return { ok:true, status:200, json:async () => ({ ok:true, data }) };
};

try {
  assert.equal((await podscribe.searchShows('Acquired'))[0].slug, 'acquired');
  assert.equal((await podscribe.listEpisodes('acquired'))[0].episode_slug, 'vanguard');
  const result = await podscribe.fetchTranscript('acquired', 'vanguard');
  const article = podscribe.transcriptArticle('acquired', 'vanguard', result);
  assert.equal(article.key, 'podscribe:acquired/vanguard');
  assert.ok(article.html.length > 200000, 'long transcript remains available');
  assert.ok(article.html.includes('&lt;script&gt;bad&lt;/script&gt;'), 'transcript text is escaped');
  assert.ok(article.transcriptText.length > 200000, 'full source text is kept');
  assert.ok(calls[2].endsWith('/transcript?segments=false'), 'full text is fetched without duplicate segment data');
  await assert.rejects(podscribe.listEpisodes('../bad'), /无效/);
  console.log('Podscribe search, episode list, long transcript and validation passed');
} finally {
  globalThis.fetch = originalFetch;
}

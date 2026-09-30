export function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (!['https:','http:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else {
        const match = /^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(url.pathname);
        id = match?.[1];
      }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id ?? '') ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

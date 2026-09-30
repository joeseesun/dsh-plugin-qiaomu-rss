/**
 * Agent-facing tools. The model reaches the reader through a small surface:
 * list channels/articles, read one article in any version, generate a missing
 * Chinese version, manage subscriptions, and refresh.
 */
import { defineTool } from '@deepseek-ai/dsh-tools';

function text(value) {
  return [{ type: 'text', text: value }];
}

function formatEntryLine(entry) {
  const flags = [entry.read === false ? '未读' : null, entry.favorite ? '收藏' : null].filter(Boolean).join(',');
  const channel = entry.channelName ? ` [${entry.channelName}]` : '';
  const date = entry.publishedAt ? ` (${entry.publishedAt.slice(0, 10)})` : '';
  return `- ${entry.key} | ${entry.title}${channel}${date}${flags ? ` ${flags}` : ''}`;
}

export const TOOL_NAMES = {
  listChannels: 'rss_list_channels',
  listArticles: 'rss_list_articles',
  readArticle: 'rss_read_article',
  generateVersion: 'rss_generate_version',
  searchArticles: 'rss_search_articles',
  addSubscription: 'rss_add_subscription',
  removeSubscription: 'rss_remove_subscription',
  refresh: 'rss_refresh',
};

/** Build every tool definition; `service` is the live RssService. */
export function createToolDefinitions(service) {
  return [
    defineTool({
      name: TOOL_NAMES.listChannels,
      description: 'List RSS channels available in the qiaomu-rss plugin (Qiaomu featured stream, per-source channels, and personal subscriptions) with unread counts.',
      parameters: {},
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async () => {
        const { channels } = await service.listChannels();
        if (channels.length === 0) return 'No channels yet. Add a personal subscription with rss_add_subscription, or refresh the Qiaomu stream with rss_refresh.';
        const lines = channels.map((channel) => `- ${channel.key} | ${channel.name}${channel.group ? ` (${channel.group})` : ''} | ${channel.kind} | unread ${channel.unread}/${channel.total}`);
        return `Channels:\n${lines.join('\n')}`;
      },
    }),
    defineTool({
      name: TOOL_NAMES.listArticles,
      description: 'List recent articles of one channel (or the aggregate stream). Returns article keys suitable for rss_read_article.',
      parameters: {
        channel: { type: 'string', description: 'Channel key from rss_list_channels; omit for the aggregate stream.' },
        filter: { type: 'string', description: 'all | unread | favorite' },
        search: { type: 'string', description: 'Case-insensitive title filter.' },
        limit: { type: 'number', description: 'Max entries to return (default 20, cap 50).' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        const page = await service.listEntries({
          channel: args.channel,
          filter: args.filter,
          search: args.search,
          limit: Math.min(args.limit ?? 20, 50),
        });
        if (page.entries.length === 0) return 'No articles matched. Try rss_refresh or a different filter.';
        return [`Articles (${page.entries.length}${page.hasMore ? '+, more available' : ''}):`, ...page.entries.map(formatEntryLine)].join('\n');
      },
    }),
    defineTool({
      name: TOOL_NAMES.readArticle,
      description: 'Read one full article. version: original (default), translation (Chinese), or rewrite (Chinese deep rewrite). Missing Chinese versions are reported instead of auto-generated.',
      parameters: {
        key: { type: 'string', description: 'Article key from rss_list_articles.', required: true },
        version: { type: 'string', description: 'original | translation | rewrite' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        const { article } = await service.getArticle({ key: args.key });
        const wanted = args.version ?? 'original';
        const versions = await service.getVersionContent({ key: args.key });
        const chosen = versions[wanted];
        if (!chosen) throw new Error('version must be original, translation or rewrite');
        if (wanted !== 'original' && !chosen.available) {
          return `Version "${wanted}" is not available for this article${chosen.status === 'missing' ? ' (no published asset)' : ` (${chosen.status})`}. Use rss_generate_version to create it with the local model, or read the original.`;
        }
        const body = chosen.content;
        const header = [
          `# ${chosen.title ?? article.title}`,
          '',
          article.url ? `原文链接: ${article.url}` : null,
          article.author ? `作者: ${article.author}` : null,
          article.publishedAt ? `发布时间: ${article.publishedAt}` : null,
          '',
        ].filter((line) => line !== null).join('\n');
        return `${header}\n${body}`;
      },
    }),
    defineTool({
      name: TOOL_NAMES.generateVersion,
      description: 'Generate a missing Chinese version (translation or rewrite) of one article with the harness model. This calls the configured LLM and may take a while.',
      parameters: {
        key: { type: 'string', description: 'Article key from rss_list_articles.', required: true },
        kind: { type: 'string', description: 'translation | rewrite', required: true },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        if (args.kind !== 'translation' && args.kind !== 'rewrite') {
          throw new Error('kind must be "translation" or "rewrite"');
        }
        const version = await service.generateVersion({ key: args.key, kind: args.kind });
        return `Generated ${args.kind} (source: ${version.source}):\n\n# ${version.title ?? ''}\n\n${version.markdown ?? version.paragraphs?.join('\n\n') ?? ''}`;
      },
    }),
    defineTool({
      name: TOOL_NAMES.searchArticles,
      description: 'Search all cached articles by title substring across every channel.',
      parameters: {
        query: { type: 'string', description: 'Title substring, case-insensitive.', required: true },
        limit: { type: 'number', description: 'Max results (default 20).' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        const results = await service.searchArticles({ query: args.query, limit: Math.min(args.limit ?? 20, 50) });
        if (results.length === 0) return `No cached article titles match "${args.query}".`;
        return `Results:\n${results.map(formatEntryLine).join('\n')}`;
      },
    }),
    defineTool({
      name: TOOL_NAMES.addSubscription,
      description: 'Add a personal RSS/Atom subscription. The feed is fetched immediately to validate it and seed articles.',
      parameters: {
        url: { type: 'string', description: 'Full RSS/Atom feed URL (http/https).', required: true },
        name: { type: 'string', description: 'Optional display name; defaults to the feed title.' },
        group: { type: 'string', description: 'Optional group label.' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        const sub = await service.addSubscription(args);
        return `Subscribed to "${sub.name}" (${sub.id}) with ${sub.entryCount ?? 0} articles seeded.`;
      },
    }),
    defineTool({
      name: TOOL_NAMES.removeSubscription,
      description: 'Remove one personal subscription by id or URL. Favorites and saved notes are kept.',
      parameters: {
        id: { type: 'string', description: 'Subscription id or feed URL.', required: true },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        const removed = await service.removeSubscription({ id: args.id });
        return removed ? 'Subscription removed.' : 'No matching subscription found.';
      },
    }),
    defineTool({
      name: TOOL_NAMES.refresh,
      description: 'Refresh feeds now: the Qiaomu stream, one Qiaomu channel, personal feeds (all or one), or everything when channel is omitted.',
      parameters: {
        channel: { type: 'string', description: 'Channel key to refresh; omit for everything.' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => text(value),
      },
      execute: async (args) => {
        const outcome = await service.refresh({ channel: args.channel });
        const parts = [];
        if (outcome.qiaomu !== undefined) parts.push(`Qiaomu: ${outcome.qiaomu} entries`);
        if (outcome.feeds !== undefined) parts.push(`Feeds refreshed: ${outcome.feeds}, new/updated entries: ${outcome.entries}`);
        if (outcome.error !== undefined) parts.push(`Error: ${outcome.error}`);
        return `Refresh done. ${parts.join('; ')}`;
      },
    }),

  ];
}

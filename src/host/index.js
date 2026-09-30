/**
 * qiaomu-rss host plugin entry. Default-exported Service class; the loader
 * constructs it with (ctx, config) and registers it under the `rss` key.
 */
import { RssService } from './service.js';

export default RssService;
export { RssService };

import { FONTS, TEXT_WIDTHS, READING_DEFAULTS } from '../reading-settings.js';

/** Reading-appearance popover, mirroring the original 阅读设置 panel. */
export function ReadingAppearance({ settings, onChange, onClose }) {
  const set = (patch) => onChange(patch);
  return (
    <div className="qrs-reading-settings" role="dialog" aria-label="阅读设置">
      <div className="qrs-reading-settings-head">
        <strong>阅读设置</strong>
        <button type="button" onClick={onClose}>完成</button>
      </div>
      <div className="qrs-reading-settings-fields">
        <label className="qrs-reading-setting">
          <span>字体</span>
          <select value={settings.readingFont} onChange={(event) => set({ readingFont: event.target.value })}>
            {Object.entries(FONTS).map(([value, font]) => <option key={value} value={value}>{font.label}</option>)}
          </select>
        </label>
        {settings.readingFont === 'custom' && (
          <label className="qrs-reading-setting">
            <span>字体名</span>
            <input aria-label="自选字体名" value={settings.customFont ?? ''} placeholder="例如 LXGW WenKai"
              onChange={(event) => set({ customFont: event.target.value })} />
          </label>
        )}
        <label className="qrs-reading-setting">
          <span>字号</span>
          <output>{settings.fontSize} px</output>
          <input type="range" min="14" max="32" step="1" value={settings.fontSize}
            onChange={(event) => set({ fontSize: Number(event.target.value) })} />
        </label>
        <label className="qrs-reading-setting">
          <span>行距</span>
          <output>{settings.lineHeight.toFixed(1)} 倍</output>
          <input type="range" min="1.5" max="2.4" step="0.1" value={settings.lineHeight}
            onChange={(event) => set({ lineHeight: Number(event.target.value) })} />
        </label>
        <label className="qrs-reading-setting">
          <span>版心宽度</span>
          <select value={settings.textWidth} onChange={(event) => set({ textWidth: Number(event.target.value) })}>
            {TEXT_WIDTHS.map((width) => <option key={width.value} value={width.value}>{width.label}</option>)}
          </select>
        </label>
        <label className="qrs-reading-setting">
          <span>阅读主题</span>
          <select value={settings.readingTheme} onChange={(event) => set({ readingTheme: event.target.value })}>
            {[['auto', '跟随应用'], ['light', '明亮'], ['paper', '纸张'], ['sage', '青绿'], ['mist', '雾蓝'], ['dark', '深色'], ['black', '纯黑']]
              .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="qrs-reading-setting">
          <span>默认版本</span>
          <select value={settings.defaultVersion} onChange={(event) => set({ defaultVersion: event.target.value })}>
            <option value="original">原文</option>
            <option value="translation">译文</option>
            <option value="rewrite">乔木改写</option>
          </select>
        </label>
        <label className="qrs-reading-setting qrs-reading-setting-check">
          <span>文章图片</span>
          <input type="checkbox" checked={settings.showImages !== false}
            onChange={(event) => set({ showImages: event.target.checked })} />
        </label>
      </div>
      <button type="button" className="qrs-reading-reset"
        onClick={() => set({ ...READING_DEFAULTS })}>
        恢复默认
      </button>
    </div>
  );
}

import { FONTS, TEXT_WIDTHS, THEMES, READING_DEFAULTS } from '../reading-settings.js';
import { Monitor } from 'lucide-react';

/** Shared controls for the quick popover and the full plugin settings page. */
export function ReadingControls({ settings, onChange, variant = 'compact' }) {
  const set = (patch) => onChange(patch);
  const page = variant === 'page';
  return (
    <>
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
        <div className="qrs-reading-setting">
          <span>版心宽度</span>
          {page ? <div className="qrs-segmented qrs-width-options" role="group" aria-label="版心宽度">{TEXT_WIDTHS.map((width) => <button key={width.value} type="button" aria-pressed={settings.textWidth === width.value} onClick={() => set({ textWidth: width.value })}>{width.value}</button>)}</div> :
            <select aria-label="版心宽度" value={settings.textWidth} onChange={(event) => set({ textWidth: Number(event.target.value) })}>{TEXT_WIDTHS.map((width) => <option key={width.value} value={width.value}>{width.label}</option>)}</select>}
        </div>
        <div className="qrs-reading-setting qrs-theme-setting">
          <span>阅读主题</span>
          {page ? <div className="qrs-theme-options" role="group" aria-label="阅读主题">{[['auto','跟随应用'],['light','明亮'],['paper','纸张'],['sage','青绿'],['mist','雾蓝'],['dark','深色'],['black','纯黑']].map(([value,label]) => <button key={value} type="button" aria-pressed={settings.readingTheme === value} onClick={() => set({ readingTheme:value })}><span className={`qrs-theme-swatch${value === 'auto' ? ' qrs-theme-swatch-auto' : ''}`} style={value === 'auto' ? undefined : { background: THEMES[value][0], color: THEMES[value][1] }}>{value === 'auto' ? <Monitor size={20} strokeWidth={1.6} /> : 'Aa'}</span><span>{label}</span></button>)}</div> :
            <select aria-label="阅读主题" value={settings.readingTheme} onChange={(event) => set({ readingTheme: event.target.value })}>{[['auto','跟随应用'],['light','明亮'],['paper','纸张'],['sage','青绿'],['mist','雾蓝'],['dark','深色'],['black','纯黑']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>}
        </div>
        <div className="qrs-reading-setting">
          <span>默认版本</span>
          {page ? <div className="qrs-segmented" role="group" aria-label="默认版本">{[['original','原文'],['translation','译文'],['rewrite','乔木改写']].map(([value,label]) => <button key={value} type="button" aria-pressed={settings.defaultVersion === value} onClick={() => set({ defaultVersion:value })}>{label}</button>)}</div> :
            <select aria-label="默认版本" value={settings.defaultVersion} onChange={(event) => set({ defaultVersion: event.target.value })}><option value="original">原文</option><option value="translation">译文</option><option value="rewrite">乔木改写</option></select>}
        </div>
        <div className="qrs-reading-setting qrs-reading-setting-check">
          <span>文章图片</span>
          {page ? <label className="qrs-switch"><input type="checkbox" aria-label="文章图片" checked={settings.showImages !== false} onChange={(event) => set({ showImages: event.target.checked })} /><span aria-hidden="true" /></label> :
            <input type="checkbox" aria-label="文章图片" checked={settings.showImages !== false} onChange={(event) => set({ showImages: event.target.checked })} />}
        </div>
      </div>
      <button type="button" className="qrs-reading-reset"
        onClick={() => set({ ...READING_DEFAULTS })}>
        恢复默认
      </button>
    </>
  );
}

/** Compact reader-toolbar popover. */
export function ReadingAppearance({ settings, onChange, onClose }) {
  return <div className="qrs-reading-settings" role="dialog" aria-label="阅读设置">
    <div className="qrs-reading-settings-head"><strong>阅读设置</strong><button type="button" onClick={onClose}>完成</button></div>
    <ReadingControls settings={settings} onChange={onChange} />
  </div>;
}

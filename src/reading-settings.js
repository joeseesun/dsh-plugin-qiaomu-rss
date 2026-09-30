/** Reading appearance: shared defaults, options, and validation for both halves. */
export const READING_DEFAULTS = {
  readingTheme: 'auto',
  readingFont: 'serif',
  customFont: '',
  fontSize: 19,
  lineHeight: 1.9,
  textWidth: 36,
  defaultVersion: 'original',
  showImages: true,
};

/** Theme id -> [background, foreground]; `auto` follows the host theme. */
export const THEMES = {
  auto: null, light: ['#ffffff', '#202124'], paper: ['#f5efdf', '#40382e'], sage: ['#e8eee3', '#29382c'],
  mist: ['#e7edf2', '#293741'], dark: ['#252525', '#dedede'], black: ['#090909', '#cccccc'],
};

export const FONTS = {
  serif: { label: '宋体', family: '"Songti SC","Noto Serif CJK SC",Georgia,serif' },
  sans: { label: '黑体', family: 'system-ui,"PingFang SC","Noto Sans CJK SC",sans-serif' },
  sourceHanSerif: { label: '思源宋体', family: '"Source Han Serif SC","Noto Serif CJK SC","Songti SC",serif' },
  sourceHanSans: { label: '思源黑体', family: '"Source Han Sans SC","Noto Sans CJK SC","PingFang SC",sans-serif' },
  wenkai: { label: '霞鹜文楷', family: '"LXGW WenKai","Kaiti SC",serif' },
  zhenkai: { label: '朱雀仿宋', family: '"Zhuque Fangsong","Fangsong","STFangsong",serif' },
  custom: { label: '自选设备字体', family: 'serif' },
};

export const TEXT_WIDTHS = [
  { value: 28, label: '窄 · 28 字' },
  { value: 32, label: '偏窄 · 32 字' },
  { value: 36, label: '适中 · 36 字' },
  { value: 40, label: '偏宽 · 40 字' },
  { value: 44, label: '宽 · 44 字' },
];

/** Resolve the CSS font stack for one settings object. */
export function fontStack(settings) {
  if (settings.readingFont === 'custom') {
    const name = String(settings.customFont ?? '').trim();
    return name ? `${JSON.stringify(name)},${FONTS.serif.family}` : FONTS.serif.family;
  }
  return (FONTS[settings.readingFont] ?? FONTS.serif).family;
}

export function validateSettings(patch = {}) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('设置必须是对象');
  const result = {};
  for (const [key, value] of Object.entries(patch)) {
    if (['aiAssist', 'showImages'].includes(key)) {
      if (typeof value !== 'boolean') throw new Error(`${key} 必须是布尔值`);
    } else if (key === 'origin') {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('服务地址必须是无凭证的 HTTPS 地址');
      result.origin = url.href.replace(/\/$/, '');
      continue;
    } else if (key === 'readingTheme') {
      if (!Object.hasOwn(THEMES, value)) throw new Error('无效阅读主题');
    } else if (key === 'readingFont') {
      if (!Object.hasOwn(FONTS, value)) throw new Error('无效字体');
    } else if (key === 'defaultVersion') {
      if (!['original', 'translation', 'rewrite'].includes(value)) throw new Error('无效默认版本');
    } else if (key === 'customFont') {
      if (typeof value !== 'string' || value.length > 100) throw new Error('自选字体名最长 100 字符');
    } else if (['fontSize', 'lineHeight', 'textWidth'].includes(key)) {
      const ranges = { fontSize: [14, 32], lineHeight: [1.5, 2.4], textWidth: [28, 44] };
      const [min, max] = ranges[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${key} 超出范围`);
    } else continue;
    result[key] = value;
  }
  return result;
}

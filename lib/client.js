window.__ModuleLoader__.load({
	id: "qiaomu-rss-dsh",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  PANEL_ID: () => PANEL_ID,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/NativeConversation.jsx
function ChatView({ renderSlot }) {
  return renderSlot("conversation.session", { view: "chat" });
}
function NativeConversation({ sessionId, useSession, useConversation, useSessions, renderFactorySlot }) {
  const session = useSession((s) => s);
  const conversation = useConversation((s) => s);
  const blank = useSessions((s) => s.byId[sessionId]?.blank);
  const active = conversation.activeTargets.size > 0 || !session.blank && !session.awaitingFirstTurn || session.running;
  const settling = !active && session.openState === "loading" && blank !== true;
  const hero = !active && (session.openState === "open" || blank === true);
  return renderFactorySlot("conversation.content", { variant: "embedded", phase: settling ? "settling" : hero ? "hero" : "active", hero }, { slots: { views: ChatView } });
}

// src/client/native-chat.js
function nativeChatBridge(ctx) {
  let scope;
  const watchers = /* @__PURE__ */ new Set();
  ctx.inject(["sessions", "uiSession", "uiWorkspace"], (child) => {
    scope = child;
    for (const notify of watchers) notify();
    return () => {
      scope = void 0;
      for (const notify of watchers) notify();
    };
  });
  return {
    defaultChatWorkspace() {
      const items = scope?.uiWorkspace.workspaces.list.getSnapshot().items ?? [];
      const preferred = items.find((w) => w.title === "default-workspace" || /(?:^|\/)default-workspace$/.test(w.path || ""));
      return (preferred ?? items[0])?.workspaceId;
    },
    watchChatWorkspaces(listener) {
      watchers.add(listener);
      const unsubscribe = scope?.uiWorkspace.workspaces.list.subscribe(listener) ?? (() => {
      });
      return () => {
        watchers.delete(listener);
        unsubscribe();
      };
    },
    chatWorkspaces() {
      return scope?.uiWorkspace.workspaces.list.getSnapshot().items.map((w) => ({ id: w.workspaceId, name: w.title || w.name || w.path, path: w.path })) ?? [];
    },
    async openChat({ workspaceId, sessionId }) {
      if (!scope) throw new Error("Harness \u5BF9\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA");
      const active = scope;
      if (!active.uiWorkspace.workspaces.list.getSnapshot().items.some((w) => w.workspaceId === workspaceId)) throw new Error("\u8BF7\u9009\u62E9\u5DE5\u4F5C\u533A");
      const id = sessionId || await active.sessions.create({ workspaceId });
      const reference = active.sessions.retain(id, { source: "qiaomu-rss" });
      try {
        const source = active.uiSession.bindingSource(reference);
        if (typeof source.value.props.inputActions?.setDraft !== "function") throw new Error("\u5F53\u524D Harness \u7248\u672C\u4E0D\u652F\u6301\u539F\u751F\u4F34\u8BFB");
        return {
          sessionId: id,
          reference,
          release: () => reference.release(),
          async sendPrompt(prompt) {
            const { input } = source.value.hooks ?? {};
            const actions = source.value.props.inputActions;
            if (typeof actions.submit !== "function" || typeof input?.getSnapshot !== "function" || typeof input?.subscribe !== "function") throw new Error("\u5F53\u524D Harness \u7248\u672C\u4E0D\u652F\u6301\u5FEB\u6377\u53D1\u9001");
            const state = input.getSnapshot();
            if (state.phase !== "plain") throw new Error("\u5F53\u524D\u8F93\u5165\u6846\u6B63\u5728\u5904\u7406\u6D88\u606F\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
            if (state.attachmentIds?.length) throw new Error("\u8F93\u5165\u6846\u6709\u5F85\u53D1\u9001\u9644\u4EF6\uFF0C\u8BF7\u5148\u5904\u7406\u9644\u4EF6");
            if (state.draft.trim()) throw new Error("\u8F93\u5165\u6846\u5DF2\u6709\u8349\u7A3F\uFF0C\u8BF7\u5148\u53D1\u9001\u6216\u6E05\u7A7A\u8349\u7A3F");
            actions.setDraft(prompt);
            if (input.getSnapshot().draft !== prompt) await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error("\u63D0\u793A\u8BCD\u5DF2\u653E\u5165\u8F93\u5165\u6846\uFF0C\u8BF7\u624B\u52A8\u53D1\u9001"));
              }, 1200);
              const unsubscribe = input.subscribe(() => {
                if (input.getSnapshot().draft === prompt) {
                  clearTimeout(timeout);
                  unsubscribe();
                  resolve();
                }
              });
              if (input.getSnapshot().draft === prompt) {
                clearTimeout(timeout);
                unsubscribe();
                resolve();
              }
            });
            if (input.getSnapshot().phase !== "plain") throw new Error("\u8F93\u5165\u6846\u6B63\u5728\u5904\u7406\u6D88\u606F\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
            actions.submit();
          }
        };
      } catch (error) {
        reference.release();
        throw error;
      }
    }
  };
}

// src/client/ReaderPage.jsx
var import_react13 = require("react");

// src/host/sanitize.js
var VOID_TAGS = /* @__PURE__ */ new Set([
  "br",
  "hr",
  "img",
  "wbr",
  "input",
  "col",
  "source"
]);
var ALLOWED_TAGS = /* @__PURE__ */ new Set([
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "em",
  "i",
  "strong",
  "b",
  "u",
  "s",
  "del",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "sup",
  "sub",
  "small",
  "mark",
  "details",
  "summary",
  "span",
  "div",
  "abbr",
  "time",
  "kbd",
  "samp"
]);
var DROP_CONTENT_TAGS = /* @__PURE__ */ new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "noscript",
  "form",
  "textarea",
  "select",
  "button",
  "svg",
  "math",
  "template",
  "title",
  "head",
  "link",
  "meta",
  "base"
]);
var SAFE_URL_ATTRS = /* @__PURE__ */ new Set(["href", "src", "cite", "poster"]);
function decodeHtmlEntities(text) {
  if (!text.includes("&")) return text;
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    mdash: "\u2014",
    ndash: "\u2013",
    hellip: "\u2026",
    laquo: "\xAB",
    raquo: "\xBB",
    ldquo: "\u201C",
    rdquo: "\u201D",
    lsquo: "\u2018",
    rsquo: "\u2019",
    copy: "\xA9",
    reg: "\xAE",
    trade: "\u2122",
    middot: "\xB7",
    bull: "\u2022",
    times: "\xD7",
    deg: "\xB0"
  };
  return text.replace(/&(#[0-9]{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,30});/g, (raw, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 32 || code > 1114111 || code >= 55296 && code <= 57343) return raw;
      try {
        return String.fromCodePoint(code);
      } catch {
        return raw;
      }
    }
    return named[body.toLowerCase()] ?? raw;
  });
}
function escapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}
function isSafeUrl(raw) {
  const value = raw.trim();
  if (value === "" || value.startsWith("#")) return true;
  if (/^(?:https?:|mailto:)/i.test(value)) return true;
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) return true;
  return false;
}
function safeUrl(raw, baseUrl) {
  const value = raw.trim();
  if (!isSafeUrl(value)) return void 0;
  if (baseUrl) {
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return void 0;
    }
  }
  return value;
}
function sanitizeHtml(html, options = {}) {
  const { baseUrl, maxLength = 4e5 } = options;
  let out = "";
  const stack = [];
  let i = 0;
  const n = html.length;
  let droppedDepth = 0;
  while (i < n && out.length < maxLength) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      if (droppedDepth === 0) out += escapeText(decodeHtmlEntities(html.slice(i)));
      break;
    }
    if (lt > i && droppedDepth === 0) out += escapeText(decodeHtmlEntities(html.slice(i, lt)));
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (html.startsWith("<!", lt) || html.startsWith("<?", lt)) {
      const end = html.indexOf(">", lt);
      i = end === -1 ? n : end + 1;
      continue;
    }
    const gt = findTagEnd(html, lt);
    if (gt === -1) break;
    const source = html.slice(lt + 1, gt);
    i = gt + 1;
    if (source.startsWith("/")) {
      const name = source.slice(1).trim().toLowerCase();
      const openIdx = stack.lastIndexOf(name);
      if (openIdx !== -1) {
        while (stack.length > openIdx) {
          const closing = stack.pop();
          if (droppedDepth > 0) {
            if (closing === "__drop__") droppedDepth -= 1;
            else out += `</${closing}>`;
          } else {
            out += `</${closing}>`;
          }
        }
      }
      continue;
    }
    const selfClosing = source.endsWith("/");
    const header = selfClosing ? source.slice(0, -1) : source;
    const nameMatch = /^[^\s/>]+/.exec(header);
    if (!nameMatch) continue;
    const tag = nameMatch[0].toLowerCase();
    if (DROP_CONTENT_TAGS.has(tag)) {
      if (!selfClosing && !VOID_TAGS.has(tag)) droppedDepth += 1;
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) continue;
    const attrs = parseAttrs(header.slice(nameMatch[0].length));
    const rendered = [];
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith("on") || key === "style" || key === "class" && false) continue;
      if (!SAFE_URL_ATTRS.has(key)) {
        if (key === "alt" || key === "title" || key === "colspan" || key === "rowspan" || key === "datetime") {
          rendered.push(`${key}="${escapeAttr(value.slice(0, 300))}"`);
        }
        continue;
      }
      const url = safeUrl(decodeHtmlEntities(value), baseUrl);
      if (url !== void 0) rendered.push(`${key}="${escapeAttr(url)}"`);
    }
    const attrText = rendered.length > 0 ? ` ${rendered.join(" ")}` : "";
    if (tag === "img") {
      out += `<img${attrText} loading="lazy">`;
      continue;
    }
    if (VOID_TAGS.has(tag)) {
      out += `<${tag}>`;
      continue;
    }
    out += `<${tag}${attrText}>`;
    if (!selfClosing) stack.push(tag);
  }
  while (stack.length > 0) out += `</${stack.pop()}>`;
  return out.slice(0, maxLength);
}
function findTagEnd(source, from) {
  let quote = "";
  for (let i = from + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (quote !== "") {
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ">") return i;
  }
  return -1;
}
var ATTR = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')?/g;
function parseAttrs(header) {
  const attrs = {};
  ATTR.lastIndex = 0;
  let match;
  while ((match = ATTR.exec(header)) !== null) {
    attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? "";
  }
  return attrs;
}

// src/host/markdown.js
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttrPart(value) {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(text) {
  let out = escapeHtml(text);
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(`<code>${code}</code>`);
    return `\0${codes.length - 1}\0`;
  });
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => `<img src="${escapeAttrPart(src)}" alt="${alt}" loading="lazy">`).replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const safe = /^(?:https?:|mailto:|\/|#)/i.test(href) ? href : "#";
    return `<a href="${escapeAttrPart(safe)}" target="_blank" rel="noreferrer">${label}</a>`;
  }).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/(^|[\s(])_([^_\s][^_]*)_/g, "$1<em>$2</em>").replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return out.replace(/\u0000(\d+)\u0000/g, (_, index) => codes[Number(index)]);
}
function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let paragraph = [];
  let listType;
  let inQuote = false;
  let codeFence = false;
  let codeBuffer = [];
  const closeParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType !== void 0) {
      out.push(`</${listType}>`);
      listType = void 0;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push("</blockquote>");
      inQuote = false;
    }
  };
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (codeFence) {
      if (/^```/.test(line)) {
        out.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        codeFence = false;
      } else {
        codeBuffer.push(rawLine);
      }
      continue;
    }
    if (/^```/.test(line)) {
      closeParagraph();
      closeList();
      closeQuote();
      codeFence = true;
      continue;
    }
    if (line.trim() === "") {
      closeParagraph();
      closeList();
      closeQuote();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeParagraph();
      closeList();
      closeQuote();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (/^(?:-{3,}|\*{3,})$/.test(line.trim())) {
      closeParagraph();
      closeList();
      closeQuote();
      out.push("<hr>");
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      closeParagraph();
      closeList();
      if (!inQuote) {
        out.push("<blockquote>");
        inQuote = true;
      }
      out.push(`<p>${inline(quote[1])}</p>`);
      continue;
    }
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ordered || unordered) {
      closeParagraph();
      closeQuote();
      const wanted = ordered ? "ol" : "ul";
      if (listType !== wanted) {
        closeList();
        out.push(`<${wanted}>`);
        listType = wanted;
      }
      out.push(`<li>${inline((ordered ?? unordered)[1])}</li>`);
      continue;
    }
    paragraph.push(line.trim());
  }
  if (codeFence && codeBuffer.length > 0) out.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  closeParagraph();
  closeList();
  closeQuote();
  return out.join("\n");
}

// src/reading-settings.js
var READING_DEFAULTS = {
  readingTheme: "auto",
  readingFont: "serif",
  customFont: "",
  fontSize: 19,
  lineHeight: 1.9,
  textWidth: 36,
  defaultVersion: "original",
  showImages: true
};
var THEMES = {
  auto: null,
  light: ["#ffffff", "#202124"],
  paper: ["#f5efdf", "#40382e"],
  sage: ["#e8eee3", "#29382c"],
  mist: ["#e7edf2", "#293741"],
  dark: ["#252525", "#dedede"],
  black: ["#090909", "#cccccc"]
};
var FONTS = {
  serif: { label: "\u5B8B\u4F53", family: '"Songti SC","Noto Serif CJK SC",Georgia,serif' },
  sans: { label: "\u9ED1\u4F53", family: 'system-ui,"PingFang SC","Noto Sans CJK SC",sans-serif' },
  sourceHanSerif: { label: "\u601D\u6E90\u5B8B\u4F53", family: '"Source Han Serif SC","Noto Serif CJK SC","Songti SC",serif' },
  sourceHanSans: { label: "\u601D\u6E90\u9ED1\u4F53", family: '"Source Han Sans SC","Noto Sans CJK SC","PingFang SC",sans-serif' },
  wenkai: { label: "\u971E\u9E5C\u6587\u6977", family: '"LXGW WenKai","Kaiti SC",serif' },
  zhenkai: { label: "\u6731\u96C0\u4EFF\u5B8B", family: '"Zhuque Fangsong","Fangsong","STFangsong",serif' },
  custom: { label: "\u81EA\u9009\u8BBE\u5907\u5B57\u4F53", family: "serif" }
};
var TEXT_WIDTHS = [
  { value: 28, label: "\u7A84 \xB7 28 \u5B57" },
  { value: 32, label: "\u504F\u7A84 \xB7 32 \u5B57" },
  { value: 36, label: "\u9002\u4E2D \xB7 36 \u5B57" },
  { value: 40, label: "\u504F\u5BBD \xB7 40 \u5B57" },
  { value: 44, label: "\u5BBD \xB7 44 \u5B57" }
];
function fontStack(settings) {
  if (settings.readingFont === "custom") {
    const name = String(settings.customFont ?? "").trim();
    return name ? `${JSON.stringify(name)},${FONTS.serif.family}` : FONTS.serif.family;
  }
  return (FONTS[settings.readingFont] ?? FONTS.serif).family;
}

// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
var import_react3 = require("react");

// node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var toKebabCase = (string) => string?.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// node_modules/lucide-react/dist/esm/shared/src/utils/toLucideIconData.mjs
function toLucideIconData(iconName, iconNode, aliases = []) {
  if (iconNode == null) {
    throw new Error("[lucide]: iconNode is required when icon name is used");
  }
  return {
    name: toKebabCase(iconName),
    size: 24,
    node: iconNode,
    ...aliases.length > 0 ? { aliases } : {}
  };
}

// node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var toCamelCase = (string) => {
  let out = "";
  let upperNext = false;
  for (const ch of string) {
    if (ch === "-" || ch === "_" || ch <= " ") {
      upperNext = out.length > 0;
      continue;
    }
    if (out.length === 0) {
      out += ch.toLowerCase();
    } else {
      out += upperNext ? ch.toUpperCase() : ch;
    }
    upperNext = false;
  }
  return out;
};

// node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

// node_modules/lucide-react/dist/esm/Icon.mjs
var import_react2 = require("react");

// node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// node_modules/lucide-react/dist/esm/shared/src/build/defaultAttributes.mjs
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

// node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconNode.mjs
function isDefined(value) {
  return value !== null && value !== void 0;
}
function buildLucideIconNode(icon, params = {}) {
  const attributeNames = params.attributeNames ?? {};
  const getAttributeName = (attributeName) => attributeNames[attributeName] ?? attributeName;
  const viewBoxWidth = icon.size ?? icon.width ?? defaultAttributes["width"];
  const viewBoxHeight = icon.size ?? icon.height ?? defaultAttributes["height"];
  const aliasClassNames = icon.aliases?.filter((alias) => typeof alias === "string" && alias.trim() !== "").map((alias) => `lucide-${alias}`) ?? [];
  const iconClassNames = [...icon.name ? [`lucide-${icon.name}`] : [], ...aliasClassNames];
  const classNamesFromClassName = params.className?.split(" ").filter(Boolean) ?? [];
  const className = params.includeDefaultClasses === false ? mergeClasses(...classNamesFromClassName) : mergeClasses("lucide", ...iconClassNames, ...classNamesFromClassName);
  const calculatedStrokeWidth = params.absoluteStrokeWidth ? Number(params.strokeWidth ?? defaultAttributes["stroke-width"]) * Number(icon.size ?? icon.width ?? defaultAttributes["width"]) / Number(params.size ?? params.width ?? defaultAttributes["width"]) : params.strokeWidth ?? defaultAttributes["stroke-width"];
  const attributes = {
    ...Object.entries(defaultAttributes).reduce((attrs, [attrName, value]) => {
      attrs[getAttributeName(attrName)] = value;
      return attrs;
    }, {}),
    ..."color" in params && params.color && {
      [getAttributeName("stroke")]: params.color
    },
    ..."size" in params && isDefined(params.size) && {
      [getAttributeName("width")]: params.size,
      [getAttributeName("height")]: params.size
    },
    ..."width" in params && isDefined(params.width) && {
      [getAttributeName("width")]: params.width
    },
    ..."height" in params && isDefined(params.height) && {
      [getAttributeName("height")]: params.height
    },
    [getAttributeName("stroke-width")]: calculatedStrokeWidth,
    ...className && {
      [getAttributeName("class")]: className
    },
    [getAttributeName("viewBox")]: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    ...params.hasA11yProp === false ? {
      [getAttributeName("aria-hidden")]: "true"
    } : {},
    ..."attributes" in params && params.attributes
  };
  return [
    "svg",
    attributes,
    icon.node.map((child) => {
      const [name, attrs, children] = child;
      const nextAttrs = params.nonScalingStroke ? { [getAttributeName("vector-effect")]: "non-scaling-stroke", ...attrs } : attrs;
      return children ? [name, nextAttrs, children] : [name, nextAttrs];
    })
  ];
}

// node_modules/lucide-react/dist/esm/shared/src/build/buildLucideIconForReact.mjs
function buildLucideIconForReact(icon, params = {}) {
  return buildLucideIconNode(icon, {
    ...params,
    attributeNames: {
      ...params.attributeNames,
      class: "className",
      "stroke-width": "strokeWidth",
      "stroke-linecap": "strokeLinecap",
      "stroke-linejoin": "strokeLinejoin",
      "vector-effect": "vectorEffect"
    }
  });
}

// node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};

// node_modules/lucide-react/dist/esm/context.mjs
var import_react = require("react");
var LucideContext = (0, import_react.createContext)({});
var useLucideContext = () => (0, import_react.useContext)(LucideContext);

// node_modules/lucide-react/dist/esm/Icon.mjs
var Icon = (0, import_react2.forwardRef)(
  ({
    color,
    size,
    width,
    height,
    strokeWidth,
    absoluteStrokeWidth,
    nonScalingStroke,
    className = "",
    children,
    iconNode = [],
    icon = {
      node: iconNode,
      aliases: [],
      size: 24
    },
    ...rest
  }, ref) => {
    const {
      size: contextSize = 24,
      strokeWidth: contextStrokeWidth = 2,
      absoluteStrokeWidth: contextAbsoluteStrokeWidth = false,
      nonScalingStroke: contextNonScalingStroke = false,
      color: contextColor = "currentColor",
      className: contextClass = ""
    } = useLucideContext() ?? {};
    const hasAccessibleProp = Boolean(children) || hasA11yProp(rest);
    const [name, svgAttributes, builtIconNode = []] = buildLucideIconForReact(icon, {
      color: color ?? contextColor,
      width: width ?? size ?? contextSize,
      height: height ?? size ?? contextSize,
      strokeWidth: strokeWidth ?? contextStrokeWidth,
      absoluteStrokeWidth: absoluteStrokeWidth ?? contextAbsoluteStrokeWidth,
      nonScalingStroke: nonScalingStroke ?? contextNonScalingStroke,
      className: mergeClasses(contextClass, className),
      hasA11yProp: hasAccessibleProp,
      attributes: rest
    });
    return (0, import_react2.createElement)(
      name,
      {
        ref,
        ...svgAttributes
      },
      [
        ...builtIconNode.map(([tag, attrs]) => (0, import_react2.createElement)(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
function createLucideIcon(iconDataOrName, iconNode = [], aliases = []) {
  const iconData = typeof iconDataOrName === "string" ? toLucideIconData(iconDataOrName, iconNode, aliases) : iconDataOrName;
  const Component2 = (0, import_react3.forwardRef)(
    ({ className, ...props }, ref) => (0, import_react3.createElement)(Icon, {
      ref,
      icon: iconData,
      className,
      ...props
    })
  );
  if (iconData.name) {
    Component2.displayName = toPascalCase(iconData.name);
  }
  return Component2;
}

// node_modules/lucide-react/dist/esm/icons/arrow-up-right.mjs
var __iconData = {
  name: "arrow-up-right",
  size: 24,
  node: [
    ["path", { d: "M7 7h10v10", key: "1tivn9" }],
    ["path", { d: "M7 17 17 7", key: "1vkiza" }]
  ]
};
__iconData.node;
var ArrowUpRight = createLucideIcon(__iconData);

// node_modules/lucide-react/dist/esm/icons/book-open.mjs
var __iconData2 = {
  name: "book-open",
  size: 24,
  node: [
    ["path", { d: "M12 5v16", key: "1f6ucr" }],
    [
      "path",
      {
        d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",
        key: "1fyvmf"
      }
    ]
  ]
};
__iconData2.node;
var BookOpen = createLucideIcon(__iconData2);

// node_modules/lucide-react/dist/esm/icons/copy.mjs
var __iconData3 = {
  name: "copy",
  size: 24,
  node: [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
  ]
};
__iconData3.node;
var Copy = createLucideIcon(__iconData3);

// node_modules/lucide-react/dist/esm/icons/download.mjs
var __iconData4 = {
  name: "download",
  size: 24,
  node: [
    ["path", { d: "M12 15V3", key: "m9g1x1" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
    ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }]
  ]
};
__iconData4.node;
var Download = createLucideIcon(__iconData4);

// node_modules/lucide-react/dist/esm/icons/folder.mjs
var __iconData5 = {
  name: "folder",
  size: 24,
  node: [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
        key: "1kt360"
      }
    ]
  ]
};
__iconData5.node;
var Folder = createLucideIcon(__iconData5);

// node_modules/lucide-react/dist/esm/icons/heart.mjs
var __iconData6 = {
  name: "heart",
  size: 24,
  node: [
    [
      "path",
      {
        d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
        key: "mvr1a0"
      }
    ]
  ]
};
__iconData6.node;
var Heart = createLucideIcon(__iconData6);

// node_modules/lucide-react/dist/esm/icons/info.mjs
var __iconData7 = {
  name: "info",
  size: 24,
  node: [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 16v-4", key: "1dtifu" }],
    ["path", { d: "M12 8h.01", key: "e9boi3" }]
  ]
};
__iconData7.node;
var Info = createLucideIcon(__iconData7);

// node_modules/lucide-react/dist/esm/icons/layers.mjs
var __iconData8 = {
  name: "layers",
  size: 24,
  node: [
    [
      "path",
      {
        d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
        key: "zw3jo"
      }
    ],
    [
      "path",
      {
        d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
        key: "1wduqc"
      }
    ],
    [
      "path",
      {
        d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
        key: "kqbvx6"
      }
    ]
  ],
  aliases: ["layers-3"]
};
__iconData8.node;
var Layers = createLucideIcon(__iconData8);

// node_modules/lucide-react/dist/esm/icons/monitor.mjs
var __iconData9 = {
  name: "monitor",
  size: 24,
  node: [
    ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2", key: "48i651" }],
    ["line", { x1: "8", x2: "16", y1: "21", y2: "21", key: "1svkeh" }],
    ["line", { x1: "12", x2: "12", y1: "17", y2: "21", key: "vw1qmm" }]
  ]
};
__iconData9.node;
var Monitor = createLucideIcon(__iconData9);

// node_modules/lucide-react/dist/esm/icons/pencil.mjs
var __iconData10 = {
  name: "pencil",
  size: 24,
  node: [
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
        key: "1a8usu"
      }
    ],
    ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
  ]
};
__iconData10.node;
var Pencil = createLucideIcon(__iconData10);

// node_modules/lucide-react/dist/esm/icons/plus.mjs
var __iconData11 = {
  name: "plus",
  size: 24,
  node: [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }]
  ]
};
__iconData11.node;
var Plus = createLucideIcon(__iconData11);

// node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs
var __iconData12 = {
  name: "refresh-cw",
  size: 24,
  node: [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
    ["path", { d: "M8 16H3v5", key: "1cv678" }]
  ]
};
__iconData12.node;
var RefreshCw = createLucideIcon(__iconData12);

// node_modules/lucide-react/dist/esm/icons/rss.mjs
var __iconData13 = {
  name: "rss",
  size: 24,
  node: [
    ["path", { d: "M4 11a9 9 0 0 1 9 9", key: "pv89mb" }],
    ["path", { d: "M4 4a16 16 0 0 1 16 16", key: "k0647b" }],
    ["circle", { cx: "5", cy: "19", r: "1", key: "bfqh0e" }]
  ]
};
__iconData13.node;
var Rss = createLucideIcon(__iconData13);

// node_modules/lucide-react/dist/esm/icons/search.mjs
var __iconData14 = {
  name: "search",
  size: 24,
  node: [
    ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
  ]
};
__iconData14.node;
var Search = createLucideIcon(__iconData14);

// node_modules/lucide-react/dist/esm/icons/sparkles.mjs
var __iconData15 = {
  name: "sparkles",
  size: 24,
  node: [
    [
      "path",
      {
        d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
        key: "1s2grr"
      }
    ],
    ["path", { d: "M20 2v4", key: "1rf3ol" }],
    ["path", { d: "M22 4h-4", key: "gwowj6" }],
    ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]
  ],
  aliases: ["stars"]
};
__iconData15.node;
var Sparkles = createLucideIcon(__iconData15);

// node_modules/lucide-react/dist/esm/icons/trash.mjs
var __iconData16 = {
  name: "trash",
  size: 24,
  node: [
    ["path", { d: "M10 11v6", key: "nco0om" }],
    ["path", { d: "M14 11v6", key: "outv1u" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
  ],
  aliases: ["trash-2"]
};
__iconData16.node;
var Trash = createLucideIcon(__iconData16);

// node_modules/lucide-react/dist/esm/icons/upload.mjs
var __iconData17 = {
  name: "upload",
  size: 24,
  node: [
    ["path", { d: "M12 3v12", key: "1x0j5s" }],
    ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }]
  ]
};
__iconData17.node;
var Upload = createLucideIcon(__iconData17);

// node_modules/lucide-react/dist/esm/icons/wand-sparkles.mjs
var __iconData18 = {
  name: "wand-sparkles",
  size: 24,
  node: [
    [
      "path",
      {
        d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",
        key: "ul74o6"
      }
    ],
    ["path", { d: "m14 7 3 3", key: "1r5n42" }],
    ["path", { d: "M5 6v4", key: "ilb8ba" }],
    ["path", { d: "M19 14v4", key: "blhpug" }],
    ["path", { d: "M10 2v2", key: "7u0qdc" }],
    ["path", { d: "M7 8H3", key: "zfb6yr" }],
    ["path", { d: "M21 16h-4", key: "1cnmox" }],
    ["path", { d: "M11 3H9", key: "1obp7u" }]
  ],
  aliases: ["wand-2"]
};
__iconData18.node;
var WandSparkles = createLucideIcon(__iconData18);

// node_modules/lucide-react/dist/esm/icons/x.mjs
var __iconData19 = {
  name: "x",
  size: 24,
  node: [
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
  ]
};
__iconData19.node;
var X = createLucideIcon(__iconData19);

// src/client/icons.jsx
var import_jsx_runtime = require("react/jsx-runtime");
var PATHS = {
  "chevron-down": ["m6 9 6 6 6-6"],
  "chevron-up": ["m18 15-6-6-6 6"],
  plus: ["M12 5v14", "M5 12h14"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  search: ["M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16", "m21 21-4.3-4.3"],
  "refresh-cw": ["M3 12a9 9 0 0 1 15.5-6.2L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-15.5 6.2L3 16", "M3 21v-5h5"],
  "panel-left-close": ["M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z", "M9 3v18", "m16 15-3-3 3-3"],
  "panel-left-open": ["M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z", "M9 3v18", "m14 9 3 3-3 3"],
  bookmark: ["m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"],
  "circle-check": ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20", "m9 12 2 2 4-4"],
  circle: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20"],
  "file-plus": ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v5h6", "M12 12v6", "M9 15h6"],
  "file-check": ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v5h6", "m9 15 2 2 4-4"],
  "file-pen": ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v5h6", "M11 14h3l4-4-3-3-4 4Z"],
  "notebook-pen": ["M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4", "M2 6h4", "M2 10h4", "M2 14h4", "M2 18h4", "m18.4 2.6a2.1 2.1 0 0 1 3 3L14 13l-4 1 1-4Z"],
  ellipsis: ["M12 12h.01", "M19 12h.01", "M5 12h.01"],
  settings: ["M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
  type: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
  sparkles: ["M9.9 2.6 11.4 7l4.4 1.5-4.4 1.5-1.5 4.4-1.5-4.4L4 8.5 8.4 7Z", "M18 5.5l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9Z"],
  rss: ["M4 11a9 9 0 0 1 9 9", "M4 4a16 16 0 0 1 16 16", "M6 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  folder: ["M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
  globe: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20", "M2 12h20", "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"],
  "message-circle": ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  podcast: ["M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z", "M16.85 18.58a9 9 0 1 0-9.7 0", "M8 14a5 5 0 1 1 8 0", "M10 20a1 1 0 0 1-1-1v-1a2 2 0 1 1 4 0v1a1 1 0 0 1-1 1Z"],
  mail: ["M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z", "m22 7-10 5L2 7"],
  newspaper: ["M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6", "M18 14h-8", "M15 18h-5", "M10 6h8v4h-8Z"],
  tv: ["M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z", "m17 2-5 5-5-5"],
  "code-xml": ["m18 16 4-4-4-4", "m6 8-4 4 4 4", "m14.5 4-5 16"],
  feather: ["M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5Z", "M16 8 2 22", "M17.5 15H9"],
  braces: ["M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1", "M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"],
  "app-window": ["M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z", "M2 9h20", "M6 6.5h.01", "M9 6.5h.01"],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  hammer: ["m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9", "M17.64 15 22 10.64", "m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"],
  gamepad: ["M6 12h4", "M8 10v4", "M15 13h.01", "M18 11h.01", "M17.32 5H6.68a4 4 0 0 0-3.98 3.59l-.87 7a4 4 0 0 0 6.79 3.35L9.7 18h4.6l1.08 1a4 4 0 0 0 6.79-3.35l-.87-7A4 4 0 0 0 17.32 5Z"],
  "tree-deciduous": ["M9.9 2.6 11.4 7l4.4 1.5-4.4 1.5-1.5 4.4-1.5-4.4L4 8.5 8.4 7Z"],
  "circle-alert": ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20", "M12 8v4", "M12 16h.01"]
};
var ALIASES = { "gamepad-2": "gamepad", "notebook-pen-2": "notebook-pen", "panel-left": "panel-left-close" };
function Icon2({ name, size = 17, className, strokeWidth = 1.7, ...rest }) {
  if (name === "wand-sparkles") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { size, className, strokeWidth, "aria-hidden": "true", focusable: "false", ...rest });
  const paths = PATHS[ALIASES[name] ?? name] ?? PATHS.circle;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      children: paths.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d }, d))
    }
  );
}

// src/client/ChannelPicker.jsx
var import_react4 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function groupChannels(channels) {
  const sections = { \u805A\u5408: [], \u8BA2\u9605\u5206\u7EC4: [], \u4E54\u6728\u9891\u9053: [], \u6211\u7684\u8BA2\u9605\u6E90: [] };
  for (const channel of channels) {
    if (channel.key === "all" || channel.key === "qiaomu" || channel.key === "feeds:all") {
      const subtitle = channel.key === "qiaomu" ? "\u4E54\u6728\u7CBE\u9009\u7684\u9AD8\u8D28\u91CF\u5185\u5BB9" : channel.key === "feeds:all" ? `${channels.filter((item) => item.kind === "feed").length} \u4E2A\u4E2A\u4EBA\u8BA2\u9605\u6E90` : `${channel.unread} \u7BC7\u672A\u8BFB`;
      sections.\u805A\u5408.push({ ...channel, subtitle });
    } else if (channel.kind === "qiaomu") {
      sections.\u4E54\u6728\u9891\u9053.push({ ...channel, subtitle: `${channel.total} \u7BC7\u6587\u7AE0`, monogram: channel.name.trim().slice(0, 1) });
    } else if (channel.key.startsWith("group:")) {
      sections.\u8BA2\u9605\u5206\u7EC4.push({ ...channel, subtitle: `${channels.filter((item) => item.group === channel.name).length} \u4E2A\u8BA2\u9605\u6E90` });
    } else {
      sections.\u6211\u7684\u8BA2\u9605\u6E90.push({ ...channel, subtitle: channel.lastError ? `\u83B7\u53D6\u5931\u8D25\uFF1A${channel.lastError}` : channel.url, error: Boolean(channel.lastError) });
    }
  }
  return sections;
}
function ChannelMark({ channel, size = 22 }) {
  const key = channel.key ?? "";
  const IconType = key === "all" ? Layers : key === "qiaomu" ? Sparkles : key === "feeds:all" || key.startsWith("feed:") ? Rss : key.startsWith("group:") ? Folder : BookOpen;
  const variant = key === "qiaomu" ? " curated" : key === "all" ? " all" : "";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `qrs-channel-mark${variant}`, style: { width: size, height: size, flex: `0 0 ${size}px` }, "aria-hidden": "true", children: channel.monogram && key.startsWith("qiaomu:") ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: channel.monogram }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IconType, { size: Math.max(16, Math.round(size * 0.72)), strokeWidth: 1.8 }) });
}
function ChannelPicker({ channels, current, anchor, onSelect, onManage, onClose }) {
  const [query, setQuery] = (0, import_react4.useState)("");
  const sections = (0, import_react4.useMemo)(() => groupChannels(channels), [channels]);
  const searching = query.trim() !== "";
  const matches = (channel) => `${channel.name} ${channel.subtitle ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
  const visible = searching ? channels.map((channel) => {
    const all = Object.values(sections).flat();
    return all.find((item) => item.key === channel.key) ?? channel;
  }).filter(matches) : [];
  const row = (channel) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qrs-channel-option-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "button",
    {
      type: "button",
      className: "qrs-channel-option",
      "aria-current": channel.key === current,
      onClick: () => {
        onSelect(channel.key);
        onClose();
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChannelMark, { channel, size: 26 }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qrs-channel-copy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qrs-channel-name", children: channel.name }),
          channel.subtitle && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qrs-channel-subtitle", children: channel.subtitle })
        ] }),
        channel.key === current && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qrs-channel-check", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon2, { name: "circle-check", size: 16 }) })
      ]
    }
  ) }, channel.key);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qrs-channel-backdrop", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qrs-channel-picker", style: anchor ? { left: anchor.left, top: anchor.top } : void 0, role: "dialog", "aria-label": "\u9009\u62E9\u9891\u9053", onClick: (event) => event.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qrs-channel-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u5207\u6362\u9891\u9053" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: "\u9009\u62E9\u60F3\u8BFB\u7684\u5185\u5BB9" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qrs-icon", "aria-label": "\u5173\u95ED\u9891\u9053\u5217\u8868", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon2, { name: "x" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qrs-channel-top", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon2, { name: "search", size: 16 }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          type: "search",
          "aria-label": "\u641C\u7D22\u9891\u9053",
          placeholder: "\u641C\u7D22\u9891\u9053\u3001\u5206\u7EC4\u6216\u8BA2\u9605\u6E90\u2026",
          value: query,
          onChange: (event) => setQuery(event.target.value),
          autoFocus: true
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qrs-channel-options", children: searching ? visible.length ? visible.map(row) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qrs-channel-empty", children: "\u6CA1\u6709\u5339\u914D\u7684\u9891\u9053" }) : Object.entries(sections).map(([title, items]) => items.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qrs-channel-section", children: title }),
      items.map((channel) => row(channel))
    ] }, title)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qrs-channel-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "qrs-channel-manage", onClick: onManage, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon2, { name: "settings", size: 16 }),
        "\u7BA1\u7406\u8BA2\u9605",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon2, { name: "chevron-down", size: 13 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qrs-channel-close", onClick: onClose, children: "\u5B8C\u6210" })
    ] })
  ] }) });
}

// src/client/ReadingAppearance.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function ReadingControls({ settings, onChange, variant = "compact" }) {
  const set = (patch) => onChange(patch);
  const page = variant === "page";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-settings-fields", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qrs-reading-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5B57\u4F53" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { value: settings.readingFont, onChange: (event) => set({ readingFont: event.target.value }), children: Object.entries(FONTS).map(([value, font]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value, children: font.label }, value)) })
      ] }),
      settings.readingFont === "custom" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qrs-reading-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5B57\u4F53\u540D" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            "aria-label": "\u81EA\u9009\u5B57\u4F53\u540D",
            value: settings.customFont ?? "",
            placeholder: "\u4F8B\u5982 LXGW WenKai",
            onChange: (event) => set({ customFont: event.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qrs-reading-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5B57\u53F7" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("output", { children: [
          settings.fontSize,
          " px"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "range",
            min: "14",
            max: "32",
            step: "1",
            value: settings.fontSize,
            onChange: (event) => set({ fontSize: Number(event.target.value) })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qrs-reading-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u884C\u8DDD" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("output", { children: [
          settings.lineHeight.toFixed(1),
          " \u500D"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "range",
            min: "1.5",
            max: "2.4",
            step: "0.1",
            value: settings.lineHeight,
            onChange: (event) => set({ lineHeight: Number(event.target.value) })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u7248\u5FC3\u5BBD\u5EA6" }),
        page ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "qrs-segmented qrs-width-options", role: "group", "aria-label": "\u7248\u5FC3\u5BBD\u5EA6", children: TEXT_WIDTHS.map((width) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", "aria-pressed": settings.textWidth === width.value, onClick: () => set({ textWidth: width.value }), children: width.value }, width.value)) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { "aria-label": "\u7248\u5FC3\u5BBD\u5EA6", value: settings.textWidth, onChange: (event) => set({ textWidth: Number(event.target.value) }), children: TEXT_WIDTHS.map((width) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: width.value, children: width.label }, width.value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-setting qrs-theme-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u9605\u8BFB\u4E3B\u9898" }),
        page ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "qrs-theme-options", role: "group", "aria-label": "\u9605\u8BFB\u4E3B\u9898", children: [["auto", "\u8DDF\u968F\u5E94\u7528"], ["light", "\u660E\u4EAE"], ["paper", "\u7EB8\u5F20"], ["sage", "\u9752\u7EFF"], ["mist", "\u96FE\u84DD"], ["dark", "\u6DF1\u8272"], ["black", "\u7EAF\u9ED1"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", "aria-pressed": settings.readingTheme === value, onClick: () => set({ readingTheme: value }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `qrs-theme-swatch${value === "auto" ? " qrs-theme-swatch-auto" : ""}`, style: value === "auto" ? void 0 : { background: THEMES[value][0], color: THEMES[value][1] }, children: value === "auto" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Monitor, { size: 20, strokeWidth: 1.6 }) : "Aa" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: label })
        ] }, value)) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { "aria-label": "\u9605\u8BFB\u4E3B\u9898", value: settings.readingTheme, onChange: (event) => set({ readingTheme: event.target.value }), children: [["auto", "\u8DDF\u968F\u5E94\u7528"], ["light", "\u660E\u4EAE"], ["paper", "\u7EB8\u5F20"], ["sage", "\u9752\u7EFF"], ["mist", "\u96FE\u84DD"], ["dark", "\u6DF1\u8272"], ["black", "\u7EAF\u9ED1"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value, children: label }, value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-setting", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u9ED8\u8BA4\u7248\u672C" }),
        page ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "qrs-segmented", role: "group", "aria-label": "\u9ED8\u8BA4\u7248\u672C", children: [["original", "\u539F\u6587"], ["translation", "\u8BD1\u6587"], ["rewrite", "\u4E54\u6728\u6539\u5199"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", "aria-pressed": settings.defaultVersion === value, onClick: () => set({ defaultVersion: value }), children: label }, value)) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { "aria-label": "\u9ED8\u8BA4\u7248\u672C", value: settings.defaultVersion, onChange: (event) => set({ defaultVersion: event.target.value }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "original", children: "\u539F\u6587" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "translation", children: "\u8BD1\u6587" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "rewrite", children: "\u4E54\u6728\u6539\u5199" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-setting qrs-reading-setting-check", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u6587\u7AE0\u56FE\u7247" }),
        page ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qrs-switch", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", "aria-label": "\u6587\u7AE0\u56FE\u7247", checked: settings.showImages !== false, onChange: (event) => set({ showImages: event.target.checked }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "aria-hidden": "true" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", "aria-label": "\u6587\u7AE0\u56FE\u7247", checked: settings.showImages !== false, onChange: (event) => set({ showImages: event.target.checked }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      {
        type: "button",
        className: "qrs-reading-reset",
        onClick: () => set({ ...READING_DEFAULTS }),
        children: "\u6062\u590D\u9ED8\u8BA4"
      }
    )
  ] });
}
function ReadingAppearance({ settings, onChange, onClose }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-settings", role: "dialog", "aria-label": "\u9605\u8BFB\u8BBE\u7F6E", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qrs-reading-settings-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u9605\u8BFB\u8BBE\u7F6E" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: onClose, children: "\u5B8C\u6210" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReadingControls, { settings, onChange })
  ] });
}

// src/client/dialogs.jsx
var import_react5 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function Modal({ label, onClose, children, wide = false }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "qrs-modal-backdrop", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `qrs-modal${wide ? " is-wide" : ""}`, role: "dialog", "aria-label": label, onClick: (event) => event.stopPropagation(), children }) });
}
function AddFeedDialog({ api, onClose, onDone, notify }) {
  const [url, setUrl] = (0, import_react5.useState)("");
  const [name, setName] = (0, import_react5.useState)("");
  const [group, setGroup] = (0, import_react5.useState)("");
  const [busy, setBusy] = (0, import_react5.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Modal, { label: "\u6DFB\u52A0\u8BA2\u9605", onClose, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: "\u6DFB\u52A0\u8BA2\u9605" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { "aria-label": "\u8BA2\u9605\u5730\u5740", placeholder: "RSS / Atom \u5730\u5740 (https://\u2026)", value: url, onChange: (event) => setUrl(event.target.value), autoFocus: true }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { "aria-label": "\u8BA2\u9605\u540D\u79F0", placeholder: "\u540D\u79F0(\u53EF\u9009,\u9ED8\u8BA4\u8BFB\u53D6\u6E90\u6807\u9898)", value: name, onChange: (event) => setName(event.target.value) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { "aria-label": "\u8BA2\u9605\u5206\u7EC4", placeholder: "\u5206\u7EC4(\u53EF\u9009)", value: group, onChange: (event) => setGroup(event.target.value) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "qrs-modal-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", disabled: busy || !/^https?:\/\//i.test(url.trim()), onClick: async () => {
        setBusy(true);
        try {
          await api.addSubscription({ url: url.trim(), name: name.trim() || void 0, group: group.trim() || void 0 });
          await onDone();
          onClose();
        } catch (error) {
          notify(`\u6DFB\u52A0\u5931\u8D25\uFF1A${error?.message ?? String(error)}`, true);
        } finally {
          setBusy(false);
        }
      }, children: busy ? "\u8BA2\u9605\u4E2D\u2026" : "\u8BA2\u9605" })
    ] })
  ] });
}

// src/client/SettingsPage.jsx
var import_react9 = require("react");

// package.json
var package_default = {
  name: "qiaomu-rss-dsh",
  description: "Qiaomu RSS reader for dsh: featured + personal feeds, AI translation/rewrite assist, agent tools, and a web reading panel",
  version: "0.5.1",
  private: true,
  license: "GPL-3.0-only",
  repository: {
    type: "git",
    url: "https://github.com/joeseesun/qiaomu-rss-dsh.git"
  },
  keywords: [
    "deepseek-harness",
    "dsh-plugin",
    "rss",
    "qiaomu"
  ],
  type: "module",
  scripts: {
    build: "node build.mjs",
    test: "node tests/smoke.mjs && node tests/article-context.mjs && node tests/video.mjs && node tests/reading-version.mjs && node tests/render.mjs && node tests/harness-integration.mjs && node tests/companion-draft.mjs"
  },
  main: "lib/index.js",
  exports: {
    ".": {
      default: "./lib/index.js"
    },
    "./client": {
      default: "./lib/client.js"
    },
    "./package.json": "./package.json"
  },
  files: [
    "README.md",
    "vendor",
    "src/data/independent-blogs.json",
    "src/data/podcast-feeds.json",
    "cordis.patch.yml",
    "lib"
  ],
  dsh: {
    bundle: {
      patch: "./cordis.patch.yml"
    },
    meta: {
      title: "\u4E54\u6728 RSS \xB7 DSH",
      description: "\u4E54\u6728 RSS \u9605\u8BFB\u5668:\u516C\u5F00\u805A\u5408\u6D41\u3001\u4E2A\u4EBA\u8BA2\u9605\u3001AI \u8BD1\u6587/\u6539\u5199\u4E0E Agent \u5DE5\u5177"
    },
    client: {
      platform: "web",
      inject: [
        "@deepseek-ai/dsh-api-remotes",
        "@deepseek-ai/dsh-api-gateway",
        "@deepseek-ai/dsh-client-connection",
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-sidebar",
        "@deepseek-ai/dsh-client-ui-primitives"
      ]
    }
  },
  peerDependencies: {
    "@deepseek-ai/cordis": "~4.0.4",
    "@deepseek-ai/dsh-agent-default-model": "0.2.0-rc.2",
    "@deepseek-ai/dsh-home-paths": "0.2.0-rc.2",
    "@deepseek-ai/dsh-llm": "0.2.0-rc.2",
    "@deepseek-ai/dsh-tools": "0.2.0-rc.2",
    "@deepseek-ai/dsh-typert-protocol": "0.2.0-rc.2"
  },
  peerDependenciesMeta: {
    "@deepseek-ai/cordis": {
      optional: true
    },
    "@deepseek-ai/dsh-typert-protocol": {
      optional: true
    },
    "@deepseek-ai/dsh-tools": {
      optional: true
    },
    "@deepseek-ai/dsh-llm": {
      optional: true
    },
    "@deepseek-ai/dsh-agent-default-model": {
      optional: true
    },
    "@deepseek-ai/dsh-home-paths": {
      optional: true
    }
  },
  devDependencies: {
    esbuild: "^0.28.1",
    jsdom: "^26.1.0",
    "lucide-react": "^1.49.0",
    react: "^18.3.1",
    "react-dom": "^18.3.1"
  }
};

// src/client/OpmlImport.jsx
var import_react6 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function OpmlImport({ api, onDone }) {
  const [xml, setXml] = (0, import_react6.useState)("");
  const [url, setUrl] = (0, import_react6.useState)("");
  const [preview, setPreview] = (0, import_react6.useState)(null);
  const [selected, setSelected] = (0, import_react6.useState)([]);
  const [query, setQuery] = (0, import_react6.useState)("");
  const [busy, setBusy] = (0, import_react6.useState)(false);
  const [message, setMessage] = (0, import_react6.useState)("");
  const run = async (fn) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(error?.message ?? String(error));
    } finally {
      setBusy(false);
    }
  };
  const inspect = (params) => run(async () => {
    const result = await api.opmlPreview(params);
    setPreview(result);
    setSelected(result.entries.filter((entry) => !entry.duplicate).map((entry) => entry.url));
  });
  const reset = () => {
    setPreview(null);
    setSelected([]);
  };
  const visible = preview?.entries.filter((entry) => `${entry.name} ${entry.group ?? ""} ${entry.url}`.toLowerCase().includes(query.toLowerCase())) ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("fieldset", { className: "qrs-opml-import", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("legend", { children: "\u5BFC\u5165 OPML" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "file", "aria-label": "\u9009\u62E9 OPML \u6587\u4EF6", accept: ".opml,.xml,text/xml", onChange: (e) => {
      const file = e.target.files?.[0];
      if (file) void run(async () => {
        if (file.size > 5 * 1024 * 1024) throw new Error("\u6587\u4EF6\u8D85\u8FC7 5 MB");
        const text = await file.text();
        setXml(text);
        reset();
      });
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { "aria-label": "OPML \u5185\u5BB9", placeholder: "\u7C98\u8D34 OPML\uFF0C\u6216\u9009\u62E9\u6587\u4EF6", rows: 4, value: xml, onChange: (e) => {
      setXml(e.target.value);
      reset();
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "qmrss-btn", disabled: !xml.trim(), onClick: () => void inspect({ xml }), children: "\u9884\u89C8\u5185\u5BB9" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { "aria-label": "OPML \u5730\u5740", placeholder: "https://example.org/subscriptions.opml", value: url, onChange: (e) => {
      setUrl(e.target.value);
      reset();
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "qmrss-btn", disabled: !url.trim(), onClick: () => void inspect({ url: url.trim() }), children: "\u4ECE\u5730\u5740\u9884\u89C8" }),
    preview && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { "aria-label": "\u7B5B\u9009\u5BFC\u5165\u8BA2\u9605", placeholder: "\u7B5B\u9009\u540D\u79F0\u3001\u5206\u7EC4\u3001\u5730\u5740", value: query, onChange: (e) => setQuery(e.target.value) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "qmrss-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "qmrss-btn", onClick: () => setSelected(visible.filter((entry) => !entry.duplicate).map((entry) => entry.url)), children: "\u9009\u62E9\u7B5B\u9009\u7ED3\u679C" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "qmrss-btn", onClick: () => setSelected([]), children: "\u6E05\u7A7A\u9009\u62E9" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "qrs-opml-results", children: visible.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", disabled: entry.duplicate, checked: selected.includes(entry.url), onChange: (e) => setSelected(e.target.checked ? [...selected, entry.url] : selected.filter((url2) => url2 !== entry.url)) }),
        entry.name || entry.url,
        " ",
        entry.group && ` \xB7 ${entry.group}`,
        " ",
        entry.duplicate && "\uFF08\u5DF2\u8BA2\u9605\uFF09"
      ] }, entry.url)) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "qmrss-btn", disabled: !selected.length, onClick: () => void run(async () => {
        const result = await api.opmlImport(preview.xml, selected);
        setMessage(`\u5DF2\u5BFC\u5165 ${result.added} \u9879\uFF0C\u8DF3\u8FC7 ${result.skipped} \u9879\u3002\u8FDB\u5165\u9891\u9053\u540E\u4F1A\u81EA\u52A8\u83B7\u53D6\u6587\u7AE0\u3002`);
        reset();
        await onDone();
      }), children: [
        "\u5BFC\u5165\u6240\u9009\uFF08",
        selected.length,
        "\uFF09"
      ] })
    ] }),
    busy && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "status", children: "\u5904\u7406\u4E2D\u2026" }),
    message && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "status", children: message })
  ] });
}

// src/client/SubscriptionManager.jsx
var import_react7 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
function SubscriptionManager({ api, subscriptions, onChange, notify }) {
  const [query, setQuery] = (0, import_react7.useState)("");
  const [errorsOnly, setErrorsOnly] = (0, import_react7.useState)(false);
  const [selected, setSelected] = (0, import_react7.useState)([]);
  const [group, setGroup] = (0, import_react7.useState)("");
  const [editing, setEditing] = (0, import_react7.useState)(null);
  const [editingGroup, setEditingGroup] = (0, import_react7.useState)(null);
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const [confirmDelete, setConfirmDelete] = (0, import_react7.useState)(false);
  const errorCount = subscriptions.filter((sub) => sub.lastError).length;
  (0, import_react7.useEffect)(() => {
    if (!errorCount) setErrorsOnly(false);
  }, [errorCount]);
  const visible = subscriptions.filter((sub) => (!errorsOnly || sub.lastError) && `${sub.name} ${sub.group ?? ""} ${sub.url}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const groups = [...new Set(subscriptions.map((sub) => sub.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const execute = async (operation) => {
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      notify(`\u64CD\u4F5C\u5931\u8D25\uFF1A${error?.message ?? String(error)}`, true);
    } finally {
      try {
        const result = await api.listSubscriptions();
        onChange(result.subscriptions);
      } catch (error) {
        notify(`\u91CD\u65B0\u8BFB\u53D6\u8BA2\u9605\u5931\u8D25\uFF1A${error?.message ?? String(error)}`, true);
      }
      setBusy(false);
    }
  };
  const batch = async (operation) => {
    const failed = [];
    for (const id of selected) {
      try {
        await operation(id);
      } catch (error) {
        failed.push(`${id}: ${error?.message ?? String(error)}`);
      }
    }
    setSelected([]);
    if (failed.length) throw new Error(failed.join("; "));
    notify("\u6279\u91CF\u64CD\u4F5C\u5B8C\u6210");
  };
  const toggleSelected = (id, checked) => setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id));
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qrs-subscriptions", "aria-label": "\u7BA1\u7406\u8BA2\u9605", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscriptions-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { className: "qrs-subscriptions-search", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Search, { size: 16 }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { "aria-label": "\u641C\u7D22\u8BA2\u9605", placeholder: "\u641C\u7D22\u540D\u79F0\u3001\u5206\u7EC4\u6216\u5730\u5740", value: query, onChange: (event) => setQuery(event.target.value) })
      ] }),
      errorCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-segmented", role: "group", "aria-label": "\u8BA2\u9605\u72B6\u6001", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-pressed": !errorsOnly, onClick: () => setErrorsOnly(false), children: "\u5168\u90E8" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", "aria-pressed": errorsOnly, title: "\u7B5B\u9009\u83B7\u53D6\u5931\u8D25\u7684\u8BA2\u9605\u6E90", onClick: () => setErrorsOnly(true), children: [
          "\u5F02\u5E38 ",
          errorCount
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscriptions-selection", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", disabled: busy || !visible.length, onClick: () => setSelected(visible.map((sub) => sub.id)), children: "\u9009\u62E9\u5F53\u524D\u7ED3\u679C" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
        visible.length,
        " \u4E2A\u7ED3\u679C"
      ] })
    ] }),
    selected.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscriptions-batch", "aria-label": "\u6279\u91CF\u64CD\u4F5C", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("strong", { children: [
        "\u5DF2\u9009 ",
        selected.length,
        " \u9879"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Folder, { size: 15 }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { "aria-label": "\u6279\u91CF\u79FB\u52A8\u5206\u7EC4", placeholder: "\u76EE\u6807\u5206\u7EC4\uFF0C\u7559\u7A7A\u4E3A\u672A\u5206\u7EC4", value: group, onChange: (event) => setGroup(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", disabled: busy, onClick: () => void execute(() => batch((id) => api.updateSubscription({ id, group }))), children: "\u79FB\u52A8\u5206\u7EC4" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", disabled: busy, onClick: () => void execute(() => batch((id) => api.refresh(id))), children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RefreshCw, { size: 14 }),
        "\u5237\u65B0"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", disabled: busy, className: "danger", onClick: () => setConfirmDelete(true), children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Trash, { size: 14 }),
        "\u9000\u8BA2"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "icon", "aria-label": "\u53D6\u6D88\u9009\u62E9", onClick: () => {
        setSelected([]);
        setConfirmDelete(false);
      }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(X, { size: 16 }) })
    ] }),
    confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscriptions-confirm", role: "alert", children: [
      "\u786E\u8BA4\u9000\u8BA2\u8FD9 ",
      selected.length,
      " \u4E2A\u8BA2\u9605\u6E90\uFF1F",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "danger", onClick: () => {
        setConfirmDelete(false);
        void execute(() => batch((id) => api.removeSubscription(id)));
      }, children: "\u786E\u8BA4\u9000\u8BA2" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", onClick: () => setConfirmDelete(false), children: "\u53D6\u6D88" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscriptions-list", children: [
      visible.map((sub) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscription-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { type: "checkbox", "aria-label": `\u9009\u62E9 ${sub.name}`, disabled: busy, checked: selected.includes(sub.id), onChange: (event) => toggleSelected(sub.id, event.target.checked) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qrs-subscription-avatar", "aria-hidden": "true", children: sub.name.trim().slice(0, 1) || "R" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscription-copy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: sub.name }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { title: sub.url, children: [
            host(sub.url),
            sub.group && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
              " \xB7 ",
              sub.group
            ] })
          ] }),
          sub.lastError && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("small", { role: "status", children: [
            "\u83B7\u53D6\u5931\u8D25\uFF1A",
            sub.lastError
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscription-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": `\u7F16\u8F91 ${sub.name}`, title: "\u7F16\u8F91", disabled: busy, onClick: () => setEditing({ id: sub.id, name: sub.name, group: sub.group ?? "" }), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Pencil, { size: 15 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": `\u590D\u5236 ${sub.name} \u5730\u5740`, title: "\u590D\u5236\u5730\u5740", onClick: () => void navigator.clipboard.writeText(sub.url).then(() => notify("\u5730\u5740\u5DF2\u590D\u5236")).catch((error) => notify(`\u590D\u5236\u5931\u8D25\uFF1A${error.message}`, true)), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Copy, { size: 15 }) })
        ] })
      ] }, sub.id)),
      !visible.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qrs-subscriptions-empty", children: errorsOnly ? "\u6CA1\u6709\u83B7\u53D6\u5931\u8D25\u7684\u8BA2\u9605\u6E90" : "\u6CA1\u6709\u5339\u914D\u7684\u8BA2\u9605\u6E90" })
    ] }),
    groups.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-group-manager", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-group-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "\u8BA2\u9605\u5206\u7EC4" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
          groups.length,
          " \u4E2A\u5206\u7EC4"
        ] })
      ] }),
      groups.map((name) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-group-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Folder, { size: 15 }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: name }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("small", { children: [
          subscriptions.filter((sub) => sub.group === name).length,
          " \u4E2A\u8BA2\u9605\u6E90"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": `\u7F16\u8F91\u5206\u7EC4 ${name}`, onClick: () => setEditingGroup({ oldName: name, name }), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Pencil, { size: 15 }) })
      ] }, name))
    ] }),
    editing && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qrs-subscription-editor-backdrop", onClick: () => setEditing(null), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("form", { className: "qrs-subscription-editor", role: "dialog", "aria-modal": "true", "aria-label": "\u7F16\u8F91\u8BA2\u9605", onClick: (event) => event.stopPropagation(), onKeyDown: (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setEditing(null);
      }
    }, onSubmit: (event) => {
      event.preventDefault();
      if (!busy && editing.name.trim()) void execute(async () => {
        await api.updateSubscription(editing);
        setEditing(null);
        notify("\u8BA2\u9605\u5DF2\u66F4\u65B0");
      });
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "\u7F16\u8F91\u8BA2\u9605" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": "\u5173\u95ED\u7F16\u8F91", onClick: () => setEditing(null), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(X, { size: 16 }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
        "\u540D\u79F0",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { autoFocus: true, "aria-label": "\u8BA2\u9605\u540D\u79F0", value: editing.name, onChange: (event) => setEditing({ ...editing, name: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
        "\u5206\u7EC4",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { "aria-label": "\u8BA2\u9605\u5206\u7EC4", list: "qrs-existing-groups", value: editing.group, onChange: (event) => setEditing({ ...editing, group: event.target.value }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("datalist", { id: "qrs-existing-groups", children: groups.map((name) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: name }, name)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscription-editor-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", onClick: () => setEditing(null), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "submit", disabled: busy || !editing.name.trim(), children: "\u4FDD\u5B58\u66F4\u6539" })
      ] })
    ] }) }),
    editingGroup && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qrs-subscription-editor-backdrop", onClick: () => setEditingGroup(null), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("form", { className: "qrs-subscription-editor", role: "dialog", "aria-modal": "true", "aria-label": "\u7F16\u8F91\u8BA2\u9605\u5206\u7EC4", onClick: (event) => event.stopPropagation(), onKeyDown: (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setEditingGroup(null);
      }
    }, onSubmit: (event) => {
      event.preventDefault();
      if (busy) return;
      void execute(async () => {
        const targets = subscriptions.filter((sub) => sub.group === editingGroup.oldName);
        for (const sub of targets) await api.updateSubscription({ id: sub.id, group: editingGroup.name.trim() });
        setEditingGroup(null);
        notify("\u5206\u7EC4\u5DF2\u66F4\u65B0");
      });
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "\u7F16\u8F91\u5206\u7EC4" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": "\u5173\u95ED\u5206\u7EC4\u7F16\u8F91", onClick: () => setEditingGroup(null), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(X, { size: 16 }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u4FEE\u6539\u5206\u7EC4\u540D\u4F1A\u79FB\u52A8\u8BE5\u5206\u7EC4\u4E2D\u7684\u5168\u90E8\u8BA2\u9605\u6E90\u3002\u7559\u7A7A\u53EF\u53D6\u6D88\u5206\u7EC4\uFF0C\u8BA2\u9605\u6E90\u4F1A\u4FDD\u7559\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { children: [
        "\u5206\u7EC4\u540D\u79F0",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { autoFocus: true, "aria-label": "\u5206\u7EC4\u540D\u79F0", value: editingGroup.name, onChange: (event) => setEditingGroup({ ...editingGroup, name: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qrs-subscription-editor-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", onClick: () => setEditingGroup(null), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "submit", disabled: busy || editingGroup.name.trim() === editingGroup.oldName, children: "\u4FDD\u5B58\u5206\u7EC4" })
      ] })
    ] }) })
  ] });
}

// src/client/PromptManager.jsx
var import_react8 = require("react");

// src/client/quick-prompts.js
var KEY = "qrs.quick-prompts.v1";
var DEFAULT_PROMPTS = [
  { id: "summary", title: "\u6982\u62EC\u8981\u70B9", body: "\u8BF7\u7528\u4E09\u70B9\u6982\u62EC\u8FD9\u7BC7\u6587\u7AE0\u7684\u6838\u5FC3\u89C2\u70B9\uFF0C\u5E76\u533A\u5206\u4E8B\u5B9E\u4E0E\u4F5C\u8005\u5224\u65AD\u3002" },
  { id: "explain", title: "\u89E3\u91CA\u9009\u6BB5", body: "\u8BF7\u7ED3\u5408\u4E0A\u4E0B\u6587\u89E3\u91CA\u6211\u9009\u4E2D\u7684\u8FD9\u6BB5\u8BDD\uFF0C\u7528\u901A\u4FD7\u7684\u4E2D\u6587\u8BF4\u660E\u3002" },
  { id: "question", title: "\u8FFD\u95EE\u8BC1\u636E", body: "\u8FD9\u7BC7\u6587\u7AE0\u7684\u4E3B\u8981\u7ED3\u8BBA\u6709\u54EA\u4E9B\u8BC1\u636E\u652F\u6301\uFF1F\u54EA\u4E9B\u5730\u65B9\u8FD8\u9700\u8981\u6838\u5B9E\uFF1F" }
];
function readQuickPrompts() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.body === "string").slice(0, 20);
  } catch {
  }
  return DEFAULT_PROMPTS;
}
function saveQuickPrompts(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("qrs-prompts-changed"));
}

// src/client/PromptManager.jsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function PromptManager({ notify, startAdding = false }) {
  const [items, setItems] = (0, import_react8.useState)(readQuickPrompts);
  const [editing, setEditing] = (0, import_react8.useState)(() => startAdding && readQuickPrompts().length < 20 ? { title: "", body: "" } : null);
  const save = () => {
    const title = editing.title.trim();
    const body = editing.body.trim();
    if (!title || !body) return;
    const next = editing.id ? items.map((item) => item.id === editing.id ? { id: item.id, title, body } : item) : [...items, { id: crypto.randomUUID(), title, body }];
    saveQuickPrompts(next);
    setItems(next);
    setEditing(null);
    notify("\u5FEB\u6377\u63D0\u793A\u8BCD\u5DF2\u4FDD\u5B58");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qrs-prompt-manager", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qrs-settings-card-head qrs-settings-source-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { children: "\u5FEB\u6377\u63D0\u793A\u8BCD" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "\u663E\u793A\u5728\u4F34\u8BFB\u8F93\u5165\u6846\u4E0A\u65B9\uFF0C\u70B9\u51FB\u540E\u76F4\u63A5\u53D1\u9001\u3002\u8F93\u5165\u6846\u5DF2\u6709\u8349\u7A3F\u65F6\u4F1A\u4FDD\u7559\u8349\u7A3F\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: "qrs-prompt-add", disabled: items.length >= 20, onClick: () => setEditing({ title: "", body: "" }), children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Plus, { size: 15 }),
        "\u65B0\u589E"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qrs-prompt-list", children: [
      items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qrs-prompt-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: item.title }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: item.body })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", "aria-label": `\u7F16\u8F91 ${item.title}`, onClick: () => setEditing(item), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Pencil, { size: 15 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", "aria-label": `\u5220\u9664 ${item.title}`, onClick: () => {
          const next = items.filter((prompt) => prompt.id !== item.id);
          saveQuickPrompts(next);
          setItems(next);
          notify("\u63D0\u793A\u8BCD\u5DF2\u5220\u9664");
        }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Trash, { size: 15 }) })
      ] }, item.id)),
      !items.length && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "\u8FD8\u6CA1\u6709\u5FEB\u6377\u63D0\u793A\u8BCD\u3002" })
    ] }),
    editing && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "qrs-subscription-editor-backdrop", onClick: () => setEditing(null), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("form", { className: "qrs-subscription-editor", role: "dialog", "aria-modal": "true", "aria-label": editing.id ? "\u7F16\u8F91\u63D0\u793A\u8BCD" : "\u65B0\u589E\u63D0\u793A\u8BCD", onClick: (event) => event.stopPropagation(), onKeyDown: (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setEditing(null);
      }
    }, onSubmit: (event) => {
      event.preventDefault();
      save();
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: editing.id ? "\u7F16\u8F91\u63D0\u793A\u8BCD" : "\u65B0\u589E\u63D0\u793A\u8BCD" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setEditing(null), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(X, { size: 16 }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { children: [
        "\u540D\u79F0",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { autoFocus: true, maxLength: 60, value: editing.title, onChange: (event) => setEditing({ ...editing, title: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { children: [
        "\u63D0\u793A\u8BCD",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("textarea", { rows: 5, maxLength: 5e3, value: editing.body, onChange: (event) => setEditing({ ...editing, body: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qrs-subscription-editor-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: () => setEditing(null), children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "submit", disabled: !editing.title.trim() || !editing.body.trim(), children: "\u4FDD\u5B58" })
      ] })
    ] }) })
  ] });
}

// src/client/SettingsPage.jsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var TABS = [["reading", "\u9605\u8BFB\u4F53\u9A8C", BookOpen], ["sources", "\u8BA2\u9605\u7BA1\u7406", Rss], ["prompts", "\u5FEB\u6377\u63D0\u793A\u8BCD", Sparkles], ["about", "\u5173\u4E8E", Info]];
var REWARD_QR = "https://radio.qiaomu.ai/assets/qiaomu_reward_qr.png";
var FOLLOW_QR = "https://radio.qiaomu.ai/assets/qiaomu_wechat_public_account_qr.jpg";
function SettingsPage({ api, onClose, notify, initialTab = "reading", startAddingPrompt = false }) {
  const [tab, setTab] = (0, import_react9.useState)(initialTab);
  const [settings, setSettings] = (0, import_react9.useState)(null);
  const [subscriptions, setSubscriptions] = (0, import_react9.useState)([]);
  const [message, setMessage] = (0, import_react9.useState)("");
  const [saving, setSaving] = (0, import_react9.useState)(false);
  const [showImport, setShowImport] = (0, import_react9.useState)(false);
  (0, import_react9.useEffect)(() => {
    let cancelled = false;
    void Promise.all([api.getSettings(), api.listSubscriptions()]).then(([preferences, feeds]) => {
      if (!cancelled) {
        setSettings(preferences.settings);
        setSubscriptions(feeds.subscriptions);
      }
    }).catch((error) => {
      if (!cancelled) setMessage(`\u8BFB\u53D6\u8BBE\u7F6E\u5931\u8D25\uFF1A${error?.message ?? String(error)}`);
    });
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [api, onClose]);
  const change = (patch) => setSettings((previous) => ({ ...previous, ...patch }));
  const reloadSubscriptions = async () => {
    const list = await api.listSubscriptions();
    setSubscriptions(list.subscriptions);
  };
  const save = async () => {
    setSaving(true);
    try {
      const result = await api.saveSettings({ ...settings, origin: settings.origin.trim() });
      setSettings(result.settings);
      window.dispatchEvent(new Event("qrs-settings-changed"));
      setMessage("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
    } catch (error) {
      setMessage(`\u4FDD\u5B58\u5931\u8D25\uFF1A${error?.message ?? String(error)}`);
    } finally {
      setSaving(false);
    }
  };
  const exportOpml = async () => {
    try {
      const result = await api.opmlExport();
      const url = URL.createObjectURL(new Blob([result.xml], { type: "text/xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "qiaomu-rss-subscriptions.opml";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    } catch (error) {
      setMessage(`\u5BFC\u51FA\u5931\u8D25\uFF1A${error?.message ?? String(error)}`);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qrs-settings-backdrop", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "qrs-settings-page", role: "dialog", "aria-modal": "true", "aria-label": "\u4E54\u6728 RSS \u8BBE\u7F6E", onClick: (event) => event.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("header", { className: "qrs-settings-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "QIAOMU RSS" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "\u63D2\u4EF6\u8BBE\u7F6E" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "qrs-icon", title: "\u5173\u95ED\u8BBE\u7F6E", "aria-label": "\u5173\u95ED\u8BBE\u7F6E", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon2, { name: "x" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("nav", { className: "qrs-settings-tabs", "aria-label": "\u8BBE\u7F6E\u5206\u7C7B", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "qrs-settings-nav-caption", children: "\u8BBE\u7F6E" }),
        TABS.map(([key, label, TabIcon]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", "aria-current": tab === key ? "page" : void 0, onClick: () => setTab(key), children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(TabIcon, { size: 17, strokeWidth: 1.8 }),
          label
        ] }, key))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("main", { className: "qrs-settings-content", children: [
        !settings && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { role: "status", children: message || "\u6B63\u5728\u52A0\u8F7D\u8BBE\u7F6E\u2026" }),
        settings && tab === "reading" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { "aria-label": "\u9605\u8BFB\u8BBE\u7F6E", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-intro", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { children: "\u9605\u8BFB\u4F53\u9A8C" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u8BA9\u6587\u7AE0\u4EE5\u4F60\u559C\u6B22\u7684\u8282\u594F\u548C\u6837\u5F0F\u5448\u73B0\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card qrs-settings-reading-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u6587\u7AE0\u5916\u89C2" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u5B57\u4F53\u3001\u7248\u5FC3\u4E0E\u989C\u8272\u53EA\u5F71\u54CD\u9605\u8BFB\u89C6\u56FE\u3002" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ReadingControls, { settings, onChange: change, variant: "page" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card qrs-settings-toggle-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "AI \u8865\u5168\u9605\u8BFB\u7248\u672C" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u6587\u7AE0\u7F3A\u5C11\u8BD1\u6587\u6216\u4E54\u6728\u6539\u5199\u65F6\uFF0C\u7528 Harness \u5F53\u524D\u6A21\u578B\u8865\u5168\u3002" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "qrs-switch", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "checkbox", "aria-label": "AI \u8865\u5168\u9605\u8BFB\u7248\u672C", checked: settings.aiAssist !== false, onChange: (event) => change({ aiAssist: event.target.checked }) }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { "aria-hidden": "true" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "qrs-settings-hint", children: "AI \u4F34\u8BFB\u4F7F\u7528 Harness \u7684\u539F\u751F\u5BF9\u8BDD\u4E0E\u9ED8\u8BA4\u5DE5\u4F5C\u533A\u3002\u6A21\u578B\u53EF\u5728\u53F3\u4FA7\u5BF9\u8BDD\u6846\u4E2D\u5207\u6362\u3002" })
        ] }),
        settings && tab === "sources" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { "aria-label": "\u8BA2\u9605\u8BBE\u7F6E", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-intro", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { children: "\u8BA2\u9605\u7BA1\u7406" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u6574\u7406\u4E2A\u4EBA\u8BA2\u9605\u6E90\uFF0C\u6216\u8FC1\u79FB\u73B0\u6709 OPML \u6E05\u5355\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u4E54\u6728\u7CBE\u9009" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u516C\u5F00\u5185\u5BB9\u670D\u52A1\u7684\u8FDE\u63A5\u5730\u5740\u3002\u4E2A\u4EBA\u8BA2\u9605\u4ECD\u7531\u672C\u673A\u8BFB\u53D6\u3002" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "qrs-settings-url", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u670D\u52A1\u5730\u5740" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "url", "aria-label": "\u4E54\u6728\u670D\u52A1\u5730\u5740", value: settings.origin ?? "", onChange: (event) => change({ origin: event.target.value }) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card qrs-settings-sources-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card-head qrs-settings-source-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u6211\u7684\u8BA2\u9605" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { children: [
                  subscriptions.length,
                  " \u4E2A\u8BA2\u9605\u6E90"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-source-actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", onClick: () => setShowImport((current) => !current), "aria-expanded": showImport, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Upload, { size: 15 }),
                  "\u5BFC\u5165 OPML"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", onClick: () => void exportOpml(), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Download, { size: 15 }),
                  "\u5BFC\u51FA"
                ] })
              ] })
            ] }),
            showImport && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qrs-settings-import", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OpmlImport, { api, onDone: async () => {
              await reloadSubscriptions();
              setShowImport(false);
            } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SubscriptionManager, { api, subscriptions, onChange: setSubscriptions, notify: (text, isError) => {
              setMessage(text);
              if (isError) notify(text, true);
            } })
          ] })
        ] }),
        tab === "prompts" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { "aria-label": "\u5FEB\u6377\u63D0\u793A\u8BCD\u8BBE\u7F6E", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-intro", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { children: "\u5FEB\u6377\u63D0\u793A\u8BCD" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u628A\u5E38\u7528\u7684\u9605\u8BFB\u63D0\u95EE\u653E\u5728\u624B\u8FB9\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qrs-settings-card", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(PromptManager, { notify: setMessage, startAdding: startAddingPrompt }) })
        ] }),
        tab === "about" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { "aria-label": "\u5173\u4E8E\u4E54\u6728 RSS", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-intro", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { children: "\u5173\u4E8E\u4E54\u6728 RSS" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u4E3A DeepSeek Harness \u6253\u9020\u7684\u5B89\u9759\u9605\u8BFB\u7A7A\u95F4\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card qrs-settings-about-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-about-brand", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u4E54" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u4E54\u6728 RSS" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { children: [
                  "\u7248\u672C ",
                  package_default.version,
                  " \xB7 GPL-3.0-only"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u9605\u8BFB\u4E54\u6728\u7CBE\u9009\u4E0E\u4E2A\u4EBA RSS\uFF0C\u5E76\u7528 Harness \u539F\u751F AI \u5BF9\u8BDD\u4F34\u8BFB\u3002\u9605\u8BFB\u6570\u636E\u4FDD\u5B58\u5728\u672C\u673A Harness \u76EE\u5F55\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qrs-settings-card-head", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u9879\u76EE\u4E0E\u53CD\u9988" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qrs-settings-links", children: [["\u6E90\u7801\u4E0E\u66F4\u65B0", "https://github.com/joeseesun/qiaomu-rss-dsh"], ["\u53CD\u9988\u95EE\u9898", "https://github.com/joeseesun/qiaomu-rss-dsh/issues"], ["\u5411\u9633\u4E54\u6728", "https://qiaomu.ai/"], ["\u4E54\u6728\u535A\u5BA2", "https://blog.qiaomu.ai/"]].map(([label, href]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("a", { href, target: "_blank", rel: "noopener noreferrer", children: [
              label,
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ArrowUpRight, { size: 15 })
            ] }, href)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-support", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Heart, { size: 18 }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u6253\u8D4F\u652F\u6301" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u611F\u8C22\u652F\u6301\u4E54\u6728\u6301\u7EED\u7EF4\u62A4\u8FD9\u4E2A\u63D2\u4EF6\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("img", { src: REWARD_QR, alt: "\u5411\u9633\u4E54\u6728\u6253\u8D4F\u4E8C\u7EF4\u7801", loading: "lazy", width: "140", height: "140", referrerPolicy: "no-referrer" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qrs-settings-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Rss, { size: 18 }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u5173\u6CE8\u516C\u4F17\u53F7" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u5411\u9633\u4E54\u6728\u63A8\u8350\u770B" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("img", { src: FOLLOW_QR, alt: "\u5411\u9633\u4E54\u6728\u63A8\u8350\u770B\u516C\u4F17\u53F7\u4E8C\u7EF4\u7801", loading: "lazy", width: "140", height: "140", referrerPolicy: "no-referrer" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("footer", { className: "qrs-settings-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { role: "status", children: message }),
      tab === "reading" || tab === "sources" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", disabled: !settings || saving, onClick: () => void save(), children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u8BBE\u7F6E" }) : null
    ] })
  ] }) });
}

// src/client/reading-version.js
var ORDER = ["original", "translation", "rewrite"];
function resolveReadingVersion(preferred, article) {
  const readable = (kind) => kind === "original" ? Boolean(article?.html?.trim()) : article?.versions?.[kind]?.available === true && Boolean(article.versions[kind].markdown?.trim());
  const candidates = [preferred, ...ORDER.filter((kind) => kind !== preferred && kind !== "original"), "original"];
  return candidates.find((kind) => ORDER.includes(kind) && readable(kind)) ?? "original";
}

// src/client/Discover.jsx
var import_react10 = require("react");

// src/data/independent-blogs.json
var independent_blogs_default = {
  source: "https://github.com/timqian/chinese-independent-blogs",
  revision: "4fbded82114fc10f16770d53f287e3af951678cd",
  skipped: 139,
  items: [
    {
      id: "blog-1f081c225f94a663",
      name: "\u900F\u660E\u521B\u4E1A\u5B9E\u9A8C",
      url: "https://blog.t9t.io/atom.xml",
      site: "https://blog.t9t.io/",
      tags: [
        "\u521B\u4E1A",
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-e8e67d7f7b2e4f7d",
      name: "\u962E\u4E00\u5CF0\u7684\u7F51\u7EDC\u65E5\u5FD7",
      url: "http://feeds.feedburner.com/ruanyifeng",
      site: "https://www.ruanyifeng.com/blog/",
      tags: [
        "\u521B\u4E1A",
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-1f78500ee39edc23",
      name: "\u9177 \u58F3 \u2013 CoolShell",
      url: "http://coolshell.cn/feed",
      site: "https://coolshell.cn/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-f30975b391928088",
      name: "\u5F20\u946B\u65ED-\u946B\u7A7A\u95F4-\u946B\u751F\u6D3B",
      url: "http://www.zhangxinxu.com/wordpress/?feed=rss2",
      site: "https://www.zhangxinxu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-030534a537d16fd1",
      name: "Alili\u4E36\u524D\u7AEF\u5927\u7206\u70B8",
      url: "https://alili.tech/index.xml",
      site: "https://alili.tech/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-dc9e87308221aae5",
      name: "\u868A\u5B50\u524D\u7AEF\u535A\u5BA2",
      url: "https://www.xiabingbao.com/atom.xml",
      site: "https://www.xiabingbao.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-ca3610ee701db5fb",
      name: "DIYGod - \u5199\u4EE3\u7801\u662F\u70ED\u7231\uFF0C\u5199\u5230\u4E16\u754C\u5145\u6EE1\u7231!",
      url: "https://diygod.me/atom.xml",
      site: "https://diygod.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-234f2256d21515e5",
      name: "MacTalk-\u6C60\u5EFA\u5F3A\u7684\u968F\u60F3\u5F55",
      url: "http://macshuo.com/?feed=rss2",
      site: "http://macshuo.com/",
      tags: [
        "\u7F16\u7A0B",
        "iOS"
      ]
    },
    {
      id: "blog-3ac4a02c5f3053d6",
      name: "ShrekShao",
      url: "http://shrekshao.github.io/feed.xml",
      site: "https://shrekshao.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-1eb515079381c356",
      name: "\u4E91\u98CE\u7684 BLOG",
      url: "http://blog.codingnow.com/atom.xml",
      site: "https://blog.codingnow.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-2dbe4080c3206c39",
      name: "Reorx\u2019s Forge",
      url: "https://reorx.com/feed.xml",
      site: "https://reorx.com/",
      tags: [
        "\u6570\u5B57\u751F\u6D3B",
        "\u4EA7\u54C1\u601D\u8003",
        "\u751F\u4EA7\u529B\u5DE5\u5177",
        "\u8F6F\u4EF6\u5F00\u53D1"
      ]
    },
    {
      id: "blog-a90f96d2d652979a",
      name: "ZDDHUB \u7684\u535A\u5BA2",
      url: "https://zddhub.com/feed",
      site: "https://zddhub.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-53d456836f7360df",
      name: "\u5168\u6808\u5E94\u7528\u5F00\u53D1:\u7CBE\u76CA\u5B9E\u8DF5",
      url: "https://www.phodal.com/blog/feeds/rss/",
      site: "https://www.phodal.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-75d133a8c5f8343f",
      name: "Python \u5DE5\u5320",
      url: "https://www.piglei.com/feeds/latest/",
      site: "https://www.piglei.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-9882c6fdf34b99ed",
      name: "\u4F46\u884C\u597D\u4E8B\uFF0C\u83AB\u95EE\u524D\u7A0B",
      url: "https://windard.com/feed.xml",
      site: "https://windard.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-8741d8e8a817293b",
      name: "Ric's Blog",
      url: "https://www.lichong.work/atom.xml",
      site: "https://www.lichong.work/",
      tags: [
        "\u7F16\u7A0B",
        "\u67B6\u6784",
        "\u8BBE\u8BA1",
        "\u7B97\u6CD5"
      ]
    },
    {
      id: "blog-340e3b693b6d18b4",
      name: "\u7F57\u78CA\u7684\u72EC\u7ACB\u535A\u5BA2",
      url: "http://luolei.org/feed/",
      site: "https://luolei.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-4069237d4cae96ad",
      name: "\u9601\u5B50",
      url: "https://dfine.tech/atom.xml",
      site: "https://dfine.tech/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b01ab45552459845",
      name: "\u4EE3\u7801\u5BB6",
      url: "https://daimajia.com/feed",
      site: "https://daimajia.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-60d4e118882d4ae5",
      name: "\u5F00\u6E90\u5B9E\u9A8C\u5BA4",
      url: "https://www.kymjs.com/feed.xml",
      site: "https://kymjs.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-cacb46e391a0f42e",
      name: "\u6280\u672F\u5C0F\u9ED1\u5C4B",
      url: "https://droidyue.com/atom.xml",
      site: "https://droidyue.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-ae18da9519ddf79f",
      name: "vzard's blog",
      url: "https://vzardlloo.github.io/atom.xml",
      site: "https://vzardlloo.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-7db2176bcabd913d",
      name: "\u540E\u7AEF\u6280\u672F\u6742\u8C08",
      url: "https://rowkey.cn/atom.xml",
      site: "https://rowkey.cn/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-2b870e352dca15a4",
      name: "zhonger \u524D\u7AEF\u5F00\u53D1\u8005\uFF0C\u559C\u7231\u8FD0\u7EF4\u7BA1\u7406",
      url: "https://blog.lui8.cn/feed.xml",
      site: "https://blog.lui8.cn/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-a5571903f7c23232",
      name: "\u4F9D\u4E91's Blog",
      url: "https://blog.lilydjwg.me/posts.rss",
      site: "https://blog.lilydjwg.me/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-8094acaf0da76b9f",
      name: "zgh's Blog",
      url: "https://hundren.github.io/atom.xml",
      site: "https://hundren.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6E38\u620F",
        "\u91CF\u5B50\u7269\u7406"
      ]
    },
    {
      id: "blog-8de8d90d2477d0ee",
      name: "\u673D\u513F",
      url: "https://xiuer.medium.com/feed",
      site: "https://xiuer.medium.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-c5574af3a99b0e5f",
      name: "INTJer",
      url: "https://arminli.com/rss.xml",
      site: "https://arminli.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-4d6c175f9f140650",
      name: "\u601D\u5706\u7B14\u8BB0",
      url: "https://hintsnet.com/pimgeek/feed/",
      site: "https://hintsnet.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-1fd240c4f8bd6e97",
      name: "\u524D\u7AEF\u5DE5\u7A0B\u5E08 Toweave",
      url: "https://toweave.github.io/rss.xml",
      site: "https://toweave.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b98ab5a026c3805a",
      name: "MouT.me",
      url: "https://ghost.mout.me/rss/",
      site: "https://mout.me/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-72bdbce58d380579",
      name: "diss\u5E26\u7801",
      url: "https://dumplingbao.github.io/atom.xml",
      site: "https://dumplingbao.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-c380c225bb7e023a",
      name: "\u738B\u767B\u79D1-DK\u535A\u5BA2",
      url: "https://greatdk.com/feed",
      site: "https://greatdk.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u521B\u4E1A"
      ]
    },
    {
      id: "blog-7192d6e8e0b518d1",
      name: "chai2010 \u7684\u535A\u5BA2",
      url: "https://chai2010.cn/index.xml",
      site: "https://chai2010.cn/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-21ea5c98ca7129d5",
      name: "\u7B28\u65B9\u6CD5\u5B66\u5199\u4F5C",
      url: "https://www.cnfeat.com/feed.xml",
      site: "https://www.cnfeat.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-25cfbc8e8cd07d3b",
      name: "\u4E91\u539F\u751F",
      url: "https://jimmysong.io/index.xml",
      site: "https://jimmysong.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b356a3ec3e55c431",
      name: "Hawstein's Blog",
      url: "http://hawstein.com/feed.xml",
      site: "https://hawstein.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-702d535f4c52ea2f",
      name: "Skywind Inside",
      url: "http://www.skywind.me/blog/feed",
      site: "https://www.skywind.me/blog/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-86935c76189797d5",
      name: "\u67D0\u5C9B",
      url: "http://www.shuizilong.com/house/feed/",
      site: "http://www.shuizilong.com/house",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-32a740b89574cdb9",
      name: "\u9648\u6C99\u514B\u65E5\u5FD7",
      url: "http://www.chenshake.com/feed/",
      site: "http://www.chenshake.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-f5e0e65c9295b4a6",
      name: "Cat in Chinese",
      url: "http://chinese.catchen.me/feeds/posts/default",
      site: "https://chinese.catchen.me/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-6fd3ac558bdf1b68",
      name: "Randy's Blog",
      url: "https://lutaonan.com/rss.xml",
      site: "https://lutaonan.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b59268d45c4fefeb",
      name: "iTimothy",
      url: "https://xiaozhou.net/atom.xml",
      site: "https://xiaozhou.net/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-acf073b5a23dd8a8",
      name: "idea's blog",
      url: "http://www.ideawu.net/blog/feed",
      site: "http://www.ideawu.net/blog",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-9767b9411f65fe4e",
      name: "xiaix's Blog",
      url: "http://xiaix.me/rss/",
      site: "https://xiaix.me/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-6a38d7d4706204db",
      name: "\u641E\u7B11\u8AC7\u8EDF\u5DE5",
      url: "http://teddy-chen-tw.blogspot.com/feeds/posts/default",
      site: "https://teddy-chen-tw.blogspot.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-3587e9524d9abc0d",
      name: "The Will Will Web",
      url: "https://feeds.feedburner.com/TheWillWillWeb",
      site: "https://blog.miniasp.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-85c38a34df8cc8ab",
      name: "\u7A0B\u5E8F\u5E08",
      url: "http://www.techug.com/feed",
      site: "https://www.techug.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-9191a6042d0d2a93",
      name: "\u89E3\u9053jdon.com",
      url: "https://www.jdon.com/jivejdon/rss",
      site: "https://www.jdon.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-7fec04f18a176980",
      name: "\u5C0F\u80E1\u5B50\u54E5\u7684\u4E2A\u4EBA\u7F51\u7AD9",
      url: "http://www.barretlee.com/rss2.xml",
      site: "https://www.barretlee.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-eccf69b93e7e19ff",
      name: "\u665A\u6674\u5E7D\u8349\u8F69",
      url: "https://www.jeffjade.com/atom.xml",
      site: "https://www.jeffjade.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-076472a522ec066c",
      name: "\u6797\u5C0F\u6C90",
      url: "http://feed.immmmm.com/",
      site: "https://immmmm.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-0842b6b483353651",
      name: "HelloDog",
      url: "https://wsgzao.github.io/atom.xml",
      site: "https://wsgzao.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-48cc720e91a494b4",
      name: "the5fire\u7684\u6280\u672F\u535A\u5BA2",
      url: "http://www.the5fire.com/rss",
      site: "https://www.the5fire.com/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "\u7B97\u6CD5",
        "\u968F\u7B14",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-7bfb9c90558f97ba",
      name: "\u4F59\u6D77\u5CEF David \u7269\u7406\u55B5 phycat",
      url: "https://hfdavidyu.com/feed/",
      site: "https://hfdavidyu.com/",
      tags: [
        "\u7269\u7406"
      ]
    },
    {
      id: "blog-fa0254532581e19c",
      name: "\u6C34\u661F\u6295\u8D44\u7406\u8D22",
      url: "http://mercurychong.blogspot.com/feeds/posts/default",
      site: "https://mercurychong.blogspot.com/",
      tags: [
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-1f5b976e7e3e37dd",
      name: "Mr. PM \u4E0B\u5348\u5148\u751F",
      url: "http://feeds.feedburner.com/pmmustknow",
      site: "https://mrpm.cc/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-68660ec81b91bb5b",
      name: "\u4EBA\u4EBA\u90FD\u662F\u4EA7\u54C1\u7ECF\u7406\u2014\u2014iamsujie",
      url: "http://iamsujie.com/feed/",
      site: "http://iamsujie.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-7dd71b590d0375c9",
      name: "\u8F49\u500B\u5F4E\u65E5\u8A8C",
      url: "http://blog.turn.tw/?feed=rss2",
      site: "https://blog.turn.tw/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-c535e12a7a94af36",
      name: "\u4F59\u679C\u7684\u535A\u5BA2",
      url: "http://feeds.feedburner.com/yuguo",
      site: "https://yuguo.us/",
      tags: [
        "\u7F16\u7A0B",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-23b5f3422307c63f",
      name: "O3noBLOG",
      url: "https://feeds.feedburner.com/othree",
      site: "https://blog.othree.net/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-fdab7cbd76809b36",
      name: "Vivaxy's blog",
      url: "https://vivaxyblog.github.io/atom.xml",
      site: "https://vivaxyblog.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-96b6b832741c21e1",
      name: "Debug\u5BA2\u6808",
      url: "https://blog.debuginn.com/index.xml",
      site: "https://blog.debuginn.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u79D1\u6280",
        "\u7B97\u6CD5",
        "\u8BFB\u4E66",
        "\u667A\u80FD\u5BB6\u5C45",
        "\u968F\u60F3",
        "\u597D\u7269\u5206\u4EAB",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-f337cd2fa3b9f994",
      name: "isaced",
      url: "http://www.isaced.com/index.xml",
      site: "https://www.isaced.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-0646166414fecf1c",
      name: "Jason",
      url: "https://atjason.com/atom.xml",
      site: "https://atjason.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-6afe4687cee0247c",
      name: "forecho \u7684\u72EC\u7ACB\u535A\u5BA2",
      url: "https://blog.forecho.com/atom.xml",
      site: "https://blog.forecho.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7F8E\u80A1\u6295\u8D44",
        "\u8BFB\u4E66",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-37553084787eb6f4",
      name: "Jack Liu\u535A\u5BA2",
      url: "https://www.jack-liu.com/rss.php",
      site: "https://www.jack-liu.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-e343c37b03fe3aa3",
      name: "GeekPlux",
      url: "https://geekplux.com/atom.xml",
      site: "https://geekplux.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-37e3dab267730580",
      name: "\u738B\u5B50\u4EAD\u7684\u535A\u5BA2",
      url: "https://jysperm.me/atom.xml",
      site: "https://jysperm.me/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-16f5d95668b0acf2",
      name: "\u738B\u57A0\u7684\u535A\u5BA2",
      url: "https://rsshub.app/blogs/wangyin",
      site: "https://www.yinwang.org/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-0b2560ae2333b12b",
      name: "\u626F\u6C2E\u96C6",
      url: "http://weiwuhui.com/feed",
      site: "http://weiwuhui.com/",
      tags: [
        "\u521B\u4E1A",
        "\u4EBA\u751F"
      ]
    },
    {
      id: "blog-8704488c666283ba",
      name: "Aiur \xB7 Zellux \u7684\u535A\u5BA2",
      url: "https://blog.yxwang.me/index.xml",
      site: "https://blog.yxwang.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u667A\u80FD\u5BB6\u5C45"
      ]
    },
    {
      id: "blog-fe3062af8502aaf9",
      name: "\u7855\u9F20\u7684\u535A\u5BA2\u7AD9",
      url: "http://lukefan.com/?feed=rss2",
      site: "http://lukefan.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-6de52b58bc01cdf9",
      name: "\u9ED1\xB7\u767D",
      url: "http://blog.xiayf.cn/feeds/rss.xml",
      site: "http://blog.xiayf.cn/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-833ec169fe0988a2",
      name: "\u5C0F\u733F\u5927\u5723",
      url: "https://hufangyun.com/atom.xml",
      site: "https://hufangyun.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-7bb9916b5179c0f8",
      name: "\u56E7\u514B\u65AF \u52FE\u4E09\u80A1\u56DB",
      url: "https://jiongks.name/atom.xml",
      site: "https://jiongks.name/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-29cab3a209aec578",
      name: "\u51B0\u7CD6\u6A59\u5B50",
      url: "http://www.btorange.com/feed",
      site: "http://www.btorange.com/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b30a136ee5983525",
      name: "\u51AF\u5510\u535A\u5BA2",
      url: "http://www.fengtang.com/blog/?feed=rss2",
      site: "http://www.fengtang.com/blog/",
      tags: [
        "\u6587\u5B66"
      ]
    },
    {
      id: "blog-770e12afa803a7d7",
      name: "Lucifr",
      url: "https://lucifr.com/rss/",
      site: "https://lucifr.com/",
      tags: [
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-7dca85d464043b0a",
      name: "\u5F20\u6208\u535A\u5BA2",
      url: "https://zhang.ge/feed",
      site: "https://zhang.ge/",
      tags: [
        "\u7F16\u7A0B",
        "\u8FD0\u7EF4"
      ]
    },
    {
      id: "blog-f2538205afd4539d",
      name: "ChrAlpha \u7684\u5E7B\u60F3\u4E61\uFF08\u535A\u5BA2\uFF09",
      url: "https://blog.ichr.me/atom.xml",
      site: "https://blog.ichr.me/",
      tags: [
        "\u7B14\u8BB0\u672C",
        "\u6280\u672F\u5411",
        "\u7F16\u7A0B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-cf66b0dc2a000e6c",
      name: "\u892A\u58A8\u30FB\u65F6\u95F4\u7BA1\u7406",
      url: "https://www.mifengtd.cn/feed.xml",
      site: "https://www.mifengtd.cn/",
      tags: [
        "\u65F6\u95F4\u7BA1\u7406"
      ]
    },
    {
      id: "blog-e91b7df7f6be3096",
      name: "\u6211\u7231\u81EA\u7136\u8BED\u8A00\u5904\u7406",
      url: "http://www.52nlp.cn/feed",
      site: "https://www.52nlp.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u673A\u5668\u5B66\u4E60"
      ]
    },
    {
      id: "blog-20f51c01876ec8a4",
      name: "\u5510\u5DE7\u7684\u535A\u5BA2",
      url: "https://blog.devtang.com/atom.xml",
      site: "https://blog.devtang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u521B\u4E1A",
        "iOS"
      ]
    },
    {
      id: "blog-08565a3afc930424",
      name: "OneV's Den",
      url: "https://onevcat.com/feed.xml",
      site: "https://onevcat.com/",
      tags: [
        "\u7F16\u7A0B",
        "iOS"
      ]
    },
    {
      id: "blog-c6d2d7ea5945ccb0",
      name: "Garan no dou",
      url: "https://blog.ibireme.com/feed/",
      site: "https://blog.ibireme.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "iOS"
      ]
    },
    {
      id: "blog-28a96967a6a8b940",
      name: "\u53EF\u80FD\u5427",
      url: "http://feeds.kenengba.com/kenengbarss",
      site: "https://kenengba.com/",
      tags: [
        "\u521B\u4E1A"
      ]
    },
    {
      id: "blog-f939d23b59d4a328",
      name: "\u9E1F\u7A9D",
      url: "https://colobu.com/atom.xml",
      site: "https://colobu.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-191164c48d96bf6b",
      name: "libfeihu Blog",
      url: "http://feihu.me/blog/feed.atom",
      site: "https://feihu.me/blog/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-e64d658b4413c0ad",
      name: "Nic Lin's Blog",
      url: "https://blog.niclin.tw/index.xml",
      site: "https://blog.niclin.tw/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-985734313aa25fae",
      name: "Halfrost's Field",
      url: "http://halfrost.com/rss/",
      site: "https://halfrost.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-a2a4d4b2cd3ee361",
      name: "limboy's HQ",
      url: "http://feeds.feedburner.com/lzyy",
      site: "https://limboy.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BBE\u8BA1"
      ]
    },
    {
      id: "blog-b44e3c2f7ba9feb6",
      name: "sunnyxx\u7684\u6280\u672F\u535A\u5BA2",
      url: "http://blog.sunnyxx.com/atom.xml",
      site: "https://blog.sunnyxx.com/",
      tags: [
        "\u7F16\u7A0B",
        "iOS"
      ]
    },
    {
      id: "blog-f26e71c9a60ccf71",
      name: "\u963F\u6BDB\u7684\u86CB\u75BC\u5730",
      url: "https://xiangwangfeng.com/atom.xml",
      site: "https://xiangwangfeng.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-f8afcefe1f653e57",
      name: "Kevin Blog",
      url: "https://blog.kevinzhow.com/feed.xml",
      site: "https://blog.kevinzhow.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u521B\u4E1A"
      ]
    },
    {
      id: "blog-b56f55f3dcaefdbd",
      name: "bang's blog",
      url: "http://blog.cnbang.net/feed/",
      site: "https://blog.cnbang.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-d42298424bef52a0",
      name: "I'm TualatriX",
      url: "http://feeds.feedburner.com/tualatrix",
      site: "https://imtx.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-8c3d52e65495e286",
      name: "Wujunze's Blog",
      url: "https://wujunze.com/index.xml",
      site: "https://wujunze.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u67B6\u6784",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-7c310f0953be3bf5",
      name: "\u591C\u884C\u4EBA",
      url: "https://wwj718.github.io/index.xml",
      site: "https://wwj718.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6559\u80B2",
        "\u968F\u7B14",
        "\u8BD7",
        "\u54F2\u5B66"
      ]
    },
    {
      id: "blog-54ea5eeb608bbcca",
      name: "Est's Blog",
      url: "http://feeds.feedburner.com/initiative",
      site: "https://blog.est.im/",
      tags: [
        "\u7F16\u7A0B",
        "\u521B\u4E1A",
        "\u54F2\u5B66"
      ]
    },
    {
      id: "blog-e7c7410a9b24673e",
      name: "Wiken",
      url: "https://www.hehuapei.com/feed",
      site: "https://www.hehuapei.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-c2cd789b424e7184",
      name: "\u70B8\u88C2\u5FD7",
      url: "https://zh.fyi/rss.xml",
      site: "https://zh.fyi/",
      tags: [
        "\u5355\u8F66",
        "\u65C5\u884C",
        "\u64AD\u5BA2",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-af35afb83af2ac2d",
      name: "kok\u7684\u7B14\u8BB0\u672C",
      url: "https://wocai.de/index.xml/",
      site: "https://wocai.de/",
      tags: [
        "\u7F16\u7A0B",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-f95db1a593ff4b08",
      name: "\u641E\u641E\u9707",
      url: "https://www.wujingquan.com/atom.xml",
      site: "https://www.wujingquan.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-234105e2e8eb7b62",
      name: "Qt\u8FDB\u9636\u4E4B\u8DEF-\u6D9B\u54E5\u7684\u535A\u5BA2",
      url: "https://jaredtao.github.io/atom.xml",
      site: "https://jaredtao.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "Qt"
      ]
    },
    {
      id: "blog-38c9350152e4ab3d",
      name: "Fred Wu's Blog",
      url: "https://persumi.com/u/fredwu/feed/rss",
      site: "https://persumi.com/u/fredwu",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u6444\u5F71",
        "\u8BBE\u8BA1",
        "\u9886\u5BFC",
        "\u6FB3\u6D32"
      ]
    },
    {
      id: "blog-fc1e5e89b442853a",
      name: "ISLAND",
      url: "https://youngxhui.top/index.xml",
      site: "https://youngxhui.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-5bbd718eb463f666",
      name: "\u8D3A\u53F6\u971C\u7684\u6811",
      url: "https://blog.heysh.xyz/feed.xml",
      site: "https://blog.heysh.xyz/",
      tags: [
        "\u5F00\u6E90",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-60c0fbeaebefc072",
      name: "Frytea's Blog",
      url: "https://www.frytea.com/index.xml",
      site: "https://www.frytea.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u9AD8\u6548"
      ]
    },
    {
      id: "blog-e357b00dfa46bda0",
      name: "Mohuishou's Blog",
      url: "https://lailin.xyz/atom.xml",
      site: "https://lailin.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "Go"
      ]
    },
    {
      id: "blog-fdf0a4e4b4014f63",
      name: "\u7B97\u6CD5\u82B1\u56ED",
      url: "https://xiang578.com/atom.xml",
      site: "https://xiang578.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-40179c5051f3163c",
      name: "1A23 Studio",
      url: "https://1a23.com/feed/",
      site: "https://1a23.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BBE\u8BA1",
        "\u97F3\u4E50",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-bf225021e0af606c",
      name: "Jiajun\u7684\u7F16\u7A0B\u968F\u60F3",
      url: "https://jiajunhuang.com/rss",
      site: "https://jiajunhuang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-b25c28d5a06ab10f",
      name: "\u8D3C\u62C9\u6B63\u7ECF\u7684\u6280\u672F\u535A\u5BA2",
      url: "https://stackoverflow.wiki/blog/rss.xml",
      site: "https://www.stackoverflow.wiki/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "Java"
      ]
    },
    {
      id: "blog-a27624ecbe1afb15",
      name: "Lenix Blog",
      url: "https://blog.p2hp.com/feed",
      site: "https://blog.p2hp.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "WEB\u5F00\u53D1"
      ]
    },
    {
      id: "blog-6ecf861535481c47",
      name: "\u897F\u79E6\u516C\u5B50",
      url: "https://www.ixiqin.com/feed/",
      site: "https://www.ixiqin.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-f3c7bf8dd9dc1f9f",
      name: "OnionTalk",
      url: "https://hateonion.me/index.xml",
      site: "https://hateonion.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0179f784ef7c3908",
      name: "Nicksxs's Blog",
      url: "https://nicksxs.me/atom.xml",
      site: "https://nicksxs.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "Java",
        "PHP"
      ]
    },
    {
      id: "blog-51a74e53405a0dd8",
      name: "Allen's Blog",
      url: "https://www.capallen.top/atom.xml",
      site: "https://www.capallen.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6570\u636E\u79D1\u5B66"
      ]
    },
    {
      id: "blog-cd41c7267b93f297",
      name: "\u8C22\u76CA\u8F89",
      url: "http://yihui.name/cn/feed/",
      site: "https://yihui.name/cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u7EDF\u8BA1\u5B66",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-2b117aa309c83520",
      name: "\u6728\u9065\u7684\u7A97\u5B50",
      url: "https://blog.farmostwood.net/feed",
      site: "https://blog.farmostwood.net/",
      tags: [
        "\u6570\u5B66",
        "\u5C0F\u8BF4",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-36951c45b2b9029c",
      name: "\u5362\u660C\u6D77\u7684\u4E2A\u4EBA\u4E3B\u9875",
      url: "https://www.changhai.org/feed.xml",
      site: "https://www.changhai.org/",
      tags: [
        "\u7269\u7406",
        "\u79D1\u666E"
      ]
    },
    {
      id: "blog-f865f992f82c97ce",
      name: "UsubeniFantasy",
      url: "https://ssshooter.com/rss.xml",
      site: "https://ssshooter.com/",
      tags: [
        "\u524D\u7AEF",
        "\u968F\u60F3",
        "\u6E38\u620F",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-bb72fc1d78548edc",
      name: "Alexander D Huang's Blog",
      url: "https://alxddh.github.io/feed.xml",
      site: "https://alxddh.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-f451863227fe105c",
      name: "KAIX.IN",
      url: "https://kaix.in/feed/",
      site: "https://kaix.in/",
      tags: [
        "\u8BFB\u4E66",
        "\u5496\u5561",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-fdcf0479e8c2c656",
      name: "\u671D\u821E",
      url: "https://ii74.com/feed.php",
      site: "https://ii74.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-66d5f3e47d13c46d",
      name: "Matrix67: The Aha Moments",
      url: "http://www.matrix67.com/blog/feed",
      site: "http://www.matrix67.com/blog/",
      tags: [
        "\u6570\u5B66",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-3c9b7d63ceb39900",
      name: "Livid",
      url: "https://livid.v2ex.com/feed.xml",
      site: "https://livid.v2ex.com/",
      tags: [
        "\u521B\u4E1A",
        "\u793E\u533A",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-93ea9707c2d73a76",
      name: "hanjm's Blog",
      url: "https://www.imhanjm.com/atom.xml",
      site: "https://www.imhanjm.com/",
      tags: [
        "\u7F16\u7A0B",
        "GO",
        "Golang",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-8fdd69cad6ab85c4",
      name: "\u8C22\u4E7E\u5764-\u9752\u5357",
      url: "https://www.kingname.info/atom.xml",
      site: "https://www.kingname.info/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "\u722C\u866B"
      ]
    },
    {
      id: "blog-bf7fc6dd139c8b46",
      name: "SEO \u7F51\u7AD9\u4F18\u5316\u53CA\u7F51\u7AD9\u63A8\u5E7F",
      url: "https://seo.g2soft.net/atom.xml",
      site: "https://seo.g2soft.net/",
      tags: [
        "\u641C\u7D22\u5F15\u64CE\u4F18\u5316",
        "\u7F51\u7AD9\u4F18\u5316",
        "\u7F51\u7AD9\u63A8\u5E7F",
        "\u7F51\u7AD9"
      ]
    },
    {
      id: "blog-1fd8d09332aa7e9e",
      name: "\u9AD8\u91D1\u7684\u535A\u5BA2",
      url: "https://igaojin.me/atom.xml",
      site: "https://igaojin.me/",
      tags: [
        "\u7F16\u7A0B",
        "python",
        "\u533A\u5757\u94FE"
      ]
    },
    {
      id: "blog-c7cf275e41312ff7",
      name: "\u81E8\u6C60\u4E0D\u8F1F",
      url: "https://keelii.com/atom.xml",
      site: "https://keelii.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u8F6F\u4EF6\u5F00\u53D1",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-a7d454bb70d676ca",
      name: "\u7280\u5229\u8C46\u7684\u535A\u5BA2",
      url: "https://xilidou.com/atom.xml",
      site: "https://xilidou.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-9a522f58c9904d5b",
      name: "Kuricat's Blog",
      url: "https://kuricat.com/rss",
      site: "https://kuricat.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u4E91\u539F\u751F"
      ]
    },
    {
      id: "blog-ad79549a34b0bdf1",
      name: "Howard Cheung",
      url: "https://h-cheung.gitlab.io/index.xml",
      site: "https://h-cheung.gitlab.io/",
      tags: [
        "\u7B97\u6CD5",
        "Linux",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9ea70d5f49ca13cb",
      name: "\u5EAD\u8BF4",
      url: "https://tingtalk.me/atom.xml",
      site: "https://tingtalk.me/",
      tags: [
        "\u79D1\u6280\u4E92\u8054\u7F51",
        "\u6570\u5B57\u751F\u6D3B",
        "\u5916\u8D38",
        "\u8BBE\u8BA1",
        "\u6392\u7248",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-76f7caf2f112ba72",
      name: "\u9065\u884C Gofurther \u6280\u672F&ML&BC\u535A\u5BA2",
      url: "https://charlesliuyx.github.io/atom.xml",
      site: "https://charlesliuyx.github.io/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u533A\u5757\u94FE",
        "\u7B97\u6CD5",
        "\u5E55\u5E03",
        "Dota2"
      ]
    },
    {
      id: "blog-533aa2c25eaf1d30",
      name: "\u5F20\u51EF\u5F3A\u7684\u535A\u5BA2",
      url: "https://zkqiang.cn/atom.xml",
      site: "https://zkqiang.cn/",
      tags: [
        "Python",
        "\u722C\u866B",
        "Java",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-285d3d4a473799ff",
      name: "xulihang's blog",
      url: "https://blog.xulihang.me/feed/",
      site: "https://blog.xulihang.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u7FFB\u8BD1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-cf776748d3bf5fac",
      name: "\u89C1\u5B57\u5982\u9762",
      url: "https://hiwannz.com/feed",
      site: "https://hiwannz.com/",
      tags: [
        "\u4EA7\u54C1",
        "\u601D\u8003",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8932f3cebbce174a",
      name: "\u628A\u9152\u8BD7\u4EE3\u7801",
      url: "https://102no.com/atom.xml",
      site: "https://102no.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-033f09eb70bd5c4f",
      name: "NotJustCode",
      url: "https://mebtte.com/rss.xml",
      site: "https://mebtte.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-2fd32906bdb76d3c",
      name: "\u6C5F\u8FB9\u7684\u65F1\u9E2D\u5B50",
      url: "https://blog.joouis.com/atom.xml",
      site: "https://blog.joouis.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u65C5\u884C",
        "\u9605\u8BFB",
        "\u62DB\u8058"
      ]
    },
    {
      id: "blog-aec9b6491da7e0d8",
      name: "\u8FFD\u98CE\u4E4B\u5F71",
      url: "https://www.devashen.com/atom.xml",
      site: "https://www.devashen.com/",
      tags: [
        "\u7F16\u7A0B",
        "iOS",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-90dc20012cb73518",
      name: "HansChen \u7684\u535A\u5BA2",
      url: "http://blog.hanschen.site/atom.xml",
      site: "https://blog.hanschen.site/",
      tags: [
        "\u7F16\u7A0B",
        "Android"
      ]
    },
    {
      id: "blog-3a2fdc672989484c",
      name: "IPhysResearch",
      url: "https://iphysresearch.github.io/blog/post/index.xml",
      site: "https://iphysresearch.github.io/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u79D1\u7814",
        "\u7269\u7406",
        "\u5F15\u529B\u6CE2",
        "AI",
        "\u673A\u5668\u5B66\u4E60",
        "\u6DF1\u5EA6\u5B66\u4E60",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-23f68e49f2fe1771",
      name: "Desvl's blog",
      url: "https://desvl.xyz/atom.xml",
      site: "https://desvl.xyz/",
      tags: [
        "\u6570\u5B66"
      ]
    },
    {
      id: "blog-20fd67da840c0553",
      name: "HaoKunT\u7684\u535A\u5BA2",
      url: "https://hkvision.cn/index.xml",
      site: "https://hkvision.cn/",
      tags: [
        "Python",
        "Golang",
        "GIS",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-151e49fb55ca84ed",
      name: "Deepzz's Blog",
      url: "https://deepzz.com/feed",
      site: "https://deepzz.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-393a4c4b4b5f1097",
      name: "lucifer\u7684\u7F51\u7EDC\u535A\u5BA2",
      url: "https://lucifer.ren/blog/atom.xml",
      site: "https://lucifer.ren/blog",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u7B97\u6CD5"
      ]
    },
    {
      id: "blog-d18407c7121e5aa3",
      name: "\u97F3\u89C6\u9891\u5F00\u53D1\u8FDB\u9636",
      url: "https://glumes.com/index.xml",
      site: "https://glumes.com/",
      tags: [
        "\u8F6F\u4EF6\u5F00\u53D1",
        "\u97F3\u89C6\u9891",
        "\u56FE\u5F62\u56FE\u50CF",
        "\u968F\u7B14\u601D\u8003"
      ]
    },
    {
      id: "blog-fafd4c8b2150103a",
      name: "Josherich\u7684\u535A\u5BA2",
      url: "https://www.josherich.me/feed.xml",
      site: "https://www.josherich.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f4c0321ddb4264f6",
      name: "Zhshch`s Blog",
      url: "https://xzhsh.ch/index.xml",
      site: "https://xzhsh.ch/",
      tags: [
        "\u65E5\u5E38",
        "\u5B66\u751F",
        "\u7F16\u7A0B",
        "\u5947\u601D\u5999\u60F3"
      ]
    },
    {
      id: "blog-f8b191a97ca5e6b5",
      name: "FlyingSky's Blog",
      url: "https://blog.fsky7.com/feed",
      site: "https://blog.fsky7.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-2cff566d0782e053",
      name: "\u5DF1\u7F8A\u7684\u68A6",
      url: "https://www.jiyang00.cn/atom.xml",
      site: "https://www.jiyang00.cn/",
      tags: [
        "\u6587\u5B66",
        "\u5C0F\u8BF4"
      ]
    },
    {
      id: "blog-f6f5d764a0461844",
      name: "anran758's blog",
      url: "https://anran758.github.io/blog/atom.xml",
      site: "https://anran758.github.io/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-b87b22385268c9d2",
      name: "\u601D\u6709\u4E91",
      url: "https://www.ioiox.com/feed",
      site: "https://www.ioiox.com/",
      tags: [
        "\u6280\u672F\u6559\u7A0B",
        "\u4E91\u670D\u52A1",
        "\u79C1\u6709\u4E91",
        "\u5B58\u50A8NAS",
        "\u7FA4\u6656\u6280\u5DE7",
        "Synology"
      ]
    },
    {
      id: "blog-fe65c811223015e5",
      name: "\u521D\u7B49\u8A18\u61B6\u9AD4",
      url: "https://axionl.me/index.xml",
      site: "https://axionl.me/",
      tags: [
        "Linux \u4F7F\u7528",
        "\u500B\u4EBA\u96A8\u7B46"
      ]
    },
    {
      id: "blog-43a5b34b952a5f9b",
      name: "\u53EF\u53EF\u6258\u6D77\u6CA1\u6709\u6D77",
      url: "https://darmau.co/zh/article/rss.xml",
      site: "https://darmau.co/zh",
      tags: [
        "\u8BBE\u8BA1",
        "\u524D\u7AEF",
        "\u6444\u5F71",
        "\u751F\u6D3B",
        "\u4EBA\u6587"
      ]
    },
    {
      id: "blog-bfd2596010870a4e",
      name: "\u4E94\u5206\u949F\u5B66\u7B97\u6CD5",
      url: "https://www.cxyxiaowu.com/feed",
      site: "https://www.cxyxiaowu.com/",
      tags: [
        "\u7B97\u6CD5",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-85169e297a110589",
      name: "Tianke Youke",
      url: "https://jyzhu.top/atom.xml",
      site: "https://jyzhu.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u8BD7",
        "\u604B\u7231"
      ]
    },
    {
      id: "blog-3b0c5566198150bc",
      name: "\u7231\u5199\u4EE3\u7801\u7684\u5C0F\u4E66\u7AE5",
      url: "https://zofun.github.io/atom.xml",
      site: "https://zofun.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-42a20d6f04f5c8cd",
      name: "Teach Talk",
      url: "https://www.ttalk.im/rss.xml",
      site: "https://www.ttalk.im/",
      tags: [
        "Web",
        "MQTT",
        "XMPP",
        "RabbitMQ",
        "\u7FFB\u8BD1"
      ]
    },
    {
      id: "blog-3fed2d065e7e6dd3",
      name: "\u9010\u9E7FIT-\u731B\u731B\u5982\u7389",
      url: "https://amonxu.com/atom.xml",
      site: "https://amonxu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u968F\u7B14",
        "\u9B3C\u753B\u5F27"
      ]
    },
    {
      id: "blog-150384502afbf9ef",
      name: "Xiaoi's Blog",
      url: "https://blog.xiaoi.me/feed.xml",
      site: "https://blog.xiaoi.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u6559\u7A0B"
      ]
    },
    {
      id: "blog-c381219a8287a204",
      name: "\u5C0F\u863F\u8514\u4E01",
      url: "http://xlbd.me/rss/",
      site: "https://www.xlbd.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-a643f33f4094f385",
      name: "Realcat",
      url: "https://www.vincentqin.tech/atom.xml",
      site: "https://www.vincentqin.tech/",
      tags: [
        "\u8BA1\u7B97\u673A\u89C6\u89C9",
        "\u7B97\u6CD5",
        "\u601D\u8003",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-75c0bc0845603dbc",
      name: "\u8303\u53F6\u4EAE\u7684\u535A\u5BA2",
      url: "https://leovan.me/cn/index.xml",
      site: "https://leovan.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u6570\u636E\u79D1\u5B66",
        "\u601D\u8003",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-6999904ab188ef17",
      name: "\u81EA\u7531\u4EBA\u7684 BLOG",
      url: "https://ifttl.com/index.xml",
      site: "https://ifttl.com/",
      tags: [
        "\u751F\u6D3B",
        "\u8BFB\u4E66",
        "\u968F\u60F3",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-80ab1a4b1e262e69",
      name: "WEB VIEW",
      url: "https://webview.tech/category/blog/feed/",
      site: "https://webview.tech/",
      tags: [
        "\u6CDB\u79D1\u6280",
        "\u601D\u8003",
        "\u64AD\u5BA2"
      ]
    },
    {
      id: "blog-b570d106673e0661",
      name: "\u540E\u7AEF\u8FDB\u9636",
      url: "https://objcoding.github.io/feed.xml",
      site: "https://objcoding.com/",
      tags: [
        "Java\u3001Golang\u3001\u5206\u5E03\u5F0F\u4E2D\u95F4\u4EF6\u3001WEB\u6846\u67B6\u3001\u670D\u52A1\u6CBB\u7406\u7B49\u7B49"
      ]
    },
    {
      id: "blog-f5c832261388c944",
      name: "Yuexun's Blog",
      url: "https://yuexun.me/rss.xml",
      site: "https://yuexun.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-51f4cc54fedd80d1",
      name: "Panda Home",
      url: "https://old-panda.com/feed/",
      site: "https://old-panda.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4e7b8be449ca2a45",
      name: "\u6E38\u9B42\u535A\u5BA2",
      url: "https://www.iyouhun.com/rss.php",
      site: "https://www.iyouhun.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4ebfc3e2eee56efc",
      name: "\u84DD\u5361",
      url: "https://www.lanka.cn/feed/",
      site: "https://www.lanka.cn/",
      tags: [
        "\u79D1\u6280",
        "\u6570\u7801",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-3c3ea76edaa18f5b",
      name: "\u81EA\u5B66\u8DEF\u6F2B\u6F2B",
      url: "https://blog.fxcdev.com/atom.xml",
      site: "https://blog.fxcdev.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-97388708ebdf8ee5",
      name: "CodeSky",
      url: "https://codesky.me/feed/",
      site: "https://codesky.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u540E\u7AEF",
        "\u8FD0\u7EF4",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-8daddbe6b8392ed2",
      name: "\u7A7A\u4E4B\u9886\u57DF",
      url: "https://xsky.me/atom.xml",
      site: "https://xsky.me/",
      tags: [
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-e744dd35c8c084c6",
      name: "Claude's Blog",
      url: "https://claude-ray.github.io/atom.xml",
      site: "https://claude-ray.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-1f5c5df214815c97",
      name: "Just lepture",
      url: "https://lepture.com/feed.xml",
      site: "https://lepture.com/",
      tags: [
        "\u521B\u4E1A",
        "\u5F00\u6E90",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c3280f32e16aef76",
      name: "Lyric",
      url: "https://quaily.com/lyric/feed/atom",
      site: "https://quaily.com/lyric",
      tags: [
        "\u4EA7\u54C1",
        "\u521B\u4E1A",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-ed65113e2a2a5608",
      name: "\u6851\u5F27\u84EC\u77E2\u5C04\u56DB\u65B9",
      url: "https://iphyer.github.io/feed.xml",
      site: "https://iphyer.github.io/",
      tags: [
        "\u6DF1\u5EA6\u5B66\u4E60",
        "\u79D1\u7814",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-50ae606b41003fa3",
      name: "\u6742\u8D27\u5C4B",
      url: "https://sword.studio/feed/",
      site: "https://sword.studio/",
      tags: [
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-b7412da14056332b",
      name: "\u6C90\u51C9",
      url: "https://blog.lacia.cn/atom.xml",
      site: "https://blog.lacia.cn/",
      tags: [
        "\u7F16\u7A0B",
        "Java"
      ]
    },
    {
      id: "blog-5f995f871f6a6908",
      name: "idealclover",
      url: "https://idealclover.top/feed",
      site: "https://idealclover.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-56001a72fb123c90",
      name: "\u9752\u7A7A\u4E4B\u84DD",
      url: "https://blog.ixk.me/feed",
      site: "https://blog.ixk.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "Web\u5F00\u53D1"
      ]
    },
    {
      id: "blog-8e5a42c33428c76e",
      name: "\u708E\u5FCD\u7684\u535A\u5BA2",
      url: "https://blog.imyan.ren/atom.xml",
      site: "https://blog.imyan.ren/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-d2f92363cb1dcd53",
      name: "\u554A\u54C8\u5475\u55E8\u7684\u535A\u5BA2",
      url: "https://gylidian.js.org/rss2.xml",
      site: "https://gylidian.js.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u5168\u6808",
        "\u4EFB\u5929\u5802",
        "\u4E13\u680F"
      ]
    },
    {
      id: "blog-3a21a4b89f97a522",
      name: "\u9648\u770B\u5DDD\u535A\u5BA2",
      url: "https://kanchuan.com/feed.xml",
      site: "https://kanchuan.com/blog",
      tags: [
        "iOS",
        "\u5F00\u53D1",
        "\u4EA7\u54C1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-45002d82ae975e62",
      name: "\u5D0E\u5F84 \u5176\u955C\u8D75\u5B89\u742A\u7684\u535A\u5BA2",
      url: "http://www.z16388.top/atom.xml",
      site: "http://www.z16388.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6E38\u620F",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-377c4da9173f9a82",
      name: "The Art of Chawye Hsu",
      url: "https://chawyehsu.com/feed/atom.xml",
      site: "https://chawyehsu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6E38\u620F",
        "\u968F\u7B14",
        "\u6742\u8C08"
      ]
    },
    {
      id: "blog-2d19c7b16fc84aa9",
      name: "\u5415\u5C0F\u8363\u7684\u7F51\u5FD7",
      url: "https://mednoter.com/feed.xml",
      site: "https://mednoter.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-dd9f34fc194a0371",
      name: "\u52A0\u83F2\u732B\u7684\u521B\u5BA2\u5DE5\u574A",
      url: "https://gaficat.com/atom.xml",
      site: "https://gaficat.com/",
      tags: [
        "\u7535\u5B50DIY",
        "\u7269\u8054\u7F51",
        "\u751F\u6D3B",
        "\u6280\u672F\u6559\u7A0B",
        "\u94A2\u7434",
        "\u7F51\u7EDC\u5B89\u5168"
      ]
    },
    {
      id: "blog-348d8d1a07974006",
      name: "\u80E1\u6D82\u8BF4",
      url: "https://hutusi.com/feed.xml",
      site: "https://hutusi.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8fea106c4ad20c19",
      name: "\u5F20\u4F73\u5706",
      url: "http://blog.jiayuanzhang.com/index.xml",
      site: "https://jiayuanzhang.com/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "Web"
      ]
    },
    {
      id: "blog-7d6694d1acbb993e",
      name: "\u6731\u53CC\u5370",
      url: "https://www.zsythink.net/feed/",
      site: "https://www.zsythink.net/",
      tags: [
        "\u8FD0\u7EF4",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-20d216ba06ae27e1",
      name: "HUHUHANG",
      url: "https://huhuhang.com/feed",
      site: "https://huhuhang.com/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u5E94\u7528\u63A8\u8350",
        "\u624B\u673A\u6444\u5F71"
      ]
    },
    {
      id: "blog-e917721610a29e9d",
      name: "\u5C0F\u660E\u660Es \xE0 domicile",
      url: "https://www.dongwm.com/atom.xml",
      site: "https://www.dongwm.com/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "k8s",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-27de75be13582b9a",
      name: "LFhacks.com",
      url: "https://www.lfhacks.com/rss/",
      site: "https://www.lfhacks.com/",
      tags: [
        "\u65E5\u5FD7",
        "\u6D4B\u8BD5",
        "\u6570\u5B66"
      ]
    },
    {
      id: "blog-76fd607b53a9a56c",
      name: "oldj's blog",
      url: "https://oldj.net/feed",
      site: "https://oldj.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u5199\u4F5C",
        "\u4EE5\u53CA\u6D82\u9E26"
      ]
    },
    {
      id: "blog-f75293e15e782440",
      name: "Yiran's Blog",
      url: "https://zdyxry.github.io/atom.xml",
      site: "https://zdyxry.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "Linux"
      ]
    },
    {
      id: "blog-d1c5136b1e279133",
      name: "\u4E09\u7701\u543E\u8EAB\u4E36\u4E36",
      url: "https://blog.guowenfh.com/atom.xml",
      site: "https://blog.guowenfh.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-dd7d154239b0a5fe",
      name: "\u56DE\u672A\u89C6\u6212",
      url: "https://huiweishijie.com/feed.xml",
      site: "https://huiweishijie.com/",
      tags: [
        "\u8BBE\u8BA1",
        "\u8BFB\u4E66",
        "\u65E5\u8BB0"
      ]
    },
    {
      id: "blog-68f5e60ba215a736",
      name: "ITBOB'S BLOG",
      url: "https://www.itbob.cn/atom.xml",
      site: "https://www.itbob.cn/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "\u722C\u866B",
        "\u6570\u636E\u5206\u6790"
      ]
    },
    {
      id: "blog-d9280314e61a4203",
      name: "\u8001\u9AD8\u7684\u535A\u5BA2",
      url: "https://blog.mute-g.com/index.xml",
      site: "https://blog.mute-g.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-6485ec63ee4025ee",
      name: "CallMeSoul",
      url: "https://callmesoul.cn/rss.xml",
      site: "https://callmesoul.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-65e38a140b5cf256",
      name: "\u9F9A\u6210\u535A\u5BA2",
      url: "https://laogongshuo.com/feed",
      site: "https://laogongshuo.com/",
      tags: [
        "\u968F\u60F3",
        "\u7F16\u7A0B",
        "\u54F2\u5B66",
        "\u7ECF\u6D4E\u5B66"
      ]
    },
    {
      id: "blog-1d4c33d20f258cd3",
      name: "Seven's blog",
      url: "https://blog.diqigan.cn/atom.xml",
      site: "https://blog.diqigan.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "Geek",
        "Java",
        "Linux"
      ]
    },
    {
      id: "blog-60e278f8c73ef8b7",
      name: "\u6728\u571F\u91D1\u738B\u53EF",
      url: "https://kinnoukabokudo.com/feed",
      site: "https://kinnoukabokudo.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4dd08cacf8a2463c",
      name: "\u6CBB\u90E8\u5C11\u8F85",
      url: "https://www.codewoody.com/atom.xml",
      site: "https://www.codewoody.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u65B0\u95FB"
      ]
    },
    {
      id: "blog-9c603d7244c03ceb",
      name: "CRIMX Blog",
      url: "https://blog.crimx.com/rss.xml",
      site: "https://blog.crimx.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u5F00\u6E90",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-288b15f238095021",
      name: "\u5C0F\u975E\u7684\u7269\u7406\u5C0F\u7AD9",
      url: "https://xiaophy.com/feed.xml",
      site: "https://xiaophy.com/",
      tags: [
        "\u7269\u7406",
        "\u5F00\u653E\u79D1\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0cf1e86d5ab96b2f",
      name: "Michael\u7FD4",
      url: "https://michael728.github.io/atom.xml",
      site: "https://michael728.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "DevOps",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ab324d7aa380df02",
      name: "Dosk \u6280\u672F\u7AD9",
      url: "https://dosk.win/feed.xml",
      site: "https://dosk.win/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "C++"
      ]
    },
    {
      id: "blog-16db9e923109dad2",
      name: "Lu Shuyu",
      url: "https://blog.lushuyu.site/feed/",
      site: "https://blog.lushuyu.site/",
      tags: [
        "\u7F16\u7A0B",
        "OI",
        "\u968F\u7B14",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-00464e19be0e959e",
      name: "Xieisabug",
      url: "https://www.xiejingyang.com/feed/",
      site: "https://www.xiejingyang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u521B\u610F"
      ]
    },
    {
      id: "blog-d282470aaadffce1",
      name: "\u90D1\u6CFD\u946B\u7684\u535A\u5BA2",
      url: "https://zhengzexin.com/feed/",
      site: "https://zhengzexin.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u7269\u4FE1\u606F\u5B66",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-bfec11696518c0f6",
      name: "\u8F76\u54E5\u535A\u5BA2",
      url: "https://www.wyr.me/rss.xml",
      site: "https://www.wyr.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u5168\u6808",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-50baacc6123a5e95",
      name: "\u6E05\u7AF9\u8336\u9986\u535A\u5BA2",
      url: "https://blog.vadxq.com/atom.xml",
      site: "https://blog.vadxq.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u5168\u6808",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-d667eda9358732e2",
      name: "YeungYeah \u7684\u4E71\u5199\u5730",
      url: "http://scottyeung.top/atom.xml",
      site: "https://scottyeung.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u968F\u7B14",
        "\u7384\u5B66"
      ]
    },
    {
      id: "blog-514ccd26ad2733c6",
      name: "LarsCheng",
      url: "https://www.larscheng.com/atom.xml",
      site: "https://www.larscheng.com/",
      tags: [
        "\u7F16\u7A0B",
        "Java",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-cac85ff1db0b1cf1",
      name: "Origin",
      url: "https://blog.singee.me/atom.xml",
      site: "https://blog.singee.me/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-aa93c645a5c422c1",
      name: "Bryan's Blog",
      url: "https://articles.singee.me/feed/xml",
      site: "https://articles.singee.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u5168\u6808",
        "Go",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-b4a14695af1a5075",
      name: "\u7801\u5FD7",
      url: "https://mazhuang.org/feed.xml",
      site: "https://mazhuang.org/",
      tags: [
        "\u7F16\u7A0B",
        "Java",
        "Android"
      ]
    },
    {
      id: "blog-918c7fc3e3df7ad4",
      name: "\u5317\u95E8\u6E05\u71D5",
      url: "https://www.bmqy.net/feed.xml",
      site: "https://www.bmqy.net/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-4a5f19f8d8760c78",
      name: "Joe's Blog",
      url: "https://hijiangtao.github.io/feed.xml",
      site: "https://hijiangtao.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-1f68e32aa8838e17",
      name: "Yuechuan Blog",
      url: "https://yuechuanx.top/atom.xml",
      site: "https://yuechuanx.top/",
      tags: [
        "\u7F16\u7A0B",
        "DevOps",
        "Automation"
      ]
    },
    {
      id: "blog-0f4a531ff95f4467",
      name: "\u7D20\u751F",
      url: "http://z.arlmy.me/atom.xml",
      site: "https://z.arlmy.me/",
      tags: [
        "\u968F\u7B14",
        "\u5199\u4F5C",
        "\u65C5\u884C",
        "\u65E5\u5E38",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-6b7bf8819d5b9d5c",
      name: "\u7EF4\u57FA\u840C",
      url: "https://www.wikimoe.com/rss.php",
      site: "https://www.wikimoe.com/",
      tags: [
        "\u52A8\u753B",
        "\u6F2B\u753B",
        "\u6E38\u620F",
        "\u65E5\u5E38",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-96521b4ab7a5057e",
      name: "strongwong's Blog",
      url: "https://blog.strongwong.top/atom.xml",
      site: "https://blog.strongwong.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5D4C\u5165\u5F0F",
        "ASIC",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-723a02abb420b4f6",
      name: "\u4FDD\u7F57\u7684\u5C0F\u5B87\u5B99",
      url: "https://paugram.com/feed",
      site: "https://paugram.com/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u524D\u7AEF",
        "\u52A8\u6F2B",
        "\u6570\u7801"
      ]
    },
    {
      id: "blog-5b826e5a77e242bc",
      name: "typeblog",
      url: "https://typeblog.net/rss/",
      site: "https://typeblog.net/",
      tags: [
        "Linux",
        "\u9690\u79C1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ac46da0eb01d5b10",
      name: "HuoJu's BLOG",
      url: "https://jhuo.ca/index.xml",
      site: "https://jhuo.ca/",
      tags: [
        "\u9690\u79C1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-5810c2d742a97f66",
      name: "MikeoPerfect's Diary",
      url: "http://blog.mikeoperfect.com/atom.xml",
      site: "https://blog.mikeoperfect.com/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5FD7"
      ]
    },
    {
      id: "blog-5f7af4472d7ce976",
      name: "\u6A59\u5149\u7B14\u8BB0",
      url: "https://www.kai666666.top/atom.xml",
      site: "https://www.kai666666.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u7B14\u8BB0",
        "\u8FD0\u52A8"
      ]
    },
    {
      id: "blog-0fbf017b28e14260",
      name: "Mobility",
      url: "http://lichuanyang.top/atom.xml",
      site: "https://lichuanyang.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "java"
      ]
    },
    {
      id: "blog-fda92d05b2a62935",
      name: "not LSD",
      url: "https://notlsd.github.io/atom.xml",
      site: "https://notlsd.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6E38\u620F\u8BBE\u8BA1",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-a1e7007ac1db274d",
      name: "\u5931\u7720\u6D77\u5CE1",
      url: "https://blog.imalan.cn/feed.xml",
      site: "https://blog.imalan.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u4E8C\u6B21\u5143",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-bb6b5464362a27f5",
      name: "DuyaoSS",
      url: "https://www.duyaoss.com/feed/",
      site: "https://www.duyaoss.com/",
      tags: [
        "SS",
        "SSR"
      ]
    },
    {
      id: "blog-8ccc78c03371cd68",
      name: "\u6728\u5B50",
      url: "https://blog.k8s.li/atom.xml",
      site: "https://blog.k8s.li/",
      tags: [
        "Linux",
        "\u79D1\u5B66\u4E0A\u7F51",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u8FD0\u7EF4",
        "\u9690\u79C1",
        "android"
      ]
    },
    {
      id: "blog-9c827581efe52ebf",
      name: "wuxinhua's Blog",
      url: "https://wuxinhua.com/atom.xml",
      site: "https://wuxinhua.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-c6e2d635ae279299",
      name: "\u9759\u304B\u306A\u68EE",
      url: "https://innei.ren/feed",
      site: "https://innei.ren/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u524D\u7AEF",
        "\u52A8\u6F2B"
      ]
    },
    {
      id: "blog-080b5ee8aadea69a",
      name: "\u571F\u6728\u575B\u5B50",
      url: "https://tumutanzi.com/feed",
      site: "https://tumutanzi.com/",
      tags: [
        "\u79D1\u7814\u5B66\u4E60",
        "\u793E\u4F1A\u4EBA\u6587",
        "\u4FE1\u606F\u6280\u672F",
        "\u56FD\u5916\u89C1\u95FB"
      ]
    },
    {
      id: "blog-e8c249e5e6a6d739",
      name: "seisamuse",
      url: "https://www.seis-jun.xyz/atom.xml",
      site: "https://seis-jun.xyz/",
      tags: [
        "\u79D1\u7814",
        "\u5B66\u4E60",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-ab51a6d5e4aa5504",
      name: "\u722A\u54C7\u5802",
      url: "https://www.javatang.com/feed",
      site: "https://www.javatang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-c596fb3388eb45a3",
      name: "\u6697\u65E0\u5929\u65E5",
      url: "https://www.lujun9972.win/rss.xml",
      site: "https://www.lujun9972.win/",
      tags: [
        "Emacs",
        "Linux"
      ]
    },
    {
      id: "blog-c0274fa6af6aaff4",
      name: "Jacky's Blog",
      url: "https://jw1.dev/atom.xml",
      site: "https://jw1.dev/",
      tags: [
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-b3c6bb4d29f1f5e0",
      name: "\u738B\u6B23\u7684\u535A\u5BA2",
      url: "https://wangxin.io/atom.xml",
      site: "https://wangxin.io/",
      tags: [
        "\u540E\u7AEF",
        "\u5F00\u6E90",
        "RPC",
        "\u5FAE\u670D\u52A1"
      ]
    },
    {
      id: "blog-f81c3e70465442a1",
      name: "Jartto's Blog",
      url: "http://jartto.wang/atom.xml",
      site: "http://jartto.wang/",
      tags: [
        "\u524D\u7AEF",
        "\u67B6\u6784",
        "\u4EBA\u5DE5\u667A\u80FD"
      ]
    },
    {
      id: "blog-010630d2d9e7309d",
      name: "ScarSu\u7684\u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://www.scarsu.com/atom.xml",
      site: "https://www.scarsu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-6d4aa90eb2ce3fd6",
      name: "Lucien's Blog",
      url: "https://blog.lucien.ink/feed/",
      site: "https://blog.lucien.ink/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u540E\u7AEF",
        "ACM",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-b6e2dba2cc85bcbf",
      name: "\u62AB\u8428\u76D2\u7684\u535A\u5BA2",
      url: "https://blog.pushihao.com/atom.xml",
      site: "https://blog.pushihao.com/",
      tags: [
        "\u7F16\u7A0B",
        "AI",
        "\u5168\u6808",
        "\u601D\u8003",
        "\u7B14\u8BB0",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8d457aa3e159c244",
      name: "TonyHe \u7684\u535A\u5BA2",
      url: "https://www.ouorz.com/feed",
      site: "https://www.ouorz.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u524D\u7AEF",
        "\u7B14\u8BB0",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-dc63e10f66f56d63",
      name: "\u683C\u7269\u81F4\u77E5",
      url: "https://liqiang.io/atom.xml",
      site: "https://liqiang.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u53F0",
        "Go",
        "Kubernetes",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-fcf925887fb41d05",
      name: "\u9EC4\u7426\u96F2\u7684\u535A\u5BA2",
      url: "https://knightyun.github.io/feed.xml",
      site: "https://knightyun.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "Linux",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-51b911a262d5da72",
      name: "\u9633\u5FD7\u5E73\u7684\u7F51\u5FD7",
      url: "https://www.yangzhiping.com/feed.xml",
      site: "https://www.yangzhiping.com/",
      tags: [
        "\u8BA4\u77E5\u79D1\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-d3fa90ca44b78fe2",
      name: "\u9648\u534E",
      url: "https://www.chen.fun/index.xml",
      site: "https://www.chen.fun/",
      tags: [
        "\u7269\u7406",
        "\u79D1\u7814",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-26fc1440f9d006ac",
      name: "Chores",
      url: "https://raincorn.top/feed/",
      site: "https://raincorn.top/",
      tags: [
        "\u8BA1\u7B97\u673A",
        "\u7F51\u7EDC",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-878b663ac6a24906",
      name: "\u987E\u5B87\u7684\u7814\u4E60\u7B14\u8BB0",
      url: "https://www.guyu.me/posts/index.xml",
      site: "https://www.guyu.me/posts/",
      tags: [
        "\u7F16\u7A0B",
        "\u5FAE\u670D\u52A1",
        "DevOps",
        "\u7814\u53D1\u6548\u80FD",
        "\u7814\u53D1\u4F53\u7CFB",
        "\u4E91\u8BA1\u7B97"
      ]
    },
    {
      id: "blog-2057f0239edfa56f",
      name: "\u5C0F\u718A\u5199\u5B57\u7684\u5730\u65B9",
      url: "https://blog.skrskrskrskr.com/atom.xml",
      site: "https://blog.skrskrskrskr.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-468387d23182071c",
      name: "\u7F16\u7A0B\u6C89\u601D\u5F55",
      url: "https://www.cyhone.com/atom.xml",
      site: "https://www.cyhone.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-66160679a0916eb0",
      name: "LiesAuer's Blog",
      url: "https://www.liesauer.net/blog/feed/",
      site: "https://www.liesauer.net/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-e42a3230b7bbfb8e",
      name: "Blog of Music",
      url: "http://www.blogofmusic.com/feed",
      site: "https://www.blogofmusic.com/",
      tags: [
        "\u97F3\u4E50",
        "\u97F3\u4E50\u63A8\u8350",
        "\u97F3\u4E50\u6587\u5316"
      ]
    },
    {
      id: "blog-49256183b3be61fc",
      name: "Beyond the Void",
      url: "https://www.byvoid.com/feed",
      site: "https://www.byvoid.com/",
      tags: [
        "\u8BED\u8A00\u5B66",
        "\u7ECF\u6D4E\u5B66",
        "\u4FE1\u606F\u5B66\u7ADE\u8D5B/ACM\u7ECF\u9A8C",
        "\u7B97\u6CD5\u8BB2\u89E3",
        "\u6280\u672F\u77E5\u8BC6",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9115c269d8b187c7",
      name: "Yi's blog",
      url: "https://wangyi.ai/atom.xml",
      site: "https://wangyi.ai/",
      tags: [
        "C++",
        "LeetCode",
        "Python",
        "iOS",
        "\u5DE5\u5177\u6D3B\u7528",
        "\u8BD1\u6587",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f2fe842bf873f331",
      name: "1 Byte",
      url: "https://1byte.io/rss.xml",
      site: "https://1byte.io/",
      tags: [
        "\u521B\u4E1A",
        "\u6295\u8D44",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-60bbc97c8d8f0f2e",
      name: "Inevitable",
      url: "https://www.inevitable.tech/atom.xml",
      site: "https://www.inevitable.tech/",
      tags: [
        "\u5927\u5B66",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-1d016b12fa51096b",
      name: "BMPI",
      url: "https://www.bmpi.dev/index.xml",
      site: "https://www.bmpi.dev/",
      tags: [
        "Learn",
        "Dev",
        "Trade"
      ]
    },
    {
      id: "blog-a5f966b7addc4ab6",
      name: "61's life",
      url: "https://61.life/feed.xml",
      site: "https://61.life/",
      tags: [
        "\u521B\u4E1A",
        "\u7BA1\u7406",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-072710b3a5147cdf",
      name: "Power's Wiki",
      url: "https://wiki-power.com/feed_rss_updated.xml",
      site: "https://wiki-power.com/",
      tags: [
        "\u786C\u4EF6",
        "\u7F16\u7A0B",
        "\u751F\u6D3B\u65B9\u5F0F",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-1e3c4c3ec52c9727",
      name: "\u77AC\u95F4 Press",
      url: "https://tripper.press/atom.xml",
      site: "https://tripper.press/",
      tags: [
        "\u6444\u5F71",
        "\u6587\u5316\u4EA7\u4E1A",
        "\u65B0\u5A92\u4F53"
      ]
    },
    {
      id: "blog-0f0675d954f81a34",
      name: "\u672A\u77E5\u7684\u4E16\u754C",
      url: "http://lulalap.com/atom.xml",
      site: "http://lulalap.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-d9a5290c8b058368",
      name: "shingle's blog",
      url: "https://shingle.me/index.xml",
      site: "https://shingle.me/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f56fe05fe69fc5d3",
      name: "@Lenciel",
      url: "https://lenciel.com/feed.xml",
      site: "https://lenciel.com/",
      tags: [
        "\u6280\u672F",
        "\u7BA1\u7406",
        "\u521B\u4E1A",
        "\u5439\u6C34"
      ]
    },
    {
      id: "blog-b62257ce3c26980a",
      name: "M-x Chris-An-Emacser",
      url: "https://chriszheng.science/atom.xml",
      site: "https://chriszheng.science/",
      tags: [
        "\u968F\u7B14",
        "Emacs"
      ]
    },
    {
      id: "blog-142a80726d5d72af",
      name: "\u7B2C\u4E03\u661F\u5C18\u7684\u72EC\u7ACB\u535A\u5BA2",
      url: "https://blog.star7th.com/feed",
      site: "https://blog.star7th.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u6280\u672F\u4EBA\u751F"
      ]
    },
    {
      id: "blog-12fd20a567003e9c",
      name: "Chino's Workspace",
      url: "https://chinomars.github.io/atom.xml",
      site: "https://chinomars.github.io/",
      tags: [
        "\u7F16\u8BD1\u5668",
        "\u7F16\u7A0B",
        "\u7BA1\u7406"
      ]
    },
    {
      id: "blog-e8fea68a68d8df0a",
      name: "chattymoney(\u8DDF\u6211\u4E00\u8D77\u6765\u8C08\u94B1)",
      url: "https://chattymoney.com/feed/",
      site: "https://chattymoney.com/",
      tags: [
        "\u7406\u8D22"
      ]
    },
    {
      id: "blog-8155d04faac4059b",
      name: "TCPGNL",
      url: "https://tcpgnl.com/feed/",
      site: "https://tcpgnl.com/",
      tags: [
        "\u8BA4\u77E5",
        "\u7F16\u7A0B",
        "\u968F\u60F3",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-054b30288f5a58f3",
      name: "weirane's blog",
      url: "https://weirane.github.io/feed.xml",
      site: "https://weirane.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "Linux",
        "Rust"
      ]
    },
    {
      id: "blog-4479341ac2c69e62",
      name: "Joway's Blog",
      url: "https://blog.joway.io/index.xml",
      site: "https://blog.joway.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u65C5\u884C",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-59214f0e8a79de75",
      name: "Mayx\u7684\u535A\u5BA2",
      url: "https://mabbs.github.io/atom.xml",
      site: "https://mabbs.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-d9e327f8d1291c3c",
      name: "Rapiz's Blog",
      url: "https://rapiz.me/atom.xml",
      site: "https://rapiz.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-dbb6ee285410475e",
      name: "Ground Oddity",
      url: "http://idle.systems/atom.xml",
      site: "http://idle.systems/",
      tags: [
        "\u7F16\u7A0B",
        "\u65C5\u884C",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-dd77e2bc468a31ef",
      name: "\u59EC\u6D9B\u7684\u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://www.jitao.tech/rss.xml",
      site: "https://www.jitao.tech/",
      tags: [
        "\u79D1\u6280",
        "\u5168\u6808",
        "\u7B14\u8BB0",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-106511c832fa66da",
      name: "\u6570\u5B57\u79FB\u6C11\u535A\u5BA2",
      url: "https://blog.shuziyimin.org/feed",
      site: "https://blog.shuziyimin.org/",
      tags: [
        "\u6570\u5B57\u79FB\u6C11",
        "\u751F\u6D3B\u65B9\u5F0F",
        "\u82F1\u8BED"
      ]
    },
    {
      id: "blog-065afdbc047aca73",
      name: "Bob Jiang's Blog",
      url: "https://www.bobjiang.com/index.xml",
      site: "https://www.bobjiang.com/",
      tags: [
        "\u654F\u6377",
        "Scrum",
        "\u9AD8\u6548\u80FD\u7EC4\u7EC7",
        "\u4E2A\u4EBA\u6210\u957F"
      ]
    },
    {
      id: "blog-db85f6fd4ad90cfc",
      name: "\u6E05\u8A00",
      url: "https://plausistory.blog/feed/",
      site: "https://plausistory.blog/",
      tags: [
        "\u4EBA\u6587",
        "\u6E05\u53F2\u7814\u7A76",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-ef833a8df661afe3",
      name: "\u51C9\u5929\u5BA2\u6808",
      url: "https://earture.org/atom.xml",
      site: "https://earture.org/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-b1ab899ab5b22864",
      name: "\u8FD1\u89C6\u773C\u901B\u535A\u5BA2",
      url: "https://blog.9hz.club/feed/",
      site: "https://blog.9hz.club/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-b3d39e2a69e8e907",
      name: "\u5F71\u7559",
      url: "https://leftshadow.com/?call_custom_simple_rss=1&csrp_cat=11",
      site: "https://leftshadow.com/",
      tags: [
        "\u8BFB\u4E66",
        "\u5FF5\u7ECF"
      ]
    },
    {
      id: "blog-c0e524fda00bcdaf",
      name: "wzyboy's blog",
      url: "https://wzyboy.im/feed.xml",
      site: "https://wzyboy.im/",
      tags: [
        "\u79D1\u6280",
        "\u8FD0\u7EF4",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ba3d7b8f874aaf21",
      name: "beyond stars",
      url: "https://beyondstars.xyz/api/feeds/atom",
      site: "https://beyondstars.xyz/",
      tags: [
        "\u63A2\u7D22",
        "\u601D\u8003",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-ce13fbce9bf1f9fe",
      name: "iPotato",
      url: "https://ipotato.me/feed",
      site: "https://ipotato.me/",
      tags: [
        "\u6280\u672F",
        "\u601D\u8003",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-b942ff6758c017a0",
      name: "\u4E09\u5E1B\u7684\u4E16\u754C",
      url: "https://blog.vvzero.com/atom.xml",
      site: "https://blog.vvzero.com/",
      tags: [
        "\u8F6F\u786C\u4EF6\u5168\u6808\u5F00\u53D1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-6a63a60e2190d1d0",
      name: "HCLonely",
      url: "https://blog.hclonely.com/atom.xml",
      site: "https://blog.hclonely.com/",
      tags: [
        "\u524D\u7AEF",
        "\u4E8C\u6B21\u5143",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-86b0885ec0f057bc",
      name: "\u6A35\u592B\u7684\u5C0F\u7AD9",
      url: "https://geofftools.cn/blog/atom.xml",
      site: "https://geofftools.cn/blog/",
      tags: [
        "\u7F16\u7A0B",
        "Swift",
        "Python"
      ]
    },
    {
      id: "blog-1e537306467833ff",
      name: "\u7535\u6CE2\u969C\u5BB3",
      url: "https://www.sund.site/index.xml",
      site: "https://sund.site/",
      tags: [
        "\u6570\u5B57\u751F\u6D3B",
        "\u6587\u5316",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-252db6e0d38cbce9",
      name: "\u4E00\u4E2A\u574F\u6389\u7684\u756A\u8304",
      url: "https://tomotoes.com/blog/atom.xml",
      site: "https://tomotoes.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-cc6d108b362b21ca",
      name: "DHTalk's Blog",
      url: "https://zhangdinghao.cn/atom.xml",
      site: "https://zhangdinghao.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u9605\u8BFB",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-eefafe1d5c6d1ab3",
      name: "shwei's blog",
      url: "http://weisenhui.top/atom.xml",
      site: "http://weisenhui.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-574f61ef29d6ab0c",
      name: "MiaoTony's Blog",
      url: "https://miaotony.xyz/atom.xml",
      site: "https://miaotony.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6298\u817E",
        "\u751F\u6D3B",
        "EE"
      ]
    },
    {
      id: "blog-8e6c623ca054bf0e",
      name: "ryank231231.blog",
      url: "https://ryank231231.top/feed/",
      site: "https://ryank231231.top/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-3b283625c87dd3db",
      name: "RivenNero's Studio",
      url: "https://rivennero.com/atom.xml",
      site: "https://rivennero.com/",
      tags: [
        "\u8BA1\u7B97\u673A",
        "\u79D1\u6280",
        "\u751F\u6D3B",
        "\u52A8\u6F2B"
      ]
    },
    {
      id: "blog-aabb7cdc5d0ee2b8",
      name: "\u6398\u5893\u4EBA\u7684\u5C0F\u94F2\u5B50",
      url: "https://juemuren4449.com/atom.xml",
      site: "https://juemuren4449.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5FAE\u4FE1",
        "\u652F\u4ED8",
        "\u6548\u7387"
      ]
    },
    {
      id: "blog-0fdab2fa17279fff",
      name: "Hwchiu Learning Note",
      url: "https://hwchiu.com/atom.xml",
      site: "https://hwchiu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "Kubernetes",
        "Linux",
        "Networking"
      ]
    },
    {
      id: "blog-bcd8bd84eb1449e6",
      name: "JieJiSS' Blog",
      url: "https://blog.jiejiss.com/atom.xml",
      site: "https://blog.jiejiss.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B97\u6CD5",
        "\u5BC6\u7801\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-85c7256c513d8dc2",
      name: "the wandering potato \u51FA\u904A\u7684\u571F\u8C46",
      url: "https://thewanderingpotato.github.io/feed.xml",
      site: "https://thewanderingpotato.github.io/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-e5ab98a705794ba8",
      name: "\u5C0F\u7092\u8089",
      url: "https://jicki.cn/index.xml",
      site: "https://jicki.cn/",
      tags: [
        "Kubernetes",
        "\u8FD0\u7EF4",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-742c028712696ac8",
      name: "\u9038\u6587\u7B14\u8BB0EvenNotes",
      url: "https://www.evennotes.cn/atom.xml",
      site: "https://www.evennotes.cn/",
      tags: [
        "\u65F6\u653F",
        "\u54F2\u5B66",
        "\u5386\u53F2"
      ]
    },
    {
      id: "blog-6c404285e3ddfa73",
      name: "\u6851\u6CB3\u4E00\u6986",
      url: "https://justpic.org/index.xml",
      site: "https://justpic.org/",
      tags: [
        "\u4EE3\u7801",
        "\u5DE5\u5177",
        "\u9605\u8BFB",
        "\u6587\u7AE0"
      ]
    },
    {
      id: "blog-6e48b98bacadf0df",
      name: "Tinyfool\u7684\u4E2D\u6587Blog",
      url: "https://codechina.org/feed/",
      site: "https://codechina.org/",
      tags: [
        "\u4EE3\u7801",
        "\u8BFB\u4E66",
        "\u5386\u53F2",
        "\u7ECF\u6D4E"
      ]
    },
    {
      id: "blog-54b6bcf06f751b8e",
      name: "Muyun\u7684\u6742\u8C08",
      url: "https://muyun.work/feed/",
      site: "https://muyun.work/",
      tags: [
        "\u79D1\u6280",
        "\u751F\u6D3B",
        "\u7B97\u6CD5",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-77bf5180672c0618",
      name: "\u741A\u81F4\u8FDC",
      url: "https://wineso.me/index.xml",
      site: "https://wineso.me/blog",
      tags: [
        "\u7F16\u7A0B",
        "\u81EA\u7531\u804C\u4E1A",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-1767d2f30b193756",
      name: "\u8001\u5F20\u8BF4\u601D\u8DEF",
      url: "https://www.aceact.com/feed/",
      site: "https://www.aceact.com/",
      tags: [
        "\u9879\u76EE\u7BA1\u7406"
      ]
    },
    {
      id: "blog-a9b59439bcb74b90",
      name: "\u4E8C\u4E2B\u8BB2\u68B5",
      url: "https://wiki.eryajf.net/rss.xml",
      site: "https://wiki.eryajf.net/",
      tags: [
        "\u8FD0\u7EF4",
        "\u601D\u7D22",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-80d0769d0d36814f",
      name: "Wulu's Blog",
      url: "https://wulu.zone/feed/post.xml",
      site: "https://wulu.zone/",
      tags: [
        "\u7B14\u8BB0",
        "\u7ECF\u9A8C\u5206\u4EAB",
        "\u5B66\u4E60",
        "\u6559\u80B2"
      ]
    },
    {
      id: "blog-373b4e4903588322",
      name: "RAIS",
      url: "https://ai.renyuzhuo.cn/atom.xml",
      site: "https://ai.renyuzhuo.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u4EBA\u5DE5\u667A\u80FD",
        "\u6DF1\u5EA6\u5B66\u4E60"
      ]
    },
    {
      id: "blog-987b6e853fff3177",
      name: "L1Yu's Blog - \u84DD\u8272\u7684\u535A\u5BA2",
      url: "https://www.l1yu.com/feed/feed.xml",
      site: "https://www.l1yu.com/",
      tags: [
        "\u6280\u672F",
        "\u6298\u817E",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-99e02ecde458ae87",
      name: "\u91CE\u751F\u7A0B\u5E8F\u7334\u5B50",
      url: "https://ljason.cn/atom.xml",
      site: "https://ljason.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6298\u817E",
        "\u7FFB\u8BD1"
      ]
    },
    {
      id: "blog-12a12ebde871c27b",
      name: "\u4E0D\u5410\u4E0D\u5FEB",
      url: "https://mianao.info/atom.xml",
      site: "https://mianao.info/",
      tags: [
        "\u751F\u6D3B",
        "\u786C\u4EF6",
        "\u6559\u7A0B",
        "DIY"
      ]
    },
    {
      id: "blog-e77f8f4ac8e6d6d4",
      name: "\u6D77\u5E03\u91CC\u5929\u4E95",
      url: "https://blog.feimind.xyz/feed.xml",
      site: "https://blog.feimind.xyz/",
      tags: [
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-101ecade312a5a74",
      name: "Jay Zangwill\u7684\u535A\u5BA2",
      url: "https://jayzangwill.github.io/blog/atom.xml",
      site: "https://jayzangwill.github.io/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-e5795c6d62623fca",
      name: "Dawner",
      url: "https://dawner.top/atom.xml",
      site: "https://dawner.top/",
      tags: [
        "\u751F\u6D3B",
        "\u6587\u5B66",
        "\u827A\u672F",
        "\u54F2\u5B66"
      ]
    },
    {
      id: "blog-5a95fa14ebe037a1",
      name: "\u6DAF\u4F59",
      url: "https://yanhang.me/index.xml",
      site: "https://yanhang.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-8689a021c075f642",
      name: "Frost's Blog",
      url: "https://frost-lee.github.io/atom.xml",
      site: "https://frost-lee.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6570\u636E\u5206\u6790",
        "\u968F\u7B14",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-3adea187bfb38737",
      name: "Kerminate's Blog",
      url: "https://kerminate.me/atom.xml",
      site: "https://kerminate.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-00c1290c08549ca5",
      name: "Ray's Blog",
      url: "https://blog.mk1.io/api/feed",
      site: "https://blog.mk1.io/",
      tags: [
        "\u7F16\u7A0B",
        "Web"
      ]
    },
    {
      id: "blog-8b424944ff909c2b",
      name: "ChungZH \u7684\u5C0F\u7A9D",
      url: "https://blog.chungzh.cn/index.xml",
      site: "https://blog.chungzh.cn/",
      tags: [
        "\u7F16\u7A0B",
        "C++",
        "\u7B97\u6CD5",
        "OI"
      ]
    },
    {
      id: "blog-cd9a5b08458b72b4",
      name: "\u8003\u62C9\u5496\u5561\u9986",
      url: "https://guhub.cn/feed/",
      site: "https://guhub.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u6E38\u620F",
        "\u601D\u8003",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-3bad7a903d7b2de4",
      name: "Lineuman's Blog",
      url: "https://lineuman.github.io/blog/feed.xml",
      site: "https://lineuman.github.io/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u6D4B\u8BD5"
      ]
    },
    {
      id: "blog-3d6c753ba396324d",
      name: "news view",
      url: "https://zsqk.github.io/news/feed.xml",
      site: "https://zsqk.github.io/news/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-44d3104b3ea1f4ef",
      name: "Nala Ginrut's Blog",
      url: "https://nalaginrut.com/feed/atom",
      site: "https://nalaginrut.com/index",
      tags: [
        "\u7F16\u7A0B",
        "GNU Guile"
      ]
    },
    {
      id: "blog-c0f69371e3742d84",
      name: "\u4F2A\u659C\u6760\u9752\u5E74",
      url: "http://i.lckiss.com/?feed=rss2",
      site: "http://i.lckiss.com/",
      tags: [
        "\u6280\u672F",
        "\u6298\u817E",
        "\u968F\u8BB0"
      ]
    },
    {
      id: "blog-f286dcf80b108e80",
      name: "\u53CC\u7EDE\u9EBB\u75F9",
      url: "https://numb.tech/atom.xml",
      site: "https://numb.tech/",
      tags: [
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-73ee099bc1981148",
      name: "ZedeX",
      url: "https://zedex.cn/feed",
      site: "https://zedex.cn/",
      tags: [
        "\u4EA7\u54C1",
        "\u79D1\u6280",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-403cbda083f3633d",
      name: "Gavin notes",
      url: "https://blog.gavln.com/atom.xml",
      site: "https://blog.gavln.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-16a8e649923f0e83",
      name: "TwIStOy",
      url: "https://twistoy.cn/index.xml",
      site: "https://twistoy.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "C++"
      ]
    },
    {
      id: "blog-f1a5dbf8bd8dba7e",
      name: "\u4E00\u676F\u8336",
      url: "https://www.zuoyu.top/atom.xml",
      site: "https://www.zuoyu.top/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u7ECF\u6D4E"
      ]
    },
    {
      id: "blog-fceb9a1735a82e47",
      name: "Louis Aeilot's Blog",
      url: "https://blog.aeilot.top/index.xml",
      site: "https://blog.aeilot.top/",
      tags: [
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u827A\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-24345d77747c9d10",
      name: "CLCK's Space",
      url: "https://www.clckblog.space/blog/rss.xml",
      site: "https://www.clckblog.space/blog/",
      tags: [
        "\u968F\u7B14",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-410b11347b8a16bf",
      name: "\u4E91\u6E38\u541B\u7684\u5C0F\u7AD9",
      url: "https://www.yunyoujun.cn/atom.xml",
      site: "https://www.yunyoujun.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u827A\u672F",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-1902fb391dee9765",
      name: "\u9A81\u4E4B\u5C4B - \u5B59\u5929\u9A81\u7684\u968F\u8EAB\u8BB0\u5F55\u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://www.ybusad.com/rss",
      site: "https://www.ybusad.com/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u8BB0",
        "\u6280\u672F",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-61c4ce74e30160cb",
      name: "WuSiYu Blog",
      url: "https://wusiyu.me/feed/",
      site: "https://wusiyu.me/",
      tags: [
        "\u6298\u817E",
        "\u6280\u672F",
        "DIY",
        "Linux"
      ]
    },
    {
      id: "blog-99c480898524f4c7",
      name: "\u653F\u5B50\u7684\u535A\u5BA2",
      url: "https://blog.zhengzi.me/atom.xml",
      site: "https://blog.zhengzi.me/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-8ba90ab6760cc369",
      name: "\u98DE\u5200\u535A\u5BA2",
      url: "https://www.feidaoboke.com/feed.php",
      site: "https://www.feidaoboke.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u8BFB\u4E66",
        "\u8DB3\u7403"
      ]
    },
    {
      id: "blog-f0541a6609cd6584",
      name: "\u5B87\u5B99\u7684\u5FC3\u5F26",
      url: "https://www.physixfan.com/feed",
      site: "https://www.physixfan.com/",
      tags: [
        "\u7269\u7406",
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-71bd46eca1764377",
      name: "Bingwhispers",
      url: "https://cyril3.github.io/feed.xml",
      site: "https://cyril3.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-76b9d0ce172fc307",
      name: "PlayerCatboy",
      url: "https://ralf.ren/feed",
      site: "https://ralf.ren/",
      tags: [
        "\u7F16\u7A0B",
        "\u6298\u817E",
        "\u521B\u9020"
      ]
    },
    {
      id: "blog-32f1c0a723013b90",
      name: "\u6728\u5323\u5B50",
      url: "https://blog.mutoo.im/atom.xml",
      site: "https://mutoo.im/",
      tags: [
        "\u524D\u7AEF",
        "\u6E38\u620F\u5F00\u53D1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-6143fbd12b60beb7",
      name: "\u6B27\u96F7\u6D41",
      url: "https://ourai.ws/atom.xml",
      site: "https://ourai.ws/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u65E5\u8BED",
        "\u5B85\u6587\u5316"
      ]
    },
    {
      id: "blog-527e8fc3339961de",
      name: "VictriD's blog",
      url: "https://victrid.dev/feed.xml",
      site: "https://victrid.dev/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-53174aff5610370f",
      name: "\u6325\u821E\u601D\u7EEA\u7684\u535A\u5BA2",
      url: "https://asazero.blogspot.com/feeds/posts/default",
      site: "https://asazero.blogspot.com/",
      tags: [
        "\u8BC4\u8BBA",
        "\u5FC3\u8DEF\u5386\u7A0B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-64864672e2d8aba9",
      name: "ddadaal.me",
      url: "https://ddadaal.me/rss.xml",
      site: "https://ddadaal.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6D88\u8D39\u6570\u7801",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-3c0fabe8f0574a21",
      name: "\u65E0\u4E3B\u9898\u535A\u5BA2",
      url: "https://wuzhuti.cn/feed",
      site: "https://wuzhuti.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-10e1e03b1e52676a",
      name: "\u533A\u5757\u94FE\u7F57\u5BBE",
      url: "https://dbarobin.com/feed.xml",
      site: "https://dbarobin.com/",
      tags: [
        "\u533A\u5757\u94FE",
        "\u52A0\u5BC6\u8D27\u5E01",
        "\u6BD4\u7279\u5E01",
        "\u4EE5\u592A\u574A",
        "DeFi",
        "\u9690\u79C1"
      ]
    },
    {
      id: "blog-fa66ae700f696118",
      name: "\u751C\u6B23\u5C4B",
      url: "https://tcxx.info/feed",
      site: "https://www.tcxx.info/",
      tags: [
        "\u7F8E\u56FD\u751F\u6D3B",
        "\u6280\u672F",
        "\u4EBA\u5DE5\u667A\u80FD"
      ]
    },
    {
      id: "blog-f03805cf08d25cae",
      name: "Luyu Huang's Tech Blog",
      url: "https://luyuhuang.github.io/feed.xml",
      site: "https://luyuhuang.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-492893d716450a53",
      name: "\u8D39\u7167\u541B\u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://feizhaojun.com/?feed=rss2",
      site: "https://feizhaojun.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u79D1\u6280",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-4ebf99049b317711",
      name: "\u5E74\u534E\u8F6C\u77AC",
      url: "https://blog.xiaket.org/feed.xml",
      site: "https://blog.xiaket.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-96088d246682debc",
      name: "\u9038\u601D\u6742\u9648",
      url: "https://blog.ponder.work/atom.xml",
      site: "https://blog.ponder.work/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7632c10dc6f836fd",
      name: "\u738B\u7384\u7684\u535A\u5BA2",
      url: "https://blog.wangxuan.name/feed/",
      site: "https://blog.wangxuan.name/",
      tags: [
        "\u968F\u7B14",
        "\u81EA\u7531\u4E92\u8054\u7F51",
        "\u6570\u5B57\u751F\u6D3B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-8943d43c1056c0c2",
      name: "\u91CD\u5F52\u6DF7\u6C8C\u7684BLOG",
      url: "https://blog.gotocoding.com/feed/",
      site: "https://blog.gotocoding.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-df80c62d2a1c735e",
      name: "\u65C1\u9038\u659C\u51FA",
      url: "https://www.mihu.live/feed/",
      site: "https://www.mihu.live/",
      tags: [
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-cbc5b353287474ff",
      name: "\u4E00\u5927\u52A0\u8D1D",
      url: "https://tianheg.co/index.xml",
      site: "https://tianheg.co/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-c2ca9e86eec78849",
      name: "\u56DB\u65B9\u4E4B\u4E91",
      url: "https://jingyig01.github.io/atom.xml",
      site: "https://jingyig01.github.io/",
      tags: [
        "\u601D\u8003",
        "\u5916\u8BED",
        "\u6570\u5B66",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-dc53cf887984ae1c",
      name: "\u56DB\u559C\u4E38\u5B50",
      url: "https://fourhappylions.com/index.xml",
      site: "https://fourhappylions.com/",
      tags: [
        "\u517B\u5A03",
        "\u5BB6\u5EAD",
        "\u6D77\u5916\u751F\u6D3B"
      ]
    },
    {
      id: "blog-005a1ddd65cffb9a",
      name: "\u5B89\u5FD7\u5408\u7684\u5B66\u4E60\u535A\u5BA2",
      url: "https://chegva.com/feed/",
      site: "https://chegva.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u8FD0\u7EF4",
        "\u968F\u7B14",
        "\u56FD\u5B66"
      ]
    },
    {
      id: "blog-823e795a2d2f0042",
      name: "\u6D6E\u4E91\u6E38\u5B50\u610F",
      url: "https://leonson.me/feed.xml",
      site: "https://leonson.me/",
      tags: [
        "\u751F\u6D3B",
        "\u7F8E\u56FD",
        "\u601D\u8003",
        "\u9605\u8BFB",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b8ef08bcfa0c5e04",
      name: "HappyHack",
      url: "https://blog.happyhack.io/atom.xml",
      site: "https://blog.happyhack.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u4E91\u539F\u751F",
        "Hack"
      ]
    },
    {
      id: "blog-89a46a336ace18e9",
      name: "Jiansing's Blog",
      url: "https://blog.ofo.moe/rss.xml",
      site: "https://blog.ofo.moe/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-97e3aff52f7a20b1",
      name: "\u76AE\u76AE\u51DB\u57FA\u5730",
      url: "https://owomoe.net/feed/",
      site: "https://owomoe.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u8BC4\u8BBA"
      ]
    },
    {
      id: "blog-4c7e4d9b4a395867",
      name: "Ljcbaby \u7684 \u7F51\u7EDC\u5C0F\u5C4B",
      url: "https://cdn.jsdelivr.net/gh/ljcbaby/ljcbaby.github.io@latest/atom.xml",
      site: "https://blog.ljcbaby.top/",
      tags: [
        "\u6280\u672F",
        "\u8BC4\u8BBA",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-15d9c5005b948ed5",
      name: "Velas\u7535\u6CE2\u7AD9",
      url: "https://www.velasx.com/feed",
      site: "https://www.velasx.com/",
      tags: [
        "\u52A8\u753B",
        "\u6E38\u620F",
        "\u5C0F\u8BF4",
        "\u8BBE\u8BA1",
        "\u9274\u8D4F"
      ]
    },
    {
      id: "blog-5a0693b1e534fd99",
      name: "\u4E0D\u70B9\u8BED\u4E66",
      url: "https://yjalifebook.com/feed/",
      site: "https://yjalifebook.com/",
      tags: [
        "\u8FD9\u91CC\u662F\u4E0D\u70B9\u8BED\u4E66\uFF0C\u4E00\u5757\u300C\u601D\u8003\u300D\u7684\u81EA\u7559\u5730\u3002"
      ]
    },
    {
      id: "blog-be369da94e7d650e",
      name: "zu1k",
      url: "https://zu1k.com/rss.xml",
      site: "https://zu1k.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7F51\u5B89",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-f1c6a614ee0bf0c7",
      name: "Jalen",
      url: "https://jalenz.cn/atom.xml",
      site: "https://jalenz.cn/",
      tags: [
        "\u7B97\u6CD5",
        "\u751F\u6D3B",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-fc22a5624b6492c5",
      name: "Gowhich",
      url: "https://www.gowhich.com/feed",
      site: "https://www.gowhich.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7F51\u7EDC",
        "\u8BA1\u7B97\u673A",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-344285a1c34d164d",
      name: "\u6768\u6C38\u5EB7\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://blog.yangyk.com/feed.xml",
      site: "https://blog.yangyk.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-fdb7344ed690c674",
      name: "Platform Thinking +",
      url: "https://pt.plus/rss/",
      site: "https://pt.plus/",
      tags: [
        "\u79D1\u6280",
        "\u4EBA\u6587",
        "\u5546\u4E1A"
      ]
    },
    {
      id: "blog-84bde7b1989bcb9e",
      name: "\u6587\u827A\u6570\u5B66\u541B",
      url: "https://mathpretty.com/feed/",
      site: "https://mathpretty.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6570\u5B66"
      ]
    },
    {
      id: "blog-4fa65aa6cf44ee33",
      name: "luozhiyun`s Blog \u6211\u7684\u6280\u672F\u5206\u4EAB",
      url: "https://www.luozhiyun.com/feed",
      site: "https://www.luozhiyun.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-e4684d96afcb48d2",
      name: "\u4EBA\u751F\u9019\u90E8\u6232",
      url: "https://www.frank.hk/rss.xml",
      site: "https://www.frank.hk/",
      tags: [
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u95B1\u8B80",
        "\u65C5\u884C",
        "\u6280\u8853"
      ]
    },
    {
      id: "blog-546e3c0c56ce6be8",
      name: "\u5730\u7403\u4EBA\u7684\u7A7A\u95F4",
      url: "https://h.cjh0613.com/zh/index.xml",
      site: "https://cjh0613.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u5206\u4EAB",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-ea9f35bd359b1266",
      name: "\u72EC\u5B64\u4F36\u4FDC",
      url: "https://blog.dugulingping.com/feed",
      site: "https://blog.dugulingping.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9df271707b21db37",
      name: "maxOS",
      url: "https://maxoxo.me/rss/",
      site: "https://maxoxo.me/",
      tags: [
        "\u8BBE\u8BA1",
        "\u9605\u8BFB",
        "\u968F\u7B14",
        "\u6B4C\u5355"
      ]
    },
    {
      id: "blog-1ec1a4fb81035fdf",
      name: "Yuko's Blog",
      url: "https://yuukoamamiya.github.io/index.xml",
      site: "https://yuukoamamiya.github.io/",
      tags: [
        "\u4E8C\u6B21\u5143",
        "\u4EBA\u6587",
        "\u793E\u79D1",
        "\u8BFB\u4E66",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-fdd1cd421b655c05",
      name: "\u6E1A\u78A7",
      url: "https://jubeny.com/feed.xml",
      site: "https://jubeny.com/",
      tags: [
        "\u8BFB\u4E66",
        "\u751F\u6D3B",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-67ccd7e5910b0e32",
      name: "\u4EE5\u68A6\u4E3A\u9A6C",
      url: "https://lhymwm.github.io//atom.xml",
      site: "https://lhymwm.github.io/",
      tags: [
        "\u5B66\u4E60",
        "\u751F\u6D3B",
        "\u65AD\u60F3"
      ]
    },
    {
      id: "blog-8d3a5be393349313",
      name: "Jiayi Liu",
      url: "https://jiayiliu.me/index.xml",
      site: "https://jiayiliu.me/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u751F\u7269\u4FE1\u606F\u5B66",
        "\u751F\u7269\u533B\u5B66",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-da17b0e4d85d08d3",
      name: "\u9065\u8FDC\u7684\u8857\u5E02",
      url: "https://blog.henix.info/rss2.0.xml",
      site: "https://blog.henix.info/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-cff1e8fc43a948ab",
      name: "\u9648\u4ED3\u9889",
      url: "https://imzm.im/feed",
      site: "https://imzm.im/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-f9973b9be9e526d2",
      name: "\u591C\u5EAD\u8A18",
      url: "https://musenxi.com/feed",
      site: "https://musenxi.com/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-a07f0b67ac271f83",
      name: "Ngzhio's Blog",
      url: "https://ngzhio.github.io/feed.xml",
      site: "https://ngzhio.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6587\u5B66",
        "\u6570\u5B66",
        "\u7269\u7406",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-fbe59874d5dc775f",
      name: "Eric's Blog",
      url: "https://wsdjeg.net/feed.xml",
      site: "https://wsdjeg.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-2effcf621925e131",
      name: "ephz3nt",
      url: "https://painso.com/posts/index.xml",
      site: "https://painso.com/",
      tags: [
        "\u968F\u60F3",
        "\u8FD0\u7EF4",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-74aed0b83ae1dc53",
      name: "\u5C0F\u732A",
      url: "https://xiaozhu.dev/index.xml",
      site: "https://xiaozhu.dev/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-22ba31402466ff1c",
      name: "251",
      url: "https://blog.251.sh/feed/",
      site: "https://blog.251.sh/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u6559\u7A0B",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-70894d5f7d2d7763",
      name: "\u5362\u8D24\u6CFC\u7684\u535A\u5BA2",
      url: "https://www.luxianpo.com/rss.xml",
      site: "https://www.luxianpo.com/",
      tags: [
        "\u5DE5\u4F5C",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-b43967b166ef0d2b",
      name: "\u8FF7\u9014\u5C0F\u4E66\u7AE5",
      url: "https://xugaoxiang.com/feed",
      site: "https://xugaoxiang.com/",
      tags: [
        "\u5DE5\u4F5C",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-75aab3296b8329e9",
      name: "\u5F90\u5B9C\u751F",
      url: "https://xuyisheng.top/rss/",
      site: "https://xuyisheng.top/",
      tags: [
        "\u5DE5\u4F5C",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-f33728be425f2c5e",
      name: "Scvoet",
      url: "https://scvoet.me/feed",
      site: "https://scvoet.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-44e1066ea59803be",
      name: "Diff\u5BA2\u65C5\u65E5\u8BB0",
      url: "https://diff.im/blog/?feed=rss2",
      site: "https://diff.im/blog/",
      tags: [
        "\u57FA\u7763\u4FE1\u4EF0\uFF0C\u8BBE\u8BA1\uFF0C\u751F\u6D3B\uFF0C\u6559\u80B2"
      ]
    },
    {
      id: "blog-6a3c69e3224027e3",
      name: "jax - \u8D70\u5728\u8DEF\u4E0A",
      url: "https://cdjax.com/?feed=rss2",
      site: "https://cdjax.com/",
      tags: [
        "\u4EA7\u54C1",
        "\u6570\u7801",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-8cd81772ccd344d6",
      name: "XINDOO\u7684\u535A\u5BA2",
      url: "https://zxs.io/feed",
      site: "https://zxs.io/",
      tags: [
        "\u7B97\u6CD5",
        "\u7F16\u7A0B",
        "\u4EBA\u751F"
      ]
    },
    {
      id: "blog-7c101361702430d1",
      name: "\u61D2\u5F97\u52E4\u5FEB\u7684\u535A\u5BA2",
      url: "https://masuit.com/rss",
      site: "https://masuit.com/",
      tags: [
        "\u7EFF\u8272\u8F6F\u4EF6",
        ".net",
        "\u8D44\u6E90\u5206\u4EAB"
      ]
    },
    {
      id: "blog-c7f73cff8a281b46",
      name: "\u6781\u5BA2\u5154\u5154",
      url: "https://geektutu.com/feed.xml",
      site: "https://geektutu.com/",
      tags: [
        "\u5206\u4EAB\u6709\u8DA3\u7684\u6280\u672F\u5B9E\u8DF5"
      ]
    },
    {
      id: "blog-6d2979e4e315641b",
      name: "\u6781\u5BA2\u4E2D\u5FC3",
      url: "https://www.geekzl.com/feed",
      site: "https://www.geekzl.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "SEO",
        "\u6559\u7A0B",
        "dotnet",
        "python"
      ]
    },
    {
      id: "blog-53543afb37e37a0b",
      name: "\u9648\u5C11\u6587\u7684\u535A\u5BA2",
      url: "https://www.chenshaowen.com/atom.xml",
      site: "https://www.chenshaowen.com/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-97f7fad621f4fb37",
      name: "\u4E00\u5207\u7686\u6709\u53EF\u80FD",
      url: "https://kubesphereio.com/tags/index.xml",
      site: "https://kubesphereio.com/",
      tags: [
        "\u5B66\u4E60",
        "K8s",
        "\u8FD0\u7EF4"
      ]
    },
    {
      id: "blog-3414ac359690eacf",
      name: "\u6781\u5BA2\u73A9\u5BB6\u5927\u767D",
      url: "https://geekplayers.com/feed.xml",
      site: "https://geekplayers.com/",
      tags: [
        "\u6280\u672F",
        "SEO",
        "\u8FD0\u8425",
        "\u6559\u7A0B",
        "python"
      ]
    },
    {
      id: "blog-420ef332ad5ff1d6",
      name: "\u5806\u6808\u9152\u9986",
      url: "https://atticuslab.com/atom.xml",
      site: "https://atticuslab.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-9174c81ec558a1fe",
      name: "\u7231\u91CC\u74DC",
      url: "https://www.eriqua.com/index.php/feed",
      site: "https://www.eriqua.com/",
      tags: [
        "\u8BFB\u4E66",
        "\u5916\u8BED",
        "\u65E5\u8BB0"
      ]
    },
    {
      id: "blog-f7e74c7631e53e08",
      name: "\u738B\u4E00\u77F3",
      url: "https://yishi.io/feed",
      site: "https://yishi.io/",
      tags: [
        "\u5546\u4E1A",
        "\u91D1\u878D",
        "\u52A0\u5BC6\u8D27\u5E01",
        "\u521B\u4E1A"
      ]
    },
    {
      id: "blog-478a5b763531a24e",
      name: "TripleZ's Blog",
      url: "https://blog.triplez.cn/index.xml",
      site: "https://blog.triplez.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7482107b729b3c20",
      name: "AmbroseRen",
      url: "https://ambroseren.github.io/",
      site: "https://ambroseren.github.io/test/",
      tags: [
        "\u7EFC\u5408\u6570\u636E\u5E93\u7B14\u8BB0",
        "\u535A\u5BA2"
      ]
    },
    {
      id: "blog-41fb6408d1c58a9b",
      name: "Fat Blog - \u633A\u80A5\u7684\u535A\u5BA2",
      url: "https://tingfei.space/index.xml",
      site: "https://tingfei.space/",
      tags: [
        "\u533A\u5757\u94FE",
        "\u79D1\u5E7B",
        "Rust",
        "\u7F8E\u98DF"
      ]
    },
    {
      id: "blog-4a7f8a8fc7fb49a5",
      name: "\u6258\u5C3C\u54E5\u7684\u73A9\u5177\u535A\u5BA2",
      url: "https://www.tony-bro.com/atom.xml",
      site: "https://www.tony-bro.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-04ded9caa82de04a",
      name: "Ramen's Box",
      url: "https://blog.lxdlam.com/index.xml",
      site: "https://blog.lxdlam.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-61060f0d7e1f8c07",
      name: "\u6B65\u6B65\u8D70\u524D\u7AEF",
      url: "https://bubuzou.com/atom.xml",
      site: "https://bubuzou.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-f22315f57e0ce45d",
      name: "Holmesian Blog",
      url: "https://holmesian.org/feed",
      site: "https://holmesian.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-8043facc01a7e39c",
      name: "\u5F20\u5C0F\u51EF\u7684\u535A\u5BA2",
      url: "https://jasonkayzk.github.io/atom.xml",
      site: "https://jasonkayzk.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u751F\u6D3B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-de2767e65b6109af",
      name: "DLog - \u674E\u4E01\u7684\u535A\u5BA2",
      url: "https://dingzeyu.li/blog/feed.xml",
      site: "https://dingzeyu.li/blog/",
      tags: [
        "\u7814\u7A76",
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u5546\u4E1A\u6A21\u5F0F",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-d6987db6c6eda8bc",
      name: "JimmyLv@\u5415\u7ACB\u9752\u7684\u535A\u5BA2",
      url: "https://blog.jimmylv.info/pages/feed.xml",
      site: "https://blog.jimmylv.info/",
      tags: [
        "\u524D\u7AEF",
        "\u601D\u8003",
        "\u7F16\u7A0B",
        "\u6F14\u8BB2",
        "\u77E5\u8BC6\u7BA1\u7406",
        "\u6548\u7387"
      ]
    },
    {
      id: "blog-11718f648cc1d309",
      name: "\u5899\u5916\u770B\u7684\u535A\u5BA2",
      url: "https://qiangwaikan.com/feed/",
      site: "https://qiangwaikan.com/",
      tags: [
        "\u6559\u7A0B",
        "\u5B89\u5168",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-ac855eb4da986493",
      name: "kirito\u7684\u535A\u5BA2",
      url: "https://www.kirito41dd.cn/index.xml",
      site: "https://www.kirito41dd.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6BD4\u7279\u5E01",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-a8415e4a28f6d113",
      name: "herrkaefer",
      url: "https://herrkaefer.com/feed/",
      site: "https://herrkaefer.com/",
      tags: [
        "\u6280\u672F",
        "\u521B\u9020",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-b1d6fe19b5d5ab70",
      name: "\u0164hinking Null",
      url: "https://awsl.blog/feed",
      site: "https://awsl.blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0e2b4c97778e017a",
      name: "teobler",
      url: "https://teobler.com/rss.xml",
      site: "https://teobler.com/",
      tags: [
        "\u524D\u7AEF",
        "\u654F\u6377"
      ]
    },
    {
      id: "blog-a33d57797ea7120a",
      name: "\u9B5A\u7ACB\u8BF4",
      url: "https://www.yulisay.com/rss.xml",
      site: "https://www.yulisay.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u8BFB\u4E66",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-6a0927a8702749aa",
      name: "winter's Blog",
      url: "https://blog.winterchen.com/atom.xml",
      site: "https://blog.winterchen.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-fab8e4ce0a1b6e07",
      name: "\u7A0B\u6C9B\u6743 - \u517B\u4E86\u4E09\u53EA\u732B",
      url: "https://chengpeiquan.com/feed/",
      site: "https://chengpeiquan.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u524D\u7AEF",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-d3aa619f9c8c067a",
      name: "yzqzss-\u4E00\u5EA7\u6865\u5728\u6C34\u4E0A's Blog",
      url: "https://blog.othing.xyz/feed/",
      site: "https://blog.othing.xyz/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-a373d131d0673005",
      name: "Terrarum::\u5F02\u4E16\u754C\u4E28\u5C45\u6B63\u535A\u5BA2",
      url: "https://blog.skyju.cc/index.xml",
      site: "https://blog.skyju.cc/",
      tags: [
        "\u7F16\u7A0B",
        "PHP",
        "\u6E17\u900F",
        "\u5F00\u6E90",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-e7e5730c6bf4edf2",
      name: "Li Hui Blog",
      url: "https://lihui.net/feed",
      site: "https://lihui.net/",
      tags: [
        "\u8BA4\u77E5",
        "\u601D\u8003",
        "\u8BFB\u4E66",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-16d139f9d294032f",
      name: "186526's Blog",
      url: "https://blog.186526.xyz/atom.xml",
      site: "https://blog.186526.xyz/",
      tags: [
        "\u6559\u7A0B",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5439\u6C34",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-d0369b0647343315",
      name: "Enoch2090",
      url: "https://enoch2090.me/atom.xml",
      site: "https://enoch2090.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u827A\u672F"
      ]
    },
    {
      id: "blog-7afeb62e3f9af074",
      name: "\u4E4C\u6258\u90A6\u662F\u4E2A\u7406\u60F3\u56FD",
      url: "https://shenyongfan.com/rss/",
      site: "https://shenyongfan.com/",
      tags: [
        "\u8BBE\u8BA1",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-68fd3f2828776651",
      name: "Anillc's blog",
      url: "https://anillc.cn/atom.xml",
      site: "https://anillc.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f72d8a15baccc2ae",
      name: "\u58A8\u5B88",
      url: "https://moshou.me/?feed=rss2",
      site: "https://moshou.me/",
      tags: [
        "\u521B\u4E1A",
        "Apple",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-6d329732001798f8",
      name: "This cute world",
      url: "https://thiscute.world/index.xml",
      site: "https://thiscute.world/",
      tags: [
        "\u4E91\u539F\u751F",
        "Kubernetes",
        "\u8FD0\u7EF4",
        "Linux"
      ]
    },
    {
      id: "blog-3c9df03d70271a79",
      name: "\u5D2E\u751F \u2022 \u4E00\u4E9B\u968F\u7B14 \u{1F3A8}",
      url: "https://shenzilong.cn/blog/feed",
      site: "https://shenzilong.cn/",
      tags: [
        "\u968F\u7B14",
        "\u7F16\u7A0B",
        "\u5206\u4EAB",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-a9cbc757d80a1328",
      name: "I'm OWenT",
      url: "https://owent.net/index.xml",
      site: "https://owent.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u6280\u672F",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-1aa1837ca33d8d55",
      name: "Android Performance",
      url: "https://www.androidperformance.com/atom.xml",
      site: "https://www.androidperformance.com/",
      tags: [
        "\u7F16\u7A0B",
        "Android",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-3994432594be50f3",
      name: "Nansey\u7684\u535A\u5BA2",
      url: "https://www.nansey.me/feeds/posts/default",
      site: "https://www.nansey.me/",
      tags: [
        "\u7FFB\u8BD1",
        "\u8BFB\u4E66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-4c8fd7efbc72c962",
      name: "\u7FFB\u8BD1\u52A8\u6001",
      url: "https://fanyi.news/feed.xml",
      site: "https://fanyi.news/",
      tags: [
        "\u7FFB\u8BD1",
        "\u672C\u5730\u5316",
        "\u884C\u4E1A\u52A8\u6001"
      ]
    },
    {
      id: "blog-083b20939090d460",
      name: "\u6CA1\u559D\u7684",
      url: "https://blog.nodr.ink/atom.xml",
      site: "https://blog.nodr.ink/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5B66\u4E60",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-945e450263e3d043",
      name: "\u6DF1\u5EA6\u6295\u8D44\u7B14\u8BB0",
      url: "https://deepinvest.org/index.xml",
      site: "https://deepinvest.org/",
      tags: [
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-f5e261a05ccdc07d",
      name: "\u53F6\u5BFB\u7684\u535A\u5BA2",
      url: "https://cyrusyip.org/zh-cn/index.xml",
      site: "https://cyrusyip.org/",
      tags: [
        "\u751F\u6D3B",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-ff646ba4fa340159",
      name: "\u82CD\u7A79\u306E\u4E0B",
      url: "https://www.blueskyxn.com/feed/",
      site: "https://www.blueskyxn.com/",
      tags: [
        "\u6280\u672F",
        "Linux",
        "\u751F\u6D3B",
        "\u7F51\u7EDC",
        "\u8BA1\u7B97\u673A",
        "\u4E8C\u6B21\u5143"
      ]
    },
    {
      id: "blog-f32fbab3ec69d9fa",
      name: "\u660E\u8FDC\u7684\u81EA\u7559\u5730",
      url: "https://blog.mayandev.top/atom.xml",
      site: "https://blog.mayandev.top/",
      tags: [
        "\u6280\u672F",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u4E92\u8054\u7F51"
      ]
    },
    {
      id: "blog-9a934dee341181f7",
      name: "TimeMachine Notes",
      url: "https://timemachine.icu/atom.xml",
      site: "https://timemachine.icu/",
      tags: [
        "\u5927\u6570\u636E",
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-5caa51bed0ed717f",
      name: "\u72C2\u4E14\u7684\u535A\u5BA2",
      url: "http://blog.kuangjux.top/atom.xml",
      site: "https://blog.kuangjux.top/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u8BFB\u4E66",
        "\u6587\u5B66"
      ]
    },
    {
      id: "blog-727f298ab6e445bc",
      name: "I Am I",
      url: "https://5ime.cn/atom.xml",
      site: "https://5ime.cn/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u5B66\u4E60",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b5f597108a8137c2",
      name: "Super Blog",
      url: "https://superpung.com/atom.xml",
      site: "https://superpung.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u89C2\u70B9",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-dbfc32e43ce6f922",
      name: "\u79BB\u522B\u6B4C",
      url: "https://www.leavesongs.com/feed/",
      site: "https://www.leavesongs.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-9f75c7e1bf12736b",
      name: "crblog",
      url: "https://blog.cal1.cn/atom.xml",
      site: "https://blog.cal1.cn/",
      tags: [
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-b6e871df0f584360",
      name: "EVILCOS",
      url: "https://evilcos.me/?feed=rss2",
      site: "https://evilcos.me/",
      tags: [
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-4030cfeb2971ee46",
      name: "Lyunvy's Blog",
      url: "https://blog.lyunvy.top/atom.xml",
      site: "https://blog.lyunvy.top/",
      tags: [
        "\u751F\u6D3B",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-cbb771fa729437f7",
      name: "PRIEWIENV's blog",
      url: "https://blog.priewienv.me/index.xml",
      site: "https://blog.priewienv.me/",
      tags: [
        "\u5BC6\u7801\u5B66",
        "\u7406\u8BBA\u8BA1\u7B97\u673A\u79D1\u5B66",
        "\u6570\u5B66",
        "\u533A\u5757\u94FE"
      ]
    },
    {
      id: "blog-243802528f27926a",
      name: "\u6E38\u620F\u7814\u7A76\u793E",
      url: "https://www.yystv.cn/rss/feed",
      site: "https://www.yystv.cn/",
      tags: [
        "\u6E38\u620F",
        "\u6742\u8C08"
      ]
    },
    {
      id: "blog-ccf9f0909295afe7",
      name: "KSkun's Blog",
      url: "https://ksmeow.moe/feed/",
      site: "https://ksmeow.moe/",
      tags: [
        "\u7B97\u6CD5",
        "\u5F00\u53D1",
        "\u4E92\u8054\u7F51",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-64eb0519096fa127",
      name: "Lucas's Blog",
      url: "http://kevinnan.org.cn/feed",
      site: "http://kevinnan.org.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u97F3\u89C6\u9891\u5F00\u53D1",
        "\u670D\u52A1\u5668\u5F00\u53D1"
      ]
    },
    {
      id: "blog-ebee40055dc23819",
      name: "\u6C88\u5501\u5FD7",
      url: "https://qq52o.me/feed",
      site: "https://qq52o.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-72c1d1aeb8aa3d17",
      name: "\u4E8C\u53EA\u8001\u864E",
      url: "https://2hu.net/feed.xml",
      site: "https://2hu.net/",
      tags: [
        "\u4E92\u8054\u7F51",
        "\u968F\u7B14",
        "\u5B66\u4E60",
        "\u8D44\u6E90"
      ]
    },
    {
      id: "blog-508383443fa54b1c",
      name: "Fanta's Blog",
      url: "https://fantalovelife.club/archives/",
      site: "https://fantalovelife.club/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-ab99f55731c9dcd9",
      name: "\u738B\u5B9C\u6977\u5DE5\u4F5C\u5BA4",
      url: "http://wangyikai.com/feed",
      site: "http://wangyikai.com/",
      tags: [
        "\u975E\u865A\u6784\u5199\u4F5C",
        "\u7528\u8EAB\u4F53\u5199\u4F5C\u7684\u7EAF\u6587\u5B66"
      ]
    },
    {
      id: "blog-3a90934eba50f2da",
      name: "Saul's Space",
      url: "https://saulnoble.github.io/atom.xml",
      site: "https://saulnoble.github.io/",
      tags: [
        "\u5C0F\u8BF4",
        "\u7EDF\u8BA1\u5B66",
        "\u827A\u672F"
      ]
    },
    {
      id: "blog-e5ce98095e470a79",
      name: "Jun's Blog",
      url: "https://www.junz.org/index.xml",
      site: "https://www.junz.org/",
      tags: [
        "\u7F16\u7A0B",
        "C++",
        "Linux",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-fc2cf8213e80a87f",
      name: "Shuo's Blog",
      url: "https://wushuo.me/atom.xml",
      site: "https://wushuo.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5927\u5B66\u751F\u6D3B"
      ]
    },
    {
      id: "blog-3fc4bcf7d030727b",
      name: "fivestone - \u540C\u4E00\u79CD\u8C03\u8C03",
      url: "http://blog.fivest.one/feed",
      site: "https://blog.fivest.one/",
      tags: [
        "\u751F\u6D3B",
        "\u5410\u69FD",
        "\u6587\u827A",
        "\u793E\u4F1A",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-ca7e4fa3e394f51e",
      name: "fieldnotes",
      url: "http://anthropology.fivest.one/feed",
      site: "https://anthropology.fivest.one/",
      tags: [
        "\u4EBA\u7C7B\u5B66"
      ]
    },
    {
      id: "blog-052ad0f2be10bb75",
      name: "rxliuli blog",
      url: "https://blog.rxliuli.com/atom.xml",
      site: "https://blog.rxliuli.com/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-e059d15068f7e60f",
      name: "\u65E0\u8F84\u7684\u6808",
      url: "https://www.zackwu.com/feed.xml",
      site: "https://www.zackwu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f9c4d1b0f4e59d86",
      name: "Markon Review",
      url: "https://markonreview.com/rss/",
      site: "https://markonreview.com/",
      tags: [
        "\u6E38\u620F\u53CA\u4EA7\u4E1A\u8BC4\u8BBA"
      ]
    },
    {
      id: "blog-348c32ed954c975c",
      name: "\u601D\u8003\u95EE\u9898\u7684\u718A",
      url: "https://kaopubear.top/blog/atom.xml",
      site: "https://kaopubear.top/blog/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-fb33426c5f0914e0",
      name: "\u9AD8\u539F\u77F3\u535A\u5BA2",
      url: "https://www.gaoyuanshi.com/?feed=rss2",
      site: "https://www.gaoyuanshi.com/",
      tags: [
        "\u65C5\u884C",
        "\u6444\u5F71",
        "\u82F1\u8BED",
        "\u7559\u5B66"
      ]
    },
    {
      id: "blog-16187f5a0dd3691b",
      name: "mghio",
      url: "https://www.mghio.cn/atom.xml",
      site: "https://www.mghio.cn/",
      tags: [
        "\u6280\u672F",
        "\u540E\u7AEF",
        "\u968F\u7B14",
        "\u7EC8\u8EAB\u5B66\u4E60\u8005"
      ]
    },
    {
      id: "blog-0f7be28208339804",
      name: "\u4FAF\u7237\u7684\u535A\u5BA2",
      url: "https://houye.xyz/atom.xml",
      site: "https://houye.xyz/",
      tags: [
        "\u8BB0\u5F55",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-11b501d91d932431",
      name: "Richie\u7684\u65F6\u5149\u673A",
      url: "https://www.riichiie.net/feed/",
      site: "https://riichiie.net/",
      tags: [
        "\u751F\u6D3B",
        "\u5174\u8DA3",
        "\u601D\u8003",
        "Blog"
      ]
    },
    {
      id: "blog-9897c29e0dd75325",
      name: "\u672C\u683C\u5F02\u60F3\u5F55",
      url: "https://astrianzheng.cn/atom.xml",
      site: "https://astrianzheng.cn/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-2e77e94dd9c78a9b",
      name: "\u6728\u5C0F\u4E30\u7684\u535A\u5BA2",
      url: "https://lesofn.com/atom.xml",
      site: "https://lesofn.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-0641ef4870d15b31",
      name: "Frank's Weblog",
      url: "https://nyan.im/feed",
      site: "https://nyan.im/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8f54a72ecb9116df",
      name: "Robotkang",
      url: "https://robotkang.cc/feed",
      site: "https://robotkang.cc/",
      tags: [
        "\u79D1\u6280",
        "\u751F\u6D3B",
        "\u97F3\u4E50",
        "\u4EBA\u751F"
      ]
    },
    {
      id: "blog-08e654894f6ab664",
      name: "\u798F\u5F3A\u8BF4 \u4E00\u4E2A\u67B6\u6784\u58EB\u7684\u601D\u8003\u4E0E\u6C89\u6DC0",
      url: "https://afoo.me/feeds.xml",
      site: "https://afoo.me/",
      tags: [
        "\u67B6\u6784",
        "\u521B\u4E1A",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-3876bed2fd6e747e",
      name: "\u795D\u878D\u8BF4",
      url: "https://zhurongshuo.com/index.xml",
      site: "https://zhurongshuo.com/",
      tags: [
        "\u6CD5\u4E0D\u51C0\u7A7A\uFF0C\u89C9\u65E0\u6027\u4E5F\u3002"
      ]
    },
    {
      id: "blog-5d4c544332d5afde",
      name: "\u5982\u9C7C\u996E\u6C34",
      url: "https://wangjiezhe.com/atom.xml",
      site: "https://wangjiezhe.com/",
      tags: [
        "\u6570\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-781d4cda558c3ea0",
      name: "\u7948\u96E8\u7684\u535A\u5BA2",
      url: "https://wakzz.cn/atom.xml",
      site: "https://wakzz.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-7d6779c7001e5a6e",
      name: "\u5218\u8363\u661F\u7684\u535A\u5BA2",
      url: "https://www.liurongxing.com/feed",
      site: "https://www.liurongxing.com/",
      tags: [
        "Linux",
        "BSD",
        "\u8FD0\u7EF4"
      ]
    },
    {
      id: "blog-e4f582f77dd01d9f",
      name: "Phuker's Blog",
      url: "https://phuker.github.io/feeds/all.atom.xml",
      site: "https://phuker.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-028f969a8f9b83a8",
      name: "\u73D2\u9676",
      url: "https://blog.chenjt.com/feed.xml",
      site: "https://blog.chenjt.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-8f7dc5d3af675c58",
      name: "\u8463\u73C2\u74A0\u2615",
      url: "https://kefan.me/rss.xml",
      site: "https://kefan.me/blog",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5B66\u751F",
        "\u8BFB\u4E66\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-ab5e8d9c0fbfa440",
      name: "\u8FF0\u5C14 - \u4E00\u4E2A\u4EA7\u54C1\u7ECF\u7406\u7684\u788E\u788E\u5FF5",
      url: "https://amore.ink/feed/",
      site: "https://amore.ink/",
      tags: [
        "\u4EA7\u54C1\u7ECF\u7406",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u8BFB\u4E66\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-3e786037a1c4202b",
      name: "\u828D\u828B\u4E4B\u5BB6",
      url: "https://shoyu.top/feed",
      site: "https://shoyu.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-fb6e0cb7980f8dad",
      name: "\u4EFB\u5CFB\u5B8F\u7684\u5C0F\u7AD9",
      url: "https://renny.ren/feed",
      site: "https://renny.ren/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u94A2\u7434"
      ]
    },
    {
      id: "blog-ca1171761f1920d7",
      name: "\u82B1\u675F\u6E32\u67D3",
      url: "https://bouquetrender.space/feed.xml",
      site: "https://bouquetrender.space/",
      tags: [
        "\u751F\u6D3B",
        "\u6E38\u620F",
        "\u7535\u5F71",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-eeff60deaeecaab8",
      name: "LoRexxar's Blog",
      url: "https://lorexxar.cn/atom.xml",
      site: "https://lorexxar.cn/",
      tags: [
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-82920f75e22a34a2",
      name: "Orange",
      url: "https://feeds.feedburner.com/blogspot/Aohx",
      site: "https://blog.orange.tw/",
      tags: [
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-10bf0261f3a9a4e5",
      name: "Nuclear'Atk\uFF08\u6838\u653B\u51FB\uFF09\u7F51\u7EDC\u5B89\u5168\u5B9E\u9A8C\u5BA4",
      url: "https://lcx.cc/index.xml",
      site: "https://lcx.cc/",
      tags: [
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-0475590c8cfaad1d",
      name: "bboysoul\u7684\u535A\u5BA2",
      url: "https://www.bboy.app/atom.xml",
      site: "https://www.bboy.app/",
      tags: [
        "k8s \u8FD0\u7EF4"
      ]
    },
    {
      id: "blog-5c063e091f97c5b8",
      name: "\u4E00\u6D3E\u80E1\u8A00",
      url: "https://dantezy.xyz/rss.xml",
      site: "https://dantezy.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u9605\u8BFB",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7bfcf492a33df504",
      name: "\u7075\u611F\u7535\u53F0 - Jack's art hobby habitat",
      url: "http://museradio.net/atom.xml",
      site: "http://museradio.net/",
      tags: []
    },
    {
      id: "blog-51921935e0c616e1",
      name: "sulinehk's blog",
      url: "https://www.sulinehk.com/index.xml",
      site: "https://www.sulinehk.com/",
      tags: [
        "\u7F16\u7A0B",
        "Golang"
      ]
    },
    {
      id: "blog-ac8102be57927019",
      name: "\u7626\u4EBA\u5FD7",
      url: "http://www.wuqiwen.cn/feed/",
      site: "http://www.wuqiwen.cn/",
      tags: [
        "\u4EA7\u54C1\u8BBE\u8BA1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b5d637124ae65ebd",
      name: "JustZht",
      url: "https://www.justzht.com/rss/",
      site: "https://www.justzht.com/",
      tags: [
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f197b42e873d4a3c",
      name: "Mokeyjay's Blog",
      url: "https://www.mokeyjay.com/feed",
      site: "https://www.mokeyjay.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "PHP",
        "\u751F\u6D3B",
        "\u5206\u4EAB",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-b79d22140e21e52c",
      name: "\u53F6\u5F00\u535A\u5BA2",
      url: "https://qq.md/feed/",
      site: "https://qq.md/",
      tags: [
        "\u65E5\u5E38",
        "\u751F\u6D3B",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-2efef720b4ca4745",
      name: "Shiau",
      url: "https://shiau.xyz/atom.xml",
      site: "https://shiau.xyz/",
      tags: [
        "\u4EA7\u54C1",
        "\u8BBE\u8BA1",
        "SwiftUI"
      ]
    },
    {
      id: "blog-2502abddcbe26308",
      name: "\u58A8\u83F2\u6613",
      url: "https://blog.murphyyi.com/atom.xml",
      site: "https://blog.murphyyi.com/",
      tags: [
        "\u6280\u672F",
        "\u540E\u7AEF",
        "golang"
      ]
    },
    {
      id: "blog-4f883b37c1d8ae48",
      name: "\u4E00\u53EA\u4F1A\u6572\u4EE3\u7801\u7684Sheep",
      url: "https://codeyang.pages.dev/atom.xml",
      site: "https://codeyang.pages.dev/",
      tags: [
        "\u7F16\u7A0B",
        "\u5206\u4EAB",
        "\u6298\u817E",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-d25a3910713725eb",
      name: "\u6668\u66E6\u7684\u535A\u5BA2",
      url: "https://blog.whuzfb.cn/feed.xml",
      site: "https://blog.whuzfb.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u65E5\u5E38",
        "\u8FD0\u7EF4"
      ]
    },
    {
      id: "blog-41916827d3bbdf11",
      name: "Easton Man's Blog",
      url: "https://blog.eastonman.com/feed",
      site: "https://blog.eastonman.com/",
      tags: [
        "\u5F00\u6E90",
        "Linux",
        "\u8BA1\u7B97\u673A\u7CFB\u7EDF"
      ]
    },
    {
      id: "blog-1622309388b3f178",
      name: "Lawrence's Blog",
      url: "https://lawrenceli.me/atom.xml",
      site: "https://lawrenceli.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5206\u5E03\u5F0F",
        "DevOps"
      ]
    },
    {
      id: "blog-23b9c568713da6d0",
      name: "Ziv Log",
      url: "https://zivlog.io/feed.xml",
      site: "https://zivlog.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6570\u5B66",
        "\u7269\u7406",
        "\u8BFB\u4E66",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-706cf6795705586f",
      name: "\u5F00\u6E90\u4E4B\u5FC3",
      url: "http://sht2019.cn/atom.xml",
      site: "http://sht2019.cn/",
      tags: [
        "\u54F2\u5B66",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-7548565ce9158fdd",
      name: "\u8424\u706B\u4E4B\u68EE",
      url: "http://frankorz.com/atom.xml",
      site: "http://frankorz.com/",
      tags: [
        "\u6E38\u620F\u5F00\u53D1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-ce8dc356a1746518",
      name: "\u4E0D\u5982\u5403\u8336\u53BB",
      url: "https://imhan.cn/feed.xml",
      site: "https://imhan.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-aa2012b5f23ffcfe",
      name: "\u8D30\u7339\u7684\u5C0F\u7A9D",
      url: "https://noionion.top/atom.xml",
      site: "https://noionion.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5206\u4EAB",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-6e560c8dbb6006a4",
      name: "\u65B9\u6CFD\u5F3A",
      url: "https://zeqiang.fun/index.xml",
      site: "https://zeqiang.fun/",
      tags: [
        "\u6570\u636E\u79D1\u5B66",
        "\u5730\u56FE\u6570\u636E\u53EF\u89C6\u5316",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4610760be1f513bb",
      name: "ChenYFan\u306EBlog",
      url: "https://blog.cyfan.top/atom.xml",
      site: "https://blog.cyfan.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-100b3c7f04dd8a77",
      name: "hiDandelion's Space",
      url: "https://www.hidandelion.com/rss",
      site: "https://www.hidandelion.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7269\u7406",
        "\u7B14\u8BB0",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-a46fb4722c52610a",
      name: "emperinter's blog",
      url: "https://www.emperinter.info/sitemap.rss",
      site: "https://www.emperinter.info/",
      tags: [
        "IT",
        "\u8BA1\u7B97\u673A",
        "\u5F71\u8BC4",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u4F53\u9A8C"
      ]
    },
    {
      id: "blog-37acec20cbb74c2c",
      name: "W4J1e's blog",
      url: "https://hin.cool/atom.xml",
      site: "https://hin.cool/",
      tags: [
        "\u5206\u4EAB",
        "\u8BB0\u5F55",
        "\u6280\u672F",
        "\u5199\u4F5C"
      ]
    },
    {
      id: "blog-e38458e0f586e9c0",
      name: "Leon.D's blog",
      url: "https://kongfandong.cn/blog/rss.xml",
      site: "https://kongfandong.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-5623449bb5c1ace9",
      name: "Fl0w3r",
      url: "https://yousazoe.top/atom.xml",
      site: "https://yousazoe.top/",
      tags: [
        "\u8BA1\u7B97\u673A\u56FE\u5F62\u5B66",
        "\u6E38\u620F\u5F00\u53D1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-788b331cf37723e2",
      name: "\u725B\u6D25\u7684\u535A\u5BA2",
      url: "https://blog.jinreal.com/index.xml",
      site: "https://blog.jinreal.com/",
      tags: [
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-e445b8a8e24ae092",
      name: "Haoxiang's Blog",
      url: "http://haoxiang.org/rss",
      site: "http://haoxiang.org/",
      tags: [
        "\u8BA1\u7B97\u673A\u89C6\u89C9",
        "\u7F16\u7A0B",
        "\u6E38\u620F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-043d13307ec6e6b1",
      name: "\u6D69\u5B50's Blog",
      url: "https://blog.lihaoya.com/rss",
      site: "https://blog.lihaoya.com/",
      tags: [
        "\u5168\u6808",
        "\u72EC\u7ACB\u5F00\u53D1\u8005",
        "\u7F16\u7A0B",
        "DevOps",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-e16b418fa3ab4852",
      name: "mengtnt\u7684Blog",
      url: "https://mengtnt.com/rss",
      site: "https://mengtnt.com/",
      tags: [
        "iOS",
        "\u79FB\u52A8\u7AEF\u5F00\u53D1",
        "\u7F16\u7A0B",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-7e65e38b2b0abad8",
      name: "Surager Blog",
      url: "https://surager.pub/feed.xml",
      site: "https://surager.pub/",
      tags: [
        "\u5B89\u5168",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-744e885c13153300",
      name: "ControlNet Blog",
      url: "https://controlnet.space/atom.xml",
      site: "https://controlnet.space/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-901964e6a8ea9541",
      name: "Amphibia",
      url: "https://iaarwu.github.io/index.xml",
      site: "https://iaarwu.github.io/",
      tags: [
        "Programming",
        "\u60F3\u6CD5"
      ]
    },
    {
      id: "blog-fbfe5f8374dd02ff",
      name: "Eluyee\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://www.eluyee.com/feed/",
      site: "https://www.eluyee.com/",
      tags: [
        "\u8DE8\u5883\u652F\u4ED8",
        "\u865A\u62DF\u5361",
        "\u4E9A\u9A6C\u900A"
      ]
    },
    {
      id: "blog-699f51c1b1d5e10d",
      name: "\u54B8\u7CD6\u7684\u535A\u5BA2",
      url: "https://vim0.com/index.xml",
      site: "https://vim0.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7406\u8D22",
        "\u60F3\u6CD5"
      ]
    },
    {
      id: "blog-92fe908a8f6e53e9",
      name: "Sanzo's Blog",
      url: "https://sanzo.top/atom.xml",
      site: "https://sanzo.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4cae66a26d0ef1b5",
      name: "Allen Hua \u7684\u7F51\u7EDC\u535A\u5BA2",
      url: "https://hellodk.cn/feed/",
      site: "https://hellodk.cn/",
      tags: [
        "\u7F16\u7A0B",
        "Linux",
        "\u540E\u7AEF",
        "\u7F51\u7EDC",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4e463f82a1647fc4",
      name: "7gugu's Blog",
      url: "https://www.7gugu.com/feed/",
      site: "https://www.7gugu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-48991939208c9e68",
      name: "std::bodun::blog",
      url: "https://www.bodunhu.com/blog/index.xml",
      site: "https://www.bodunhu.com/blog/",
      tags: [
        "Linux",
        "OS",
        "\u7F51\u7EDC",
        "\u7406\u8BBA",
        "Programming",
        "Others"
      ]
    },
    {
      id: "blog-2c111948561e963e",
      name: "\u7A0B\u5E8F\u5458\u5FC6\u521D",
      url: "https://www.developerastrid.com/index.xml",
      site: "https://www.developerastrid.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-8277182a1ee819ff",
      name: "\u963F\u822A\u7684\u6280\u672F\u5C0F\u7AD9",
      url: "https://www.bugcatt.com/feed",
      site: "https://www.bugcatt.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-ad7a8e6f2b567bc5",
      name: "QuarticCat's Blog",
      url: "https://blog.quarticcat.com/index.xml",
      site: "https://blog.quarticcat.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-7b64c6afbcaebd46",
      name: "\u9014\u4E2D\u7684\u6811",
      url: "https://zkpeace.com/blog-cn/atom.xml",
      site: "https://zkpeace.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u673A\u5668"
      ]
    },
    {
      id: "blog-ca06f6e12d7d2989",
      name: "LitStronger's notes",
      url: "http://fetchrss.com/rss/60e1767cf877a4023a2caee260e176387504cf483957bf43.xml",
      site: "https://liaoyq.club/",
      tags: [
        "\u524D\u7AEF\u7B14\u8BB0\uFF0C\u751F\u6D3B"
      ]
    },
    {
      id: "blog-5e6bb91c138f0a20",
      name: "WeepingDogel's Blog",
      url: "https://weepingdogel.github.io/index.xml",
      site: "https://weepingdogel.github.io/",
      tags: [
        "Linux",
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u5B89\u5168",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-01d246a27bb75590",
      name: "Lss233's.Blog();",
      url: "https://blog.lss233.com/rss/",
      site: "https://blog.lss233.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-c57d3f50e6ad4bf1",
      name: "\u8BFB\u5199\u9519\u8BEF",
      url: "https://ioerr.github.io/index.xml",
      site: "https://ioerr.github.io/",
      tags: [
        "\u6742\u6587",
        "\u8BFB\u4E66",
        "\u60F3\u6CD5",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-adfe220771c3a4cf",
      name: "Zhendong\u7684\u535A\u5BA2",
      url: "https://www.kxit.net/blog/feed/",
      site: "https://www.kxit.net/",
      tags: [
        "\u65E5\u5E38",
        "\u7B14\u8BB0",
        "\u751F\u6D3B",
        "\u6D4B\u8BC4",
        "\u7F16\u7A0B",
        "\u8D44\u8BAF"
      ]
    },
    {
      id: "blog-ef06e4fd123b0474",
      name: "f2h2h1's blog",
      url: "https://f2h2h1.github.io/rss.xml",
      site: "https://f2h2h1.github.io/",
      tags: [
        "\u7B14\u8BB0",
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-493b21607379d8b4",
      name: "Fidel's Lab",
      url: "https://fidel.js.org/rss.xml",
      site: "https://fidel.js.org/",
      tags: [
        "\u7F16\u7A0B",
        "OI",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-1c475f58c4cd991e",
      name: "Java for You",
      url: "https://java4u.cn/feed",
      site: "http://java4u.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u6280\u672F",
        "Java"
      ]
    },
    {
      id: "blog-d897a148086cad26",
      name: "Eason Yang's Blog",
      url: "https://easonyang.com/atom.xml",
      site: "https://easonyang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u67B6\u6784",
        "\u6280\u672F",
        "\u4EA7\u54C1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-7fb1bb906512d7aa",
      name: "\u5055\u81E7\u7684\u5C0F\u7AD9",
      url: "https://ifmet.cn/atom.xml",
      site: "https://ifmet.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-2ae7f12d5c65572b",
      name: "\u65C5\u884C\u8005\u7684\u968F\u60F3",
      url: "https://besscroft.com/rss.xml",
      site: "https://besscroft.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-edd8ead2e714e994",
      name: "3\u53F7\u5B9E\u9A8C\u5BA4",
      url: "https://www.labno3.com/feed/",
      site: "https://www.labno3.com/",
      tags: [
        "\u6811\u8393\u6D3E",
        "\u5F00\u53D1\u677F",
        "\u7F16\u7A0B",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-3faa06f954fb9cc6",
      name: "Shall We Code?",
      url: "https://www.waynerv.com/rss.xml",
      site: "https://www.waynerv.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "Linux",
        "\u4E91\u539F\u751F",
        "Kubernetes"
      ]
    },
    {
      id: "blog-659500c27ea74bcb",
      name: "\u80E1\u5B50\u7684\u72EC\u7ACB\u535A\u5BA2",
      url: "https://huzizi.com/feed/",
      site: "https://www.huzizi.com/",
      tags: [
        "\u666E\u62C9\u63D0",
        "\u5065\u8EAB",
        "\u751F\u6D3B",
        "\u65C5\u884C",
        "\u7A0B\u5E8F\u5458"
      ]
    },
    {
      id: "blog-b2d2bc7b4b8ba746",
      name: "ipfans",
      url: "https://www.4async.com/atom.xml",
      site: "https://www.4async.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-f91f0e9e46b36ff9",
      name: "Xudong's Blog",
      url: "https://misfork.com/atom.xml",
      site: "https://misfork.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-def1db9a0ce11951",
      name: "Simple code Simple life",
      url: "https://blog.halberd.cn/rss.xml",
      site: "https://blog.halberd.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u8BA1\u7B97\u673A",
        "\u751F\u6D3B\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-f5c02072897b3a45",
      name: "\u5434\u6DA6\u5199\u5B57\u7684\u5730\u65B9",
      url: "http://wu.run/atom.xml",
      site: "http://wu.run/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-4372c83cde71cff1",
      name: "Rainshaw's Blog",
      url: "https://blog.ruixiaolu.com/feed/",
      site: "https://blog.ruixiaolu.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u60F3",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-7c263721b8334a14",
      name: "Aemon's Blog",
      url: "https://aemoncao.github.io/rss2.xml",
      site: "https://aemoncao.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6298\u817E",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-34579e55cc80af7d",
      name: "\u601D\u4E3A\u8BF4",
      url: "https://siwei.io/index.xml",
      site: "https://siwei.io/",
      tags: [
        "\u56FE\u6570\u636E\u5E93",
        "\u7F16\u7A0B",
        "\u4E91\u8BA1\u7B97",
        "\u5927\u6570\u636E"
      ]
    },
    {
      id: "blog-be38680b6336cce3",
      name: "Marwin's Blog",
      url: "https://marwin.cn/rss2.xml",
      site: "https://marwin.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6570\u7801"
      ]
    },
    {
      id: "blog-8ebdf736afcb8b1f",
      name: "\u706B\u55B5\u65E5\u8BB0\u672C",
      url: "https://www.mmbkz.cn/feed",
      site: "https://www.mmbkz.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-d1246f660a9a432b",
      name: "\u5FA1\u5742\u7814\u7A76\u6240",
      url: "https://www.nosuchfield.com/atom.xml",
      site: "https://www.nosuchfield.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-8864aa6eb54739c6",
      name: "Acmic",
      url: "https://acmic.top/feed",
      site: "https://acmic.top/",
      tags: [
        "\u8BFB\u4E66",
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u7B14\u8BB0",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-417f625928630d9d",
      name: "\u7126\u70B9\u7684\u52A8\u529B\u7089",
      url: "https://dianjiaogit.github.io/feed.xml",
      site: "https://dianjiaogit.github.io/",
      tags: [
        "\u751F\u6D3B",
        "\u6742\u6587",
        "\u5206\u4EAB",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-1a73c638df364c03",
      name: "\u5F20\u6D69\u5728\u8DEF\u4E0A",
      url: "https://imzhanghao.com/atom.xml",
      site: "https://imzhanghao.com/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u8BA1\u7B97\u5E7F\u544A",
        "\u63A8\u8350\u7CFB\u7EDF",
        "\u6280\u672F\u53D8\u73B0"
      ]
    },
    {
      id: "blog-16b361dae94b8995",
      name: "\u51CC\u8D5F's blog",
      url: "https://www.zhukang.tech/feed.xml",
      site: "https://www.zhukang.tech/",
      tags: [
        "\u751F\u6D3B",
        "\u8BFB\u4E66",
        "\u601D\u8003",
        "\u56FD\u5B66",
        "\u7F16\u7A0B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-ad63f04564772ba4",
      name: "lowinli's blog",
      url: "https://lowin.li/atom.xml",
      site: "https://lowin.li/",
      tags: [
        "NLP",
        "AI",
        "\u5F00\u6E90",
        "\u751F\u6D3B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-96d7a2590147ca76",
      name: "\u540C\u548C\u6545\u4E8B\u532F",
      url: "https://hocassian.cn/feed/",
      site: "https://hocassian.cn/",
      tags: [
        "\u7DE8\u7A0B",
        "\u96A8\u7B46",
        "Galgame",
        "\u96DC\u8AC7"
      ]
    },
    {
      id: "blog-bcc29edc8610c3f9",
      name: "\u6728\u6FA4\u7684\u7814\u767C\u8166",
      url: "https://woodloch.blog/feed/",
      site: "https://woodloch.blog/",
      tags: [
        "\u7DE8\u7A0B",
        "\u958B\u6E90",
        "\u96A8\u7B46"
      ]
    },
    {
      id: "blog-442db2221babc159",
      name: "\u5468\u826F\u535A\u5BA2",
      url: "https://imzl.com/feed/",
      site: "https://imzl.com/",
      tags: [
        "\u4EA7\u54C1",
        "\u8FD0\u8425",
        "\u5546\u4E1A",
        "\u7F16\u7A0B",
        "WordPress",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c70fcc82b235aae2",
      name: "DGideas' Blog",
      url: "https://dgideas.net/feed/",
      site: "https://dgideas.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-e8f9065945cad327",
      name: "\u55B5\u4E8C\u306E\u5C0F\u535A\u5BA2",
      url: "https://www.miaoer.net/feed",
      site: "https://www.miaoer.net/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-e35d47d530fb4b8f",
      name: "nojsja'\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://nojsja.github.io/blogs/atom.xml",
      site: "https://nojsja.github.io/blogs/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u524D\u7AEF",
        "Linux"
      ]
    },
    {
      id: "blog-2383465c443c59f5",
      name: "itgoyo's blog",
      url: "https://itgoyo.github.io/atom.xml",
      site: "https://itgoyo.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "UP",
        "\u5B66\u4E60",
        "Vim",
        "Mac",
        "Linux"
      ]
    },
    {
      id: "blog-8b7ec464b9526d6a",
      name: "\u601D\u6CC9-Jev0n",
      url: "https://Jev0n.com/feed/",
      site: "https://jev0n.com/",
      tags: [
        "\u5B89\u5168",
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b1096249c1eec270",
      name: "\u6A58\u5B50\u5473\u7684\u5FC3",
      url: "https://www.52xml.cn/atom.xml",
      site: "https://www.52xml.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5B89\u5168",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-3fa45497a21aaad0",
      name: "hqingLau\u7684\u535A\u5BA2",
      url: "https://orzlinux.cn/index.html",
      site: "https://orzlinux.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "Linux",
        "Bug"
      ]
    },
    {
      id: "blog-6c64f84f5799b930",
      name: "\u6D9B\u53D4",
      url: "https://taoshu.in/feed.xml",
      site: "https://taoshu.in/",
      tags: [
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-3977b9f524a35e1e",
      name: "czp's blog",
      url: "https://www.hiczp.com/rss.xml",
      site: "https://www.hiczp.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7F51\u7EDC"
      ]
    },
    {
      id: "blog-a0dfc9ed6c80a002",
      name: "iMaeGoo's Blog",
      url: "https://www.imaegoo.com/atom.xml",
      site: "https://www.imaegoo.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "Serverless"
      ]
    },
    {
      id: "blog-6043d3f827a08648",
      name: "\u5927\u5927\u7684\u5C0F\u8717\u725B",
      url: "https://eallion.com/atom.xml",
      site: "https://eallion.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7535\u5546"
      ]
    },
    {
      id: "blog-58552498f4ea1262",
      name: "BAI YUN",
      url: "https://baiyun.me/feed",
      site: "https://baiyun.me/",
      tags: [
        "\u6280\u672F",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-79d102e9ced41a1e",
      name: "\u5B9D\u7855\u535A\u5BA2",
      url: "https://blog.baoshuo.ren/atom.xml",
      site: "https://blog.baoshuo.ren/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u524D\u7AEF",
        "\u540E\u7AEF",
        "\u5206\u4EAB",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-768216cef667f3f5",
      name: "\u6C89\u821F\u4FA7\u7554 Blog",
      url: "https://springwood.me/feed/",
      site: "https://springwood.me/",
      tags: [
        "\u6280\u672F",
        "\u65E5\u672C\u751F\u6D3B",
        "iOS",
        "macOS",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-f5829d7bc954e51c",
      name: "\u5B66\u65E0\u6B62\u5883@\u4E00\u70B9\u4E00\u6EF4",
      url: "http://yibie.github.io/index.xml",
      site: "http://gtdstudy.com/",
      tags: [
        "\u9605\u8BFB",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-b6933e2bc38ce584",
      name: "EdNovas\u7684\u5C0F\u7AD9",
      url: "https://ednovas.xyz/atom.xml",
      site: "https://ednovas.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "Linux",
        "\u79D1\u5B66\u4E0A\u7F51"
      ]
    },
    {
      id: "blog-ccc2ac22af107518",
      name: "wentao's blog",
      url: "https://wentao.org/index.xml",
      site: "https://wentao.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u9605\u8BFB",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-bc8e8db9e91d5b62",
      name: "\u8D3E\u8DC3\u534E",
      url: "https://www.jiayuehua.com/feed.xml",
      site: "https://www.jiayuehua.com/",
      tags: [
        "\u7F16\u7A0B",
        "C++\uFF0CLinux\uFF0C\u591A\u5F69\u4EBA\u751F"
      ]
    },
    {
      id: "blog-9ddeb7bda1bcc35b",
      name: "\u6728\u9E1F\u6742\u8BB0",
      url: "https://www.qtmuniao.com/atom.xml",
      site: "https://www.qtmuniao.com/",
      tags: [
        "\u5206\u5E03\u5F0F\u7CFB\u7EDF",
        "\u5B58\u50A8",
        "boltdb",
        "\u6E90\u7801\u9605\u8BFB"
      ]
    },
    {
      id: "blog-2b52a8fdfbfc1c40",
      name: "\u7389\u660EBLOG",
      url: "https://xdym11235.com/feed",
      site: "https://xdym11235.com/",
      tags: [
        "\u4FE1\u606F\u5B89\u5168"
      ]
    },
    {
      id: "blog-8a2fab2d87898bc5",
      name: "Godot's Blog",
      url: "https://iamgodot.com/posts/index.xml",
      site: "https://iamgodot.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-9bd399d53aed5f40",
      name: "ZingLix Blog",
      url: "https://zinglix.xyz/feed.xml",
      site: "https://zinglix.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-92457b68031b9262",
      name: "gyro\u6C38\u4E0D\u62BD\u98CE\uFF01",
      url: "https://gyrojeff.top/index.php/feed",
      site: "https://gyrojeff.top/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-3e335517f4e1112a",
      name: "DrPika's Blog",
      url: "https://blog.drpika.com/atom.xml",
      site: "https://blog.drpika.com/",
      tags: [
        "\u533B\u5B66",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u653F\u6CBB"
      ]
    },
    {
      id: "blog-3498b9ab780b3f60",
      name: "whyes\u7684\u535A\u5BA2",
      url: "https://whyes.org/feed.xml",
      site: "https://whyes.org/",
      tags: [
        "\u533B\u5B66",
        "\u79D1\u7814",
        "\u4E34\u5E8A\u7814\u7A76",
        "\u786C\u4EF6"
      ]
    },
    {
      id: "blog-01047dc349a6f9b0",
      name: "\u661F\u8FB0\u65E5\u8BB0",
      url: "https://blog.xsot.cn/feed",
      site: "https://blog.xsot.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-01b23718db66774b",
      name: "\u98CE\u96E8\u96F7\u7535\u5802",
      url: "https://www.linchangyu.com/feed.xml",
      site: "https://www.linchangyu.com/",
      tags: [
        "\u6781\u5BA2",
        "\u7F16\u7A0B",
        "UX"
      ]
    },
    {
      id: "blog-878cefd6c4c5408b",
      name: "White Space",
      url: "https://whites.space/feed",
      site: "https://whites.space/",
      tags: [
        "\u8BBE\u8BA1\u968F\u7B14",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-ab1795dbc1cfaede",
      name: "\u975E\u5B66\xB7\u6D3E",
      url: "https://fxpai.com/feed",
      site: "https://fxpai.com/",
      tags: [
        "\u6444\u5F71",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-aac2d7122c37d58f",
      name: "Ayx \u535A\u5BA2",
      url: "https://imayx.top/index.xml",
      site: "https://imayx.top/",
      tags: [
        "\u4FE1\u606F\u5B66\u7ADE\u8D5B",
        "C++",
        "\u7B97\u6CD5",
        "\u7F16\u7A0B",
        "\u60F3\u6CD5",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u5206\u4EAB",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-77088a44e87b3fab",
      name: "\u5FD8\u5FE7 \u5FD8\u5FE7\u7684\u5C0F\u7AD9",
      url: "https://wangyou233.wang/rss",
      site: "https://wangyou233.wang/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b10439652a324750",
      name: "\u7F51\u7EDC\u70ED\u5EA6",
      url: "https://www.packetmania.net/atom.xml",
      site: "https://www.packetmania.net/",
      tags: [
        "\u7F51\u7EDC",
        "\u7F16\u7A0B",
        "\u5BC6\u7801\u5B66"
      ]
    },
    {
      id: "blog-e794da76acae6c7b",
      name: "\u87F9\u58F3",
      url: "https://shellc.cn/feed.xml",
      site: "https://shellc.cn/",
      tags: [
        "\u6280\u672F",
        "\u8BFB\u4E66",
        "\u521B\u4E1A",
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-8adf849dbdfd7e0c",
      name: "icebreaker",
      url: "https://www.icebreaker.top/rss.xml",
      site: "https://www.icebreaker.top/",
      tags: [
        "\u5927\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5373\u65F6\u6218\u7565"
      ]
    },
    {
      id: "blog-406fa0e727d3cbb3",
      name: "\u95F2\u8DA3\u65E5\u8BC4",
      url: "https://xqrp.com/feed",
      site: "https://xqrp.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7B14\u8BB0",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-3a50c127a492976e",
      name: "\u6106\u4F0F",
      url: "https://www.tortorse.com/atom.xml",
      site: "https://www.tortorse.com/",
      tags: [
        "\u4EA7\u54C1",
        "\u524D\u7AEF",
        "\u8BBE\u8BA1",
        "\u6742\u8C08"
      ]
    },
    {
      id: "blog-4eff40f1d773176c",
      name: "Librehat's Blog",
      url: "https://www.librehat.com/feed",
      site: "https://www.librehat.com/",
      tags: [
        "C++",
        "Qt",
        "Python",
        "Linux",
        "Windows",
        "\u7F51\u7EDC",
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-2a0692c31646d65b",
      name: "\u51AF\u5144\u8BDD\u5409\u535A\u5BA2",
      url: "https://fengmengzhao.github.io/feed.xml",
      site: "https://fengmengzhao.github.io/",
      tags: [
        "Java",
        "Linux",
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-389ce89775c1cd8d",
      name: "\u5F53\u4EE3\u5199\u4F5C\u4ED3\u5E93",
      url: "https://zuopin.jingluole.com/feed",
      site: "https://zuopin.jingluole.com/",
      tags: [
        "\u7EAF\u6587\u5B66",
        "\u5199\u4F5C",
        "\u5C0F\u8BF4",
        "\u8BD7\u6B4C",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-3cfaf524276ef0fe",
      name: "\u7A0B\u5E8F\u733FDD",
      url: "https://blog.didispace.com/atom.xml",
      site: "https://blog.didispace.com/",
      tags: [
        "Java",
        "Spring",
        "\u7F16\u7A0B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-1fe89e83d720a104",
      name: "\u6B65\u4E08\u4E5D\u5DDE\u7684\u535A\u5BA2",
      url: "https://www.buzhangjiuzhou.com/index.php/feed/",
      site: "https://www.buzhangjiuzhou.com/",
      tags: [
        "\u535A\u5BA2",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-ed576c7c0e7c6773",
      name: "SKYue's Home",
      url: "https://www.skyue.com/feed/",
      site: "https://www.skyue.com/",
      tags: [
        "\u751F\u6D3B",
        "\u80A1\u7968\u6295\u8D44",
        "\u4EA7\u54C1\u7ECF\u7406",
        "\u8F6F\u4EF6\u6570\u7801"
      ]
    },
    {
      id: "blog-8770956e7178d69d",
      name: "BBing's Blog",
      url: "https://www.bbing.com.cn/index.xml",
      site: "https://www.bbing.com.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7f44374b8ecbfd94",
      name: "lzw-723's blog",
      url: "https://lzw-723.github.io/atom.xml",
      site: "https://blog.lzwi.fun/",
      tags: [
        "\u7F16\u7A0B",
        "\u7FFB\u8BD1",
        "\u5199\u4F5C",
        "\u52A8\u753B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-6fd2599cb7a3c41a",
      name: "2BAB \u7684\u5DE5\u7A0B\u535A\u5BA2",
      url: "https://2bab.me/atom.xml",
      site: "https://2bab.me/",
      tags: [
        "Android",
        "\u7F16\u8BD1\u6784\u5EFA"
      ]
    },
    {
      id: "blog-8dcaa2c7add1ae4b",
      name: "ypingcn's blog",
      url: "https://blog.ypingcn.com/feed.xml",
      site: "https://blog.ypingcn.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u5206\u4EAB",
        "\u706B\u72D0",
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-261b645fa4c04cd0",
      name: "LCZBlog",
      url: "https://blog.licaoz.com/feed/",
      site: "https://blog.licaoz.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-e74906223bceda8e",
      name: "Surmon.me",
      url: "https://surmon.me/rss.xml",
      site: "https://surmon.me/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-ac8dbc2bdf21224a",
      name: "ZhensJoke \u98DE\u4E91\u7B97",
      url: "https://blog.fyun.org/feed",
      site: "https://blog.fyun.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-3f3850f44a18a254",
      name: "\u5343\u53E4\u58F9\u53F7",
      url: "https://qianguyihao.com/atom.xml",
      site: "https://www.qianguyihao.com/",
      tags: [
        "\u524D\u7AEF",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u4EA7\u54C1\u601D\u8003",
        "\u8F6F\u4EF6\u5DE5\u5177",
        "\u5177\u4F53\u751F\u6D3B"
      ]
    },
    {
      id: "blog-c265f5fe1171c128",
      name: "Kevin Blog",
      url: "https://blog.kevinzhow.com/rss/",
      site: "https://blog.kevinzhow.com/",
      tags: [
        "\u4EA7\u54C1",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-f57a638ecb8e7d26",
      name: "Tmr Blog",
      url: "https://blog.xlab.app/atom.xml",
      site: "https://blog.xlab.app/",
      tags: [
        "\u5B89\u5168",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-a12e644ffd6754b0",
      name: "\u5C0F\u7403\u98DE\u9C7C",
      url: "https://mantyke.icu/index.xml",
      site: "https://mantyke.icu/",
      tags: [
        "\u751F\u6D3B",
        "\u7B14\u8BB0",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-008b4dbe0a6a98a8",
      name: "\u7D20\u5C65\u72EC\u884C",
      url: "https://blog.yuanpei.me/atom.xml",
      site: "https://blog.yuanpei.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-803255a995435957",
      name: "\u5F00\u98DE\u673A\u7684\u8001\u5F20",
      url: "https://kaifeiji.cc/atom.xml",
      site: "https://kaifeiji.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u624B\u5DE5",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0048e20b09841f14",
      name: "jdhao's blog",
      url: "https://jdhao.github.io/index.xml",
      site: "https://jdhao.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "Nvim",
        "\u751F\u6D3B",
        "\u8BFB\u4E66",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-0d40be26f931c4c2",
      name: "\u738B\u5C0F\u55E8\u7684\u4E0D\u8001\u6B4C",
      url: "https://sogola.com/index.xml",
      site: "https://sogola.com/",
      tags: [
        "\u9A6C\u514B\u601D\u4E3B\u4E49",
        "\u5DE5\u4EBA",
        "\u5DE5\u5382",
        "\u8BFB\u4E66",
        "\u7FFB\u8BD1"
      ]
    },
    {
      id: "blog-495459235b298d65",
      name: "\u4E1C\u6CFD\u716E\u7CA5",
      url: "https://eurychen.me/index.xml",
      site: "https://eurychen.me/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u533A\u5757\u94FE",
        "\u97F3\u4E50",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-5c933253194d6591",
      name: "icy's blog",
      url: "https://icys.top/atom.xml",
      site: "https://icys.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-da33db2661274884",
      name: "Alliot's blog",
      url: "https://blog.alliot.tech/atom.xml",
      site: "https://blog.alliot.tech/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u8FD0\u7EF4",
        "\u786C\u4EF6"
      ]
    },
    {
      id: "blog-ec3a57c1dddfcc03",
      name: "\u7A0B\u5E8F\u5458\u5145\u7535\u7AD9",
      url: "https://itcharge.cn/feed/",
      site: "https://itcharge.cn/",
      tags: [
        "iOS",
        "\u7B97\u6CD5",
        "\u6570\u636E\u7ED3\u6784",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-d04b22b1b7243269",
      name: "Yuk\u7684\u90E8\u843D\u683C",
      url: "https://blog.yuk7.com/atom.xml",
      site: "https://blog.yuk7.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7ED8\u753B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-78a6233ab9c3a513",
      name: "Domon",
      url: "https://www.domon.cn/rss/",
      site: "https://www.domon.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-f013ac8b98b25ff2",
      name: "[\u7C73\u968F\u968F] s5s5",
      url: "https://s5s5.me/feed/",
      site: "https://s5s5.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-49d7f5315edb73d0",
      name: "Dvel's Blog",
      url: "https://dvel.me/index.xml",
      site: "https://dvel.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-49c5eb3d1105c4d3",
      name: "\u9ED1\u7FBD\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://blog.thetbw.xyz/atom.xml",
      site: "https://blog.thetbw.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-107ca8081f4c520a",
      name: "\u5C71\u6708",
      url: "https://sanguok.com/feed/",
      site: "https://sanguok.com/",
      tags: [
        "\u6587\u827A",
        "\u6587\u5B66",
        "\u5F71\u89C6",
        "\u8BED\u8A00",
        "\u65E5\u8BED",
        "\u65B9\u8A00",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-5de23fbcb18c9202",
      name: "\u521D\u4E4B\u97F3",
      url: "https://www.himiku.com/feed",
      site: "https://www.himiku.com/",
      tags: [
        "\u52A8\u753B",
        "\u6E38\u620F",
        "\u65E5\u5E38",
        "\u4E8C\u6B21\u5143"
      ]
    },
    {
      id: "blog-ab040ab2f912e89a",
      name: "L\u306EWorld",
      url: "https://lllgoyour.com/feed/",
      site: "https://lllgoyour.com/",
      tags: [
        "\u52A8\u753B",
        "\u6587\u5B66",
        "\u8BED\u8A00",
        "\u5B66\u672F",
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u4E8C\u6B21\u5143",
        "\u97F3\u4E50",
        "\u7F16\u7A0B",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-1b4aa7cbf6f7a779",
      name: "\u7AF9\u6797\u91CC\u6709\u51B0\u7684\u535A\u5BA2",
      url: "https://zhul.in/rss.xml",
      site: "https://zhul.in/",
      tags: [
        "\u6280\u672F",
        "\u6298\u817E",
        "\u7B14\u8BB0",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-1acf2011ec29ed9c",
      name: "\u4E00\u9897\u5C0F\u6811",
      url: "https://yeshu.cloud/atom.xml",
      site: "https://yeshu.cloud/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6295\u8D44"
      ]
    },
    {
      id: "blog-db976fd2b3f13f2c",
      name: "Huiliu",
      url: "https://fucktheworld.top/atom.xml",
      site: "https://fucktheworld.top/",
      tags: [
        "\u6444\u5F71",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-0c48f32b737d9197",
      name: "yiyun's Blog",
      url: "https://moeci.com/atom.xml",
      site: "https://moeci.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5168\u6808",
        "\u673A\u5668\u5B66\u4E60"
      ]
    },
    {
      id: "blog-68520950093b2249",
      name: "EE Archeology \u7535\u5B50\u8003\u53E4\u5B66",
      url: "http://7400.me/atom.xml",
      site: "http://7400.me/",
      tags: [
        "\u786C\u4EF6",
        "\u6444\u5F71",
        "\u6298\u817E",
        "\u65E0\u7EBF\u7535"
      ]
    },
    {
      id: "blog-7e99347d8e2c378c",
      name: "\u8D6B\u5C14\u7C73\u5A1C\u53CA\u5176\u4ED6",
      url: "https://hermine.in/atom.xml",
      site: "https://hermine.in/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8e13c9b4367ced0b",
      name: "jtr109's Castle",
      url: "https://www.jtr109.com/index.xml",
      site: "https://jtr109.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-3c02197095d8f522",
      name: "\u4E54\u514B\u53D4\u53D4\u7684\u5E8A\u8FB9\u6545\u4E8B",
      url: "https://lifeodyssey.github.io/atom.xml",
      site: "https://lifeodyssey.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u9065\u611F",
        "\u79D1\u7814"
      ]
    },
    {
      id: "blog-666a62db15f7b4c3",
      name: "\u5370\u8BB0",
      url: "https://yinji.org/feed",
      site: "https://yinji.org/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-82f9f2084b1f57ed",
      name: "\u6797\u6797\u6742\u8BED",
      url: "https://www.xiaozonglin.cn/feed/",
      site: "https://www.xiaozonglin.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-4cd7029a6d7ef6f3",
      name: "\u4E00\u53F6\u658B",
      url: "https://xieguanglei.github.io/blog/feed.xml",
      site: "https://xieguanglei.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-2eed24bfdbfb24de",
      name: "WangDeer",
      url: "https://w.toomore.us/index.xml",
      site: "https://w.toomore.us/",
      tags: [
        "\u751F\u6D3B",
        "\u8BFB\u4E66",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-9d0a429dcf88073f",
      name: "Wenxuan 1999",
      url: "https://www.whexy.com/feed/feed.xml",
      site: "https://www.whexy.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B89\u5168",
        "\u7CFB\u7EDF"
      ]
    },
    {
      id: "blog-d56f250cc3ca7694",
      name: "\u5C79\u94ED\u8BF4",
      url: "https://www.iccat.cn/feed",
      site: "https://www.iccat.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u9605\u8BFB",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-6cdd9b87fe9a8156",
      name: "JohnSmith\u7684\u5C0F\u5BB6",
      url: "https://xsn123.top/feed/",
      site: "https://xsn123.top/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u7F16\u7A0B",
        "\u79D1\u7814"
      ]
    },
    {
      id: "blog-0d3e5aabaf685ef3",
      name: "ShineKid",
      url: "https://shinekid.com/feed/",
      site: "https://shinekid.com/",
      tags: [
        "\u751F\u6D3B",
        "\u5F71\u89C6",
        "\u6587\u5B66"
      ]
    },
    {
      id: "blog-f7265378223af53f",
      name: "An's Blog",
      url: "https://zincnode.com/index.xml",
      site: "https://zincnode.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-bce30cd6f6f02c40",
      name: "\u7F57\u4E8C\u5FB7",
      url: "https://lorde627.xyz/atom.xml",
      site: "https://Lorde627.xyz/",
      tags: [
        "\u6298\u817E",
        "\u751F\u6D3B",
        "\u6570\u5B57"
      ]
    },
    {
      id: "blog-c74540a535b659fa",
      name: "zStack",
      url: "https://blog.noicdi.com/atom.xml",
      site: "https://blog.noicdi.com/",
      tags: [
        "\u7B14\u8BB0",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-d77da1f5a450a088",
      name: "\u70E7\u997C\u535A\u5BA2",
      url: "https://u.sb/rss.xml",
      site: "https://u.sb/",
      tags: [
        "\u8FD0\u7EF4",
        "\u57DF\u540D"
      ]
    },
    {
      id: "blog-00134be2d3024bb2",
      name: "Lei Mao's Log Book",
      url: "https://leimao.github.io/atom.xml",
      site: "https://leimao.github.io/",
      tags: [
        "\u4EBA\u5DE5\u667A\u80FD",
        "\u673A\u5668\u5B66\u4E60",
        "\u8BA1\u7B97\u673A\u79D1\u5B66",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-42624d2a99f3a99f",
      name: "gd1214b's blog",
      url: "https://blog.gd1214b.icu/atom.xml",
      site: "https://blog.gd1214b.icu/",
      tags: [
        "\u6280\u672F",
        "\u65F6\u8BC4"
      ]
    },
    {
      id: "blog-2ac7f7c47e7e2029",
      name: "Sirius's Blog",
      url: "https://blog.yeefire.com/atom.xml",
      site: "https://blog.yeefire.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u8FD0\u7EF4",
        "\u751F\u6D3B",
        "Linux",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-4d4703a4269e59b7",
      name: "7Wate`s Blog",
      url: "https://blog.7wate.com/rss.xml",
      site: "https://blog.7wate.com/",
      tags: [
        "\u751F\u6D3B",
        "\u5F00\u53D1",
        "\u65C5\u884C",
        "\u6444\u5F71",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-e626aaa7994112f6",
      name: "\u884C\u8FD0\u8BBE\u8BA1\u5E08",
      url: "https://www.luckydesigner.space/feed",
      site: "https://www.luckydesigner.space/",
      tags: [
        "\u7F16\u7A0B",
        "\u5206\u4EAB",
        "\u6280\u672F",
        "\u79D1\u6280"
      ]
    },
    {
      id: "blog-4bc2e7aab910609f",
      name: "\u53F8\u9A6C\u4ED6",
      url: "https://www.congcong.us/feed",
      site: "https://www.congcong.us/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-7302afaa6e1d335e",
      name: "elmagnifico",
      url: "http://elmagnifico.tech/feed.xml",
      site: "http://elmagnifico.tech/",
      tags: [
        "\u5D4C\u5165\u5F0F",
        "\u968F\u7B14",
        "\u6E38\u620F",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-e4ebf88846cdd6f9",
      name: "\u9648\u6631\u884C\u535A\u5BA2",
      url: "https://blog.yuhang.ch/index.xml",
      site: "https://blog.yuhang.ch/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-809b4d214796331c",
      name: "\u51B0\u4EE5\u4E1C\u7684\u535A\u5BA2",
      url: "https://bninecoding.com/atom.xml",
      site: "https://bninecoding.com/",
      tags: [
        "iOS",
        "\u7F16\u7A0B",
        "\u804C\u573A",
        "\u4EA7\u54C1\u89C2",
        "\u6280\u672F\u65B9\u6848"
      ]
    },
    {
      id: "blog-90708b1d48ffca18",
      name: "inDev. Journal",
      url: "https://www.frankindev.com/feed.xml",
      site: "https://www.frankindev.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5206\u4EAB",
        "\u6280\u672F",
        "\u79D1\u6280"
      ]
    },
    {
      id: "blog-701fc2f801bc389a",
      name: "\u7A46\u91CE\u971C\u6CC9\u7684\u9ED1\u6D1E",
      url: "https://muyesq.cn/index.xml",
      site: "https://muyesq.cn/",
      tags: [
        "\u8BD7\u6B4C",
        "\u6587\u5B66"
      ]
    },
    {
      id: "blog-485e89b8c98ba41d",
      name: "\u6742\u70E9\u996D",
      url: "https://zahui.fan/index.xml",
      site: "https://zahui.fan/",
      tags: [
        "\u7F16\u7A0B",
        "\u8FD0\u7EF4",
        "\u6280\u672F",
        "\u6298\u817E",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-10bc93a2647cc70d",
      name: "conge",
      url: "https://conge.github.io/feed.xml",
      site: "https://conge.github.io/",
      tags: [
        "\u751F\u6D3B",
        "\u8DD1\u6B65",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-f9553c8a5c4f05f2",
      name: "zd\u5C0F\u8FBE's blog",
      url: "https://blog.zhangda.xyz/feed/",
      site: "https://blog.zhangda.xyz/",
      tags: [
        "\u6280\u672F",
        "\u6298\u817E",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-a40a577fbd849052",
      name: "\u50CF\u6E05\u6C34\u4E00\u822C\u6E05\u6F88\u900F\u660E",
      url: "https://sumsec.me/resources/atom.xml",
      site: "https://sumsec.me/",
      tags: [
        "\u6280\u672F",
        "\u5B89\u5168",
        "\u751F\u6D3B",
        "Java\u5B89\u5168"
      ]
    },
    {
      id: "blog-45241df422a2b991",
      name: "ROYWANG",
      url: "https://roy.wang/feed/",
      site: "https://roy.wang/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u65E5\u8BB0"
      ]
    },
    {
      id: "blog-1aabf388eee72dec",
      name: "Vulkey_Chen's Blog",
      url: "https://gh0st.cn/feed.xml",
      site: "https://gh0st.cn/",
      tags: [
        "\u5B89\u5168",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-3d75cef3110de509",
      name: "zjun's blog",
      url: "https://blog.zjun.info/rss.xml",
      site: "https://blog.zjun.info/",
      tags: [
        "\u5B89\u5168",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-a7aa4f412b17e031",
      name: "RUNNINGJ",
      url: "https://runningj.top/feed.xml",
      site: "https://runningj.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u9605\u8BFB",
        "\u7F8E\u98DF",
        "\u521B\u4E1A"
      ]
    },
    {
      id: "blog-823d60810d29d4f9",
      name: "\u7985\u623F\u82B1\u6728",
      url: "https://jdqiong.cn/rss.xml",
      site: "https://jdqiong.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u521B\u4F5C"
      ]
    },
    {
      id: "blog-e18b8c1b372eee85",
      name: "Frange Zone\uFF5CXu's Blog",
      url: "https://frangezone.github.io/index.xml",
      site: "https://frangezone.github.io/",
      tags: [
        "\u4EA7\u54C1",
        "\u751F\u6D3B",
        "\u6570\u7801",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-82c4bcb6bba028cf",
      name: "\u7A0B\u5E8F\u5458\u7684\u55B5",
      url: "https://catcoding.me/atom.xml",
      site: "https://catcoding.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5199\u4F5C",
        "\u9605\u8BFB",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-848d4c9778efa046",
      name: "\u540E\u7AEF\u5DE5\u7A0B\u5E08",
      url: "https://hdgcs.com/feed.xml",
      site: "https://hdgcs.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5F00\u6E90",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-7328790d5f5da067",
      name: "BlogKe\u8BB0\u5F55\u5FD7",
      url: "https://blogke.cn/index.xml",
      site: "https://blogke.cn/index.html",
      tags: [
        "\u7B14\u8BB0",
        "\u60F3\u6CD5"
      ]
    },
    {
      id: "blog-2313030567fa749f",
      name: "nickChenyx",
      url: "https://nickchenyx.github.io/atom.xml",
      site: "https://nickchenyx.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-a1baf2eb3b9463da",
      name: "\u8BA9\u6211\u4EEC\u4E00\u8D77\u53D1\u73B0\u897F\u897F\u91CC\u5C9B",
      url: "https://mattia88.com/feed/",
      site: "https://mattia88.com/",
      tags: [
        "\u897F\u897F\u91CC\u4EBA",
        "\u897F\u897F\u91CC\u65C5\u6E38"
      ]
    },
    {
      id: "blog-b2315981be0d2c2e",
      name: "Shadow Walker \u677E\u70DF\u9601",
      url: "https://www.edony.ink/rss/",
      site: "https://www.edony.ink/",
      tags: [
        "Linux \u64CD\u4F5C\u7CFB\u7EDF\u5B89\u5168",
        "LSM",
        "ebpf",
        "\u57FA\u7840\u8BBE\u65BD\u53EF\u4FE1",
        "\u4EA7\u54C1\u601D\u8003",
        "\u6570\u5B57\u82B1\u56ED",
        "Obsidian"
      ]
    },
    {
      id: "blog-765430fbffd22e49",
      name: "\u70DF\u8349\u7684\u9999\u5473",
      url: "https://hujingnb.com/feed",
      site: "https://hujingnb.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-d92181606b544c27",
      name: "SpaceTime Blog",
      url: "https://blog.spacetimee.xyz/atom.xml",
      site: "https://blog.spacetimee.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-abc3e3fe739d7ffb",
      name: "\u98DE\u7FD4\u6CAB\u6CAB\u60C5\u535A\u5BA2",
      url: "https://www.fxkjnj.com/feed/",
      site: "https://fxkjnj.com/",
      tags: [
        "\u79D1\u6280",
        "\u8FD0\u7EF4",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-1a0b869d92e55f6d",
      name: "\u5E06\u57DF - \u5E06\u5E06\u7684\u4E2A\u4EBA\u7AD9",
      url: "https://www.fancraft.top/feed/",
      site: "https://www.fancraft.top/",
      tags: [
        "\u5B66\u4E1A",
        "\u7F16\u7A0B",
        "\u5174\u8DA3",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-6f1a17500c6e5fa9",
      name: "Jieran233's Blog",
      url: "https://jieran233.github.io/feed.xml",
      site: "https://jieran233.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-d14ada2e991a4801",
      name: "Zkeq\u306ECoding\u65E5\u5FD7",
      url: "https://icodeq.com/feed.xml",
      site: "https://icodeq.com/",
      tags: [
        "\u7F16\u7A0B",
        "Python"
      ]
    },
    {
      id: "blog-889932b92c48e765",
      name: "Redish101\u535A\u5BA2",
      url: "https://blog.redish101.top/atom.xml",
      site: "https://blog.redish101.top/",
      tags: [
        "Python",
        "Java",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0a349425fbfa0800",
      name: "Amicoyuan\u7684\u9AD8\u6027\u80FD\u8BA1\u7B97\u4E16\u754C",
      url: "https://my-rssh-gwb5d33jd-amicoyuan.vercel.app/hexo/fluid/xingyuanjie.top",
      site: "https://xingyuanjie.top/",
      tags: [
        "\u9AD8\u6027\u80FD\u8BA1\u7B97",
        "\u5E76\u884C\u8BA1\u7B97",
        "\u6027\u80FD\u4F18\u5316",
        "\u7B97\u6CD5"
      ]
    },
    {
      id: "blog-0489c2a168a3daa7",
      name: "Measure Zero",
      url: "https://shiina18.github.io/atom.xml",
      site: "https://shiina18.github.io/",
      tags: [
        "\u7B14\u8BB0",
        "\u6E38\u620F",
        "\u673A\u5668\u5B66\u4E60"
      ]
    },
    {
      id: "blog-35e38b60eead4d75",
      name: "Sc's \u795E\u5947\u7684JavaWeb",
      url: "https://shicheng.cool/atom.xml",
      site: "https://shicheng.cool/",
      tags: [
        "Java",
        "SSM",
        "Linux",
        "\u524D\u540E\u7AEF"
      ]
    },
    {
      id: "blog-94343ecca47c0a2f",
      name: "openSUSE \u4E2D\u6587\u793E\u533A",
      url: "https://suse.org.cn/feed.xml",
      site: "https://suse.org.cn/",
      tags: [
        "Linux",
        "openSUSE",
        "\u65B0\u95FB",
        "\u672C\u5730\u5316"
      ]
    },
    {
      id: "blog-8877d7cd5a69ba8a",
      name: "D2PE",
      url: "https://d2pe.com/atom.xml",
      site: "https://d2pe.com/",
      tags: [
        "\u91D1\u878D",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-fad8f728d6d54231",
      name: "Moeif",
      url: "https://blog.moeif.com/index.xml",
      site: "https://blog.moeif.com/",
      tags: [
        "\u72EC\u7ACB\u5F00\u53D1",
        "\u6280\u672F",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-cfeea54d5416e1a5",
      name: "\u9891\u7387 - \u98CE\u5377\u8FC7\u7684\u8D77\u70B9",
      url: "https://pinlyu.com/feed/",
      site: "https://pinlyu.com/",
      tags: [
        "\u968F\u7B14",
        "\u89C2\u70B9",
        "\u751F\u6D3B",
        "\u5F71\u89C6"
      ]
    },
    {
      id: "blog-5b3148d1696e5e28",
      name: "Peacalm Notes - \u53CC\u5168\u7684\u7F51\u7AD9",
      url: "https://lishuangquan.cn/index.xml",
      site: "https://lishuangquan.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u4E92\u8054\u7F51",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-a0c278c682b5a3c4",
      name: "icodex - \u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://icodex.me/atom.xml",
      site: "https://icodex.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u4E92\u8054\u7F51",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-6ca8dad181aa82ec",
      name: "shrik3",
      url: "https://shrik3.com/index.xml",
      site: "https://shrik3.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-0382958dce74571c",
      name: "MegaMU\u4E2A\u4EBA\u7AD9",
      url: "https://megamu.icu/feed.xml",
      site: "https://megamu.icu/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6821\u56ED",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-bf538db59644f825",
      name: "Rei's Blog",
      url: "https://rei.ac/index.xml",
      site: "https://rei.ac/",
      tags: [
        "\u6280\u672F",
        "\u7B97\u6CD5",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-5bc27b0ee3e70c28",
      name: "yonniye's blog",
      url: "https://yonniye.com/feed",
      site: "https://yonniye.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5730\u4FE1",
        "Python",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-643e6acd3c6ebba5",
      name: "Cubik\u7684\u5C0F\u7AD9",
      url: "https://cubik65536.top/atom.xml",
      site: "http://cubik65536.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u53D1",
        "\u6298\u817E",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-4c94ab053bfdf21c",
      name: "Peijie's Wiki",
      url: "https://liupj.top/atom.xml",
      site: "https://liupj.top/",
      tags: [
        "CS",
        "\u6298\u817E",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-1ee16b47ed518f0d",
      name: "Yunfeng's Simple Blog",
      url: "https://vra.github.io/atom.xml",
      site: "https://vra.github.io/",
      tags: [
        "\u8BA1\u7B97\u673A\u89C6\u89C9",
        "Linux",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-3220380a653cecc0",
      name: "Lao_Liu's Blog",
      url: "https://blog.laoliu.eu.org/atom.xml",
      site: "https://blog.laoliu.eu.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5F00\u53D1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-8846405a80af8d17",
      name: "QAIU's Blog",
      url: "https://blog.qaiu.top/rss.xml",
      site: "https://blog.qaiu.top/",
      tags: [
        "\u624B\u673A\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5F00\u53D1",
        "\u6559\u7A0B",
        "C4droid"
      ]
    },
    {
      id: "blog-de64767f82d371c7",
      name: "\u597D\u5DE5\u5177\u5468\u520A",
      url: "https://bestxtools.github.io/atom.xml",
      site: "https://bestxtools.github.io/",
      tags: [
        "\u5DE5\u5177",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u8BBE\u8BA1"
      ]
    },
    {
      id: "blog-8b79d7a0a76d844a",
      name: "\u72EC\u7ACB\u5F00\u53D1\u53D8\u73B0\u5468\u520A",
      url: "https://www.ezindie.com/feed/rss.xml",
      site: "https://www.ezindie.com/",
      tags: [
        "\u72EC\u7ACB\u5F00\u53D1\u8005",
        "\u5F00\u53D1"
      ]
    },
    {
      id: "blog-fa90e95e2850db36",
      name: "\u8FD0\u7EF4\u5496\u5561\u5427",
      url: "https://blog.ops-coffee.cn/feed.xml",
      site: "https://blog.ops-coffee.cn/",
      tags: [
        "devops",
        "\u8FD0\u7EF4",
        "\u81EA\u52A8\u5316\u5F00\u53D1",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-5da14aea8f2f0e1c",
      name: "EINDEX's Blog",
      url: "https://eindex.me/feed.xml",
      site: "https://eindex.me/",
      tags: [
        "\u540E\u7AEF",
        "\u7B97\u6CD5",
        "\u5E94\u7528\u5B89\u5168",
        "HomeLab",
        "\u6444\u5F71",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-cd6cfd9721fbf5d0",
      name: "OK Computer\u300C\u597D\u7535\u8111\u300D",
      url: "https://wumanho.cn/index.xml",
      site: "https://wumanho.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u524D\u7AEF",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-3e4fbd957a99ebec",
      name: "\u8FDC\u98DE\u95F2\u8BB0",
      url: "https://leonhe.cn/index.xml",
      site: "https://leonhe.cn/",
      tags: [
        "\u9605\u8BFB",
        "\u601D\u8003",
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-57d6ecebab1bb0a5",
      name: "Pseudoyu",
      url: "https://www.pseudoyu.com/zh/index.xml",
      site: "https://www.pseudoyu.com/",
      tags: [
        "\u533A\u5757\u94FE",
        "\u7F16\u7A0B",
        "\u5DE5\u5177",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ac828cbda4575678",
      name: "Starfury",
      url: "http://starfury.tech/feed",
      site: "http://starfury.tech/",
      tags: [
        "\u6280\u672F",
        "\u67B6\u6784",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-5c98d1c0401ad41f",
      name: "\u6234\u515C\u7684\u5C0F\u5C4B",
      url: "https://daidr.me/feed",
      site: "https://daidr.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-3081993327aee2b4",
      name: "Timochan\u306EBlog",
      url: "https://www.timochan.cn/feed",
      site: "https://www.timochan.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B89\u5168",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-b654cc50572177cd",
      name: "Shiroha\u767D\u7FBD\u7684\u535A\u5BA2",
      url: "https://hukeqing.github.io/rss.xml",
      site: "https://hukeqing.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-a2fdce43fbcfa395",
      name: "\u767D\u4E91\u82CD\u72D7",
      url: "https://www.imalun.com/atom.xml",
      site: "https://www.imalun.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-ad437368ff6e8a4c",
      name: "\u6211\u6709\u70B9\u9177-HuntZou\u7684\u535A\u5BA2",
      url: "https://blog.woyou.cool/feed",
      site: "https://blog.woyou.cool/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "whim"
      ]
    },
    {
      id: "blog-396f9156df62a23c",
      name: "Benson",
      url: "https://blog.bensontech.dev/feed.xml",
      site: "https://blog.bensontech.dev/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "NLP",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-014e0dfeb3c13b0a",
      name: "\u6D6E\u4E91\u7FE9\u8FC1\u4E4B\u95F4",
      url: "https://blognas.hwb0307.com/feed/",
      site: "https://blognas.hwb0307.com/",
      tags: [
        "Docker",
        "Linux",
        "\u751F\u7269\u533B\u5B66"
      ]
    },
    {
      id: "blog-f949991d7be048e2",
      name: "\u661F\u7A7A\u4E0B\u7684YZY",
      url: "https://www.226yzy.com/atom.xml",
      site: "https://www.226yzy.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4ba7749fdfc7f815",
      name: "SakuraWald",
      url: "https://sakurawald.github.io/sitemap.xml",
      site: "https://sakurawald.github.io/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-19b40efd326e42cd",
      name: "ImCaO's Blog",
      url: "https://www.imcao.cn/atom.xml",
      site: "https://www.imcao.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-5999006a511fd61b",
      name: "NoneData",
      url: "https://www.nonedata.com/rss.xml",
      site: "https://www.nonedata.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-09cc7e61fa598de3",
      name: "Cysime Moflu",
      url: "https://blog.cysi.me/index.xml",
      site: "https://blog.cysi.me/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BC4\u6D4B"
      ]
    },
    {
      id: "blog-a89e1bb215131ed0",
      name: "\u4E03\u7C73\u84DD",
      url: "https://www.chirmyram.top/feed",
      site: "https://www.chirmyram.top/",
      tags: [
        "\u8BB0\u5F55",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-825c82447bcac9ab",
      name: "\u51B0\u96EA\u6B87\u7483\u964C\u68A6\u306E\u5C0F\u7AD9",
      url: "https://www.dreamofice.cn/atom.xml",
      site: "https://www.dreamofice.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u4E8C\u6B21\u5143",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-e4835ff59c4deaba",
      name: "Bright LGM's Blog",
      url: "https://brightliao.com/atom.xml",
      site: "https://brightliao.com/",
      tags: [
        "\u6280\u672F",
        "\u6570\u636E",
        "\u667A\u80FD"
      ]
    },
    {
      id: "blog-68efc75dd39bedb1",
      name: "\u6587\u8F69\u7684Blog",
      url: "https://allanware.github.io/zh/index.xml",
      site: "https://allanware.github.io/zh/",
      tags: [
        "\u7535\u5F71",
        "\u97F3\u4E50",
        "\u8DB3\u7403",
        "\u56F4\u68CB",
        "\u7F16\u7A0B",
        "\u4E66"
      ]
    },
    {
      id: "blog-f1bf108695467aad",
      name: "Airing's Blog",
      url: "https://blog.ursb.me/feed.xml",
      site: "https://ursb.me/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-d1d54f69dd05db47",
      name: "\u6768\u5B9D\u5F3A\u7684\u6280\u672F\u7B14\u8BB0",
      url: "https://bqyang.top/atom.xml",
      site: "https://bqyang.top/",
      tags: [
        "\u7F16\u7A0B",
        "Golang",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-1a2f7c6f61d30df8",
      name: "Raz1ner",
      url: "https://raz1ner.com/atom.xml",
      site: "https://raz1ner.com/",
      tags: [
        "Excel\u51FD\u6570",
        "Google\u811A\u672C",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u8F6F\u4EF6"
      ]
    },
    {
      id: "blog-46ce1f91a34182af",
      name: "DAVID'S BLOG",
      url: "https://blog.blahaj.uk/feed",
      site: "https://blog.blahaj.uk/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u5F71\u8BC4",
        "\u4F5C\u54C1\u96C6"
      ]
    },
    {
      id: "blog-9d74eda68b416b4d",
      name: "Ethan's Blog",
      url: "https://ethan-phu.github.io/index.xml",
      site: "https://ethan-phu.github.io/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u540E\u7AEF",
        "\u6DF1\u5EA6\u5B66\u4E60"
      ]
    },
    {
      id: "blog-15280431b2da5439",
      name: "jinji's Blog",
      url: "https://jinjipang.com/index.xml",
      site: "https://jinjipang.com/",
      tags: [
        "\u7231\u597D",
        "\u968F\u7B14",
        "\u751F\u7269",
        "\u7EDF\u8BA1"
      ]
    },
    {
      id: "blog-74bd1a0c7196fd9e",
      name: "Owen\u7684\u535A\u5BA2",
      url: "https://www.owenyoung.com/atom.xml",
      site: "https://www.owenyoung.com/",
      tags: [
        "\u6CE8\u610F\u529B\u7BA1\u7406\uFF0C\u8BFB\u4E66\uFF0C\u7B14\u8BB0\uFF0C\u6280\u672F"
      ]
    },
    {
      id: "blog-a3f1fd61c3a9d526",
      name: "\u8C2D\u5347\u7684\u535A\u5BA2",
      url: "https://face2ai.com/atom.xml",
      site: "https://face2ai.com/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b0daf832284b133c",
      name: "\u571F\u8C46\u4E0D\u597D\u5403",
      url: "https://dmesg.app/feed",
      site: "https://dmesg.app/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-f6786af950754079",
      name: "\u5361\u74E6\u90A6\u5676\uFF01",
      url: "https://www.kawabangga.com/feed",
      site: "https://www.kawabangga.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-960d863974eaea20",
      name: "\u4F0A\u85E4\u2022\u535A\u6587",
      url: "https://moc.1tlt1.com/index.php/feed",
      site: "https://moc.1tlt1.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u79D1\u7814"
      ]
    },
    {
      id: "blog-085b9cb4c58579db",
      name: "\u5982\u6709\u4E50\u4EAB",
      url: "https://51.ruyo.net/feed",
      site: "https://51.ruyo.net/",
      tags: [
        "\u6280\u672F",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-e9370c92df774711",
      name: "\u695A\u5929\u4E50\u7684\u5C0F\u7AD9",
      url: "http://blog.shyclouds.net/feed/",
      site: "http://blog.shyclouds.net/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-c8adde5ad4115162",
      name: "\u6797\u6D77\u8349\u539F",
      url: "https://lhcy.org/feed",
      site: "https://lhcy.org/",
      tags: [
        "\u751F\u6D3B",
        "\u5DE5\u4F5C",
        "\u4EBA\u751F",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-5a6cec5b7049c21c",
      name: "\u65E0\u7AE0",
      url: "https://hetaoblog.site/atom.xml",
      site: "https://hetaoblog.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-c4b9cdc0255e56d8",
      name: "\u5341\u8D30\u7684\u5C0F\u7A9D",
      url: "https://hehysh.github.io/atom.xml",
      site: "https://hehysh.github.io/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u6210\u957F"
      ]
    },
    {
      id: "blog-85ebfa6ee9e72216",
      name: "\u667A\u670B\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://coffeelize.top/atom.xml",
      site: "https://coffeelize.top/",
      tags: [
        "\u751F\u6D3B",
        "LaTeX",
        "\u968F\u7B14",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-8b39aeeb7d6f1d4d",
      name: "\u5B50\u6052\u7684\u535A\u5BA2",
      url: "https://chestnutheng.cn/index.xml",
      site: "https://chestnutheng.cn/",
      tags: [
        "\u540E\u53F0",
        "\u4E92\u8054\u7F51",
        "\u8BFB\u4E66",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-f66c4d9a4820bbc1",
      name: "Chancel's blog",
      url: "https://www.chancel.me/rest/api/v1/feed",
      site: "https://www.chancel.me/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u7F51\u7EDC"
      ]
    },
    {
      id: "blog-fdab7a443c37e973",
      name: "\u4E92\u822A\u98DE",
      url: "https://www.huhangfei.com/feed/",
      site: "https://www.huhangfei.com/",
      tags: [
        "\u6280\u672F",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-7e5cf41d6b52e598",
      name: "Jimersy Lee\u2019s blog",
      url: "https://blog.jimersylee.com/feed",
      site: "https://blog.jimersylee.com/",
      tags: [
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u968F\u7B14",
        "\u6210\u957F"
      ]
    },
    {
      id: "blog-411d02ae36d3106c",
      name: "Jim Luo's blog",
      url: "https://blog.jimmieluo.com/feed",
      site: "https://www.jimmieluo.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-4d26f30438e4d8da",
      name: "\u5F20\u6D2AHeo",
      url: "https://blog.zhheo.com/rss.xml",
      site: "https://blog.zhheo.com/",
      tags: [
        "\u8BBE\u8BA1",
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-70fe8be93de1c16a",
      name: "Save The Web Project",
      url: "https://blog.save-web.org/feed/",
      site: "https://blog.save-web.org/",
      tags: [
        "\u5B58\u6863",
        "\u5907\u4EFD",
        "\u4E92\u8054\u7F51",
        "\u516C\u76CA"
      ]
    },
    {
      id: "blog-dca7f6ec7f541f5e",
      name: "AlbertAz's Blog",
      url: "https://www.albertaz.com/rss.xml",
      site: "https://www.albertaz.com/",
      tags: [
        "\u524D\u7AEF",
        "\u6280\u672F",
        "\u7ED8\u753B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-e449062d39b7affa",
      name: "\u5DE5\u52B3\u5C0F\u62A5",
      url: "https://newsletter.laborinfocn.com/rss",
      site: "https://newsletter.laborinfocn.com/",
      tags: [
        "\u5DE5\u4EBA",
        "\u52B3\u52A8",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-220f782a1e65db7f",
      name: "\u96EA\u732B\u793E",
      url: "https://www.yukicat.net/feed/",
      site: "https://www.yukicat.net/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8FD0\u7EF4",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-117a5287ce8741cf",
      name: "\u662F\u975E\u9898",
      url: "https://www.shifeiti.com/atom.xml",
      site: "https://www.shifeiti.com/",
      tags: [
        "\u751F\u6D3B",
        "\u8DD1\u6B65",
        "FPGA"
      ]
    },
    {
      id: "blog-836dd4e3eb50d569",
      name: "\u4E14\u70BC\u65F6\u5149",
      url: "https://linshenkx.cn/atom.xml",
      site: "https://linshenkx.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u4EA7\u529B",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-971950b0ed8ed288",
      name: "\u9053\u8F72",
      url: "https://dorck.cn/feed.xml",
      site: "https://dorck.cn/",
      tags: [
        "\u6280\u672F",
        "\u5F00\u6E90",
        "\u968F\u7B14",
        "\u81EA\u7531"
      ]
    },
    {
      id: "blog-8b0f51923e33c429",
      name: "\u591C\u6CD5\u4E4B\u4E66",
      url: "https://blog.17lai.site/atom.xml",
      site: "https://blog.17lai.site/",
      tags: [
        "\u6280\u672F",
        "\u5F00\u6E90",
        "hexo",
        "\u6210\u957F",
        "nas",
        "linux"
      ]
    },
    {
      id: "blog-cd7f715f3722cf51",
      name: "Makerlife \u7684\u5C0F\u7AD9",
      url: "https://blog.makerlife.top/atom.xml",
      site: "https://blog.makerlife.top/",
      tags: [
        "\u7F16\u7A0B",
        "C++",
        "\u4FE1\u606F\u5B66\u7ADE\u8D5B",
        "\u5206\u4EAB",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-785d0efdcf0f3841",
      name: "\u5B50\u8212\u7684\u535A\u5BA2",
      url: "https://zishu.me/index.xml",
      site: "https://zishu.me/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-58e1597cd7d4164b",
      name: "\u6D41\u6D6A\u5929\u4E0B",
      url: "https://maie.name/feed",
      site: "https://maie.name/",
      tags: [
        "\u6237\u5916",
        "\u65C5\u884C",
        "\u884C\u8D70",
        "\u968F\u7B14",
        "vtiger"
      ]
    },
    {
      id: "blog-52f5ef425726b040",
      name: "zguishen's blog",
      url: "https://zguishen.com/atom.xml",
      site: "https://zguishen.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c12118d09bb572dd",
      name: "\u6D1B\u96EA\u306ECat",
      url: "https://blog.sayhi.moe/index.php/feed/",
      site: "https://blog.sayhi.moe/",
      tags: [
        "\u6821\u56ED",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u4E8C\u6B21\u5143",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-ce7fd263dbbe863b",
      name: "matsuri's neverland",
      url: "https://matsuri.site/atom.xml",
      site: "https://matsuri.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u6548\u7387\u5DE5\u5177",
        "\u6E38\u620F",
        "\u4E92\u8054\u7F51"
      ]
    },
    {
      id: "blog-fe2bffb8252b1d22",
      name: "\u989C\u6D77\u955C",
      url: "https://yanhaijing.com/rss.xml",
      site: "https://yanhaijing.com/",
      tags: [
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-8e3abe0137c117f8",
      name: "\u4E5D\u65EC\u7684\u535A\u5BA2",
      url: "http://www.zhangningle.top/rss.xml",
      site: "http://www.zhangningle.top/",
      tags: [
        "\u524D\u7AEF",
        "\u968F\u7B14",
        "\u5206\u4EAB",
        "\u6210\u957F"
      ]
    },
    {
      id: "blog-36e734c40c591d4e",
      name: "\u4F60\u662F\u4E0B\u96E8\u5929",
      url: "https://glooow1024.github.io/atom.xml",
      site: "https://glooow1024.github.io/",
      tags: [
        "\u5B66\u4E60",
        "\u6570\u5B66",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-afba0a49df3a92b9",
      name: "\u65F6\u95F4\u7684\u670B\u53CB",
      url: "https://blog.storycn.cn/index.xml",
      site: "https://blog.storycn.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u5206\u4EAB",
        "\u5DE5\u4F5C\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-f10087ed46ae0a5a",
      name: "\u5E03\u9C81\u65AF\u9C7C\u7684\u5947\u601D\u4E71\u60F3",
      url: "https://emergencyexit.xyz/feed.xml",
      site: "https://emergencyexit.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u5DE5\u4F5C\u7B14\u8BB0",
        "\u751F\u6D3B",
        "\u6E38\u620F",
        "\u7535\u5F71"
      ]
    },
    {
      id: "blog-4f62f68163524272",
      name: "\u9759\u6C34\u6DF1\u6D41\u7684\u535A\u5BA2",
      url: "https://slbyml.github.io/rss.xml",
      site: "https://slbyml.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9843080d5e0c03ca",
      name: "Tw93 \u7684\u535A\u5BA2",
      url: "https://tw93.fun/feed.xml",
      site: "https://tw93.fun/",
      tags: [
        "\u5F00\u6E90",
        "\u524D\u7AEF",
        "\u5206\u4EAB",
        "MacOS"
      ]
    },
    {
      id: "blog-fe62bfa2d8d9a894",
      name: "ocero\u7684\u535A\u5BA2",
      url: "https://oceroblogentry.metalstudio.top/rss.xml",
      site: "https://oceroblogentry.metalstudio.top/",
      tags: [
        "\u524D\u7AEF",
        "\u5206\u4EAB",
        "\u751F\u6D3B\u5C0F\u8BB0"
      ]
    },
    {
      id: "blog-f26fdb3d885568b2",
      name: "BinGo\u2018s Blog",
      url: "https://www.zh996.com/index.php/feed/",
      site: "https://www.zh996.com/",
      tags: [
        "\u7F16\u7A0B",
        "Java",
        "\u5206\u4EAB",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-917549e2a4f11bf1",
      name: "Finisky Garden",
      url: "https://finisky.github.io/atom.xml",
      site: "https://finisky.github.io/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "NLP",
        "\u4E92\u8054\u7F51",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-c122a4b382f340f4",
      name: "Qiuyuair\u7684\u81EA\u7559\u5730",
      url: "https://qiuyuair.com/feed/",
      site: "https://qiuyuair.com/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u5E7F\u64AD",
        "\u65E0\u7EBF\u7535"
      ]
    },
    {
      id: "blog-8486a5f1c6c58af6",
      name: "\u963F\u732B\u7684\u535A\u5BA2",
      url: "https://ameow.xyz/atom.xml",
      site: "https://ameow.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-9bc62e4c57cc75e9",
      name: "\u9020\u58F3 MkShell",
      url: "https://www.mkshell.com/feed/",
      site: "https://www.mkshell.com/",
      tags: [
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u6298\u817E",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-3a23b79f28ee86d6",
      name: "\u6D41\u5E74\u77F3\u523B",
      url: "https://www.timeshike.com/atom.xml",
      site: "https://www.timeshike.com/",
      tags: [
        "\u8BB0\u5F55",
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u6587\u5B66"
      ]
    },
    {
      id: "blog-ffd4a1e9a1b5cc09",
      name: "\u516D\u4E2A\u5468",
      url: "https://blog.liugezhou.online/atom.xml",
      site: "https://blog.liugezhou.online/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f663bd1b58ba034f",
      name: "\u5B59\u5A01\u7684\u9633\u5149\u6D77",
      url: "https://www.sunnyfly.com/feed",
      site: "https://www.sunnyfly.com/",
      tags: [
        "\u4EA7\u54C1",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9cee8089643b6a0a",
      name: "Sean's Note",
      url: "https://blog.sean.taipei/feed.xml",
      site: "https://blog.sean.taipei/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-1b169f3b2efbb9bb",
      name: "cserwen",
      url: "https://blog.cserwen.com/feed.xml",
      site: "https://blog.cserwen.com/",
      tags: [
        "\u5B66\u4E60",
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-30a8eeb0d7443e8c",
      name: "\u4E91\u8427\u7684\u5495\u5495\u5C4B",
      url: "https://blog.crrashh.com/feed",
      site: "https://blog.crrashh.com/",
      tags: [
        "\u524D\u7AEF",
        "\u6280\u672F",
        "\u6574\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c5b8b29fbcadc939",
      name: "xiongxinwei\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://nsddd.top/rss.xml",
      site: "https://nsddd.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u533A\u5757\u94FE",
        "\u5B66\u4E60",
        "\u8D44\u6599\u6536\u96C6"
      ]
    },
    {
      id: "blog-5f3b7bca48a6bd8b",
      name: "\u8D6B\u8D6B\u6587\u738B",
      url: "https://kqh.me/index.xml",
      site: "https://kqh.me/",
      tags: [
        "\u5386\u53F2",
        "\u4EBA\u6587",
        "\u827A\u672F",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-211ed4466033fe3d",
      name: "\u4E00\u6D3E\u80E1\u8A00",
      url: "https://yipai.me/feed",
      site: "https://yipai.me/",
      tags: [
        "\u80E1\u4E00\u6D3E",
        "\u968F\u7B14",
        "\u4E0D\u6298\u817E"
      ]
    },
    {
      id: "blog-b6f3c5198a961d57",
      name: "SuperEggs",
      url: "https://www.supereggs.cn/index.xml",
      site: "https://www.supereggs.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u9605\u8BFB",
        "\u751F\u6D3B\u968F\u7B14"
      ]
    },
    {
      id: "blog-87755ef63e46fd29",
      name: "\u4E86\u8FF9\u5947\u6709\u6CA1",
      url: "https://whrss.com/feed",
      site: "https://whrss.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u751F\u6D3B\u968F\u7B14"
      ]
    },
    {
      id: "blog-668f90dc0e090cfd",
      name: "\u8C2D\u65B0\u5B87\u7684\u535A\u5BA2",
      url: "https://tanxinyu.work/atom.xml",
      site: "https://tanxinyu.work/",
      tags: [
        "\u5171\u8BC6\u7B97\u6CD5",
        "\u5206\u5E03\u5F0F\u5B58\u50A8",
        "\u65F6\u5E8F\u6570\u636E\u5E93",
        "\u8BBA\u6587\u7B14\u8BB0",
        "\u6E90\u7801\u5206\u6790"
      ]
    },
    {
      id: "blog-ca0ea264cce7d97a",
      name: "\u5C71\u6942\u7247\u7684\u535A\u5BA2",
      url: "https://szp15.com/index.xml",
      site: "https://szp15.com/",
      tags: [
        "\u8BA1\u7B97\u673A\u89C6\u89C9",
        "\u673A\u5668\u5B66\u4E60"
      ]
    },
    {
      id: "blog-3c455fe8ede6b323",
      name: "Kaichao You",
      url: "https://youkaichao.github.io/feed.xml",
      site: "https://youkaichao.github.io/research",
      tags: [
        "\u6DF1\u5EA6\u5B66\u4E60"
      ]
    },
    {
      id: "blog-4239475992326c85",
      name: "Eren Zhao",
      url: "https://zhaochenyang20.github.io/atom.xml",
      site: "https://zhaochenyang20.github.io/",
      tags: [
        "\u65E5\u8BB0",
        "\u6DF1\u5EA6\u5B66\u4E60"
      ]
    },
    {
      id: "blog-a7c251c463d0580c",
      name: "\u6770\u54E5\u7684\u5C0F\u7B14\u8BB0",
      url: "https://jia.je/feed.xml",
      site: "https://jia.je/",
      tags: [
        "\u8FD0\u7EF4",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-5de314a1a7f0a808",
      name: "Wriprin's Blog",
      url: "https://blog.cnix.cc/index.php/feed",
      site: "https://blog.cnix.cc/",
      tags: [
        "SAP",
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-9d6462e44f3fbeee",
      name: "\u5B8B\u6D69\u5FD7\u7684\u535A\u5BA2",
      url: "https://songhaozhi.com/atom.xml",
      site: "https://songhaozhi.com/",
      tags: [
        "\u5B66\u4E60",
        "\u6280\u672F",
        "Java"
      ]
    },
    {
      id: "blog-506777005e94107a",
      name: "\u5B50\u6765\u56ED",
      url: "https://simplecoding.fun/index.xml",
      site: "https://simplecoding.fun/",
      tags: [
        "\u7F16\u8BD1\u5668",
        "\u82AF\u7247",
        "AI",
        "\u8F6F\u4EF6\u5DE5\u7A0B",
        "\u5199\u4F5C",
        "\u4EBA\u6587"
      ]
    },
    {
      id: "blog-f56fe1502c1b14eb",
      name: "Mereith's Blog",
      url: "https://www.mereith.com/feed.xml",
      site: "https://www.mereith.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u6298\u817E",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-ccba727063d86140",
      name: "Wang Fenjin's Blog",
      url: "https://www.wangfenjin.com/index.xml",
      site: "https://www.wangfenjin.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u6298\u817E",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-47d4620d9a11056f",
      name: "Ligdyu Blog",
      url: "https://ligdy.com/rss/feed.xml",
      site: "https://ligdy.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u65E5\u8BB0",
        "\u968F\u7B14",
        "\u5B66\u4E60",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-58b59cdd41ab2af9",
      name: "SeerSu",
      url: "https://suus.me/index.xml",
      site: "https://suus.me/",
      tags: [
        "\u6280\u672F\u5206\u4EAB",
        "\u65E5\u8BB0",
        "\u968F\u7B14",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-893a45fcc4d5ec38",
      name: "Mycpen",
      url: "https://blog.cpen.top/atom.xml",
      site: "https://blog.cpen.top/",
      tags: [
        "\u6280\u672F\u5206\u4EAB",
        "\u65E5\u8BB0",
        "\u968F\u7B14",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-3356d11d896f3879",
      name: "\u6548\u7387\u5DE5\u5177\u6307\u5357",
      url: "https://penghh.fun/atom.xml",
      site: "https://penghh.fun/",
      tags: [
        "\u6548\u7387\u5DE5\u5177",
        "\u8F6F\u4EF6",
        "Macbook",
        "\u524D\u7AEF",
        "\u5DE5\u5177",
        "App",
        "\u535A\u5BA2",
        "\u5199\u4F5C"
      ]
    },
    {
      id: "blog-824ed8b164c89d01",
      name: "Mark24Code",
      url: "https://mark24code.github.io/feed.xml",
      site: "https://mark24code.github.io/",
      tags: [
        "\u524D\u7AEF",
        "\u6280\u672F",
        "\u535A\u5BA2",
        "\u968F\u7B14",
        "\u7F16\u7A0B\u601D\u8003"
      ]
    },
    {
      id: "blog-387ee4ba75fc90aa",
      name: "\u5C0F\u8D75\u535A\u5BA2 - XiaoZhao233",
      url: "https://blog.xiaozhao233.top/feed/",
      site: "https://blog.xiaozhao233.top/",
      tags: [
        "\u65E5\u8BB0",
        "\u968F\u7B14",
        "\u5B66\u4E60",
        "\u6280\u672F\u5206\u4EAB",
        "\u601D\u8003",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-95fe54629b118005",
      name: "\u7FFB\u8EAB\u732B",
      url: "https://www.zy99.net/feed",
      site: "https://www.zy99.net/",
      tags: [
        "\u81EA\u5A92\u4F53",
        "\u5EFA\u7B51",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-aa9242079a1cc647",
      name: "Macin",
      url: "https://www.macin.org/atom.xml",
      site: "https://macin.org/",
      tags: [
        "\u5206\u4EAB",
        "\u6295\u8D44",
        "\u5B66\u4E60",
        "Crypto",
        "\u65E5\u5E38",
        "\u9605\u8BFB",
        "\u4EBA\u6587"
      ]
    },
    {
      id: "blog-a8fae414b32efd1d",
      name: "\u667A\u4F24\u5E1D",
      url: "https://blog.l0v0.com/atom.xml",
      site: "https://blog.l0v0.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u7F8E\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-43ad6c864e875bac",
      name: "GamerNoTitle",
      url: "https://bili33.top/atom.xml",
      site: "https://bili33.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u6280\u672F",
        "\u6742\u8C08"
      ]
    },
    {
      id: "blog-1383230fc76497fb",
      name: "YuZhangWang\u7684\u9886\u57DF",
      url: "https://yuzhang.wang/atom.xml",
      site: "https://yuzhang.wang/",
      tags: [
        "\u7F16\u7A0B",
        "DL",
        "ML",
        "\u751F\u6D3B\u8BB0\u5F55",
        "\u9879\u76EE\u63CF\u8FF0"
      ]
    },
    {
      id: "blog-9f60092f8ce10cb1",
      name: "\u9759\u98CE\u8BF4",
      url: "http://www.jfsay.com/feed",
      site: "http://www.jfsay.com/",
      tags: [
        "\u751F\u6D3B",
        "\u8BFB\u4E66",
        "\u7535\u5F71",
        "\u65C5\u6E38"
      ]
    },
    {
      id: "blog-1f4c50f66d694a50",
      name: "To the Lighthouse",
      url: "https://owlswims.com/feed",
      site: "https://owlswims.com/",
      tags: [
        "\u8BFB\u4E66",
        "\u64AD\u5BA2",
        "\u968F\u7B14",
        "\u4E66\u8BC4",
        "\u4EBA\u6587"
      ]
    },
    {
      id: "blog-55882a5c594529c5",
      name: "TrumanDu \u535A\u5BA2",
      url: "http://blog.trumandu.top/atom.xml",
      site: "http://blog.trumandu.top/",
      tags: [
        "\u65E5\u8BB0",
        "\u968F\u7B14",
        "\u5B66\u4E60",
        "\u6280\u672F\u5206\u4EAB",
        "\u601D\u8003",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-0be500b42d21e2c9",
      name: "Wang's Blog",
      url: "https://vlight.me/rss2.xml",
      site: "https://vlight.me/",
      tags: [
        "\u6570\u503C\u8BA1\u7B97",
        "\u4F18\u5316\u7B97\u6CD5"
      ]
    },
    {
      id: "blog-c50ef0bc2c5a2f26",
      name: "HUOYIJIE's WEB\u5F00\u53D1\u7B14\u8BB0",
      url: "https://huoyijie.cn/rss",
      site: "https://huoyijie.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-592dcc10481f926d",
      name: "Spaceack's Blog",
      url: "https://spaceack.com/index.xml",
      site: "https://spaceack.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-20d642c0c4bd5f78",
      name: "\u6613\u826F\u540C\u5B66\u7684\u535A\u5BA2",
      url: "https://yiliang.site/sitemap.xml",
      site: "https://yiliang.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u5B66\u4E60",
        "\u751F\u6D3B\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-618448946e57b714",
      name: "Yubolun \u535A\u5BA2",
      url: "https://yubolun.com/feed.xml",
      site: "https://yubolun.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6295\u8D44",
        "\u52A0\u5BC6\u8D27\u5E01"
      ]
    },
    {
      id: "blog-5821a00c7ea1bc6c",
      name: "BlackHole's Blog",
      url: "https://blackholemax.github.io/atom.xml",
      site: "https://blackholemax.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u4EBA\u6587\u793E\u79D1",
        "\u9605\u8BFB",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0fdcf1f2b5c68a0f",
      name: "Mephisto's blog",
      url: "https://mephisto.cc/index.xml",
      site: "https://mephisto.cc/",
      tags: [
        "Linux",
        "Python",
        "Travel",
        "Note"
      ]
    },
    {
      id: "blog-7810aaf574555fc0",
      name: "Tony Bai",
      url: "http://feed.tonybai.com/",
      site: "https://tonybai.com/",
      tags: [
        "\u7F16\u7A0B",
        "Golang",
        "GO"
      ]
    },
    {
      id: "blog-0f9fdd4b2d386a97",
      name: "\u6211\u4E0D\u662F\u5495\u5495\u9E3D",
      url: "https://blog.laoda.de/rss.xml",
      site: "https://blog.laoda.de/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u7F51\u7EDC",
        "\u5BB9\u5668",
        "VPS"
      ]
    },
    {
      id: "blog-8b3c2bec126cb1ee",
      name: "\u65B9\u6C38\u3001\u5357\u5929\u7D2B\u4E91",
      url: "https://www.vinoca.org/atom.xml",
      site: "https://www.vinoca.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c9ea3a188bc5625b",
      name: "\u5927\u767D\u6700\u9ED1\u306EHome",
      url: "https://dabaizuihei.github.io/atom.xml",
      site: "https://dabaizuihei.github.io/",
      tags: [
        "\u5B66\u4E60",
        "\u6781\u5BA2",
        "\u65E5\u8BB0",
        "\u751F\u6D3B",
        "\u6444\u5F71",
        "\u4E8C\u6B21\u5143",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b3d27f018dab6838",
      name: "\u5B5F\u5764\u535A\u5BA2",
      url: "https://mkblog.cn/feed/",
      site: "https://mkblog.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u4E91\u670D\u52A1",
        "PHP",
        "WordPress"
      ]
    },
    {
      id: "blog-134edb00504655a2",
      name: "\u4E00\u7EB8\u5FD8\u5FE7",
      url: "https://www.ikxin.com/feed/",
      site: "https://www.ikxin.com/",
      tags: [
        "\u7F16\u7A0B",
        "PHP",
        "\u5F00\u7BB1",
        "Linux",
        "\u4E91\u670D\u52A1",
        "Typecho"
      ]
    },
    {
      id: "blog-b9cc063ddd8e30c8",
      name: "YuxiangWang_0525\u7684\u535A\u5BA2",
      url: "https://blog.yuxiangwang0525.com/index.php/feed/",
      site: "https://blog.yuxiangwang0525.com/",
      tags: [
        "\u9526\u4F9D\u536B",
        "\u6D1B\u5929\u4F9D",
        "\u4FE1\u606F\u5B66\u7ADE\u8D5B",
        "Typecho",
        "\u4E8C\u6B21\u5143",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-9c4077b5db5a8ad5",
      name: "tj\u2018sblog_\u65E0\u804A\u9879\u76EE\u805A\u96C6\u5730",
      url: "https://www.tjsite.cn/feed.php",
      site: "https://www.tjsite.cn/",
      tags: [
        "\u5F00\u7BB1",
        "\u6E38\u620F",
        "\u6280\u672F",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-b26f687e90afe1e5",
      name: "EAimTY \u7684\u535A\u5BA2",
      url: "https://www.eaimty.com/feed/",
      site: "https://www.eaimty.com/",
      tags: [
        "\u4FE1\u606F\u5B89\u5168",
        "\u6280\u672F",
        "Typecho",
        "\u7F16\u7A0B",
        "\u4E91\u670D\u52A1",
        "Linux",
        "Android"
      ]
    },
    {
      id: "blog-ed8fde767fc491cc",
      name: "R4y\u7684\u535A\u5BA2",
      url: "https://blog.12ms.xyz/feed/",
      site: "https://blog.12ms.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u8FD0\u7EF4",
        "\u52A0\u5BC6\u8D27\u5E01"
      ]
    },
    {
      id: "blog-5ad7fbb656402a58",
      name: "619's blog",
      url: "https://66619.eu.org/feed/",
      site: "https://66619.eu.org/",
      tags: [
        "\u5B66\u4E60",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-27faefb9a0ec15ac",
      name: "Hubert's Blog",
      url: "https://trle5.xyz/atom.xml",
      site: "https://trle5.xyz/",
      tags: [
        "\u7EFC\u5408",
        "\u6742\u8C08",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-6fa988573041d66e",
      name: "smallyu\u7684\u535A\u5BA2",
      url: "https://smallyu.net/atom.xml",
      site: "https://smallyu.net/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u533A\u5757\u94FE"
      ]
    },
    {
      id: "blog-fdd311847fb7261f",
      name: "\u5410\u53F8\u9762\u5305",
      url: "https://toast.pub/totoro/index.xml",
      site: "https://toast.pub/totoro/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-49ade784eb429b1c",
      name: "vegetable1024\u7684\u535A\u5BA2",
      url: "https://oi-liu.com/atom.xml",
      site: "https://oi-liu.com/",
      tags: [
        "\u7B97\u6CD5\u7ADE\u8D5B",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-75d0fa99d454587a",
      name: "Kenvix's Blog",
      url: "https://kenvix.com/rss.xml",
      site: "https://kenvix.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BA1\u7B97\u673A\u7F51\u7EDC",
        "Windows",
        "\u6280\u672F",
        "\u5206\u4EAB",
        "Kotlin"
      ]
    },
    {
      id: "blog-7c3556dfc38193f0",
      name: "\u5FC3\u7684\u9053\u7406",
      url: "https://stephenleng.com/feed/",
      site: "https://stephenleng.com/",
      tags: [
        "\u968F\u7B14",
        "\u6587\u5316\u6279\u8BC4",
        "\u5FC3\u7406\u5B66",
        "\u56FD\u9645\u95EE\u9898",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-f74f1b4a359aa6eb",
      name: "Eson Wong's Blog",
      url: "https://blog.esonwong.com/atom.xml",
      site: "https://blog.esonwong.com/",
      tags: [
        "Web \u5F00\u53D1",
        "\u968F\u7B14",
        "\u5206\u4EAB",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-04562fcc1dc4d0ce",
      name: "\u963F\u554A\u963F\u5416\u4E01",
      url: "https://4ading.com/feed/",
      site: "https://4ading.com/",
      tags: [
        "\u968F\u7B14",
        "\u65E5\u5E38",
        "\u6280\u672F",
        "\u6D4B\u8BD5"
      ]
    },
    {
      id: "blog-a58c9408e78242f9",
      name: "Java\u4E0D\u52A0\u7CD6's Blog",
      url: "https://blog.javazero.top/atom.xml",
      site: "https://blog.javazero.top/",
      tags: [
        "\u8F6F\u4EF6\u5206\u4EAB",
        "\u8BA1\u7B97\u673A\u89C6\u89C9"
      ]
    },
    {
      id: "blog-f5dc99344cb51716",
      name: "Mathor's Blog",
      url: "https://wmathor.com/index.php/feed",
      site: "https://wmathor.com/",
      tags: [
        "\u6DF1\u5EA6\u5B66\u4E60",
        "\u6E38\u620F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-732c91331ac82e5c",
      name: "\u4EE3\u7801\u8303",
      url: "https://codefine.site/feed/",
      site: "https://codefine.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-595cd13aeef24898",
      name: "BB\u9171\u7684\u535A\u5BA2",
      url: "https://www.bbbbchan.com/feed/atom/",
      site: "https://www.bbbbchan.com/",
      tags: [
        "\u6DF1\u5EA6\u5B66\u4E60",
        "\u968F\u7B14",
        "\u7F16\u7A0B\u6280\u672F",
        "\u4E8C\u6B21\u5143"
      ]
    },
    {
      id: "blog-6769bebcfdf75fe5",
      name: "Kris Yan",
      url: "https://blog.krisyan.dev/feed.xml",
      site: "https://blog.krisyan.dev/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-3fcf5c531b5f1c64",
      name: "\u4E1C\u65B9\u661F\u75D5",
      url: "https://ystyle.top/atom.xml",
      site: "https://ystyle.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-83c9f44cf7f06124",
      name: "Anjhon\u2019s Blog",
      url: "https://www.anjhon.top/feed",
      site: "https://www.anjhon.top/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-23512c16438589b2",
      name: "Mythsman",
      url: "https://blog.mythsman.com/rss",
      site: "https://blog.mythsman.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-511f3e9d589e2612",
      name: "\u6B8B\u9875\u7684\u5C0F\u535A\u5BA2",
      url: "https://blog.canyie.top/atom.xml",
      site: "https://blog.canyie.top/",
      tags: [
        "\u7F16\u7A0B",
        "Android",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b843042d11e0f8e2",
      name: "\u81A8\u80C0\u7684\u9762\u5305",
      url: "https://blog.wangtwothree.com/feed",
      site: "https://blog.wangtwothree.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u53D1\u677F",
        "\u6280\u672F",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-68b585d25b258919",
      name: "\u6653\u7A7Ablog",
      url: "https://blog.moeworld.tech/feed/",
      site: "https://blog.moeworld.tech/",
      tags: [
        "\u751F\u6D3B",
        "\u5F00\u53D1\uFF0C\u65E5\u5E38",
        "\u4E8C\u6B21\u5143",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-0533e34e244dabda",
      name: "Mosu - Mosuzi\u7684\u535A\u5BA2",
      url: "https://www.mosuzi.com/atom.xml",
      site: "https://www.mosuzi.com/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u5F00\u53D1"
      ]
    },
    {
      id: "blog-f201da3c5c0d5f33",
      name: "Weishu's Notes",
      url: "https://weishu.me/atom.xml",
      site: "https://weishu.me/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-cda736d5225105cf",
      name: "\u6674\u96C0\u5802",
      url: "https://blog.verynb.me/atom.xml",
      site: "https://blog.verynb.me/",
      tags: [
        "\u751F\u6D3B",
        "\u6210\u957F",
        "\u4EBA\u751F",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-4f971972bf44fd79",
      name: "SkyWT",
      url: "https://blog.skywt.cn/feed/",
      site: "https://blog.skywt.cn/",
      tags: [
        "\u6280\u672F",
        "\u5F00\u53D1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-3893e023542a3cbc",
      name: "Jing Blog",
      url: "https://jingine.com/feed/",
      site: "https://jingine.com/",
      tags: [
        "\u6280\u672F",
        "\u6D77\u5916",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-39984e08a9bd3313",
      name: "\u738B\u4F73\u51AC\u4E2D\u6587\u535A\u5BA2",
      url: "http://wjd.name/feed/",
      site: "http://wjd.name/",
      tags: [
        "\u65C5\u884C",
        "\u4EA7\u54C1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-16d00491fccece0d",
      name: "HugeTerry-Den",
      url: "http://hugeterry.cn/feed",
      site: "http://hugeterry.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u8C03\u9152"
      ]
    },
    {
      id: "blog-242fb8933626f530",
      name: "\u660E\u660E\u5982\u6708\u7684\u535A\u5BA2",
      url: "https://lmmsoft.github.io/feed.atom",
      site: "https://lmmsoft.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u65C5\u884C",
        "\u8FD0\u52A8"
      ]
    },
    {
      id: "blog-0d6bf0f17bb6b4a4",
      name: "\u8C61\u5E1D\u6D6E\u534E\u751F",
      url: "https://www.ahianzhang.com/index.xml",
      site: "https://www.ahianzhang.com/",
      tags: [
        "\u6280\u672F",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-c7f15f711166992e",
      name: "\u7C7B\u5E93\u5927\u9B54\u738B\u7684\u6316\u4E95\u65E5\u8BB0",
      url: "https://blog.ismisv.com/feed.xml",
      site: "https://blog.ismisv.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-f8228f5eed311fd9",
      name: "u3blog",
      url: "https://u3blog.xyz/feed.php",
      site: "https://u3blog.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "Android"
      ]
    },
    {
      id: "blog-65c118616b6776ed",
      name: "Cerallin's blog",
      url: "https://notes.cerallin.top/atom.xml",
      site: "https://notes.cerallin.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B14\u8BB0\u672C"
      ]
    },
    {
      id: "blog-509f85ccc33f487e",
      name: "Cestlavie's Blog",
      url: "https://www.cestlavie.moe/index.xml",
      site: "https://www.cestlavie.moe/",
      tags: [
        "\u5B66\u4E60",
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-a8f24a5ffe962f14",
      name: "happy xiao \u7684\u535A\u5BA2",
      url: "https://happyxiao.com/feed",
      site: "https://happyxiao.com/",
      tags: [
        "\u4E2A\u4EBA\u6210\u957F"
      ]
    },
    {
      id: "blog-a8afb7c15ada46c4",
      name: "Clark's \u5C27\u671B Blog",
      url: "https://www.dongyao.ren/feed/",
      site: "https://www.dongyao.ren/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-d76544c6235c8a74",
      name: "/home/rook1e",
      url: "https://rook1e.com/feed.xml",
      site: "https://rook1e.com/",
      tags: [
        "\u5B89\u5168",
        "\u5F00\u53D1",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-b2354d914084c5aa",
      name: "Yi's Blog",
      url: "https://ycao.top/feed.xml",
      site: "https://ycao.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-40feb2be9c5fd574",
      name: "\u4ECE\u767E\u8349\u56ED\u5230\u4E09\u5473\u4E66\u5C4B",
      url: "https://youngforever.tech/index.xml",
      site: "https://youngforever.tech/",
      tags: [
        "\u79D1\u7814",
        "\u4EBA\u5DE5\u667A\u80FD",
        "\u8BBA\u6587",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-15d561a454f76de3",
      name: "Long Luo's Life Notes",
      url: "https://www.longluo.me/atom.xml",
      site: "https://www.longluo.me/",
      tags: [
        "\u6570\u5B66",
        "\u7269\u7406",
        "\u7B97\u6CD5",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-466df47cd04b6b36",
      name: "\u56DB\u7573\u534A\u306E\u3078\u3084",
      url: "https://moeyua.com/atom.xml",
      site: "https://moeyua.com/",
      tags: [
        "\u8BA1\u7B97\u673A",
        "\u9605\u8BFB",
        "\u65E5\u5E38",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-b17bbe6706dc20f6",
      name: "\u304A\u524D\u306F\u3069\u3053\u307E\u3067\u898B\u3048\u3066\u3044\u308B",
      url: "https://hotarugali.github.io/atom.xml",
      site: "https://hotarugali.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u8BBA\u6587",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-4d2e76e09f0826f3",
      name: "Magren's Blog",
      url: "https://magren.me/atom.xml",
      site: "https://magren.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4c56b0b939d72f56",
      name: "\u4E00\u4E2A\u5DE5\u5320",
      url: "https://www.yigegongjiang.com/atom.xml",
      site: "https://www.yigegongjiang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-dddce9fbe8ac3901",
      name: "AlexSJC \u7684\u535A\u5BA2",
      url: "https://www.alexsjc.top/atom.xml",
      site: "https://www.alexsjc.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-94a6b2f119eed3fe",
      name: "\u8001\u9C7C\u7684\u535A\u5BA2",
      url: "https://hgoldfish.com/blogs/rss/articles.xml",
      site: "https://hgoldfish.com/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "Qt"
      ]
    },
    {
      id: "blog-81c80071cfc3cdb9",
      name: "xxxx\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://www.windsong.top/atom.xml",
      site: "https://www.windsong.top/",
      tags: [
        "\u79D1\u7814",
        "\u7535\u5B50\u5668\u4EF6",
        "\u4F20\u70ED",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-02d5dcb15ba33cf7",
      name: "Ethan's Wiki",
      url: "https://wiki-mkdocs-topaz.vercel.app/feed_rss_updated.xml",
      site: "https://wiki-mkdocs-topaz.vercel.app/",
      tags: [
        "\u7F16\u7A0B",
        "wiki",
        "\u6548\u7387",
        "\u5DE5\u4F5C",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-2f4fea6f78b91845",
      name: "\u8303\u660E\u660E",
      url: "https://www.fanmingming.com/feed/",
      site: "https://www.fanmingming.com/",
      tags: [
        "\u5206\u4EAB",
        "\u65E5\u5E38",
        "\u5B66\u4E60",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-04e4fadd3b8bc620",
      name: "\u5B81\u946B\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://n-xin.com/index.php/feed/",
      site: "https://n-xin.com/",
      tags: [
        "JAVA",
        "\u5B66\u4E60",
        "\u5DE5\u4F5C\u65E5\u5FD7"
      ]
    },
    {
      id: "blog-0582a977dd0333db",
      name: "\u6708\u843D\u661F\u6CB3Tsukistar",
      url: "https://www.tsukistar.fun/atom.xml",
      site: "https://www.tsukistar.fun/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-ccc20a6766c1aa74",
      name: "dsy4567 \u7684\u5C0F\u7AD9",
      url: "https://dsy4567.github.io/rss.xml",
      site: "https://dsy4567.github.io/blog.html",
      tags: [
        "\u7F16\u7A0B",
        "HTML",
        "CSS",
        "JS",
        "\u7B97\u6CD5\u7ADE\u8D5B"
      ]
    },
    {
      id: "blog-fc7150500715ba1b",
      name: "\u68A6\u6EAA\u535A\u5BA2",
      url: "https://www.cyrilstudio.top/feed",
      site: "http://www.cyrilstudio.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-722031319ae2391e",
      name: "Captain\u7684\u535A\u5BA2",
      url: "https://totapo.netlify.app/index.xml",
      site: "https://totapo.netlify.app/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u6559\u7A0B",
        "\u8F6F\u4EF6\u5206\u4EAB",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-efc05f91a7d6d909",
      name: "\u4E07\u5723\u8282\u6076\u9B54\u7684\u9886\u5730",
      url: "https://cytrogen.icu/atom.xml",
      site: "https://cytrogen.icu/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "\u5B66\u4E60",
        "\u7B14\u8BB0",
        "\u5168\u6808",
        "JS"
      ]
    },
    {
      id: "blog-2a8d561592de1b57",
      name: "Dejavu's Blog",
      url: "https://blog.dejavu.moe/index.xml",
      site: "https://blog.dejavu.moe/",
      tags: [
        "\u6298\u817E",
        "\u5B66\u4E60",
        "\u751F\u6D3B",
        "\u65E5\u5FD7"
      ]
    },
    {
      id: "blog-7a9511be2d9e978e",
      name: "zhaolife Blog",
      url: "https://zhaolife.com/atom.xml",
      site: "https://zhaolife.com/",
      tags: [
        "\u751F\u6D3B",
        "\u6570\u7801",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-61fb8ecfbca00d3a",
      name: "iCooper",
      url: "https://icooper.cc/feed/",
      site: "https://icooper.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u65E5\u5FD7",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-543488cc7f5da48f",
      name: "Max\u7684\u6280\u672F\u672D\u8BB0",
      url: "https://www.immaxfang.com/atom.xml",
      site: "https://www.immaxfang.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u4E91\u539F\u751F"
      ]
    },
    {
      id: "blog-a5956bb87425f31e",
      name: "Fernweh",
      url: "https://blog.wohin.me/index.xml",
      site: "https://blog.wohin.me/",
      tags: [
        "\u4FE1\u606F\u5B89\u5168",
        "\u8BD7\u6B4C",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-430324923d0948b8",
      name: "Suiko\u7684\u81EA\u7559\u5730",
      url: "https://suiko.dev/rss/feed.xml",
      site: "https://suiko.dev/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-a67862d878ccc51c",
      name: "\u675C\u8001\u5E08\u8BF4",
      url: "https://dusays.com/atom.xml",
      site: "https://dusays.com/",
      tags: [
        "\u8FD0\u7EF4\uFF0C\u6570\u7801\uFF0C\u8D44\u6E90"
      ]
    },
    {
      id: "blog-cd60b498a011cd24",
      name: "\u4E16\u754C\u89C2\u5BDF\u65E5\u8BB0",
      url: "https://fiftysixtimes7.github.io/MyWorldObservationJournal/feeds/all.atom.xml",
      site: "https://fiftysixtimes7.github.io/MyWorldObservationJournal/",
      tags: [
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u54F2\u5B66",
        "\u6587\u5B66",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-cee70eb6a2dae4c3",
      name: "plus studio",
      url: "https://studyinglover.com/atom.xml",
      site: "https://studyinglover.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u673A\u5668\u5B66\u4E60",
        "\u8BA1\u7B97\u673A\u89C6\u89C9",
        "\u5143\u5B87\u5B99"
      ]
    },
    {
      id: "blog-078babdbbae770e4",
      name: "Wayne\u7684\u6280\u672F\u535A\u5BA2",
      url: "https://blog.michealwayne.cn/atom.xml",
      site: "https://blog.michealwayne.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u8F6F\u4EF6\u5DE5\u7A0B",
        "\u9879\u76EE\u7BA1\u7406",
        "\u8BFB\u4E66\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-c72636e1309e9873",
      name: "\u65F6\u5149\u7684\u65F6\u5149\u8F74",
      url: "https://outti.me/feed/xml",
      site: "https://outti.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6298\u817E",
        "\u751F\u6D3B",
        "\u5206\u4EAB",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-e5f2ab5725f05910",
      name: "whtli\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "http://hexo.whtli.cn/atom.xml",
      site: "http://hexo.whtli.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-b9675b02231f1c6f",
      name: "\u84B2\u5C0F\u82B1\u7684\u535A\u5BA2",
      url: "https://www.jackpu.com/rss/",
      site: "https://www.jackpu.com/",
      tags: [
        "\u524D\u7AEF",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-bb74ea1925cb1acf",
      name: "ccagml\u7684\u535A\u5BA2",
      url: "http://www.ccagml.com/?feed=rss2",
      site: "http://www.ccagml.com/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-442a7e86b004d4ca",
      name: "\u6CE0\u6CEB\u51DD\u7684\u5F02\u6B21\u5143\u7A7A\u95F4",
      url: "https://lxnchan.cn/atom.xml",
      site: "https://lxnchan.cn/",
      tags: [
        "\u8FD0\u7EF4",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-aeade3106e6cd1dd",
      name: "Colorful - \u4E00\u679A\u6570\u5B57\u827A\u672F\u5BB6\u7684\u81EA\u7559\u5730",
      url: "https://xiaoa.name/feed.xml",
      site: "https://xiaoa.name/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "Javascript",
        "Node.js",
        "Rust",
        "Java",
        "Python",
        "\u8BFB\u4E66\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-473cd94670f92a5e",
      name: "Sekyoro\u7684\u535A\u5BA2\u5C0F\u5C4B",
      url: "https://www.sekyoro.top/atom.xml",
      site: "https://www.sekyoro.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u673A\u5668\u5B66\u4E60",
        "\u5DE5\u5177\u4F7F\u7528",
        "\u8F6F\u4EF6\u5DE5\u7A0B"
      ]
    },
    {
      id: "blog-ad4ce1c299836a7f",
      name: "\u67F4\u90E1\u732B",
      url: "https://www.cheshirex.com/feed",
      site: "https://www.cheshirex.com/",
      tags: [
        "\u751F\u6D3B",
        "\u5206\u4EAB",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-3605428f389c801c",
      name: "obaby@mars",
      url: "https://h4ck.org.cn/feed/",
      site: "http://nai.dog/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u786C\u4EF6",
        "\u4EBA\u5DE5\u667A\u80FD"
      ]
    },
    {
      id: "blog-f536be364a24931f",
      name: "aikenh",
      url: "https://aikenh.cn/index.xml",
      site: "https://aikenh.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-89f5bedc03a1a74e",
      name: "\u9189\u91CC\u535A\u5BA2",
      url: "https://202271.xyz/atom.xml",
      site: "https://202271.xyz/",
      tags: [
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-f63f82ceaa4dcec2",
      name: "RBA\u7684\u6280\u672F\u5206\u4EAB",
      url: "https://www.firfor.cn/rss.xml",
      site: "https://firfor.cn/",
      tags: [
        "JAVA",
        "JVM",
        "HotSpot",
        "\u865A\u62DF\u673A",
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-7e857040af4cb175",
      name: "\u9ED1\u5DDD\u7720\u4E5F\u7684\u732B\u7A9D",
      url: "https://www.nekow.cn/index.php/feed/",
      site: "https://nekow.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u4E2A\u4EBA\u6210\u957F",
        "\u6298\u817E",
        "\u5B66\u4E60",
        "\u6E38\u620F",
        "\u5199\u4F5C"
      ]
    },
    {
      id: "blog-b779af565479a8e9",
      name: "LearnData \u5F00\u6E90\u7B14\u8BB0",
      url: "https://newzone.top/rss.xml",
      site: "https://newzone.top/",
      tags: [
        "\u7B14\u8BB0",
        "\u4E2A\u4EBA\u6210\u957F",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-d1f83ad9fe440dda",
      name: "\u4E5D\u4EDE\u4E4B\u884C",
      url: "https://styunlen.cn/feed",
      site: "https://styunlen.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u4EBA\u6587",
        "\u97F3\u4E50",
        "\u7B14\u8BB0",
        "\u751F\u6D3B\u65E5\u5E38"
      ]
    },
    {
      id: "blog-d38b7e6299976e6a",
      name: "Enderfga's blog",
      url: "https://enderfga.cn/atom.xml",
      site: "https://enderfga.cn/",
      tags: [
        "CV",
        "DL",
        "\u968F\u7B14",
        "\u6559\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-3a6536d420a021e3",
      name: "szhshp \u7684\u7B2C\u4E09\u8FB9\u5883\u7814\u7A76\u6240",
      url: "https://szhshp.org/sitemap.xml",
      site: "https://szhshp.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u4EBA\u6587",
        "\u97F3\u4E50",
        "\u7B14\u8BB0",
        "\u751F\u6D3B\u65E5\u5E38"
      ]
    },
    {
      id: "blog-53c0c4a0ee790f4b",
      name: "\u5C0F\u5B59\u540C\u5B66",
      url: "https://blog.sunguoqi.com/rss.xml",
      site: "https://blog.sunguoqi.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6444\u5F71",
        "\u751F\u6D3B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-3848da7c3bdc4eff",
      name: "ming5ming's blog",
      url: "https://ming5ming.xlog.app/feed/xml",
      site: "https://ming5ming.xlog.app/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-39b7b1449e2a015f",
      name: "\u7267\u5C18\u7684\u7F51\u7EDC\u65E5\u5FD7",
      url: "https://www.dreamlyn.cn/feed",
      site: "https://www.dreamlyn.cn/",
      tags: [
        "\u89E3\u51B3\u751F\u6D3B\u3001\u5DE5\u4F5C\u4E2D\u9047\u5230\u7684\u95EE\u9898"
      ]
    },
    {
      id: "blog-18e9ca61a0079afc",
      name: "\u8349\u6885\u53CB\u4EC1\u7684\u535A\u5BA2",
      url: "https://blog.cmyr.ltd/atom.xml",
      site: "https://blog.cmyr.ltd/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u524D\u7AEF",
        "\u65E5\u5E38",
        "TypeScript",
        "JavaScript",
        "Vue",
        "Node.js",
        "Docker"
      ]
    },
    {
      id: "blog-20c0584fdd211a8e",
      name: "Yusank's Site",
      url: "https://yusank.space/index.xml",
      site: "https://yusank.space/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "Golang",
        "Kubernetes",
        "\u5B66\u4E60",
        "\u7B14\u8BB0",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-33ba241a2896d9ae",
      name: "\u90D1\u6587\u5CF0\u7684\u535A\u5BA2",
      url: "https://www.zhengwenfeng.com/rss.xml",
      site: "https://www.zhengwenfeng.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u751F\u6D3B",
        "python",
        "golang"
      ]
    },
    {
      id: "blog-b344e3956a60de32",
      name: "MiaoHN's Blog",
      url: "https://miaohn.github.io/index.xml",
      site: "https://miaohn.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B66\u4E60",
        "\u7B14\u8BB0",
        "C++",
        "Linux"
      ]
    },
    {
      id: "blog-bf668cf7c8a2e4de",
      name: "n0tr00t's blog",
      url: "https://www.n0tr00t.eu.org/index.xml",
      site: "https://www.n0tr00t.eu.org/",
      tags: [
        "\u5B89\u5168",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c4735a027150a882",
      name: "CRUDMAN",
      url: "https://www.crudman.cn/index.xml",
      site: "https://www.crudman.cn/",
      tags: [
        "\u8F6F\u4EF6\u5F00\u53D1",
        "\u67B6\u6784\u8BBE\u8BA1",
        "\u804C\u4E1A\u53D1\u5C55",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u751F\u6D3B\u968F\u7B14"
      ]
    },
    {
      id: "blog-94ad0042e204b4f5",
      name: "PHP\u6B66\u5668\u5E93",
      url: "https://phpreturn.com/atom.xml",
      site: "https://phpreturn.com/",
      tags: [
        "PHP",
        "PHP\u9879\u76EE",
        "\u7F16\u7A0B",
        "\u8D44\u8BAF",
        "\u6280\u672F\u6587\u7AE0"
      ]
    },
    {
      id: "blog-23a39e4913c64676",
      name: "\u6D66\u660E\u7684\u535A\u5BA2",
      url: "https://puming.zone/index.xml",
      site: "https://puming.zone/",
      tags: [
        "\u5B89\u5168",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u4E91\u539F\u751F"
      ]
    },
    {
      id: "blog-11a0ca3e7804c69c",
      name: "\u7834\u788E\u5343\u79CB",
      url: "https://breakinglead.github.io/atom.xml",
      site: "https://breakinglead.github.io/",
      tags: [
        "\u521D\u4E2D",
        "\u7F16\u7A0B",
        "\u8BED\u8A00\u5B66",
        "Rust",
        "\u4E1C\u65B9Project",
        "\u968F\u7B14",
        "\u97F3\u4E50",
        "OI"
      ]
    },
    {
      id: "blog-c88cb6c0fcbe5e95",
      name: "Xiaobin's Blog",
      url: "https://lxb.wiki/atom.xml",
      site: "https://lxb.wiki/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-09e218cddca6c621",
      name: "LanYun\u306EBlog",
      url: "https://lanyundev.com/atom.xml",
      site: "https://lanyundev.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-826b09f5e4959749",
      name: "mikaelzero",
      url: "https://xrandroid.com/atom.xml",
      site: "https://xrandroid.com/",
      tags: [
        "VR",
        "Android Framework"
      ]
    },
    {
      id: "blog-fa6724be21541854",
      name: "Leo's blog",
      url: "https://leonis.cc/feed.xml",
      site: "https://leonis.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u9605\u8BFB",
        "\u6587\u5B66",
        "\u79D1\u7814"
      ]
    },
    {
      id: "blog-92b88f04a81cba4c",
      name: "WuHJ's Personel Site",
      url: "https://hjwu.cc/rss/feed.xml",
      site: "https://hjwu.cc/",
      tags: [
        "\u751F\u6D3B",
        "\u97F3\u4E50",
        "\u804A\u5929"
      ]
    },
    {
      id: "blog-07df1b9e4e588db1",
      name: "Tifa's Blog",
      url: "https://blog.tifa-233.com/atom.xml",
      site: "https://blog.tifa-233.com/",
      tags: [
        "\u7B97\u6CD5",
        "\u7F16\u7A0B",
        "C++",
        "\u4FE1\u606F\u5B66\u7ADE\u8D5B",
        "\u6570\u5B66",
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-399dd9af778e3872",
      name: "\u5B50\u865A\u6808",
      url: "https://blog.si-on.top/atom.xml",
      site: "https://blog.si-on.top/",
      tags: [
        "\u9605\u8BFB",
        "\u751F\u6D3B",
        "\u6750\u6599\u79D1\u5B66",
        "LaTeX",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-b9f54fbb4dafe787",
      name: "sjdhome blog",
      url: "https://sjdhome.com/blog/atom.xml",
      site: "https://sjdhome.com/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-2b9fe0b08093218c",
      name: "Hsu Yeung \u7684\u535A\u5BA2",
      url: "https://www.hsuyeung.com/feed",
      site: "https://www.hsuyeung.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u5B66\u4E60",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-7f38dbba3ed144fa",
      name: "Moby",
      url: "https://isfalse.pro/feed",
      site: "https://isfalse.pro/",
      tags: [
        "\u65E5\u5E38\u7B14\u8BB0",
        "\u6280\u672F\u5165\u95E8"
      ]
    },
    {
      id: "blog-64b383701ad1fae6",
      name: "kkocdko \u7684\u535A\u5BA2",
      url: "https://kkocdko.site/feed.xml",
      site: "https://kkocdko.site/",
      tags: [
        "\u6298\u817E",
        "Rust",
        "\u524D\u7AEF",
        "\u8E29\u5751"
      ]
    },
    {
      id: "blog-0575fabb3ac3c041",
      name: "\u82E5\u7EFE",
      url: "https://royc30ne.xlog.app/feed/xml",
      site: "https://royc30ne.com/",
      tags: [
        "\u673A\u5668\u5B66\u4E60",
        "\u6280\u672F",
        "\u7B97\u6CD5",
        "\u65E5\u5E38",
        "\u6444\u5F71",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-ba99d6a1960ac4a6",
      name: "\u5343\u53E4\u516B\u65B9\u7684\u535A\u5BA2",
      url: "https://rangotec.com/feed",
      site: "https://rangotec.com/",
      tags: [
        "\u7F16\u7A0B",
        "Android",
        "\u6570\u636E\u79C1\u6709\u5316"
      ]
    },
    {
      id: "blog-74f3947ba5873e22",
      name: "\u949F\u610F\u535A\u5BA2",
      url: "https://blog.thatcoder.cn/atom.xml",
      site: "https://blog.thatcoder.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-c74d5492689f86d0",
      name: "ikeno blog",
      url: "https://blog.ikeno.top/rss.xml",
      site: "https://blog.ikeno.top/",
      tags: [
        "\u6280\u672F",
        "\u5B66\u4E60",
        "ACG"
      ]
    },
    {
      id: "blog-9ef934b9da3571a2",
      name: "Coding\u624B\u827A\u4EBA",
      url: "https://www.smiletoyou.cn/feed",
      site: "https://www.smiletoyou.cn/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u67B6\u6784\u8BBE\u8BA1",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-7e42d974075da400",
      name: "AlexSJC \u7684\u535A\u5BA2",
      url: "https://blog.c3c.one/feed",
      site: "https://blog.c3c.one/",
      tags: [
        "\u7B14\u8BB0",
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f0e120a8d2e561f8",
      name: "\u788E\u8A00\u535A\u5BA2",
      url: "https://suiyan.cc/rss.xml",
      site: "https://suiyan.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B14\u8BB0",
        "\u968F\u611F"
      ]
    },
    {
      id: "blog-ccc43e6e73528e9f",
      name: "Dr3@m's Blog",
      url: "https://blog.ctftools.com/atom.xml",
      site: "https://blog.ctftools.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u7ECF\u9A8C"
      ]
    },
    {
      id: "blog-82634375c085f86b",
      name: "\u4EFB\u970F\u535A\u5BA2",
      url: "https://blog.renfei.net/rss.xml",
      site: "https://blog.renfei.net/",
      tags: [
        "\u7F16\u7A0B",
        "Java",
        "\u7ECF\u9A8C"
      ]
    },
    {
      id: "blog-7249e376df69e935",
      name: "Shuibaco \u2022 \u6C34\u516B\u53E3",
      url: "https://shuiba.co/feed",
      site: "https://shuiba.co/",
      tags: [
        "\u65E5\u5E38",
        "\u65C5\u9014",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-967921ed1134b9ac",
      name: "\u6D41\u91D1\u5C81\u6708",
      url: "https://iliu.org/feed",
      site: "https://iliu.org/",
      tags: [
        "\u751F\u6D3B",
        "\u8BFB\u4E66",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-8a8d1ce82248f056",
      name: "Darren blog",
      url: "https://blog.darrenzzy.cn/atom.xml",
      site: "https://blog.darrenzzy.cn/",
      tags: [
        "\u7B97\u6CD5\uFF0C\u7F16\u7A0B\uFF0C\u67B6\u6784"
      ]
    },
    {
      id: "blog-ea1fb3315e2a9a57",
      name: "\u51CC\u89C8\u793E",
      url: "http://linglan01.cn/feed.xml",
      site: "http://linglan01.cn/",
      tags: [
        "\u524D\u7AEF",
        "Node.js",
        "\u968F\u7B14",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-0c8833508cea8a94",
      name: "SRE\u8FD0\u7EF4\u535A\u5BA2",
      url: "https://www.cnsre.cn/index.xml",
      site: "https://www.cnsre.cn/",
      tags: [
        "Linux",
        "\u81EA\u52A8\u5316\u8FD0\u7EF4",
        "AWS",
        "K8S"
      ]
    },
    {
      id: "blog-605d56c4052411a0",
      name: "Ripple's blog",
      url: "https://hiripple.com/feed",
      site: "https://hiripple.com/",
      tags: [
        "\u6280\u672F",
        "\u6E38\u620F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4a6a13895b1025c9",
      name: "\u8FDC\u9E4F\u7684\u535A\u5BA2",
      url: "https://liangyuanpeng.com/index.xml",
      site: "https://liangyuanpeng.com/",
      tags: [
        "\u4E91\u539F\u751F",
        "Pulsar",
        "CNCF",
        "CDF",
        "\u5BB9\u5668",
        "K8S"
      ]
    },
    {
      id: "blog-54091469dca9af52",
      name: "\u98CE\u8427\u53E4\u9053",
      url: "https://windypath.com/rss.xml",
      site: "https://windypath.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u8F6F\u4EF6",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-94f881b6bd968fab",
      name: "\u996D\u55B5",
      url: "https://blog.fanmiao.site/feed",
      site: "https://blog.fanmiao.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u667A\u80FD",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-0dbb1d17d3d512b7",
      name: "\u4E18\u5361\u996E\u54C1\u5E97",
      url: "https://blog.zerolacqua.top/atom.xml",
      site: "https://blog.zerolacqua.top/",
      tags: [
        "\u5B66\u4E60",
        "\u751F\u6D3B",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-8fa0b874217c6da8",
      name: "\u8BC6\u6587\u89E3\u610F\u7684\u7231\u4E66\u4EBA",
      url: "http://yyy.zone/rss",
      site: "http://yyy.zone/",
      tags: [
        "\u7B14\u8BB0",
        "\u672D\u8BB0"
      ]
    },
    {
      id: "blog-d7362ff8d6c949e6",
      name: "Oragekk's Blog",
      url: "https://oragekk.me/rss.xml",
      site: "https://oragekk.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u751F\u6D3B\u6742\u60F3",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-2b382f9f676cf20f",
      name: "\u53C8\u8033\u7B14\u8BB0",
      url: "https://youerning.top/index.xml",
      site: "https://youerning.top/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ad6fbdc9fc94726f",
      name: "\u8C46\u9017\u5B50\u7684\u5C0F\u9ED1\u5C4B",
      url: "https://weaxsey.org/index.html",
      site: "https://weaxsey.org/",
      tags: [
        "\u5B66\u4E60",
        "\u968F\u7B14",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-eb634e0d096bcc5a",
      name: "Log4D",
      url: "https://blog.alswl.com/atom.xml",
      site: "https://blog.alswl.com/",
      tags: [
        "\u7B14\u8BB0",
        "\u6280\u672F",
        "\u5B66\u4E60",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-4f4e11d22a4877e6",
      name: "\u6C99\u591A\u591A\u7684\u5947\u601D\u5999\u60F3",
      url: "https://fallen.wang/index.xml",
      site: "https://fallen.wang/",
      tags: [
        "\u533B\u5B66",
        "\u7F16\u7A0B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-2be19476fc34739d",
      name: "\u571F\u6CD5\u70BC\u94A2\u5174\u8DA3\u5C0F\u7EC4\u7684\u535A\u5BA2",
      url: "https://quant67.com/rss.xml",
      site: "https://quant67.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-5f1a4cefa8ca92fd",
      name: "Dorad's Life",
      url: "https://blog.cuger.cn/atom.xml",
      site: "https://blog.cuger.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6444\u5F71",
        "\u65E5\u5E38",
        "\u79D1\u7814"
      ]
    },
    {
      id: "blog-2603c09278f1b112",
      name: "\u30CD\u30B3\u306E\u30E1\u30E2\u5E33",
      url: "https://n.ova.moe/blog/rss.xml",
      site: "https://n.ova.moe/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B89\u5168",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-c1dd866e6e615426",
      name: "\u6D45\u65F6\u5149\u535A\u5BA2",
      url: "https://www.dqzboy.com/feed",
      site: "https://www.dqzboy.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u5B66\u4E60\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-a20d5b63c25de68d",
      name: "Cirry's Blog",
      url: "https://cirry.cn/rss.xml",
      site: "https://cirry.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-9aec54b5dc7413c8",
      name: "Kivinsae's Nest",
      url: "https://www.kivinsae.com/atom.xml",
      site: "https://www.kivinsae.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-19bff396b1b735f3",
      name: "\u665A\u98CE\u535A\u5BA2",
      url: "https://xlog.me/feed",
      site: "https://xlog.me/",
      tags: [
        "\u751F\u6D3B",
        "\u65C5\u884C",
        "\u80B2\u513F"
      ]
    },
    {
      id: "blog-5a857dea54fa2057",
      name: "\u8D28\u6570\u4EBA\u751F",
      url: "https://2357.life/rss/feed.xml",
      site: "https://2357.life/",
      tags: [
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u5B9E\u8DF5",
        "\u6210\u957F"
      ]
    },
    {
      id: "blog-ab4bc36347087fb3",
      name: "HikariLan's Blog",
      url: "https://my.minecraft.kim/feed",
      site: "https://my.minecraft.kim/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u751F\u6D3B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-04e06f6a53a8ef27",
      name: "Rehtt's Blog",
      url: "https://rehtt.com/index.php/feed/",
      site: "https://rehtt.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u6298\u817E",
        "Furry"
      ]
    },
    {
      id: "blog-41ae23ae7b6c8263",
      name: "Bluemangoo;s Blog",
      url: "https://blog.bluemangoo.net/rss.xml",
      site: "https://blog.bluemangoo.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u5199\u4F5C"
      ]
    },
    {
      id: "blog-09e9f8ed14148d11",
      name: "trudbot's blog",
      url: "https://trudbot.cn/atom.xml",
      site: "https://trudbot.cn/",
      tags: [
        "\u7B97\u6CD5",
        "\u6280\u672F",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-a64614caba7ffa38",
      name: "\u8FD9\u91CC\u662FL",
      url: "https://liuuzaki.net/feed",
      site: "https://liuuzaki.net/",
      tags: [
        "CG\u7F8E\u672F",
        "\u54F2\u5B66",
        "\u793E\u4F1A",
        "\u5404\u79CD\u6742\u5B66"
      ]
    },
    {
      id: "blog-6aab44f73fd8638a",
      name: "shimmer",
      url: "https://wp-boke.work/rss.xml",
      site: "https://wp-boke.work/",
      tags: [
        "\u524D\u7AEF",
        "\u6280\u672F\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-0350e654b916b3ef",
      name: "\u8C4C\u8C46\u82B1\u4E0B\u732B - Python\u732B",
      url: "https://pythoncat.top/rss.xml",
      site: "https://pythoncat.top/",
      tags: [
        "\u7F16\u7A0B",
        "Python",
        "\u7FFB\u8BD1",
        "\u968F\u7B14",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-5f0496066d21540a",
      name: "WAYJAM's Blog",
      url: "https://wayjam.me/index.xml",
      site: "https://wayjam.me/",
      tags: [
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-cc4a91532acba8cc",
      name: "\u91CD\u751F\u4E91",
      url: "https://xiaochopin.github.io/feed.xml",
      site: "https://xiaochopin.github.io/",
      tags: [
        "\u968F\u7B14",
        "\u65E5\u5E38",
        "\u6E38\u620F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-0bb5f350ddc3bda3",
      name: "\u67D2\u6708\u662F\u4F60\u7684\u8C0E\u8A00",
      url: "https://www.huangdf.xyz/rss.xml",
      site: "https://www.huangdf.xyz/",
      tags: [
        "Java",
        "Rust",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-3f3b394a1cf12ebb",
      name: "FKY&JYQ",
      url: "https://blog.fkynjyq.com/feed.xml",
      site: "https://blog.fkynjyq.com/",
      tags: [
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-cc739ac8e5e9847e",
      name: "Vincent' blog",
      url: "https://wekic.com/rss.xml",
      site: "https://wekic.com/",
      tags: [
        "\u524D\u7AEF",
        "\u6280\u672F\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-7662101feaad690e",
      name: "\u95F2\u4EBALife",
      url: "https://www.xianrenlife.com/feeds/posts/default",
      site: "https://www.xianrenlife.com/",
      tags: [
        "\u968F\u7B14",
        "\u5C0F\u8BF4",
        "\u4E66\u8BC4"
      ]
    },
    {
      id: "blog-82b025f5fe45fcaf",
      name: "\u826F\u8BF4",
      url: "https://xijingxu.blog/atom.xml",
      site: "https://xijingxu.blog/",
      tags: [
        "\u8BBE\u8BA1",
        "\u827A\u672F",
        "\u98DF\u7269",
        "\u624B\u5DE5",
        "\u521B\u4F5C",
        "\u8C03\u7814",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-070aa5aff40ca04a",
      name: "\u53E4\u65F6\u7684\u98CE\u7B5D",
      url: "https://www.moonkite.cn/index.xml",
      site: "https://www.moonkite.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u968F\u610F\u53D1\u6325"
      ]
    },
    {
      id: "blog-5d83da2eadd5e308",
      name: "\u83DC\u76AE\u65E5\u8BB0",
      url: "https://www.lipijin.com/feed",
      site: "https://www.lipijin.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BFB\u4E66",
        "\u968F\u7B14",
        "\u6444\u5F71",
        "\u505A\u996D",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-a0e80a34ecb21e75",
      name: "\u8679\u7EBF",
      url: "https://1q43.blog/feed",
      site: "https://1q43.blog/",
      tags: [
        "\u5546\u4E1A",
        "\u793E\u79D1",
        "\u79D1\u6280",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-070be887fe0b6785",
      name: "\u65E0\u540D\u5C0F\u7AD9",
      url: "https://waahah.xyz/atom.xml",
      site: "https://waahah.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u8E29\u5751",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-65e535f0d9a1e76f",
      name: "\u79CB\u8272\u90E8\u843D",
      url: "https://qiu.se/feed",
      site: "https://qiu.se/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8FD0\u52A8"
      ]
    },
    {
      id: "blog-53fc3b22d7750bc0",
      name: "Seraphine\u306E\u5C0F\u7A9D",
      url: "https://www.helloseraphine.top/atom.xml",
      site: "https://www.helloseraphine.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u673A\u5668\u5B66\u4E60",
        "\u5FAE\u8F6F\u5929\u5751"
      ]
    },
    {
      id: "blog-1227e5dcf432c0ec",
      name: "\u4E1C\u8BC4\u897F\u5C31",
      url: "https://dongjunke.cn/atom.xml",
      site: "https://dongjunke.cn/",
      tags: [
        "\u793E\u4EA4\u5A92\u4F53",
        "\u79D1\u6280\u4E92\u8054\u7F51",
        "\u601D\u8003",
        "\u8BFB\u4E66",
        "\u968F\u7B14",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-b3221a83f4f582d0",
      name: "Leon Fong \u7684\u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://leonfong.me/feed.xml",
      site: "https://leonfong.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u5206\u4EAB",
        "\u8BB0\u5F55",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-749b77566d26a164",
      name: "Ke's blog",
      url: "https://mengke.me/feed.xml",
      site: "https://mengke.me/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-2068bc31d6729c97",
      name: "\u86EE\u8346",
      url: "https://dbwu.tech/index.xml",
      site: "https://dbwu.tech/",
      tags: [
        "Go \u8BED\u8A00",
        "\u4E91\u539F\u751F",
        "CS \u57FA\u7840\u7406\u8BBA\u548C\u8F6F\u4EF6"
      ]
    },
    {
      id: "blog-ae1544ad84803038",
      name: "\u6587\u6B66\u79D1\u6280\u67DC",
      url: "https://www.wangdu.site/feed",
      site: "https://www.wangdu.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u8F6F\u4EF6",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-b226b16eab9c881f",
      name: "Oct.Cool",
      url: "https://www.oct.cool/index.xml",
      site: "https://www.oct.cool/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "Flutter"
      ]
    },
    {
      id: "blog-2e6b4db232821824",
      name: "\u7279\u7ACB\u72EC\u884C\u7684\u5F02\u7C7B",
      url: "https://www.demochen.com/atom.xml",
      site: "https://www.demochen.com/",
      tags: [
        "\u9605\u8BFB\u4E0E\u601D\u8003",
        "\u6548\u7387\u4E0E\u5DE5\u5177",
        "\u751F\u6D3B\u4E0E\u6210\u957F"
      ]
    },
    {
      id: "blog-39fc48a2a07f5a2c",
      name: "Ivan's blog",
      url: "https://ivanli.cc/feed.xml",
      site: "https://ivanli.cc/",
      tags: [
        "\u7F16\u7A0B",
        "Web",
        "\u786C\u4EF6",
        "\u5168\u6808"
      ]
    },
    {
      id: "blog-de26f736b56666e8",
      name: "Ivan's Timeline",
      url: "https://tl.ivanli.cc/u/1/rss.xml",
      site: "https://tl.ivanli.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u786C\u4EF6",
        "\u968F\u60F3",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-44965c6dd24848c9",
      name: "Nemo",
      url: "https://nemo.cool/rss",
      site: "https://nemo.cool/",
      tags: [
        "\u673A\u5668\u4EBA",
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9eda51e751b5bcc9",
      name: "\u5143\u5426\u7684\u7814\u7A76\u5BA4",
      url: "https://www.happyfou.com/index.xml",
      site: "https://www.happyfou.com/",
      tags: [
        "\u6559\u7A0B",
        "\u8BA4\u77E5",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-9af69af27ac44cdf",
      name: "\u65B9\u5BF8\u4E4B\u95F4",
      url: "https://smj.im/rss.xml",
      site: "https://smj.im/",
      tags: [
        "Linux",
        "\u540E\u7AEF",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-605cfed1cc1cf5bb",
      name: "\u83AB\u5C14\u7D22",
      url: "https://liduos.com/atom.xml",
      site: "https://liduos.com/",
      tags: [
        "Python",
        "SDN",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "LLM\u5E94\u7528\u5F00\u53D1"
      ]
    },
    {
      id: "blog-fbdf26bfa5a9e8b1",
      name: "\u534A\u65B9\u6C60\u6C34\u534A\u65B9\u7530",
      url: "https://uuanqin.top/atom.xml",
      site: "https://uuanqin.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-633af6928ae6f096",
      name: "\u897F\u884C\u5996",
      url: "https://my.toho.red/index.xml",
      site: "https://my.toho.red/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u7B14\u8BB0",
        "\u968F\u7B14",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-a58bfb56f8f8a107",
      name: "\u54C8\u5C14\u7684\u57CE\u5821",
      url: "https://hallee.me/atom",
      site: "https://hallee.me/",
      tags: [
        "\u8BBE\u8BA1",
        "\u65E5\u5E38",
        "\u65C5\u884C",
        "\u5F00\u53D1"
      ]
    },
    {
      id: "blog-9e65c7b14e4bd489",
      name: "X\xB7myLog",
      url: "https://www.xmylog.com/rss/feed.xml",
      site: "https://www.xmylog.com/",
      tags: [
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u7ECF\u9A8C",
        "\u65C5\u884C",
        "\u63A8\u8350",
        "\u751F\u6D3B",
        "\u97F3\u4E50",
        "\u7535\u5F71"
      ]
    },
    {
      id: "blog-af5149b0a2697453",
      name: "\u767D\u83DC",
      url: "https://blog.baicai.me/index.xml",
      site: "https://blog.baicai.me/",
      tags: [
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u7ECF\u9A8C",
        "\u65C5\u884C",
        "\u63A8\u8350",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-c7356b172af43f7f",
      name: "\u5211\u8FA9\u4EBA\u5728\u8DEF\u4E0A",
      url: "https://xingbianren.cn/feed.php",
      site: "https://xingbianren.cn/",
      tags: [
        "\u5F8B\u5E08",
        "\u5211\u4E8B\u8FA9\u62A4",
        "\u65E0\u7F6A\u8FA9\u62A4",
        "\u529E\u6848\u6545\u4E8B"
      ]
    },
    {
      id: "blog-e48c6ed1143b2ad6",
      name: "Krysztal\u7684\u4E66\u684C",
      url: "https://blog.krysztal.dev/atom.xml",
      site: "https://blog.krysztal.dev/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u786C\u4EF6",
        "\u540E\u7AEF",
        "Furry",
        "\u7ECF\u9A8C"
      ]
    },
    {
      id: "blog-4d25ecfc161b5c74",
      name: "\u5927\u5C0F\u7897\u8BD7\u8BDD",
      url: "https://christianpoet.github.io/atom.xml",
      site: "https://christianpoet.github.io/",
      tags: [
        "\u8BD7\u6B4C\u539F\u521B",
        "\u8BD7\u6B4C\u7FFB\u8BD1",
        "\u57FA\u7763\u5F92\u8BD7\u6B4C",
        "\u5723\u7ECF\u601D\u8003",
        "\u751F\u6D3B\u968F\u7B14"
      ]
    },
    {
      id: "blog-db2909fca5d9edda",
      name: "Yuteng's Blog",
      url: "https://yanyuteng.netlify.app/atom.xml",
      site: "https://yanyuteng.github.io/",
      tags: [
        "\u793E\u4F1A\u5B66",
        "\u4EBA\u53E3\u5B66",
        "\u65C5\u884C",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-122ce48fd6f04297",
      name: "\u6642\u9593\u8C46",
      url: "http://halo.zfc.life/archives/5152aea5-c2e8-4717-8bba-2263d46e19d5",
      site: "http://halo.zfc.life/",
      tags: [
        "\u7B14\u8BB0",
        "\u751F\u6D3B",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-4641e0d32f880b58",
      name: "\u5341\u4E8C\u7684\u7F16\u7A0B\u7B14\u8BB0",
      url: "https://blog.twelveeee.top/rss.xml",
      site: "https://blog.twelveeee.top/",
      tags: [
        "\u7B14\u8BB0",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4bb66be337f4a1eb",
      name: "\u674E\u5BD2\u7684\u5C0F\u7A9D",
      url: "https://lihan3238.github.io/index.xml",
      site: "https://lihan3238.github.io/",
      tags: [
        "\u5B66\u4E60",
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u601D\u7D22"
      ]
    },
    {
      id: "blog-5633273a33f1248f",
      name: "Ryan' Lab",
      url: "https://blog.gaoran.xyz/rss/feed.xml",
      site: "https://blog.gaoran.xyz/",
      tags: [
        "\u4EA7\u54C1",
        "\u8BC4\u6D4B",
        "AIGC",
        "\u751F\u6D3B",
        "\u6280\u5DE7"
      ]
    },
    {
      id: "blog-ea383a35d259098c",
      name: "\u53F9\u4E16\u754C",
      url: "https://www.hauhau.cn/feed.xml",
      site: "https://www.hauhau.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-869a7d57baf3edf2",
      name: "Abner\u7684\u79D8\u5BC6\u57FA\u5730",
      url: "https://cdt3211.top/atom.xml",
      site: "https://cdt3211.top/",
      tags: [
        "\u751F\u6D3B",
        "\u5B66\u4E60",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-828944604f520895",
      name: "\u519C\u7801\u751F\u6DAF \u65E0\u9152\u65E0\u82B1",
      url: "https://nicrosoft.net/blog/feed/",
      site: "https://www.nicrosoft.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-e6386e9a9c034b67",
      name: "\u6D6E\u751F\u7B14\u8BB0",
      url: "https://www.dennisthink.com/index.xml",
      site: "https://www.dennisthink.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "C++"
      ]
    },
    {
      id: "blog-c64a0cf7ea289586",
      name: "Laike9m's blog",
      url: "https://laike9m.com/blog/rss/",
      site: "https://laike9m.com/blog/",
      tags: [
        "Python",
        "\u751F\u6D3B",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-1025baa467c11dec",
      name: "\u65F6\u7A7A\u4E4B\u6B4C",
      url: "https://space520.eu.org/feed/",
      site: "https://space520.eu.org/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-2c2e30555879cff0",
      name: "\u6708\u68A6\u306E\u6280\u672F\u535A\u5BA2",
      url: "https://ymiir.top/feed.xml",
      site: "https://ymiir.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BA1\u7B97\u673A\u6280\u672F",
        "Golang",
        "\u4E91\u539F\u751F"
      ]
    },
    {
      id: "blog-f3edc9e5c0533a82",
      name: "Jason Lee\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://blog.jasonleehere.com/atom.xml",
      site: "https://blog.jasonleehere.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6DA6",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-4185aec407410d4a",
      name: "by Upsangel",
      url: "https://upsangel.com/feed/",
      site: "https://upsangel.com/",
      tags: [
        "\u7F51\u8DEF\u786C\u4EF6",
        "NAS",
        "\u5355\u677F\u7535\u8111",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-1d46eabe78a3147d",
      name: "krkr2(beta)",
      url: "https://www.krkr2.xyz/feed/",
      site: "https://www.krkr2.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u5206\u4EAB",
        "\u4E8C\u6B21\u5143",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-ec10738ac6e845df",
      name: "\u79CB\u6FAAAkimio",
      url: "https://blog.akimio.top/rss2.xml/",
      site: "https://blog.akimio.top/",
      tags: [
        "\u79D1\u6280",
        "\u7F51\u8DEF",
        "\u5B66\u4E60\u8BB0\u5F55",
        "NAS",
        "PC"
      ]
    },
    {
      id: "blog-3ed3cb90db68abd1",
      name: "Sky Watch",
      url: "https://darksair.org/blog/feed.xml",
      site: "https://darksair.org/blog/",
      tags: [
        "\u65E5\u5E38",
        "\u7B14\u8BB0",
        "\u601D\u8003",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-b375c756d73d5a44",
      name: "booop",
      url: "https://booop.net/feed/",
      site: "https://booop.net/",
      tags: [
        "\u65E5\u5E38",
        "\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u5F00\u53D1",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-31409ba385083bb9",
      name: "Shanwer's Blog",
      url: "https://blog.shanwer.top/feed/",
      site: "https://blog.shanwer.top/",
      tags: [
        "\u65E5\u5E38",
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u7B14\u8BB0",
        "\u5F00\u53D1",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-d1c71a0576b4eb2c",
      name: "xnum's Blog",
      url: "https://xnum.github.io/feed.xml",
      site: "https://xnum.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6298\u817E",
        "\u540E\u7AEF"
      ]
    },
    {
      id: "blog-31d359cd29088a29",
      name: "\u65E0\u540D\u535A\u5BA2",
      url: "https://wuminboke.site/feed/",
      site: "https://wuminboke.site/",
      tags: [
        "\u65E5\u5E38",
        "\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u5F00\u53D1",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-ec114d8437bb9160",
      name: "gorpeln\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://gorpeln.top/feed.xml",
      site: "https://gorpeln.top/",
      tags: [
        "\u65E5\u5E38",
        "\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u5F00\u53D1",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-6139ae6974131bf8",
      name: "\u9762\u6761\u5B9E\u9A8C\u5BA4",
      url: "https://feed.miantiao.me/",
      site: "https://chi.miantiao.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-40824c1b1b8b648b",
      name: "Longlong's Blog",
      url: "https://blog.xlonglong.cn/feed/",
      site: "https://blog.xlonglong.cn/",
      tags: [
        "\u751F\u6D3B\u65E5\u5E38",
        "\u968F\u7B14",
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u70BC\u4E39",
        "\u5F00\u53D1"
      ]
    },
    {
      id: "blog-07be1537517d9631",
      name: "Ruter's Blog",
      url: "https://ruterly.com/feed/",
      site: "https://ruterly.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u5F00\u53D1",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-75a0875de2ddcc9c",
      name: "\u5C0F\u5434\u4E50\u610F\u2019blog",
      url: "http://xiaowuleyi/feed",
      site: "https://www.xiaowuleyi.com/",
      tags: [
        "\u751F\u6D3B\u968F\u60F3",
        "\u5546\u4E1A\u601D\u8003"
      ]
    },
    {
      id: "blog-b5c81ee58bfc8e22",
      name: "Gary's Blog",
      url: "https://garymeng.com/feed/",
      site: "https://garymeng.com/",
      tags: [
        "\u7F16\u7A0B",
        "IT\u6280\u672F",
        "\u6D77\u5916\u5DE5\u4F5C",
        "AI Agent"
      ]
    },
    {
      id: "blog-d3b8801173111df8",
      name: "\u5C40\u57DF\u81EA\u7531",
      url: "https://localfreedom.pages.dev/index.xml",
      site: "https://localfreedom.pages.dev/",
      tags: [
        "\u8F6F\u4EF6",
        "\u9690\u79C1",
        "\u7B14\u8BB0",
        "\u672C\u5730\u5316"
      ]
    },
    {
      id: "blog-806d4dceff54be45",
      name: "Qifei's Blog",
      url: "https://blog.sci.ci/rss2.xml",
      site: "https://blog.sci.ci/",
      tags: [
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u673A\u5668\u5B66\u4E60",
        "\u524D\u7AEF",
        "\u7B97\u6CD5",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-d02c8cca3cb9fe93",
      name: "\u732B\u56DB\u53D4",
      url: "https://yuanj.top/index.xml",
      site: "https://yuanj.top/",
      tags: [
        "\u5B66\u4E60",
        "\u751F\u6D3B",
        "\u751F\u7269\u4FE1\u606F\u5B66"
      ]
    },
    {
      id: "blog-00b2801a789c4e10",
      name: "\u4E91\u65E0\u5FC3\u5929\u5929\u5411\u4E0A",
      url: "https://yangk.net/blog/rss.xml",
      site: "https://yangk.net/blog/",
      tags: [
        "\u95F2\u8C08",
        "\u7B14\u8BB0",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-425b6879ca479dac",
      name: "Qborfy\u77E5\u8BC6\u5E93",
      url: "https://qborfy.com/atom.xml",
      site: "https://qborfy.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u9605\u8BFB\u603B\u7ED3",
        "\u6280\u672F",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-d935f70dea797037",
      name: "fwqaaq's Blog",
      url: "https://www.fwqaq.us/feed.xml",
      site: "https://www.fwqaq.us/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5F00\u53D1",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-03b5018606a363ba",
      name: "AabyssZG's Blog",
      url: "https://blog.zgsec.cn/feed/",
      site: "https://blog.zgsec.cn/",
      tags: [
        "\u7F51\u7EDC\u5B89\u5168",
        "\u968F\u7B14",
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u7ECF\u9A8C\u5206\u4EAB",
        "\u7F16\u7A0B",
        "\u4E91\u5B89\u5168",
        "\u6E17\u900F\u6D4B\u8BD5"
      ]
    },
    {
      id: "blog-f7cb835d90c44e7e",
      name: "Mox\u7684\u7B14\u8BB0\u5E93",
      url: "https://mocusez.site/zh-CN/atom.xml",
      site: "https://mocusez.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u6570\u636E\u5E93",
        "\u7A0B\u5E8F\u7F16\u8BD1\u5668",
        "\u968F\u7B14",
        "\u5B66\u4E60\u7B14\u8BB0",
        "\u7ECF\u9A8C\u5206\u4EAB",
        "IT\u6280\u672F"
      ]
    },
    {
      id: "blog-c9aaf1634bc55ef4",
      name: "\u4E13\u4EAB\u751F\u6D3B",
      url: "https://zhjwork.online/feed",
      site: "https://zhjwork.online/",
      tags: [
        "\u4E13\u5229",
        "\u79D1\u6280",
        "\u968F\u7B14",
        "\u6CD5\u5F8B",
        "\u5468\u906D\u751F\u6D3B"
      ]
    },
    {
      id: "blog-63b44a8e9eea8798",
      name: "\u6B63\u5FF5",
      url: "https://wp.wtrzl.xyz/feed",
      site: "https://wp.wtrzl.xyz/",
      tags: [
        "\u6280\u672F\u5206\u4EAB",
        "\u884C\u4E1A\u7ECF\u9A8C",
        "AGI",
        "\u5927\u6570\u636E",
        "\u4E91\u8BA1\u7B97",
        "\u67B6\u6784\u8BBE\u8BA1",
        "\u751F\u6D3B\u601D\u8003"
      ]
    },
    {
      id: "blog-9eab86a84b8cf389",
      name: "8ug.icu",
      url: "https://www.8ug.icu/rss.xml",
      site: "https://www.8ug.icu/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u5F00\u6E90\u8F6F\u4EF6"
      ]
    },
    {
      id: "blog-a29911e0e35d33e2",
      name: "QP's Blog",
      url: "https://www.szqp.site/feed",
      site: "https://www.szqp.site/",
      tags: [
        "\u751F\u6D3B",
        "\u65C5\u884C",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-c722b0b68c35ed6d",
      name: "lazy_forever's Blog",
      url: "https://blog.lazyforever.top/atom.xml",
      site: "https://blog.lazyforever.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5B89\u5168",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-3caa39256feddd0e",
      name: "\u963F\u732A",
      url: "https://yfzhu.cn/rss2.xml",
      site: "https://yfzhu.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u91CF\u5316\u4EA4\u6613",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-6a5d4a36239441d8",
      name: "\u5BD2\u4E5D",
      url: "https://hhao.wang/feed",
      site: "https://www.hhao.wang/",
      tags: [
        "Web",
        "C#",
        "\u6280\u672F",
        "\u67B6\u6784"
      ]
    },
    {
      id: "blog-f630d18e1e851e1f",
      name: "\u6BB5\u67D0\u4EBA\u7684\u535A\u5BA2",
      url: "https://duanmourena.github.io/feed.xml",
      site: "https://duanmourena.github.io/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u67B6\u6784",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c627326d7ffb7158",
      name: "\u6D41\u52A8",
      url: "https://liudon.com/index.xml",
      site: "https://liudon.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-f4a860a0c07cd882",
      name: "FGHRSH \u7684\u535A\u5BA2",
      url: "https://www.fghrsh.net/feed.php",
      site: "https://www.fghrsh.net/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u79D1\u6280",
        "\u6570\u7801",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-3d308b2279dc6e3c",
      name: "ZLA \u5C0F\u7AD9",
      url: "https://www.zla.pub/feed.xml",
      site: "https://www.zla.pub/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u79D1\u6280",
        "\u6570\u7801",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u673A\u5668\u5B66\u4E60",
        "\u6DF1\u5EA6\u5B66\u4E60"
      ]
    },
    {
      id: "blog-f27b014e68997790",
      name: "Another Dayu",
      url: "https://anotherdayu.com/feed/",
      site: "https://anotherdayu.com/",
      tags: [
        "\u65E5\u5E38",
        "\u6D41\u884C\u75C5\u4E0E\u536B\u751F\u7EDF\u8BA1",
        "\u79D1\u6280",
        "\u6570\u7801"
      ]
    },
    {
      id: "blog-ebb8b19187d2d35b",
      name: "\u80E1\u8BF4",
      url: "https://blog.zhangyingwei.com/index.xml",
      site: "https://blog.zhangyingwei.com/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u4EA7\u54C1"
      ]
    },
    {
      id: "blog-76bf5668950a678d",
      name: "\u5531\u8BD7\u73ED",
      url: "https://changshiban.com/index.xml",
      site: "https://changshiban.com/",
      tags: [
        "\u751F\u6D3B\u65B9\u5F0F",
        "\u54F2\u5B66\u5B97\u6559",
        "\u5386\u53F2\u4EBA\u6587",
        "\u8D22\u5BCC\u5E78\u798F"
      ]
    },
    {
      id: "blog-c4be37168cb549c0",
      name: "\u738B\u5149\u536B\u535A\u5BA2",
      url: "https://www.guangweiblog.com/feed/",
      site: "https://www.guangweiblog.com/",
      tags: [
        "\u6570\u5B57\u8425\u9500",
        "\u6570\u636E\u5206\u6790"
      ]
    },
    {
      id: "blog-0fd4a048717c3271",
      name: "\u7CA5\u91CC\u6709\u52FA\u7CD6",
      url: "https://sugarat.top/feed.rss",
      site: "https://sugarat.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u5927\u524D\u7AEF",
        "\u5F00\u6E90",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c22bd02141f37972",
      name: "Path2Exile",
      url: "https://path2exile.com/feed.xml",
      site: "https://path2exile.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u7231\u597D",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-2f2bc72c8c392d17",
      name: "Innomad\u4E00\u632A\u8FC8",
      url: "https://innomad.io/feed",
      site: "https://innomad.io/",
      tags: [
        "\u6295\u8D44",
        "\u72EC\u7ACB\u5F00\u53D1",
        "\u6570\u5B57\u6E38\u6C11"
      ]
    },
    {
      id: "blog-7aa87b8ea8a0f0dd",
      name: "Raye's Journey",
      url: "https://rayepeng.net/feed",
      site: "https://rayepeng.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-d2805a6f6e333d6a",
      name: "CuB3y0nd's Writings",
      url: "https://www.cubeyond.net/feed.xml",
      site: "https://cubeyond.net/",
      tags: [
        "\u7F51\u7EDC\u5B89\u5168",
        "PWN",
        "\u9006\u5411",
        "\u5BC6\u7801\u5B66",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-6282b8c33a7d1514",
      name: "\u4FDF\u6CB3\u6E05",
      url: "https://naive514.top/atom.xml",
      site: "https://naive514.top/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u6C34\u6587",
        "\u6C34\u5229\u5DE5\u7A0B"
      ]
    },
    {
      id: "blog-ef4ac5475e2dc397",
      name: "\u6E38\u9493\u56DB\u65B9",
      url: "https://lhasa.icu/atom.xml",
      site: "https://lhasa.icu/",
      tags: [
        "\u9A91\u884C",
        "\u97F3\u4E50",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-cbaabbd5c6986227",
      name: "\u5341\u6708\u9057\u5FD8\u8BD7",
      url: "https://greniray.org/feed",
      site: "https://greniray.org/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6587\u5B66",
        "\u8BD7\u6B4C"
      ]
    },
    {
      id: "blog-6d6b880fc98d09be",
      name: "AsyncX's Blog",
      url: "https://hi.asyncx.top/rss.xml",
      site: "https://hi.asyncx.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u54F2\u5B66",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-18862d954f2988ec",
      name: "Mag\u2018s Blog",
      url: "https://mag267.github.io/atom.xml",
      site: "https://mag267.github.io/",
      tags: [
        "\u7ED8\u753B",
        "\u7F8E\u672F",
        "\u4E66\u5F71\u97F3"
      ]
    },
    {
      id: "blog-2372e4a96c499bff",
      name: "Ali's Blog",
      url: "https://blog.liuailin.top/atom.xml",
      site: "https://blog.liuailin.top/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-797de34c428820a0",
      name: "\u88F4\u5148\u751F\u7B14\u8BB0",
      url: "https://blog.peiluming.com/feed",
      site: "https://blog.peiluming.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u7F16\u7A0B",
        "\u6559\u7A0B",
        "\u653B\u7565"
      ]
    },
    {
      id: "blog-a21173ec90f16554",
      name: "\u7EB8\u706F\u7684\u535A\u5BA2",
      url: "https://qingmingzong.cn/index.php/feed/",
      site: "https://qingmingzong.cn/",
      tags: [
        "\u6E38\u620F",
        "\u65E5\u5E38",
        "\u7F16\u7A0B",
        "\u6742\u8C08"
      ]
    },
    {
      id: "blog-e85bebae0b0bc6b3",
      name: "I BCL.",
      url: "https://ibcl.us/atom.xml",
      site: "https://ibcl.us/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "Linux",
        "\u524D\u540E\u7AEF",
        "\u7535\u5B50",
        "\u786C\u4EF6",
        "\u65E0\u7EBF\u7535"
      ]
    },
    {
      id: "blog-c8694561a49aa85f",
      name: "Oyyko's Blog",
      url: "https://blog.oyyko.com/index.xml",
      site: "https://blog.oyyko.com/",
      tags: [
        "\u65E5\u5E38",
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "C++",
        "infra"
      ]
    },
    {
      id: "blog-0917d7312645a608",
      name: "\u96F7\u8499\u4E09\u5341",
      url: "https://raymondhouch.com/feed",
      site: "https://raymondhouch.com/",
      tags: [
        "\u521B\u4E1A",
        "\u6570\u7801",
        "\u6570\u5B57\u6E38\u6C11",
        "\u751F\u4EA7\u529B\u5DE5\u5177",
        "Notion",
        "\u6570\u5B57\u751F\u6D3B"
      ]
    },
    {
      id: "blog-fbbfe5bfa5204ab2",
      name: "Kaffa",
      url: "https://kaffa.im/feeds/all.atom.xml",
      site: "https://kaffa.im/",
      tags: [
        "\u7814\u53D1",
        "\u7F16\u7A0B",
        "\u9605\u8BFB",
        "\u6570\u667A",
        "\u8F6F\u4EF6",
        "\u8BA4\u77E5\u65B9\u6CD5\u8BBA",
        "\u4E66\u5F71\u97F3\u7269"
      ]
    },
    {
      id: "blog-c78783de4590883a",
      name: "Val.istar.Guo Blog",
      url: "https://val-istar-guo.com/api/rss/feed",
      site: "https://val-istar-guo.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38"
      ]
    },
    {
      id: "blog-87faa028979a6139",
      name: "\u7801\u519C\u5C0F\u6613\u7684\u535A\u5BA2",
      url: "https://0xlau.dev/posts/index.xml",
      site: "https://0xlau.dev/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u9006\u5411",
        "\u751F\u6D3B",
        "\u5B89\u5168"
      ]
    },
    {
      id: "blog-8913715f4defa7d3",
      name: "jdjwzx233-Blog",
      url: "https://www.jdjwzx233.cn/atom.xml",
      site: "https://www.jdjwzx233.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u65E5\u5E38",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-92a77bfacd821259",
      name: "\u7F16\u7A0B\u968F\u60F3\u7684\u535A\u5BA2",
      url: "https://feeds2.feedburner.com/programthink",
      site: "https://program-think.blogspot.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5206\u4EAB",
        "\u9690\u79C1",
        "\u7BA1\u7406"
      ]
    },
    {
      id: "blog-78fc04749f7250f2",
      name: "\u4E4C\u4E91\u76D6\u96EA",
      url: "https://wygxmew.github.io/index.xml",
      site: "https://wygxmew.github.io/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u601D\u8003",
        "\u611F\u609F",
        "\u968F\u7B14",
        "\u6587\u5B66",
        "\u8BD7\u6B4C",
        "\u7B14\u8BB0",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-ffcf329a7063e309",
      name: "\u90A2\u5E73cn-xingpingcn",
      url: "https://xingpingcn.top/atom.xml",
      site: "https://xingpingcn.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u793E\u4F1A\u79D1\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-38a78d4ac49f3674",
      name: "\u9A91\u884C\u8D85\u8FC7\u725B",
      url: "https://www.chaoniulian.com/rss/",
      site: "https://www.chaoniulian.com/",
      tags: [
        "\u597D\u73A9\u7684\u4E2A\u4EBA\u7F51\u5FD7",
        "\u8BFB\u4E66",
        "\u9A91\u884C",
        "\u6548\u7387\u7FFB\u500D"
      ]
    },
    {
      id: "blog-07bbc5198fe0ea98",
      name: "\u6F84\u6CA8\u7684\u6F2B\u6E38\u8336\u8BB0",
      url: "https://champhoon.xyz/atom.xml",
      site: "https://champhoon.xyz/",
      tags: [
        "ACG",
        "\u65E5\u5E38",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-a9be18f3d9ebc3b2",
      name: "\u5343\u91CC\u4E4B\u8C6A",
      url: "https://blog.gadore.top/feed.xml",
      site: "https://blog.gadore.top/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u56FE\u7247"
      ]
    },
    {
      id: "blog-6b6276905417e627",
      name: "Shaun's Space",
      url: "https://cniter.github.io/atom.xml",
      site: "https://cniter.github.io/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-3c5e7e7fb1065270",
      name: "\u5927\u718A\u8981\u98DE\u7FD4",
      url: "https://blog.wexiami.com/feed",
      site: "https://blog.wexiami.com/",
      tags: [
        "\u751F\u6D3B",
        "\u6210\u957F",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-3e9bab53fc5aeff2",
      name: "\u7528\u4E2D\u6587\u7F16\u7A0B",
      url: "http://codeinchinese.com/feed.xml",
      site: "http://codeinchinese.com/",
      tags: [
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-ba545c3bca7a4dee",
      name: "\u8FFD\u9010\u65E5\u843D",
      url: "https://zzrl.cc/atom.xml",
      site: "https://zzrl.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u540E\u7AEF",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u7B14\u8BB0",
        "Java"
      ]
    },
    {
      id: "blog-612c5e4f7fe579d8",
      name: "\u6708\u591CMoonlight",
      url: "https://moonlt.site/posts/index.xml",
      site: "https://moonlt.site/",
      tags: [
        "\u968F\u7B14",
        "\u8BFB\u4E66",
        "\u751F\u6D3B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-0cb3f7cd16afa345",
      name: "\u536B\u661F\u5B9E\u9A8C\u5BA4",
      url: "https://www.xlabs.club/index.xml",
      site: "https://www.xlabs.club/",
      tags: [
        "\u7F16\u7A0B",
        "\u79D1\u6280",
        "\u4E91\u539F\u751F",
        "Java"
      ]
    },
    {
      id: "blog-65ea418199176c53",
      name: "\u5F20\u667A\u52C7",
      url: "https://zyzhang.com/feed/",
      site: "https://zyzhang.com/",
      tags: [
        "\u521B\u4E1A",
        "\u6295\u8D44",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-f758f20d9efa2b6c",
      name: "\u7693\u5B50\u7684\u5C0F\u7AD9",
      url: "https://howiehz.top/rss.xml",
      site: "https://howiehz.top/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u524D\u7AEF",
        "\u540E\u7AEF",
        "\u65E5\u5E38",
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6742\u8C08",
        "Python",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-862437a0b6f651d9",
      name: "ZoDream's Blog",
      url: "https://zodream.cn/blog/rss",
      site: "https://zodream.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u5168\u6808"
      ]
    },
    {
      id: "blog-c40d22e319d816c3",
      name: "\u61CB\u548C\u9053\u4EBA",
      url: "https://blog.dao.js.cn/atom.xml",
      site: "https://blog.dao.js.cn/",
      tags: [
        "\u674E\u81F3\u81E3",
        "\u674E\u61CB\u548C",
        "\u5357\u901A\u9053\u58EB",
        "\u98CE\u6C34",
        "\u5BB6\u5C45\u98CE\u6C34",
        "\u4F4F\u5B85\u98CE\u6C34"
      ]
    },
    {
      id: "blog-2e5b60999230fdd3",
      name: "\u9876\u5C16\u7814\u53D1\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://bestcoder.cn/feed",
      site: "https://bestcoder.cn/",
      tags: [
        "\u65E5\u5E38",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-b33863dd8c7e2091",
      name: "\u4E91\u5FC3\u6000\u9E64",
      url: "https://bluehe.cn/feed/",
      site: "https://bluehe.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u751F\u6D3B\u65B9\u5F0F",
        "\u98CE\u5149\u6444\u5F71",
        "\u79D1\u6280",
        "\u65C5\u884C",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-c02ac7e5f66b2441",
      name: "\u4E00\u4E2A\u590F\u5929\u7684\u5E74\u5C11",
      url: "https://forrestgump618.github.io/atom.xml",
      site: "https://forrestgump618.github.io/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u7269\u4FE1\u606F\u5B66",
        "\u4E34\u5E8A\u533B\u5B66"
      ]
    },
    {
      id: "blog-0871590a584d0d62",
      name: "Dallas Lu",
      url: "https://dallas.lu/feed",
      site: "https://dallas.lu/",
      tags: [
        "\u7F16\u7A0B",
        "\u7F51\u7EDC"
      ]
    },
    {
      id: "blog-20e71ee81c1eaddf",
      name: "\u96FE\u6797\u535A\u5BA2",
      url: "https://www.baiwulin.com/feed/",
      site: "https://www.baiwulin.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-56dc02a299f4192a",
      name: "Yuics Blog",
      url: "https://arckive.cn/index.xml",
      site: "https://arckive.cn/",
      tags: [
        "\u7B97\u6CD5\u7ADE\u8D5B",
        "\u7B97\u6CD5\u4E0E\u6570\u636E\u7ED3\u6784",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6570\u5B66",
        "\u9605\u8BFB",
        "ACGN"
      ]
    },
    {
      id: "blog-bc2e1dc27cc256fb",
      name: "A small world of unnamedtat",
      url: "https://unnamedtat.xyz/rss.xml",
      site: "https://unnamedtat.xyz/",
      tags: [
        "\u6280\u672F",
        "GIS\u3001\u751F\u6001\u6587\u732E\u9605\u8BFB\u3001\u7B97\u6CD5\u5206\u4EAB",
        "Web\u524D\u7AEF",
        "Python",
        "R"
      ]
    },
    {
      id: "blog-6a8815fc3adf214e",
      name: "\u98DE\u98DE\u7231\u6298\u817E",
      url: "https://songfei.org/index.xml",
      site: "https://songfei.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u65E0\u7EBF\u7535",
        "DIY"
      ]
    },
    {
      id: "blog-bff9eba5617423f9",
      name: "Menghuan1918\u7684\u535A\u5BA2",
      url: "https://blog.menghuan1918.com/rss.xml",
      site: "https://blog.menghuan1918.com/",
      tags: [
        "\u7F16\u7A0B",
        "Linux",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-5af53383279963f1",
      name: "\u7B03\u5FD7\u8005\u7684\u535A\u5BA2",
      url: "https://ceeji.net/blog/feed/",
      site: "https://ceeji.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u6444\u5F71",
        "\u65C5\u884C",
        "\u6C49\u8BED",
        "\u6587\u5316"
      ]
    },
    {
      id: "blog-df82a58233a59b6d",
      name: "Cosmos\u7684\u535A\u5BA2",
      url: "https://cosmo-polite.com/feed/",
      site: "https://cosmo-polite.com/",
      tags: [
        "\u5317\u7F8E\u751F\u6D3B",
        "\u601D\u7EF4\u788E\u7247"
      ]
    },
    {
      id: "blog-f26cdf4037718a26",
      name: "\u6912\u76D0\u8C46\u8C49",
      url: "https://blog.douchi.space/index.xml",
      site: "https://blog.douchi.space/",
      tags: [
        "\u6D4B\u8BC4",
        "\u751F\u6D3B",
        "\u65C5\u884C",
        "\u79D1\u6280"
      ]
    },
    {
      id: "blog-6590aba5a33a56af",
      name: "\u572801\u4E4B\u95F4\u5230\u5904\u627E\u6211",
      url: "https://imzh.me/index.xml",
      site: "https://imzh.me/",
      tags: [
        "\u5DE5\u5177"
      ]
    },
    {
      id: "blog-64765a8186b7fea2",
      name: "JZ's Rambles",
      url: "https://ramble.imzh.me/index.xml",
      site: "https://ramble.imzh.me/",
      tags: [
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-73db9290f380e037",
      name: "mafeifan\u7684\u6280\u672F\u535A\u5BA2",
      url: "https://mafeifan.com/feed.rss",
      site: "https://mafeifan.com/",
      tags: [
        "Devops",
        "\u6280\u672F",
        "\u4E91\u539F\u751F"
      ]
    },
    {
      id: "blog-214e6eeb7dd51365",
      name: "Wener's Live & Life",
      url: "https://wener.me/story/rss.xml",
      site: "https://wener.me/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u6587\u5316",
        "\u6742\u8C08",
        "\u67B6\u6784",
        "\u8BBE\u8BA1",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-26571f4450b46fad",
      name: "\u5C3C\u666E\u5B66\u79CD\u82B1",
      url: "https://kneep.github.io/index.xml",
      site: "https://kneep.github.io/",
      tags: [
        "\u6280\u672F",
        "\u5DE5\u4F5C",
        "\u65C5\u884C",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-54941b5c309eb4c6",
      name: "\u6570\u636E\u4ED3\u5E93\u6280\u672F",
      url: "https://www.dwsql.com/interview",
      site: "https://www.dwsql.com/",
      tags: [
        "\u5927\u6570\u636E",
        "\u6570\u636E\u4ED3\u5E93",
        "\u6570\u636E\u5F00\u53D1\u9762\u8BD5SQL"
      ]
    },
    {
      id: "blog-f19790cbc41b057b",
      name: "\u8098\u5B50\u7684 Swift \u8BB0\u4E8B\u672C",
      url: "https://fatbobman.com/zh/rss.xml",
      site: "https://fatbobman.com/",
      tags: [
        "\u7F16\u7A0B",
        "Swift",
        "SwiftUI"
      ]
    },
    {
      id: "blog-527d0a9b24966d9e",
      name: "Tevin Zhang",
      url: "https://tevinzhang.com/zh/feed.xml",
      site: "https://tevinzhang.com/zh/",
      tags: [
        "\u6570\u5B57\u5316\u751F\u6D3B",
        "\u6570\u636E\u81EA\u4E3B",
        "\u6570\u5B57\u8D44\u4EA7",
        "\u751F\u4EA7\u529B\u5DE5\u5177",
        "\u7ECF\u9A8C\u5206\u4EAB",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-3725135f83abf17d",
      name: "Linzihao's Blog",
      url: "https://www.linzihao.com/",
      site: "https://linzihao.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u521B\u4E1A",
        "\u751F\u6D3B",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-4ae79bc5ef928023",
      name: "Keenwon's Blog",
      url: "https://keenwon.com/rss.xml",
      site: "https://keenwon.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u601D\u8003",
        "\u6280\u672F\u535A\u5BA2",
        "\u524D\u7AEF\u5F00\u53D1",
        "\u5168\u6808"
      ]
    },
    {
      id: "blog-133bdec23f8fbc01",
      name: "Stray Episode",
      url: "https://farer.org/rss/",
      site: "https://farer.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6E38\u620F",
        "\u601D\u8003",
        "\u968F\u7B14",
        "\u9605\u8BFB",
        "\u5410\u69FD"
      ]
    },
    {
      id: "blog-511a941174e52a33",
      name: "\u8499\u5947\u65E5\u8BB0",
      url: "https://luffy.cc/feed",
      site: "https://luffy.cc/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ed41ce13f18362ad",
      name: "data4fun",
      url: "https://data4fun.cc/index.xml",
      site: "https://data4fun.cc/",
      tags: [
        "\u4E2A\u4EBA\u968F\u7B14",
        "\u5927\u6570\u636E",
        "AI"
      ]
    },
    {
      id: "blog-9c4a22f6d5dac455",
      name: "\u5931\u8FF9\u306E\u535A\u5BA2",
      url: "https://blog.reincarnatey.net/index.xml",
      site: "https://blog.reincarnatey.net/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-473dba4ed370bd88",
      name: "Kerry\u7684\u5B66\u4E60\u7B14\u8BB0",
      url: "https://kerrynotes.com/feed/",
      site: "https://kerrynotes.com/",
      tags: [
        "\u8F6F\u4EF6",
        "\u6280\u672F",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-40ff35feaec15190",
      name: "smile \u7684\u535A\u5BA2\u82B1\u56ED",
      url: "https://nsddd.top/zh/posts/index.xml",
      site: "https://nsddd.top/zh",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "AI",
        "\u521B\u4E1A",
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u7B14\u8BB0",
        "\u751F\u4EA7\u529B\u5DE5\u5177",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-b6ba0e2deee267d3",
      name: "\u4E1C\u4E1C's Blog",
      url: "https://blog.yasking.org/atom.xml",
      site: "https://blog.yasking.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-05da7b2c78958fb4",
      name: "\u6709\u601D\u60F3\u7684\u82A6\u82C7's Blog",
      url: "https://thinking-reed.cn/atom.xml",
      site: "https://thinking-reed.cn/",
      tags: [
        "\u6280\u672F",
        "\u79D1\u7814",
        "AI",
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-e2e2d58fdca9d562",
      name: "\u962E\u8D85\u6C11\u7684\u4E2A\u4EBA\u7F51\u7AD9",
      url: "https://www.ruanchaomin.com/api/rss",
      site: "https://www.ruanchaomin.com/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-87e0282cdc09da62",
      name: "\u9010\u6C34\u5BFB\u6E90",
      url: "https://www.zair.top/index.xml",
      site: "https://www.zair.top/",
      tags: [
        "AI",
        "\u5927\u6A21\u578B",
        "\u6570\u636E\u79D1\u5B66",
        "\u673A\u5668\u5B66\u4E60",
        "\u5B66\u4E60\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-0d35d3aaeb0494b9",
      name: "Razeen's Blog",
      url: "https://razeen.me/index.xml",
      site: "https://razeen.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-8454f0b4c5f9e3bb",
      name: "\u9752\u77F3\u575E",
      url: "https://www.qs5.org/feed/",
      site: "https://www.qs5.org/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-fe7c65a85aa9cd1e",
      name: "hsfzxjy \u7684\u535A\u5BA2",
      url: "https://i.hsfzxjy.site/rss.xml",
      site: "https://i.hsfzxjy.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u968F\u60F3",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-d6c3a344dc6cd5b3",
      name: "S\u0415SS\u306EB10G\u0422\u04155\u0422",
      url: "https://sess.moe/feed.xml",
      site: "https://sess.moe/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "Linux",
        "\u751F\u6D3B",
        "\u7F51\u7EDC"
      ]
    },
    {
      id: "blog-fe293c4313735242",
      name: "C0reFast\u8BB0\u4E8B\u672C",
      url: "https://www.ichenfu.com/atom.xml",
      site: "https://www.ichenfu.com/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "Linux"
      ]
    },
    {
      id: "blog-368f8a851f5b565d",
      name: "\u7801\u519C\u660E\u660E\u6851",
      url: "https://isming.me/index.xml",
      site: "https://isming.me/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u65C5\u884C",
        "\u8BFB\u4E66"
      ]
    },
    {
      id: "blog-ab8c1b3aaee3aa9b",
      name: "Deeprouter",
      url: "https://deeprouter.org/rss/feed.xml",
      site: "https://deeprouter.org/",
      tags: [
        "\u8DEF\u7531\u5668",
        "\u5BB6\u5EAD\u7F51\u7EDC",
        "\u5DE5\u5177",
        "OpenWRT",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-2418d477ad0c1b8d",
      name: "Jame",
      url: "https://jame.work/feed.xml",
      site: "https://jame.work/",
      tags: [
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-0f572c39bb021d6e",
      name: "iNote",
      url: "https://inote.xyz/zh/rss.xml",
      site: "https://inote.xyz/zh/",
      tags: [
        "\u6295\u8D44",
        "\u521B\u4E1A",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b1fe890d7b3501df",
      name: "\u4EBA\u751F\u8DB3\u8FF9 \xB7 \u535A\u5BA2\u5E73\u53F0",
      url: "https://blog.lifebus.top/feed.xml",
      site: "https://blog.lifebus.top/",
      tags: [
        "\u6559\u7A0B",
        "\u8F6F\u4EF6",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7426851e2a80b887",
      name: "\u767D\u4E01\u8F76\u4E8B",
      url: "https://www.moranfong.com/feed/",
      site: "https://www.moranfong.com/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-683d422bac016565",
      name: "OneCoder\u7684\u535A\u5BA2",
      url: "https://www.coderli.com/feed.xml",
      site: "https://www.coderli.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6559\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7c350c4b6fd9b43b",
      name: "\u83F2\u5179\u514B\u65AF\u55B5",
      url: "https://physnya.top/atom.xml",
      site: "https://physnya.top/",
      tags: [
        "\u7269\u7406",
        "\u6570\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-8b7fd1f10c61aebd",
      name: "Xeonzilla's Note",
      url: "https://xeonzilla.top/index.xml",
      site: "https://xeonzilla.top/",
      tags: [
        "\u4E8C\u6B21\u5143",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ac915179eb80b3ad",
      name: "Kang's Blog",
      url: "https://blog.kdev.top/atom.xml",
      site: "https://blog.kdev.top/",
      tags: [
        "\u7F16\u7A0B",
        "Linux",
        "\u79D1\u7814\u5B66\u4E60"
      ]
    },
    {
      id: "blog-2dd2b43e0dda3eab",
      name: "JaSpirit \u7684\u4E07\u4E8B\u5C4B",
      url: "https://blog.jaspirit.cc/atom.xml",
      site: "https://blog.jaspirit.cc/",
      tags: [
        "\u7B97\u6CD5",
        "\u8BA1\u7B97\u673A\u79D1\u5B66",
        "\u795E\u7ECF\u79D1\u5B66",
        "\u5316\u5B66",
        "\u6280\u672F",
        "\u6559\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f4ba2692c636b939",
      name: "\u6DF1\u6D77\u4E4B\u773C",
      url: "https://www.seaeye.cn/feed/",
      site: "https://www.seaeye.cn/",
      tags: [
        "\u533A\u5757\u94FE",
        "CTF"
      ]
    },
    {
      id: "blog-69f6fca89668dbe5",
      name: "\u5E3D\u4E4B\u5C9B - Hat's Land",
      url: "https://www.hats-land.com/atom.xml",
      site: "https://www.hats-land.com/",
      tags: [
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-b8b29b1691cdf437",
      name: "Niracler's Blog",
      url: "https://niracler.com/rss.xml",
      site: "https://niracler.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u5DE5\u5177",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-96fa651e54efee95",
      name: "\u62D2\u7EDD\u5185\u8017\u76F4\u63A5\u53D1\u75AF",
      url: "https://blog.luijp.cn/rss.xml",
      site: "https://blog.luijp.cn/",
      tags: [
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-cb1cf69344608bc4",
      name: "gentlelucky",
      url: "https://blog.gentlelucky.com/zh/index.xml",
      site: "https://blog.gentlelucky.com/",
      tags: [
        "\u968F\u7B14",
        "\u601D\u8003",
        "Java",
        "\u77E5\u8BC6\u7BA1\u7406"
      ]
    },
    {
      id: "blog-6df70b7bcee7d7a8",
      name: "\u4F46\u4E3A\u541B\u6545",
      url: "https://dreams.plus/rss.xml",
      site: "https://dreams.plus/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u7F16\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-f060eb32f6b89839",
      name: "\u5C0F\u677E\u9F20\u7684\u535A\u5BA2",
      url: "https://ycyin.eu.org/sitemap.xml",
      site: "https://ycyin.eu.org/",
      tags: [
        "\u7F16\u7A0B",
        "\u907F\u5751",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-81ef81d50cdeee4b",
      name: "Taxodium",
      url: "https://taxodium.ink/rss.xml",
      site: "https://taxodium.ink/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-af6ac9b2316ba68e",
      name: "\u9177\u9177\u7684\u767D",
      url: "https://bducds.com/feed",
      site: "https://bducds.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-ad9a9187dda70948",
      name: "Yesterday17's Blog",
      url: "https://blog.mmf.moe/rss.xml",
      site: "https://blog.mmf.moe/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u4E8C\u6B21\u5143",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-a86f1598cc365b58",
      name: "WSH",
      url: "https://www.wsh233.cn/feed.xml",
      site: "https://wsh233.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "GISer",
        "\u5730\u4FE1"
      ]
    },
    {
      id: "blog-8ab97d16e61dbd5d",
      name: "Heggria",
      url: "https://heggria.site/feed.xml",
      site: "https://heggria.site/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u524D\u7AEF"
      ]
    },
    {
      id: "blog-a03af3c82baf17bc",
      name: "Sehnsucht",
      url: "https://blog.sehnsucht.top/rss.xml",
      site: "https://blog.sehnsucht.top/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BFB\u4E66",
        "\u6742\u8C08",
        "\u5A31\u4E50",
        "\u601D\u8003"
      ]
    },
    {
      id: "blog-8b983ff304020862",
      name: "RisingIce",
      url: "https://www.imrising.cn/sitemap.xml",
      site: "https://www.imrising.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "AIGC"
      ]
    },
    {
      id: "blog-ad22fe809b19576a",
      name: "Muspi Merol \u7684\u4E2A\u4EBA\u4E3B\u9875",
      url: "https://muspimerol.site/feed",
      site: "https://muspimerol.site/",
      tags: [
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-949966295b76b7ee",
      name: "qubeijun's Blog",
      url: "https://qubeijun.github.io/atom.xml",
      site: "https://qubeijun.github.io/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9baf2ebea6f3d6bc",
      name: "VPS\u4E25\u9009",
      url: "https://www.vpscp.top/feed/",
      site: "https://www.vpscp.top/",
      tags: [
        "\u6280\u672F",
        "\u6D4B\u8BC4",
        "Linux",
        "\u4E3B\u673A"
      ]
    },
    {
      id: "blog-77febfddf3cba637",
      name: "\u6709\u8BDD\u8C6A\u8BF4",
      url: "https://www.lihao00.com/feed/",
      site: "https://www.lihao00.com/",
      tags: [
        "\u601D\u8003",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-46c68dbe18d3bb2d",
      name: "Yonglin's Blog",
      url: "https://xieyonglin.com/posts/rss.xml",
      site: "https://xieyonglin.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-50096e383f5c6839",
      name: "\u6674\u7A7A\u6811",
      url: "https://pinaland.cn/feed/",
      site: "https://pinaland.cn/",
      tags: [
        "\u65E5\u5E38",
        "\u4E8C\u6B21\u5143",
        "\u52A8\u753B",
        "\u6E38\u620F",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-4e6c252e8ec436ad",
      name: "\u7A7A\u9E23\u6DF1\u8BED",
      url: "https://blog.deepchirp.com/atom.xml",
      site: "https://blog.deepchirp.com/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-83f030735cbb132c",
      name: "\u8FD0\u7EF4\u5F00\u53D1\u7EFF\u76AE\u4E66",
      url: "https://www.geekery.cn/rss.xml",
      site: "https://www.geekery.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-e637b0cb1aa5fe8c",
      name: "\u8292\u679C\u52FF\u8BED",
      url: "https://mangoman.us.kg/?feed=rss2",
      site: "https://mangoman.us.kg/",
      tags: [
        "\u968F\u7B14",
        "\u5206\u4EAB",
        "\u641E\u4E8B\u60C5"
      ]
    },
    {
      id: "blog-d54a4309c6c11726",
      name: "distjr_'s blog",
      url: "https://blog.distjr.top/atom.xml",
      site: "https://blog.distjr.top/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u97F3\u4E50",
        "\u4E8C\u6B21\u5143"
      ]
    },
    {
      id: "blog-b08f10563d8aebbf",
      name: "\u6708\u77F3MoonStone",
      url: "https://moonstone.fun/feed/",
      site: "https://moonstone.fun/",
      tags: [
        "\u4E2D\u56FD\u53E4\u5EFA\u7B51",
        "\u5510\u5B8B\u8FBD\u91D1\u53E4\u5EFA\u7B51",
        "\u4E2D\u56FD\u6728\u7ED3\u6784\u5EFA\u7B51",
        "\u53E4\u5EFA\u7B51\u77E5\u8BC6",
        "\u8425\u9020\u6CD5\u5F0F",
        "\u6597\u6831",
        "\u5927\u6728\u4F5C",
        "3D\u6A21\u578B"
      ]
    },
    {
      id: "blog-f6467bb593ee0436",
      name: "\u6816\u6728\u7684\u7F51\u7EDC\u65E5\u5FD7",
      url: "https://blog.thedoga.tech/feed",
      site: "https://blog.thedoga.tech/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6742\u4E03\u6742\u516B"
      ]
    },
    {
      id: "blog-50310b27b0e26534",
      name: "\u53F6\u6CEF\u5E0C",
      url: "https://blog.418121.xyz/rss2.xml",
      site: "https://blog.418121.xyz/",
      tags: [
        "\u751F\u6D3B",
        "\u6444\u5F71",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-f862cc3e01bacfa6",
      name: "\u4E00\u6850\u306EBlog",
      url: "https://blog.ytmc.fun/rss.xml",
      site: "https://blog.ytmc.fun/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u6298\u817E",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-ba55c58c476706e2",
      name: "Evan",
      url: "https://evan.xin/feed",
      site: "https://evan.xin/",
      tags: [
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8e361dea9ece20bf",
      name: "\u5047\u88C5\u770B\u98CE\u666F",
      url: "https://pt2mu.top/atom.xml",
      site: "https://pt2mu.top/",
      tags: [
        "\u751F\u6D3B",
        "\u8BB0\u5F55",
        "\u788E\u788E\u5FF5"
      ]
    },
    {
      id: "blog-492a11da10f97c41",
      name: "\u597D\u597D\u5B66\u4E60\u7684\u90DD",
      url: "https://www.voidking.com/sitemap.xml",
      site: "https://www.voidking.com/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u4E91\u539F\u751F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-30822138aa99e099",
      name: "\u55BB\u7075\u7684\u535A\u5BA2",
      url: "https://yvling.cn/rss",
      site: "https://yvling.cn/",
      tags: [
        "\u7F51\u7EDC\u5B89\u5168",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-942caad239dc5b56",
      name: "\u7EB8\u9E7F\u6478\u9C7C\u5904",
      url: "https://blog.zhilu.cyou/atom.xml",
      site: "https://blog.zhilu.cyou/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-604ae8ff703c8426",
      name: "\u5D14\u9E4F\u98DE\u7684blog",
      url: "https://cuipengfei.me/atom.xml",
      site: "https://cuipengfei.me/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u8F6F\u4EF6"
      ]
    },
    {
      id: "blog-207f6e65632bf687",
      name: "\u901A\u7075\u5361\u7247",
      url: "https://www.yuqiqin.me/feed.xml",
      site: "https://www.yuqiqin.me/",
      tags: [
        "\u6559\u7814",
        "\u8BED\u8A00\u5B66\u4E60",
        "\u751F\u6D3B",
        "\u65C5\u6E38"
      ]
    },
    {
      id: "blog-0dcf1686a076c147",
      name: "\u66AE\u51ACZ\u7FA1\u6155\u7684\u535A\u5BA2",
      url: "https://forcheetah.github.io/atom.xml",
      site: "https://forcheetah.github.io/",
      tags: [
        "AI\u7F16\u8BD1",
        "\u8BA1\u7B97\u52A0\u901F"
      ]
    },
    {
      id: "blog-50b55c3f34083fc0",
      name: "Bolaxious \u7684\u5C0F\u7AD9",
      url: "http://bolaxious.fun/rss.xml",
      site: "http://bolaxious.fun/",
      tags: [
        "\u524D\u7AEF\uFF0C\u751F\u6D3B\uFF0C\u6280\u672F\uFF0C\u968F\u7B14"
      ]
    },
    {
      id: "blog-e503883fe8ec3c75",
      name: "Maohang Gao's Blog",
      url: "https://kangaroogao.com/atom.xml",
      site: "https://kangaroogao.com/",
      tags: [
        "\u6E38\u8BB0",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-32dd27b06a559d04",
      name: "\u963F\u6396\u5C71\xB7\u535A\u5BA2",
      url: "https://blog.mountaye.com/feed.xml",
      site: "https://blog.mountaye.com/",
      tags: [
        "\u7269\u7406",
        "\u751F\u7269",
        "\u7F16\u7A0B",
        "\u6444\u5F71",
        "\u5386\u53F2"
      ]
    },
    {
      id: "blog-81f1c69c8212063f",
      name: "\u4E8C\u6B6A\u540C\u5B66",
      url: "https://blog.waistu.com/rss.xml",
      site: "https://blog.waistu.com/",
      tags: [
        "\u6570\u7801",
        "\u79D1\u6280",
        "\u751F\u6D3B",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-2f5da050f9a76a6d",
      name: "\u9648\u661F\u5B87\u7684\u4E3B\u9875",
      url: "https://cxy0714.github.io/index.xml",
      site: "https://cxy0714.github.io/",
      tags: [
        "\u7EDF\u8BA1\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-6a29cc4a415e3214",
      name: "\u6E05\u7FBD\u98DE\u626C",
      url: "https://blog.liushen.fun/atom.xml",
      site: "https://blog.liushen.fun/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-906abc0cdfecff2d",
      name: "Peter267",
      url: "https://peter267.github.io/atom.xml",
      site: "https://peter267.github.io/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u6559\u7A0B",
        "AIGC"
      ]
    },
    {
      id: "blog-5778ffe2b6cca8a0",
      name: "Huan's Blog",
      url: "https://blog.huan99.com/atom.xml",
      site: "https://blog.huan99.com/",
      tags: [
        "\u81EA\u6211\u6210\u957F",
        "\u540E\u7AEF",
        "\u9605\u8BFB",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c55498f84bc7b562",
      name: "\u6CEB\u8A00",
      url: "https://blog.cugxuan.cn/atom.xml",
      site: "https://blog.cugxuan.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u79D1\u6280",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-dc39d847274f1452",
      name: "FrWalker's Blog",
      url: "https://blog.frwalker.top/atom.xml",
      site: "https://blog.frwalker.top/",
      tags: [
        "\u5B66\u4E60",
        "\u968F\u7B14",
        "\u7814\u7A76",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-28fbdcbbeea5a436",
      name: "Sunset \u7684\u91CD\u6784\u535A\u5BA2",
      url: "https://blog.sunmkt.uk/feed.xml",
      site: "https://blog.sunmkt.uk/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9f8a6889fc2a7964",
      name: "Flowable\u4E2D\u6587\u535A\u5BA2",
      url: "https://flowable.me/blog/atom.xml",
      site: "https://flowable.me/blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F\u5206\u4EAB",
        "\u6559\u7A0B",
        "Flowable"
      ]
    },
    {
      id: "blog-55855f3bb272e675",
      name: "\u987A\u6BDB\u5E08\u4E4B\u5BB6",
      url: "https://www.cvzoo.cn/atom.xml",
      site: "https://www.cvzoo.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u79D1\u7814",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9484623f6bc89d72",
      name: "Rolenx",
      url: "https://blog.yesord.top/atom.xml",
      site: "https://home.yesord.top/",
      tags: [
        "\u751F\u6D3B",
        "\u601D\u8003",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-e4300799f5d871d0",
      name: "\u6625\u6C34\u714E\u8336",
      url: "https://writings.sh/feed",
      site: "https://writings.sh/",
      tags: [
        "\u7F16\u7A0B",
        "\u7B97\u6CD5",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-70bc5e2c0a39d833",
      name: "KEKKJ BLOG",
      url: "https://kekkj123.github.io/RSS_atom.xml",
      site: "https://kekkj123.github.io/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u5B66\u4E60"
      ]
    },
    {
      id: "blog-a88156fd41fa96c6",
      name: "s22y",
      url: "https://blog.s22y.moe/rss.xml",
      site: "https://blog.s22y.moe/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-39f855bcb1a85d52",
      name: "\u75AF\u5B50\u7684\u5929\u7A7A",
      url: "https://xuexc.cn/api/articles/rss",
      site: "https://xuexc.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-89a01e53f7f45d80",
      name: "\u522B\u5E74",
      url: "https://fylsen.com/rss.xml",
      site: "https://fylsen.com/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-b1eaf646ae3962cb",
      name: "\u51B0\u5C4B",
      url: "https://blog.millya.top/feed",
      site: "https://blog.millya.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f6fc492cc7f50c19",
      name: "\u97E9\u5C0F\u97E9\u535A\u5BA2",
      url: "https://www.vvhan.com/rss.xml",
      site: "https://www.vvhan.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u5206\u4EAB",
        "\u751F\u6D3B",
        "\u524D\u7AEF",
        "\u540E\u7AEF",
        "\u5F00\u6E90",
        "\u7ECF\u9A8C"
      ]
    },
    {
      id: "blog-60284b6a37104807",
      name: "\u8499\u9700",
      url: "https://jiangcl.com/feed",
      site: "https://jiangcl.com/",
      tags: [
        "\u6CD5\u5F8B",
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u5DE5\u7A0B"
      ]
    },
    {
      id: "blog-436d6f2cda2fbd21",
      name: "\u963F\u6770\u9C81\u7684\u81EA\u7559\u5730",
      url: "https://zaunist.com/rss/feed.xml",
      site: "https://zaunist.com/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u8BB0\u5F55",
        "\u7ECF\u9A8C",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-193e31f1cd801d48",
      name: "runzhliu\u7684\u5BB9\u5668\u7B14\u8BB0",
      url: "https://runzhliu.cn/index.xml",
      site: "https://runzhliu.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-c4865d56754dd4b3",
      name: "Fall's Blog",
      url: "https://fallzhang.top/sitemap.xml",
      site: "https://fallzhang.top/",
      tags: [
        "\u524D\u7AEF",
        "\u8DE8\u7AEF",
        "\u5168\u6808"
      ]
    },
    {
      id: "blog-dc238884b1d6bbb3",
      name: "YOLO",
      url: "https://www.yolo.blue/blog/rss.xml",
      site: "https://www.yolo.blue/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u7B14",
        "\u6E38\u620F",
        "\u751F\u6D3B",
        "\u65C5\u884C"
      ]
    },
    {
      id: "blog-53b582927a7f9eab",
      name: "\u72EC\u5143\u6B87",
      url: "https://www.ccgxk.com/rss.php",
      site: "https://www.ccgxk.com/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u79D1\u6280",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-e2bb6da5f6e41772",
      name: "HFwas",
      url: "https://www.hfwas.tech/sitemap.xml",
      site: "https://www.hfwas.tech/",
      tags: [
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-958a686b4e3c0982",
      name: "DaBai",
      url: "https://ucds.me/feed",
      site: "https://ucds.me/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-1a6e74a4f6f8f95e",
      name: "\u4E91\u7AEF\u7684\u89E3\u6784\u8005",
      url: "https://www.zheep.top/atom.xml",
      site: "https://www.zheep.top/",
      tags: [
        "code",
        "\u751F\u6D3B",
        "\u9605\u8BFB",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-11a5e7831daceefe",
      name: "GoodBoyboy 's Blog",
      url: "https://blog.goodboyboy.top/atom.xml",
      site: "https://blog.goodboyboy.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-7cc226fc8e0aca23",
      name: "Peng's Blog",
      url: "https://pengs.top/atom.xml",
      site: "https://pengs.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "linux",
        "\u751F\u6D3B",
        "\u5F00\u6E90",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-8732cb4df569133e",
      name: "\u6620\u5C7F",
      url: "https://www.glowisle.me/atom.xml",
      site: "https://www.glowisle.me/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u601D\u8003",
        "\u9605\u8BFB"
      ]
    },
    {
      id: "blog-393098b77a4809b5",
      name: "DailyMinz",
      url: "https://dailyminz.org/atom.xml",
      site: "https://dailyminz.org/",
      tags: [
        "\u4EBA\u6587\u793E\u79D1",
        "\u601D\u8003",
        "\u968F\u7B14",
        "\u9605\u8BFB",
        "\u54F2\u5B66"
      ]
    },
    {
      id: "blog-72d25a48ea192829",
      name: "Watermelonabc\u7684Blog",
      url: "https://blog.watermelonabc.top/atom.xml",
      site: "https://blog.watermelonabc.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-694625d3aa680241",
      name: "unixetc",
      url: "https://unixetc.com/index.xml",
      site: "https://unixetc.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "linux",
        "\u751F\u6D3B",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-d569850956129d76",
      name: "0xd00's blog",
      url: "https://blog.0xd00.com/rss.xml",
      site: "https://blog.0xd00.com/",
      tags: [
        "\u7F51\u7EDC\u5B89\u5168",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-31a0dc469a29cc74",
      name: "\u7845\u4E0A\u89C2\u9053\u7684\u4E2A\u4EBA\u535A\u5BA2",
      url: "https://www.changsun.work/atom.xml",
      site: "https://www.changsun.work/",
      tags: [
        "\u6280\u672F",
        "\u5F00\u6E90",
        "\u968F\u7B14",
        "\u8BFB\u4E66\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-92a48d46990381bc",
      name: "Shine\u7684AI\u535A\u5BA2",
      url: "https://blog.fuxieyi.top/rss.xml",
      site: "https://blog.fuxieyi.top/",
      tags: [
        "\u6280\u672F\u5F00\u6E90",
        "\u5927\u6A21\u578B",
        "AI",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-127f9a4ae50b45af",
      name: "NBlog",
      url: "https://nocp.space/rss/feed.json",
      site: "https://blog.nocp.space/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-5d3f672b9dc6bc41",
      name: "\u6A59\u6811\u5FD7",
      url: "https://citydatum.cn/feed",
      site: "https://citydatum.cn/",
      tags: [
        "\u57CE\u5E02",
        "\u6570\u636E\u5206\u6790",
        "\u6280\u672F",
        "\u89C6\u89C9",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-fe886d4a9923a0c8",
      name: "\u5C60\xB7\u57CE",
      url: "https://www.haomwei.com/atom.xml",
      site: "https://www.haomwei.com/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BB0\u5F55",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-2681d5fc252408db",
      name: "\u53C9\u606F\u7684\u7A7A\u4E2D\u5496\u5561\u9986",
      url: "https://www.xchere.xyz/atom.xml",
      site: "https://www.xchere.xyz/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u8BB0\u5F55",
        "\u8BFB\u4E66\u7B14\u8BB0",
        "\u4E71\u4E03\u516B\u7CDF"
      ]
    },
    {
      id: "blog-28a0521c3b379b63",
      name: "\u660E\u7ACB\u975E(Mingnify)\u7684\u535A\u5BA2",
      url: "https://mingnify.com/zh/blog/atom.xml",
      site: "https://mingnify.com/zh/blog/",
      tags: [
        "Indie Maker",
        "\u72EC\u7ACB\u5F00\u53D1",
        "AI",
        "\u6253\u9020\u4EA7\u54C1",
        "\u5185\u5BB9\u521B\u4F5C",
        "\u6570\u5B57\u6E38\u6C11"
      ]
    },
    {
      id: "blog-80afb10b9a84b25a",
      name: "Kevin's Blog",
      url: "https://kevintan.pro/sitemap.xml",
      site: "https://kevintan.pro/",
      tags: [
        "\u6280\u672F",
        "\u9006\u5411",
        "\u5927\u5B66",
        "\u751F\u6D3B",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-5ed13c2f53547971",
      name: "Lamber\u7684\u535A\u5BA2",
      url: "https://lamber-maybe.com/blog/index.xml",
      site: "https://lamber-maybe.com/",
      tags: [
        "\u6280\u672F",
        "\u7F51\u7EDC\u5B89\u5168",
        "\u6210\u957F",
        "\u8BB0\u5F55",
        "BugBounty"
      ]
    },
    {
      id: "blog-365173f818c98c11",
      name: "\u5047\u8BBE\u68C0\u9A8C",
      url: "https://jiashejianyan.com/sitemap.xml",
      site: "https://jiashejianyan.com/",
      tags: [
        "\u751F\u6D3B",
        "\u54C1\u724C",
        "\u6295\u8D44",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-325bd5d57880b616",
      name: "\u738B\u5706\u5706",
      url: "https://www.iconpik.com/rss/",
      site: "https://www.iconpik.com/",
      tags: [
        "AI",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-ed6d6c7430ba8d00",
      name: "\u5E26\u9C7CBlog",
      url: "https://blog.beltfish.cn/feed/",
      site: "https://blog.beltfish.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u65E5\u5E38",
        "\u5BA1\u8BA1",
        "\u8D22\u52A1",
        "\u6570\u7801"
      ]
    },
    {
      id: "blog-929d825dc3461af2",
      name: "\u6DB5\u54F2\u5B50\u5C45",
      url: "https://iluc.cn/rss.xml",
      site: "https://iluc.cn/",
      tags: [
        "\u65E5\u5E38",
        "\u968F\u7B14",
        "\u4E71\u4E03\u516B\u7CDF"
      ]
    },
    {
      id: "blog-d6c6a9eb69e9ccd0",
      name: "SuperGrey\u7684\u7B14\u8BB0\u672C",
      url: "https://supergrey.bearblog.dev/rss/",
      site: "https://supergrey.bearblog.dev/",
      tags: [
        "\u9605\u8BFB\u968F\u7B14",
        "\u52A8\u6F2B\u5F71\u8BC4"
      ]
    },
    {
      id: "blog-fc047f873cc70373",
      name: "\u59D3\u738B\u8005\u7684\u535A\u5BA2",
      url: "https://xingwangzhe.fun/rss.xml",
      site: "https://xingwangzhe.fun/",
      tags: [
        "\u7F16\u7A0B\uFF0C\u968F\u7B14\uFF0C\u5927\u5B66\uFF0C\u751F\u6D3B\uFF0C\u5F00\u6E90"
      ]
    },
    {
      id: "blog-9478c3aef0598306",
      name: "\u4E66\u8FDC\u89C1",
      url: "https://bookvision7.com/feed.xml",
      site: "https://bookvision7.com/",
      tags: [
        "\u7F16\u7A0B\uFF0C\u6280\u672F\uFF0C\u751F\u6D3B\uFF0C\u601D\u8003"
      ]
    },
    {
      id: "blog-be7347e2cdab6d28",
      name: "solaireh3",
      url: "https://Ashlord.com/feed.xml",
      site: "https://Ashlord.com/",
      tags: [
        "\u533B\u5B66\uFF0C\u751F\u6D3B\uFF0C\u968F\u7B14\uFF0C\u539F\u521B"
      ]
    },
    {
      id: "blog-d506e8f3266ede31",
      name: "\u9165\u7C73\u7684\u5C0F\u7AD9",
      url: "https://www.sumi233.top/rss.xml",
      site: "https://www.sumi233.top/",
      tags: [
        "\u751F\u6D3B\uFF0C\u6280\u672F\uFF0C\u7F51\u7EDC\uFF0C\u65E5\u5E38\uFF0C\u968F\u7B14"
      ]
    },
    {
      id: "blog-2161db4e789c11c9",
      name: "\u8B1D\u61FFShine\xA9\u7684AI\u535A\u5BA2",
      url: "https://xieyi.org/rss.xml",
      site: "https://xieyi.org/",
      tags: [
        "\u6280\u672F\u5F00\u6E90",
        "\u5927\u6A21\u578B",
        "AI",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-48465a134cae3ef2",
      name: "Fgaoxing\u7684\u535A\u5BA2",
      url: "https://www.yt-blog.top/atom.xml",
      site: "https://www.yt-blog.top/",
      tags: [
        "\u6280\u672F",
        "\u5F00\u6E90",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-5a5cd00767d78ffe",
      name: "yCENzh's Blog",
      url: "https://fuwari.oh1.top/rss.xml",
      site: "https://fuwari.oh1.top/",
      tags: [
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u7B14\u8BB0",
        "\u4E71\u4E03\u516B\u7CDF"
      ]
    },
    {
      id: "blog-35d7b31cd5973828",
      name: "\u624B\u91CC\u6709\u53EA\u6BDB\u6BDB\u866B",
      url: "https://www.krjojo.com/feed",
      site: "https://www.krjojo.com/",
      tags: [
        "\u6280\u672F",
        "\u5F00\u6E90",
        "\u968F\u7B14",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-8aab6211c898be87",
      name: "Henry Z's blog",
      url: "https://changchen.me/atom.xml",
      site: "https://changchen.me/",
      tags: [
        "\u6280\u672F",
        "Python",
        "SRE",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-1e9b57d2030f9f35",
      name: "fenglielie",
      url: "https://fenglielie.top/atom.xml",
      site: "https://fenglielie.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-bde8fa324603b67e",
      name: "ICDYCT\u6211\u80FD\u4F60\u4E5F\u884C",
      url: "https://zelikk.blogspot.com/rss.xml",
      site: "https://zelikk.blogspot.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u968F\u60F3",
        "DIY"
      ]
    },
    {
      id: "blog-88f01c5b02c2bf09",
      name: "\u5C0F\u6DB5Naiwenel",
      url: "https://www.naiwenel.com/rss.xml",
      site: "https://www.naiwenel.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u72EC\u7ACB\u6E38\u620F",
        "\u72EC\u7ACB\u5F00\u53D1",
        "\u5F00\u6E90",
        "\u5B66\u4E60",
        "\u4E8C\u6B21\u5143"
      ]
    },
    {
      id: "blog-c67e74e0ee2a891b",
      name: "\u7E41\u661F\u70B9\u70B9",
      url: "https://blog.52013120.xyz/rss.xml",
      site: "https://blog.52013120.xyz/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u539F\u521B",
        "\u7F51\u7EDC",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-5e0b799929db84ff",
      name: "Under the Sun with Paddy",
      url: "https://www.paddysun.top/feed",
      site: "https://www.paddysun.top/",
      tags: [
        "\u7B97\u6CD5",
        "\u751F\u6D3B",
        "\u5DE5\u4F5C",
        "\u60C5\u611F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-35c176318a5de3d3",
      name: "ArgoVICT's blog",
      url: "https://argovict.asia/blog/rss/rss.xml",
      site: "https://argovict.asia/",
      tags: [
        "\u5D4C\u5165\u5F0F",
        "\u4E1A\u4F59\u65E0\u7EBF\u7535",
        "\u7F16\u7A0B",
        "\u5DE5\u7A0B",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-1977eb190ed70fce",
      name: "Honesty",
      url: "https://blog.hehouhui.cn/rss/feed.xml",
      site: "https://blog.hehouhui.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u65E5\u5E38",
        "\u7EAA\u5F55",
        "AI"
      ]
    },
    {
      id: "blog-d9c473daa3b4d341",
      name: "\u58A8\u5BD2\u8F69",
      url: "http://hankmo.com/index.xml",
      site: "https://hankmo.com/",
      tags: [
        "\u6F5C\u5FC3\u7814\u6280\u672F\uFF0C\u79EF\u6781\u54C1\u4EBA\u751F"
      ]
    },
    {
      id: "blog-1352ff1225be4ffd",
      name: "\u9B3C\u5F71\u7684\u57FA\u5730 - \u9B3C\u5F71233",
      url: "https://gui-ying233.github.io/Nest/src/atom.xml",
      site: "https://gui-ying233.github.io/Nest/",
      tags: [
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-f4a9375efd376b63",
      name: "zhecydn\u7684\u535A\u5BA2\u7AD9",
      url: "https://blog.zhecydn.asia/feed/",
      site: "https://blog.zhecydn.asia/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u5206\u4EAB",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-ad3b783c297f9403",
      name: "\u6556\u82DB\u8BB0",
      url: "https://blog.kayro.cn/atom.xml",
      site: "https://blog.kayro.cn/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-a2dd60828db8415a",
      name: "HaydenBi",
      url: "https://haydenbi.com/feed.xml",
      site: "https://haydenbi.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u51FA\u6D77",
        "\u751F\u6D3B",
        "\u5206\u4EAB",
        "\u5DE5\u4F5C"
      ]
    },
    {
      id: "blog-6fd90eb2b3450d0f",
      name: "\u81F4\u4EE5\u65E0\u7455\u4E4B\u4EBA",
      url: "https://blog.elykia.cn/atom.xml",
      site: "https://blog.elykia.cn/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-6454ffa8c3f59648",
      name: "\u95EA\u7535\u7684\u81EA\u7559\u5730",
      url: "https://blog.lyujp.com/sitemap.xml",
      site: "https://blog.lyujp.com/",
      tags: [
        "\u751F\u6D3B",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-e7f1ccdd329f91d3",
      name: "S T C H E N G",
      url: "https://cheng.st/atom.xml",
      site: "https://cheng.st/",
      tags: [
        "\u968F\u7B14",
        "\u65C5\u884C",
        "\u6444\u5F71",
        "\u8FD0\u52A8",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-8d21015af3b79fb9",
      name: "Luenci\u7684\u6280\u672F\u535A\u5BA2",
      url: "https://luenci.com/en/index.xml",
      site: "https://luenci.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u7B14\u8BB0"
      ]
    },
    {
      id: "blog-7ab8f6321b994b14",
      name: "GISerLab \u5730\u7406\u7A7A\u95F4",
      url: "https://blog.giserlab.cn/feed.xml",
      site: "https://blog.giserlab.cn/",
      tags: [
        "GIS",
        "\u6280\u672F",
        "\u5730\u4FE1",
        "\u5730\u56FE",
        "\u5DE5\u5177",
        "\u51B3\u89E3\u65B9\u6848",
        "Cesium"
      ]
    },
    {
      id: "blog-a355384e2f096376",
      name: "Rokcso's Blog",
      url: "https://rokcso.com/index.xml",
      site: "https://rokcso.com/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u597D\u5947\u5FC3",
        "\u4EA7\u54C1\u7BA1\u7406",
        "\u7F16\u7A0B",
        "AI",
        "\u72EC\u7ACB\u5F00\u53D1"
      ]
    },
    {
      id: "blog-5633e3dd1a239a71",
      name: "\u5C0F\u9676\u6301\u7EED\u7CBE\u8FDB",
      url: "https://whyya.xyz/rss.xml",
      site: "https://whyya.xyz/",
      tags: [
        "\u751F\u6D3B",
        "\u751F\u4EA7\u529B\u5DE5\u5177",
        "\u6548\u7387",
        "\u77E5\u8BC6\u7BA1\u7406"
      ]
    },
    {
      id: "blog-59c588d68d7bcc67",
      name: "UWillno's Blog",
      url: "https://uwillno.com/rss.xml",
      site: "https://uwillno.com/",
      tags: [
        "Qt",
        "WASM",
        "\u6280\u672F",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-255d7d15c5ddc1aa",
      name: "ventuss",
      url: "https://ventuss.xyz/rss/zh.xml",
      site: "https://ventuss.xyz/",
      tags: [
        "\u601D\u8003",
        "\u5199\u4F5C"
      ]
    },
    {
      id: "blog-ac0ef534e9c919eb",
      name: "\u50B2\u96EA\u306E",
      url: "https://www.oxue.de/rss.xml",
      site: "https://www.oxue.de/",
      tags: [
        "\u6280\u672F",
        "\u5199\u4F5C",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-3fcef7355352f1b0",
      name: "\u963F\u5C14\u7684\u4EE3\u7801\u5C4B",
      url: "https://blog.algieba12.cn/atom.xml",
      site: "https://blog.algieba12.cn/",
      tags: [
        "\u968F\u7B14",
        "AI",
        "\u6E38\u620F\u5F00\u53D1",
        "C++",
        "Python",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-ffa2a65c3d9144b8",
      name: "wklken",
      url: "https://wklken.me/posts/index.xml",
      site: "https://wklken.me/",
      tags: [
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-975b7b131234580b",
      name: "\u732B\u6D85\u7684\u6280\u672F\u535A\u5BA2",
      url: "https://www.maonie.top/atom.xml",
      site: "https://www.maonie.top/",
      tags: [
        "\u6280\u672F",
        "\u4FE1\u606F\u5B89\u5168",
        "\u968F\u7B14",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-632adab04d993cc1",
      name: "Yourlai's Blog",
      url: "https://yourlai.com/feed/",
      site: "https://yourlai.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5D4C\u5165\u5F0F",
        "\u6280\u672F",
        "\u6444\u5F71"
      ]
    },
    {
      id: "blog-b19bdcf0c5520493",
      name: "Jake Blog",
      url: "https://jaketao.com/feed/",
      site: "https://jaketao.com/blog",
      tags: [
        "\u7845\u8C37\u79D1\u6280",
        "\u4E3B\u673A\u6E38\u620F",
        "\u7559\u5B66\u65C5\u5C45",
        "\u8DE8\u5883\u7535\u5546"
      ]
    },
    {
      id: "blog-8493b38312725c73",
      name: "ABB00717's Blog",
      url: "https://blog.abb00717.com/index.xml",
      site: "https://blog.abb00717.com/",
      tags: [
        "\u8CC7\u8A0A\u5B89\u5168",
        "\u7A0B\u5F0F\u8A2D\u8A08",
        "\u6280\u8853",
        "\u5BEB\u4F5C",
        "\u97F3\u6A02"
      ]
    },
    {
      id: "blog-e174af50c2c650d4",
      name: "\u8CC7\u5DE5\u5C0F\u5EE2\u7269 - JN",
      url: "https://blog.giveanornot.com/index.xml",
      site: "https://blog.giveanornot.com/",
      tags: [
        "\u4F86\u81EA\u53F0\u7063",
        "\u751F\u6D3B\u53CD\u601D",
        "\u793E\u7FA4\u5A92\u9AD4\u8CA0\u9762\u5F71\u97FF",
        "\u958B\u6E90\u8EDF\u9AD4"
      ]
    },
    {
      id: "blog-1b3f8e0b2d9ccf4d",
      name: "\u5218\u679C\u7684\u5C0F\u7AD9",
      url: "https://liu-guo.com/feed.xml",
      site: "https://liu-guo.com/",
      tags: [
        "\u6587\u5B57\u3001\u97F3\u4E50\u4E0E\u4EA4\u4E92\u5B9E\u9A8C"
      ]
    },
    {
      id: "blog-15a5d205ab9d66dc",
      name: "\u4E94\u6708\u4E03\u65E5\u7684\u601D\u8003\u672D\u8BB0",
      url: "https://fivsevn.com/rss",
      site: "https://fivsevn.com/",
      tags: [
        "\u4E2A\u4EBA\u6570\u5B57\u82B1\u56ED"
      ]
    },
    {
      id: "blog-28f7651b6c45720d",
      name: "49th LunaSea",
      url: "https://maki49.github.io/feed.xml",
      site: "https://maki49.github.io/",
      tags: [
        "\u52A8\u6F2B\u6E38\u620F",
        "\u751F\u6D3B\u968F\u7B14",
        "\u79D1\u7814",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-785ed136e9903682",
      name: "\u8B80\u89D2\u7378 \u2014 \u82F1\u6587\u4F86\u6E90\u7684\u77DB\u76FE\u6524\u958B\u8B93\u4F60\u81EA\u5DF1\u5224\u65B7",
      url: "https://ducorn.com/feed.xml",
      site: "https://ducorn.com/",
      tags: [
        "\u6295\u8CC7",
        "\u5065\u5EB7",
        "\u5224\u65B7"
      ]
    },
    {
      id: "blog-9bb83c5fce2af2cf",
      name: "CSS\u68EE\u6797",
      url: "https://www.cssforest.org/feed/",
      site: "https://www.cssforest.org/",
      tags: [
        "\u751F\u6D3B\u968F\u7B14",
        "\u4EA4\u4E92\u4F53\u9A8C",
        "\u524D\u7AEF",
        "\u5B66\u4E60\u601D\u8003"
      ]
    },
    {
      id: "blog-4dbc5f607ba6fc70",
      name: "fengc's Blog",
      url: "https://rssweball.top/feed/afaf2a3c-e11a-4783-a358-9e2d20d76a69.xml",
      site: "https://fengcblog.880200.xyz/",
      tags: [
        "\u6444\u5F71\u4E60\u4F5C",
        "\u6444\u5F71\u95F2\u626F",
        "\u76F8\u5173\u6D4B\u8BD5",
        "AI\u89C6\u9891"
      ]
    },
    {
      id: "blog-53e675e543a5fc82",
      name: "for_the_zero\u7684\u5C0F\u7AD9",
      url: "https://ftz.is-a.dev/rss.xml",
      site: "https://ftz.is-a.dev/",
      tags: [
        "\u7F16\u7A0B",
        "\u524D\u7AEF",
        "\u8F6F\u4EF6\u5F00\u53D1",
        "\u601D\u8003",
        "\u968F\u7B14",
        "AI",
        "Web\u5F00\u53D1"
      ]
    },
    {
      id: "blog-64d84211648934fb",
      name: "\u5ECA\u6865\u9057\u68A6",
      url: "https://blog.moran.im/rss.xml",
      site: "https://blog.moran.im/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-d755bc724b5af93f",
      name: "\u67AB\u6797\u706F\u8BED",
      url: "https://blog.mfwt.top/index.php/feed/",
      site: "https://blog.mfwt.top/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u65E0\u7EBF\u7535",
        "\u7F51\u7EDC"
      ]
    },
    {
      id: "blog-8bb8b2b5aa466934",
      name: "Neil\u7684\u81EA\u7559\u5730",
      url: "https://neilmin.com/zh/posts/index.xml",
      site: "https://neilmin.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u7B14\u8BB0",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-d26b7e63ffb2b4ed",
      name: "\u5BD2\u591C\u96E8",
      url: "https://www.coderlock.site/index.php/feed/",
      site: "https://www.coderlock.site/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "AI",
        "\u968F\u60F3"
      ]
    },
    {
      id: "blog-945af708f34d7d2b",
      name: "\u50A5\u5E08\u59B9TangShiMei\u7684\u5C0F\u7A7A\u95F4",
      url: "https://blog.224418.xyz/rss2.xml",
      site: "https://blog.224418.xyz/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6298\u817E"
      ]
    },
    {
      id: "blog-1be0d0eebcfedec7",
      name: "QingCCL",
      url: "https://qingccl.github.io/rss.xml",
      site: "https://qingccl.github.io/",
      tags: [
        "\u6587\u5B66",
        "\u8BFB\u4E66",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-880c351ebb22015b",
      name: "\u8B1D\u61FFShine",
      url: "https://www.futseyi.com/rss.xml",
      site: "https://www.futseyi.com/",
      tags: [
        "AI",
        "\u8BFB\u535A\u79D1\u7814",
        "\u968F\u7B14",
        "\u6280\u672F",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-a793def00859ab23",
      name: "\u6240\u8C13\u7A7A\u60F3",
      url: "https://www.alxh.page/feed.rss",
      site: "https://alxh.page/",
      tags: [
        "\u6587\u5B66",
        "\u97F3\u4E50",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-aa86c8fa1c6708ea",
      name: "\u7FD4\u5B87\u5DE5\u4F5C\u6D41",
      url: "https://xiangyugongzuoliu.com/latest/rss/",
      site: "https://xiangyugongzuoliu.com/",
      tags: [
        "AI",
        "\u7F16\u7A0B",
        "\u81EA\u52A8\u5316",
        "Claude Code",
        "\u6559\u7A0B"
      ]
    },
    {
      id: "blog-234887a2897bc7d0",
      name: "\u521D\u7136\u5FC6",
      url: "https://www.imcry.vip/index.xml",
      site: "https://www.imcry.vip/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-183876508856d545",
      name: "\u5218\u90CE\u9601",
      url: "https://vjo.cc/feed/",
      site: "https://vjo.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u8BB0\u5F55",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-b568c5170dfc342e",
      name: "Im Patrick",
      url: "https://impatrick.blog/feed/",
      site: "https://impatrick.blog/",
      tags: [
        "\u7E41\u4E2D",
        "\u651D\u5F71",
        "\u751F\u6D3B",
        "\u8A18\u9304"
      ]
    },
    {
      id: "blog-720ebfedd6c9e207",
      name: "cocolia\u5C0F\u7A9D",
      url: "https://cocolia.fun/feed.xml",
      site: "https://cocolia.fun/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u6444\u5F71",
        "AI"
      ]
    },
    {
      id: "blog-995ee2666dd305ce",
      name: "Dax",
      url: "https://daolanx.me/zh/rss.xml",
      site: "https://daolanx.me/zh/",
      tags: [
        "\u7F16\u7A0B",
        "\u5168\u6808",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-7a1796c45455a541",
      name: "Haku",
      url: "https://re.karlbaey.top/rss.xml",
      site: "https://re.karlbaey.top/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u7F16\u7A0B",
        "\u6587\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-9b534cde8a12a1df",
      name: "Amiya\u7684\u4E66\u684C",
      url: "https://blog.sayori.org/rss.xml",
      site: "https://blog.sayori.org/",
      tags: [
        "\u65E5\u8BB0",
        "\u8D44\u6E90",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-9c885b4ea11b1f50",
      name: "\u661F\u89C5\u6D77\u7684\u535A\u5BA2",
      url: "https://www.xmhai.cn/rss.xml",
      site: "https://www.xmhai.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u8D44\u6E90"
      ]
    },
    {
      id: "blog-00895a433c62f69b",
      name: "Oleg's Tech Blog",
      url: "https://timoshinoleg-eng.github.io/blog/feed.xml",
      site: "https://timoshinoleg-eng.github.io/blog/",
      tags: [
        "Python",
        "Telegram",
        "AI",
        "Bot"
      ]
    },
    {
      id: "blog-85480ab02defd463",
      name: "MoeBlog",
      url: "https://1loli.link/feed/",
      site: "https://1loli.link/",
      tags: [
        "\u6280\u672F",
        "AI",
        "\u7F16\u7A0B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-40a00054fc8f72d3",
      name: "AI\u5B66\u4E60\u65E5\u8BB0",
      url: "https://livk30.github.io/rss.xml",
      site: "https://livk30.github.io/",
      tags: [
        "AI",
        "\u673A\u5668\u5B66\u4E60",
        "\u6DF1\u5EA6\u5B66\u4E60"
      ]
    },
    {
      id: "blog-76354eeeea30da83",
      name: "\u51B0\u51BB\u5927\u897F\u74DC\u7684\u535A\u5BA2",
      url: "https://bddxg.top/feed.rss",
      site: "https://bddxg.top/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "AI"
      ]
    },
    {
      id: "blog-62f29089e6a12656",
      name: "\u6BDB\u82F1\u9F99\u7684\u6570\u5B57\u82B1\u56ED",
      url: "https://blog.rnm.gv.uy/atom.xml",
      site: "https://blog.rnm.gv.uy/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u524D\u7AEF",
        "\u6298\u817E",
        "\u6570\u5B57\u751F\u6D3B",
        "agent",
        "openclaw",
        "Hermes"
      ]
    },
    {
      id: "blog-e48ba14180f4a41a",
      name: "BotForge Notes",
      url: "https://blog.notlove.me/feed.xml",
      site: "https://blog.notlove.me/",
      tags: [
        "AI",
        "Telegram",
        "Bot",
        "\u7F16\u7A0B",
        "\u81EA\u52A8\u5316"
      ]
    },
    {
      id: "blog-07e5d58fbe5ad069",
      name: "keggin's blog",
      url: "https://keggin.tech/rss.xml",
      site: "https://keggin.tech/",
      tags: [
        "\u7F16\u7A0B",
        "Linux",
        "\u6570\u6A21",
        "\u9006\u5411"
      ]
    },
    {
      id: "blog-a39dee7cbc520239",
      name: "BWYLBT Blog",
      url: "https://blog.sxizhuo.cn/rss/feed.xml",
      site: "https://blog.sxizhuo.cn/",
      tags: [
        "\u7F16\u7A0B",
        "AI",
        "\u968F\u7B14",
        "\u6280\u672F"
      ]
    },
    {
      id: "blog-330ec66b178e45be",
      name: "My Mods",
      url: "https://dayzmod.kdns.fr/rss.xml",
      site: "https://dayzmod.kdns.fr/",
      tags: [
        "\u7F16\u7A0B",
        "\u6A21\u7EC4",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-758d7e929f816768",
      name: "LX blog",
      url: "https://blog.liua.us.ci/rss.xml",
      site: "https://blog.liua.us.ci/",
      tags: [
        "\u7F16\u7A0B",
        "AI",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-297214c4189e5b1d",
      name: "\u7801\u5F55\u96C6\uFF08CoderLog\uFF09",
      url: "https://www.coderlog.net/rss.xml",
      site: "https://www.coderlog.net/",
      tags: [
        "\u7F16\u7A0B",
        "AI",
        "C#",
        ".NET",
        "\u5168\u6808"
      ]
    },
    {
      id: "blog-019bb7ff8ec1db35",
      name: "Abyss\u7684\u5C0F\u5C4B",
      url: "https://www.rsnocsi.cn/feed",
      site: "https://www.rsnocsi.cn/",
      tags: [
        "AI",
        "\u6280\u672F",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-cb01583341a78fd1",
      name: "wmhwiki",
      url: "https://wmhwiki.cn/rss.xml",
      site: "https://wmhwiki.cn/",
      tags: [
        "\u6280\u672F",
        "\u751F\u6D3B"
      ]
    },
    {
      id: "blog-b7a433656e06c665",
      name: "Victor42",
      url: "https://victor42.eth.limo/index.xml",
      site: "https://victor42.eth.limo/",
      tags: [
        "\u79D1\u5B66",
        "\u6570\u636E\u5206\u6790",
        "\u8BBE\u8BA1",
        "\u6E38\u8BB0",
        "\u5F00\u53D1\u8005"
      ]
    },
    {
      id: "blog-2044190e91b292dd",
      name: "\u521B\u89C1\u601D\u8003",
      url: "https://www.fengcan.net/feed/",
      site: "https://www.fengcan.net/",
      tags: [
        "AI",
        "\u8BFB\u4E66",
        "\u533B\u7597",
        "\u4EBA\u751F\u51B3\u7B56"
      ]
    },
    {
      id: "blog-1491b066e2acd0b5",
      name: "\u6768\u8F69\u7684\u535A\u5BA2:AI\xD7\u6295\u8D44\u5B9E\u76D8\u8BB0\u5F55",
      url: "https://yangxuan.ai/feed/",
      site: "https://yangxuan.ai/",
      tags: [
        "AI",
        "\u6295\u8D44",
        "\u91CF\u5316"
      ]
    },
    {
      id: "blog-4d8b78f41ff9f2e8",
      name: "RYANUO\u7684\u535A\u5BA2",
      url: "https://ryanuo.cc/sitemap.xml",
      site: "https://ryanuo.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u5D4C\u5165\u5F0F",
        "\u524D\u7AEF",
        "AI",
        "\u5F00\u6E90"
      ]
    },
    {
      id: "blog-795e3153b39dbc19",
      name: "MOMB\u95F2\u8C08",
      url: "https://www.momb.top/rss/feed.xml",
      site: "https://www.momb.top/",
      tags: [
        "\u70ED\u70B9",
        "\u968F\u7B14",
        "\u77E5\u8BC6",
        "\u6E38\u620F"
      ]
    },
    {
      id: "blog-bb3444c05fe9f65b",
      name: "\u80E1\u4E1C\u4E1C\u535A\u5BA2",
      url: "https://blog.hudd.cn/feed/",
      site: "https://blog.hudd.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "AI"
      ]
    },
    {
      id: "blog-fea37358cbc4f384",
      name: "\u733F\u5BA2\u968F\u7B14",
      url: "https://monkeyke.com/index.xml",
      site: "https://monkeyke.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-f00e541a644bc1d9",
      name: "\u6208\u58C1\u6709\u8033",
      url: "https://www.zhanggeer.net/feed/",
      site: "https://www.zhanggeer.net/",
      tags: [
        "\u751F\u6D3B",
        "\u968F\u7B14",
        "\u6444\u5F71",
        "\u97F3\u4E50"
      ]
    },
    {
      id: "blog-218f8d6dbaeac4ae",
      name: "Arthur's Review",
      url: "https://blog.leesaitool.com/feed.xml",
      site: "https://blog.leesaitool.com/",
      tags: [
        "AI",
        "\u793E\u4F1A",
        "\u54F2\u5B66",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-16edf0976ca5b769",
      name: "\u6885\u4E4B\u590F",
      url: "https://blog.mcenahle.page/feed.xml",
      site: "https://blog.mcenahle.page/",
      tags: [
        "\u968F\u7B14",
        "\u8BB0\u5F55",
        "\u6210\u957F",
        "\u5B66\u4E60",
        "\u533B\u7597"
      ]
    },
    {
      id: "blog-0b7b2f4bafe67a14",
      name: "Suk\u306EBlog",
      url: "https://imsuk.cn/feed/",
      site: "https://imsuk.cn/",
      tags: [
        "\u524D\u7AEF",
        "\u7F16\u7A0B",
        "\u6280\u672F",
        "AI"
      ]
    },
    {
      id: "blog-8216516218f62d25",
      name: "Fei's Tours and Tales",
      url: "https://www.feifun.cn/feed.xml",
      site: "https://www.feifun.cn/",
      tags: [
        "\u65C5\u884C",
        "\u590D\u53E4\u8BA1\u7B97\u8BBE\u5907",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c32d6e52db57c758",
      name: "LiaoKe\u7684\u535A\u5BA2",
      url: "https://blog.liao-ke.com/rss.xml",
      site: "https://blog.liao-ke.com/",
      tags: [
        "\u7F16\u7A0B",
        "\u5F00\u6E90",
        "\u5168\u6808",
        "\u5F00\u53D1\u8005"
      ]
    },
    {
      id: "blog-16ca6917947c2f04",
      name: "Dort \u7684\u535A\u5BA2",
      url: "https://blog.dort.me/rss.xml",
      site: "https://blog.dort.me/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u8BB0\u5F55"
      ]
    },
    {
      id: "blog-ff6e874b296c734f",
      name: "\u637B\u58A8\u8FD0\u8425\u7B14\u8BB0",
      url: "https://dyy.nianmo.top/rss.xml",
      site: "https://dyy.nianmo.top/",
      tags: [
        "\u8FD0\u8425",
        "\u81EA\u5A92\u4F53",
        "\u5C0F\u7EA2\u4E66",
        "\u521B\u4E1A"
      ]
    },
    {
      id: "blog-6c6e727209fbec7d",
      name: "67\u7684\u535A\u5BA2",
      url: "https://www.liuqi.cc/rss/feed.xml",
      site: "https://www.liuqi.cc/",
      tags: [
        "\u7F16\u7A0B",
        "\u751F\u6D3B",
        "\u8BB0\u5F55",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-95bb91070385bccb",
      name: "DataShare \u6570\u636E\u4EBA\u963F\u591A",
      url: "https://datashare-duo.github.io/datashare-blog/rss.xml",
      site: "https://datashare-duo.github.io/datashare-blog/",
      tags: [
        "\u7F16\u7A0B",
        "\u6570\u636E",
        "\u968F\u7B14",
        "\u6280\u672F",
        "AI",
        "\u673A\u5668\u5B66\u4E60"
      ]
    },
    {
      id: "blog-352c9ad39dedea32",
      name: "\u70ED\u8877\u4E8E\u7684\u535A\u5BA2",
      url: "https://zooyoo.top/feed/",
      site: "https://zooyoo.top/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u968F\u7B14",
        "\u89C2\u5BDF"
      ]
    },
    {
      id: "blog-7e105df8e0969fc7",
      name: "\u697C\u8239INKFLAKE",
      url: "https://fravilion.top/index.php/feed/",
      site: "https://fravilion.top/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u65C5\u884C",
        "\u6444\u5F71",
        "\u6570\u7801"
      ]
    },
    {
      id: "blog-8467ddb3da52abc3",
      name: "\u4E09\u53F6\u7684\u535A\u5BA2",
      url: "https://blog.cloverta.top/rss.xml",
      site: "https://blog.cloverta.top/",
      tags: [
        "\u968F\u7B14",
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u7F16\u7A0B"
      ]
    },
    {
      id: "blog-81a830d73ca38885",
      name: "\u674E\u4E0D\u8A00\u7684\u535A\u5BA2",
      url: "https://libuyan.top/rss.xml",
      site: "https://libuyan.top/",
      tags: [
        "\u6280\u672F",
        "\u601D\u8003",
        "\u91CF\u5316",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-86d71333b0b222ef",
      name: "\u4EF2\u5E73 \xB7 \u6587\u8F91",
      url: "https://blog.zopiya.com/rss.xml",
      site: "https://blog.zopiya.com/",
      tags: [
        "\u751F\u6D3B",
        "\u5F00\u53D1",
        "\u65C5\u884C",
        "\u6444\u5F71",
        "\u5206\u4EAB"
      ]
    },
    {
      id: "blog-997d9c82a6ff8695",
      name: "Moyuin's Blog",
      url: "https://moyuin.top/rss.xml",
      site: "https://moyuin.top/",
      tags: [
        "\u751F\u6D3B",
        "\u6280\u672F",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-c9c32ec12e4e9b78",
      name: "ChangYo's Blog",
      url: "https://changyo.pages.dev/index.xml",
      site: "https://changyo.pages.dev/",
      tags: [
        "\u6280\u672F\uFF0C\u968F\u7B14\uFF0C\u9605\u8BFB\uFF0C\u8BBE\u8BA1"
      ]
    },
    {
      id: "blog-61f48a869f9a14ad",
      name: "XBSTACK",
      url: "https://www.xbstack.com/rss.xml",
      site: "https://www.xbstack.com/",
      tags: [
        "\u6280\u672F",
        "\u7F16\u7A0B",
        "AI",
        "\u4EA7\u54C1",
        "\u6295\u8D44",
        "\u968F\u7B14"
      ]
    },
    {
      id: "blog-69b330627ab25c4d",
      name: "Sanmussh Blog",
      url: "https://blog.movcloud.xyz/rss.xml",
      site: "https://blog.movcloud.xyz/",
      tags: [
        "\u6280\u672F",
        "AI",
        "\u77E5\u8BC6",
        "\u968F\u7B14"
      ]
    }
  ]
};

// src/data/podcast-feeds.json
var podcast_feeds_default = {
  source: "https://github.com/joeseesun/qiaomu-ai-rss/blob/main/src/data/tidings.json",
  items: [
    {
      name: "30 for 30 Podcasts",
      url: "https://feeds.megaphone.fm/ESP5765452710",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "42\u7AE0\u7ECF \u2014 Podcast",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/648b0b641c48983391a63f98",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "AI\u70BC\u91D1\u672F \u2014 Podcast",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/63e9ef4de99bdef7d39944c8",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "Darknet Diaries",
      url: "https://feeds.megaphone.fm/darknetdiaries",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Discovery",
      url: "https://podcasts.files.bbci.co.uk/p002w557.rss",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Fragmented - AI Developer Podcast",
      url: "https://feeds.simplecast.com/LpAGSLnY",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Gastropod",
      url: "https://www.omnycontent.com/d/playlist/aaea4e69-af51-495e-afc9-a9760146922b/2a195077-f014-41d2-8313-ab190186b4c2/277bcd5c-0a05-4c14-8ba6-ab190186b4d5/podcast.rss",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Hacking Humans",
      url: "https://feeds.megaphone.fm/hacking-humans",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Hanselminutes with Scott Hanselman",
      url: "https://feeds.simplecast.com/gvtxUiIf",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Invest Like the Best with Patrick O'Shaughnessy",
      url: "https://investlikethebest.libsyn.com/rss",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Invisibilia",
      url: "https://feeds.npr.org/510307/podcast.xml",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Planet Money",
      url: "https://feeds.npr.org/510289/podcast.xml",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Reply All",
      url: "https://feeds.megaphone.fm/replyall",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "The Cynical Developer",
      url: "https://cynicaldeveloper.com/feed/podcast",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "The Startup Junkies Podcast",
      url: "https://startupjunkie.libsyn.com/rss",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "The Vergecast",
      url: "https://feeds.megaphone.fm/vergecast",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "Throughline",
      url: "https://feeds.npr.org/510333/podcast.xml",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "en"
    },
    {
      name: "TIANYU2FM \u2014 \u5BF9\u8C08\u672A\u77E5\u9886\u57DF",
      url: "https://rsshub.xiaowuaiblog.com/xiaoyuzhou/podcast/5f22729f9504bbdb77253e46",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "What's Next\uFF5C\u79D1\u6280\u65E9\u77E5\u9053",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e74b52c418a84a046ecaceb",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4E00\u5E2D",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e285326418a84a04627343f",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4E09\u4E94\u73AF",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e280fab418a84a0461faa3c",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4E0D\u5408\u65F6\u5B9C",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e280fb8418a84a0461fd076",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4E1C\u4E9A\u89C2\u5BDF\u5C40",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e9a4e25418a84a046bc6156",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4E1C\u8154\u897F\u8C03",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5f72b66083c34e85dd14fde9",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4E71\u7FFB\u4E66",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/61358d971c5d56efe5bcb5d2",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4EBA\u6C11\u516C\u56ED\u8BF4AI",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/65257ff6e8ce9deaf70a65e9",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4FDD\u6301\u504F\u89C1",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/663e3c95af1e22bb157dcee3",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u4FE1\u53F7\u4E0E\u566A\u58F0",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6819d5a7e37664602a344e0e",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u51F9\u51F8\u7535\u6CE2",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e2839ca418a84a0462431b7",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5341\u5B57\u8DEF\u53E3Crossing \u2014 Podcast",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/60502e253c92d4f62c2a9577",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u534A\u62FF\u94C1 | \u5546\u4E1A\u6C89\u6D6E\u5F55",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/62382c1103bea1ebfffa1c00",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u536B\u8BD7\u5A55\uFF5C\u6F2B\u8C08Light the Star",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6627fda4b56459544087d86a",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5546\u4E1A\u5C31\u662F\u8FD9\u6837",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6022a180ef5fdaddc30bb101",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u58F0\u4E1C\u51FB\u897F",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e2831ed418a84a046231c00",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u58F0\u52A8\u65E9\u5496\u5561",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/60de7c003dd577b40d5a40f3",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5929\u771F\u4E0D\u5929\u771F",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/65cef9e3cace72dff8d98de3",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5C60\u9F99\u4E4B\u672F",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6507bc165c88d2412626b401",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5CA9\u4E2D\u82B1\u8FF0",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/625635587bfca4e73e990703",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5F00\u59CB\u8FDE\u63A5 LinkStart",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/63ff0da51b1faf8a0b70b337",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5F20\u5C0F\u73FAJ\xF9n\uFF5C\u5546\u4E1A\u8BBF\u8C08\u5F55",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/626b46ea9cbbf0451cf5a962",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u5FFD\u5DE6\u5FFD\u53F3",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e4ee557418a84a0466737b7",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u6162\u901F\u751F\u957F",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/668d00c38fcadceb90158ac1",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u6355\u86C7\u8005\u8BF4",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e2864f7418a84a04628f2da",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u641E\u94B1\u5973\u5B69",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/63d945ece725b5378a158d29",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u6587\u5316\u6709\u9650",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e4515bd418a84a046e2b11a",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u665A\u70B9\u804A LateTalk",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/61933ace1b4320461e91fd55",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u674E\u8BDE",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/65bb55f6513a776b57dedb32",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u67AB\u8A00\u67AB\u8BED \u2014 Podcast",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e2864f5418a84a04628e249",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u6B64\u8BDD\u5F53\u771F",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/646f194853a5e5ea1408d97c",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u6E38\u8361\u96C6",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6163ca67c8c1d14e83366b31",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u725B\u6CB9\u679C\u70E4\u9762\u5305",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e7c8b2b418a84a046e3ecbc",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u72EC\u6811\u4E0D\u6210\u6797",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/64acd33c7a3d479103fbd32d",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u75AF\u6295\u5708",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e280faf418a84a0461fbd39",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u76AE\u86CB\u6F2B\u6E38\u8BB0",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6281264ad22bcf3950c80b56",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u770B\u7406\u60F3\u5706\u684C",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e4ff4c7418a84a046977618",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u77E5\u884C\u5C0F\u9152\u9986",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6013f9f58e2f7ee375cf4216",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u7845\u8C37101 \u2014 Podcast",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e5c52c9418a84a04625e6cc",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u786C\u5730\u9A87\u5BA2",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/640ee2438be5d40013fe4a87",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u79D1\u6280\u4E71\u7096",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e4243cd418a84a0469573fb",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u7B2C\u4E00\u8D22\u7ECF",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/64c75555e8176c3ff81de98c",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u7EB5\u6A2A\u56DB\u6D77",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/62694abdb221dd5908417d1e",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u7F57\u6C38\u6D69\u7684\u5341\u5B57\u8DEF\u53E3",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/68981df29e7bcd326eb91d88",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u80A5\u8BDD\u8FDE\u7BC7",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/61d50d72ee197a3aac3dac42",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u81EA\u4E60\u5BA4 STUDY ROOM",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/65a5fb7540d4ef949c0140ac",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u81EA\u6211\u8FDB\u5316\u8BBA",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e5de5cb418a84a0467beb90",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u848B\u65B9\u821F\xB7\u4E00\u5BF8",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/67c7eeb07ac3e30992e75a2f",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u8BD7\u68B3\u98CE",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/696496f4db4738160d5fabde",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u8C2D\u7ACB\u4EBA",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/65a2d0f07242f9fc1c1df60a",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u8D77\u6731\u697C\u5BB4\u5BBE\u5BA2",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/61dd99a47b29652ff572257b",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u8DE8\u56FD\u4E32\u95E8\u513F\u8BA1\u5212",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/670f3da40d2f24f28978736f",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u968F\u673A\u6CE2\u52A8StochasticVolatility",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/5e7cc741418a84a046b0c2bd",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u9762\u57FA",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/6388760f22567e8ea6ad070f",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    },
    {
      name: "\u9AD8\u80FD\u91CF",
      url: "https://rsshub.bestblogs.dev/xiaoyuzhou/podcast/62c6ae08c4eaa82b112b9c84",
      description: "\u64AD\u5BA2\u8282\u76EE",
      language: "zh"
    }
  ]
};

// src/client/Discover.jsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var featured = [
  ["\u6F6E\u6D41\u5468\u520A \xB7 Tw93", "https://weekly.tw93.fun/rss.xml"],
  ["\u962E\u4E00\u5CF0\u7684\u7F51\u7EDC\u65E5\u5FD7", "https://www.ruanyifeng.com/blog/atom.xml"],
  ["\u4E91\u98CE", "https://blog.codingnow.com/atom.xml"],
  ["\u548C\u83DC\u5934", "https://www.hecaitou.com/feeds/posts/default?alt=rss"],
  ["\u5F20\u946B\u65ED", "https://www.zhangxinxu.com/wordpress/feed/"],
  ["\u5C0F\u4F17\u8F6F\u4EF6", "https://www.appinn.com/feed/"],
  ["\u6708\u5149\u535A\u5BA2", "https://www.williamlong.info/rss.xml"],
  ["Reorx", "https://reorx.com/feed.xml"],
  ["pseudoyu", "https://www.pseudoyu.com/zh/index.xml"]
].map(([name, url]) => ({ name, url, category: "\u7CBE\u9009\u4F5C\u8005" }));
var wechat = [
  ["\u5411\u9633\u4E54\u6728\u63A8\u8350\u770B", "3008229483"],
  ["\u846CAI", "3988614169"],
  ["AGENT\u6A58", "3903697567"],
  ["\u8D5B\u535A\u7985\u5FC3", "3934419561"],
  ["\u6570\u5B57\u751F\u547D\u5361\u5179\u514B", "3223096120"],
  ["\u665A\u70B9LatePost", "3572959446"],
  ["\u65B0\u667A\u5143", "3271041950"],
  ["elsewhere\u522B\u5904\u53D1\u751F", "3635075805"]
].map(([name, id]) => ({ name, url: `https://rss.t5t6.com/weread/MP_WXS_${id}.xml`, category: "\u5FAE\u4FE1\u516C\u4F17\u53F7" }));
var catalog = [...featured, ...wechat, ...podcast_feeds_default.items.map((entry) => ({ ...entry, category: "\u64AD\u5BA2" })), ...independent_blogs_default.items.map((entry) => ({ ...entry, category: "\u72EC\u7ACB\u535A\u5BA2" }))];
var topics = [...new Set(independent_blogs_default.items.flatMap((entry) => entry.tags ?? []))].sort();
var categories = ["\u5168\u90E8", "\u7CBE\u9009\u4F5C\u8005", "\u5FAE\u4FE1\u516C\u4F17\u53F7", "\u64AD\u5BA2", "\u72EC\u7ACB\u535A\u5BA2"];
function feedHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
function Discover({ api, onClose, onAdded, onRead }) {
  const [query, setQuery] = (0, import_react10.useState)("");
  const [category, setCategory] = (0, import_react10.useState)("\u5168\u90E8");
  const [topic, setTopic] = (0, import_react10.useState)("");
  const [limit, setLimit] = (0, import_react10.useState)(40);
  const [subscribed, setSubscribed] = (0, import_react10.useState)([]);
  const [busy, setBusy] = (0, import_react10.useState)("");
  const [message, setMessage] = (0, import_react10.useState)("");
  (0, import_react10.useEffect)(() => setLimit(40), [query, category, topic]);
  (0, import_react10.useEffect)(() => {
    void api.listSubscriptions().then((result) => setSubscribed(result.subscriptions)).catch((error) => setMessage(error.message));
  }, [api]);
  (0, import_react10.useEffect)(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const visible = (0, import_react10.useMemo)(() => {
    const needle = query.trim().toLocaleLowerCase();
    return catalog.filter((entry) => (category === "\u5168\u90E8" || entry.category === category) && (!topic || entry.tags?.includes(topic)) && `${entry.name} ${entry.url} ${(entry.tags ?? []).join(" ")}`.toLocaleLowerCase().includes(needle));
  }, [query, category, topic]);
  const add = async (entry) => {
    setBusy(entry.url);
    setMessage("");
    try {
      const result = await api.addSubscription({ name: entry.name, url: entry.url, group: entry.category });
      setSubscribed((current) => [...current, result]);
      setMessage(result.lastError ? `\u5DF2\u6DFB\u52A0\uFF0C\u9996\u6B21\u83B7\u53D6\u5931\u8D25\uFF1A${result.lastError}` : `\u5DF2\u8BA2\u9605 ${entry.name}`);
      await onAdded();
    } catch (error) {
      setMessage(error?.message ?? String(error));
    } finally {
      setBusy("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "qmrss-dialog-backdrop", onMouseDown: (event) => {
    if (event.target === event.currentTarget) onClose();
  }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qmrss-dialog qrs-discover", role: "dialog", "aria-modal": "true", "aria-label": "\u63A2\u7D22\u8BA2\u9605", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("header", { className: "qrs-discover-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { children: "\u63A2\u7D22\u8BA2\u9605" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: "\u627E\u5230\u611F\u5174\u8DA3\u7684\u5185\u5BB9\uFF0C\u52A0\u5165\u4F60\u7684\u9891\u9053\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "qrs-icon", "aria-label": "\u5173\u95ED\u63A2\u7D22", title: "\u5173\u95ED", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon2, { name: "x" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qrs-discover-filters", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "qrs-discover-search", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon2, { name: "search" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { autoFocus: true, "aria-label": "\u641C\u7D22\u63A8\u8350\u6E90", placeholder: "\u641C\u7D22\u4F5C\u8005\u3001\u64AD\u5BA2\u6216 RSS \u5730\u5740", value: query, onChange: (event) => setQuery(event.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "qrs-discover-categories", role: "group", "aria-label": "\u63A8\u8350\u6E90\u5206\u7C7B", children: categories.map((name) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: category === name ? "active" : "", "aria-pressed": category === name, onClick: () => {
        setCategory(name);
        if (name !== "\u5168\u90E8" && name !== "\u72EC\u7ACB\u535A\u5BA2") setTopic("");
      }, children: name }, name)) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qrs-discover-filter-line", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
          visible.length,
          " \u4E2A\u7ED3\u679C"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("select", { "aria-label": "\u4E3B\u9898\u6807\u7B7E", value: topic, onChange: (event) => setTopic(event.target.value), disabled: category !== "\u5168\u90E8" && category !== "\u72EC\u7ACB\u535A\u5BA2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "", children: "\u5168\u90E8\u4E3B\u9898" }),
          topics.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { children: tag }, tag))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qrs-discover-results", children: [
      visible.slice(0, limit).map((entry, index) => {
        const subscription = subscribed.find((sub) => sub.url === entry.url);
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qrs-discover-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "qrs-discover-avatar", "aria-hidden": "true", children: entry.category === "\u64AD\u5BA2" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon2, { name: "podcast", size: 17 }) : entry.name.slice(0, 1) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qrs-discover-info", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("strong", { children: entry.name }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { title: entry.url, children: [
              feedHost(entry.url),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "qrs-discover-dot", children: " \xB7 " }),
              entry.category
            ] })
          ] }),
          subscription ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "qrs-discover-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "qrs-discover-read", "aria-label": `\u9605\u8BFB ${entry.name}`, onClick: () => onRead(`feed:${subscription.id}`), children: "\u9605\u8BFB" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "qrs-discover-subscribed", children: "\u5DF2\u8BA2\u9605" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "qrs-discover-add", disabled: Boolean(busy), "aria-label": `\u8BA2\u9605 ${entry.name}`, onClick: () => void add(entry), children: busy === entry.url ? "\u6DFB\u52A0\u4E2D\u2026" : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon2, { name: "plus" }),
            "\u8BA2\u9605"
          ] }) })
        ] }, `${entry.url}:${index}`);
      }),
      visible.length > limit && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "qrs-discover-more", onClick: () => setLimit((current) => current + 40), children: "\u663E\u793A\u66F4\u591A" }),
      !visible.length && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "qrs-discover-empty", children: "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u8BA2\u9605\u6E90" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("footer", { className: "qrs-discover-foot", children: [
      message && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "qrs-discover-message", role: "status", children: message }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
        "\u72EC\u7ACB\u535A\u5BA2\u6765\u81EA ",
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("a", { href: independent_blogs_default.source, target: "_blank", rel: "noreferrer", children: "Tim Qian \u76EE\u5F55" }),
        " \xB7 MIT"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
        "\u64AD\u5BA2\u76EE\u5F55\u6765\u81EA ",
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("a", { href: podcast_feeds_default.source, target: "_blank", rel: "noreferrer", children: "\u4E54\u6728 RSS" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "\u516C\u4F17\u53F7\u6E90\u7531\u7B2C\u4E09\u65B9\u63D0\u4F9B\uFF0C\u53EF\u80FD\u53EA\u6709\u6458\u8981" })
    ] })
  ] }) });
}

// src/client/MediaDock.jsx
var import_react11 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function MediaDock({ episode, onOpen, onClose }) {
  const audio = (0, import_react11.useRef)();
  const [error, setError] = (0, import_react11.useState)("");
  (0, import_react11.useEffect)(() => {
    setError("");
    if (!episode || !navigator.mediaSession) return;
    const session = navigator.mediaSession;
    if (typeof MediaMetadata !== "undefined") session.metadata = new MediaMetadata({ title: episode.titleZh || episode.title, artist: episode.author || episode.channelName || "\u4E54\u6728 RSS" });
    const handlers = {
      play: () => {
        void audio.current?.play().catch(() => setError("\u64AD\u653E\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u6253\u5F00\u539F\u6587"));
      },
      pause: () => audio.current?.pause(),
      seekbackward: () => {
        if (audio.current) audio.current.currentTime = Math.max(0, audio.current.currentTime - 15);
      },
      seekforward: () => {
        if (audio.current && Number.isFinite(audio.current.duration)) audio.current.currentTime = Math.min(audio.current.duration, audio.current.currentTime + 15);
      }
    };
    for (const [name, handler] of Object.entries(handlers)) {
      try {
        session.setActionHandler(name, handler);
      } catch {
      }
    }
    return () => {
      session.metadata = null;
      for (const name of Object.keys(handlers)) {
        try {
          session.setActionHandler(name, null);
        } catch {
        }
      }
    };
  }, [episode]);
  if (!episode) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("aside", { "aria-label": "\u6B63\u5728\u64AD\u653E", style: { padding: 10, borderTop: "1px solid var(--dsw-alias-border-l1)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: "qmrss-btn", onClick: () => onOpen(episode.key), title: "\u8FD4\u56DE\u8282\u76EE\u6587\u7AE0", children: episode.titleZh || episode.title }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("audio", { ref: audio, controls: true, autoPlay: true, preload: "metadata", src: episode.audio, onError: () => setError("\u97F3\u9891\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5\u6216\u6253\u5F00\u539F\u6587") }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: "qmrss-btn", onClick: onClose, children: "\u5173\u95ED\u64AD\u653E\u5668" }),
    error && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { role: "alert", children: [
      error,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: "qmrss-btn", onClick: () => {
        setError("");
        audio.current?.load();
      }, children: "\u91CD\u8BD5\u97F3\u9891" })
    ] })
  ] });
}

// src/client/selection.js
function selectedPassage(root, selection = window.getSelection()) {
  if (!root || !selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const quote = selection.toString().trim();
  if (!quote || quote.length > 6e3) return null;
  const before = range.cloneRange();
  before.selectNodeContents(root);
  before.setEnd(range.startContainer, range.startOffset);
  const offset = before.toString().length;
  return { quote, prefix: root.textContent.slice(Math.max(0, offset - 40), offset), suffix: root.textContent.slice(offset + selection.toString().length, offset + selection.toString().length + 40) };
}
function quoteRange(root, note) {
  const text = root.textContent;
  let start = text.indexOf(note.quote);
  if (start < 0 || !note.quote) return null;
  if (note.prefix) {
    const anchored = text.indexOf(note.prefix + note.quote);
    if (anchored >= 0) start = anchored + note.prefix.length;
  }
  const end = start + note.quote.length;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0, node, range = document.createRange(), begun = false;
  while (node = walker.nextNode()) {
    const next = offset + node.length;
    if (!begun && start < next) {
      range.setStart(node, start - offset);
      begun = true;
    }
    if (begun && end <= next) {
      range.setEnd(node, end - offset);
      return range;
    }
    offset = next;
  }
  return null;
}

// src/client/AskArticle.jsx
var import_react12 = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime11 = require("react/jsx-runtime");
function AskArticle({ api, context, onClose, onManagePrompts, SessionProvider, renderSlot }) {
  const [workspaceId, setWorkspaceId] = (0, import_react12.useState)(() => api.defaultChatWorkspace?.());
  const [chat, setChat] = (0, import_react12.useState)(null);
  const [error, setError] = (0, import_react12.useState)("");
  const [actionError, setActionError] = (0, import_react12.useState)("");
  const [busy, setBusy] = (0, import_react12.useState)(true);
  const [attached, setAttached] = (0, import_react12.useState)("");
  const [attachedVersion, setAttachedVersion] = (0, import_react12.useState)(context.version);
  const [prompts, setPrompts] = (0, import_react12.useState)(readQuickPrompts);
  const [promptMount, setPromptMount] = (0, import_react12.useState)(null);
  const [emptyConversation, setEmptyConversation] = (0, import_react12.useState)(false);
  const [sendingPrompt, setSendingPrompt] = (0, import_react12.useState)(false);
  const chatRoot = (0, import_react12.useRef)(null);
  const sending = (0, import_react12.useRef)(false);
  const owned = (0, import_react12.useRef)(null);
  const generation = (0, import_react12.useRef)(0);
  const started = (0, import_react12.useRef)(false);
  const contextKey = [context.key, context.version, context.selection || "", context.quoteId || ""].join("|");
  (0, import_react12.useEffect)(() => {
    if (workspaceId) return;
    return api.watchChatWorkspaces?.(() => setWorkspaceId(api.defaultChatWorkspace?.()));
  }, [api, workspaceId]);
  (0, import_react12.useEffect)(() => () => {
    generation.current += 1;
    owned.current?.release();
  }, []);
  (0, import_react12.useEffect)(() => {
    const reload = () => setPrompts(readQuickPrompts());
    window.addEventListener("qrs-prompts-changed", reload);
    return () => window.removeEventListener("qrs-prompts-changed", reload);
  }, []);
  (0, import_react12.useEffect)(() => {
    setActionError("");
  }, [contextKey]);
  (0, import_react12.useEffect)(() => {
    if (!chat || !SessionProvider) return;
    const root = chatRoot.current;
    if (!root) return;
    const mount = document.createElement("div");
    mount.className = "qrs-companion-prompt-anchor";
    let placed = false;
    const place = () => {
      const seat = root.querySelector("[data-composer-seat]");
      if (seat?.parentNode) {
        if (mount.nextSibling !== seat) seat.parentNode.insertBefore(mount, seat);
        if (!placed) {
          placed = true;
          setPromptMount(mount);
        }
      }
      setEmptyConversation(root.querySelector("[data-content-phase]")?.getAttribute("data-content-phase") === "hero");
    };
    const observer = new MutationObserver(place);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-content-phase"] });
    place();
    return () => {
      observer.disconnect();
      mount.remove();
      setPromptMount(null);
      setEmptyConversation(false);
    };
  }, [chat, SessionProvider]);
  async function start(fresh = false) {
    if (!workspaceId) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    setActionError("");
    let acquired;
    try {
      const saved = fresh ? null : localStorage.getItem(`qrs.chat.${workspaceId}.${context.key}`);
      try {
        acquired = await api.openChat({ workspaceId, sessionId: saved || void 0 });
      } catch (cause) {
        if (!saved) throw cause;
        localStorage.removeItem(`qrs.chat.${workspaceId}.${context.key}`);
        acquired = await api.openChat({ workspaceId });
      }
      if (current !== generation.current) {
        acquired.release();
        return;
      }
      const binding = await api.setReadingContext({ sessionId: acquired.sessionId, ...context });
      if (current !== generation.current) {
        acquired.release();
        return;
      }
      owned.current?.release();
      owned.current = acquired;
      setChat(acquired);
      setAttached(contextKey);
      setAttachedVersion(binding?.version ?? context.version);
      localStorage.setItem(`qrs.chat.${workspaceId}.${context.key}`, acquired.sessionId);
      acquired = null;
    } catch (cause) {
      acquired?.release();
      setError(cause?.message ?? String(cause));
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  (0, import_react12.useEffect)(() => {
    if (!workspaceId || started.current) return;
    started.current = true;
    void start();
  }, [workspaceId]);
  (0, import_react12.useEffect)(() => {
    if (!chat || attached === contextKey) return;
    let stale = false;
    setError("");
    api.setReadingContext({ sessionId: chat.sessionId, ...context }).then((binding) => {
      if (!stale) {
        setAttached(contextKey);
        setAttachedVersion(binding?.version ?? context.version);
      }
    }).catch((cause) => {
      if (!stale) setError(cause?.message ?? String(cause));
    });
    return () => {
      stale = true;
    };
  }, [chat, contextKey]);
  async function sendQuickPrompt(item) {
    if (sending.current || !chat || attached !== contextKey) return;
    sending.current = true;
    setSendingPrompt(true);
    setActionError("");
    try {
      await chat.sendPrompt(item.body);
    } catch (cause) {
      setActionError(cause?.message?.includes("\u5DF2\u6709\u8349\u7A3F") ? "\u8F93\u5165\u6846\u5DF2\u6709\u8349\u7A3F\uFF0C\u5148\u53D1\u9001\u6216\u6E05\u7A7A\u540E\u518D\u4F7F\u7528\u5FEB\u6377\u63D0\u793A\u8BCD\u3002" : `\u5FEB\u6377\u53D1\u9001\u5931\u8D25\uFF1A${cause?.message ?? String(cause)}`);
    } finally {
      setSendingPrompt(false);
      sending.current = false;
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("aside", { className: "qrs-companion", "aria-label": "AI \u4F34\u8BFB", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qrs-companion-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: "AI \u4F34\u8BFB" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "qrs-icon", title: "\u65B0\u4F34\u8BFB\u5BF9\u8BDD", "aria-label": "\u65B0\u4F34\u8BFB\u5BF9\u8BDD", onClick: () => void start(true), disabled: busy || !workspaceId, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon2, { name: "plus" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "qrs-icon", title: "\u5173\u95ED\u4F34\u8BFB", "aria-label": "\u5173\u95ED\u4F34\u8BFB", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon2, { name: "x" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qrs-companion-context", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: context.title }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
        { original: "\u539F\u6587", translation: "\u8BD1\u6587", rewrite: "\u4E54\u6728\u6539\u5199" }[attached === contextKey ? attachedVersion : context.version],
        attached === contextKey && attachedVersion !== context.version ? "\u53EF\u7528\uFF0C\u5F53\u524D\u7248\u672C\u6682\u7F3A" : "",
        " \xB7 \u5F53\u524D\u6587\u7AE0"
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qrs-companion-error", role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: error.includes("\u6CA1\u6709\u53EF\u7528\u6B63\u6587") ? "\u6682\u65F6\u65E0\u6CD5\u4F34\u8BFB\u8FD9\u7BC7\u6587\u7AE0" : "\u4F34\u8BFB\u8FDE\u63A5\u672A\u5B8C\u6210" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: error.includes("\u6CA1\u6709\u53EF\u7528\u6B63\u6587") ? "\u8FD9\u7BC7\u6587\u7AE0\u76EE\u524D\u6CA1\u6709\u53EF\u5F15\u7528\u7684\u6B63\u6587\u3002\u4F60\u53EF\u4EE5\u7A0D\u540E\u518D\u8BD5\uFF0C\u6216\u5148\u9605\u8BFB\u5176\u4ED6\u6587\u7AE0\u3002" : error }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => void start(), children: "\u91CD\u65B0\u8FDE\u63A5" })
    ] }),
    actionError && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qrs-companion-notice", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: actionError }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", "aria-label": "\u5173\u95ED\u63D0\u793A", onClick: () => setActionError(""), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon2, { name: "x", size: 13 }) })
    ] }),
    !chat && !error && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qrs-companion-loading", role: "status", children: workspaceId ? "\u6B63\u5728\u6253\u5F00\u5BF9\u8BDD\u2026" : "\u6B63\u5728\u8FDE\u63A5\u9ED8\u8BA4\u5DE5\u4F5C\u533A\u2026" }),
    chat && SessionProvider && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qrs-native-chat", ref: chatRoot, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SessionProvider, { session: chat.reference, children: renderSlot("qiaomu-rss.chat", {}) }),
      emptyConversation && attached === contextKey && !error && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qrs-companion-opening", "aria-label": "\u5F00\u59CB\u4F34\u8BFB", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qrs-companion-book", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("svg", { viewBox: "0 0 112 88", fill: "none", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M56 72c-10-7-21-10-37-9V19c16-1 27 2 37 9 10-7 21-10 37-9v44c-16-1-27 2-37 9Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M56 28v44M25 29c9 .3 17 2.5 24 6M25 38c9 .3 17 2.5 24 6M63 35c7-3.5 15-5.7 24-6M63 44c7-3.5 15-5.7 24-6" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M11 68c18-3 33 0 45 9 12-9 27-12 45-9" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: "77", cy: "13", r: "2.5", className: "qrs-companion-book-spark" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M77 3v4M77 19v4M67 13h4M83 13h4", className: "qrs-companion-book-spark" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qrs-companion-opening-label", children: "\u4E0E\u6587\u7AE0\u5BF9\u5750\u7247\u523B" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: "\u597D\u5947\uFF0C\u4ECE\u8FD9\u4E00\u9875\u5F00\u59CB\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u4E00\u4E2A\u7EC6\u8282\uFF0C\u4E00\u5904\u7591\u95EE\uFF0C\u6216\u4E00\u53E5\u4E0D\u540C\u610F\u7684\u8BDD\u3002",
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("br", {}),
          "\u5199\u4E0B\u6765\uFF0C\u6211\u4EEC\u63A5\u7740\u8BFB\u3002"
        ] })
      ] })
    ] }),
    promptMount && (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qrs-companion-prompt-strip", role: "group", "aria-label": "\u5FEB\u6377\u63D0\u793A\u8BCD", children: [
      context.selection && attached === contextKey && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qrs-companion-selection-chip", title: "\u9009\u6BB5\u5DF2\u52A0\u5165\u672C\u6B21\u4F34\u8BFB\u4E0A\u4E0B\u6587", children: "\u9009\u6BB5\u5DF2\u52A0\u5165\u4E0A\u4E0B\u6587" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qrs-companion-prompt-scroll", children: prompts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "qrs-companion-prompt-ghost", title: item.body, "aria-label": `\u76F4\u63A5\u53D1\u9001\uFF1A${item.title}`, disabled: sendingPrompt || attached !== contextKey, onClick: () => void sendQuickPrompt(item), children: item.title }, item.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "qrs-companion-add-prompt", "aria-label": "\u65B0\u589E\u5FEB\u6377\u63D0\u793A\u8BCD", title: "\u65B0\u589E\u5FEB\u6377\u63D0\u793A\u8BCD", onClick: onManagePrompts, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon2, { name: "plus", size: 14 }) })
    ] }), promptMount)
  ] });
}

// src/video.js
function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const host2 = url.hostname.toLowerCase();
    let id;
    if (host2 === "youtu.be") id = url.pathname.slice(1);
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(host2)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const match = /^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(url.pathname);
        id = match?.[1];
      }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id ?? "") ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

// src/client/print-article.js
function printArticle({ title, html, url, version }, hostDocument = document) {
  const frame = hostDocument.createElement("iframe");
  frame.title = "\u6587\u7AE0\u6253\u5370\u9884\u89C8";
  frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10000px;border:0";
  hostDocument.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    throw new Error("\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u521B\u5EFA\u6253\u5370\u6587\u6863");
  }
  doc.title = title || "RSS \u6587\u7AE0";
  const style = doc.createElement("style");
  style.textContent = "@page{margin:20mm}body{font:16px/1.8 serif;color:#111;background:#fff;max-width:44em;margin:auto}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:26px}a{overflow-wrap:anywhere}iframe,audio,video,button{display:none}";
  doc.head.appendChild(style);
  const heading = doc.createElement("h1");
  heading.textContent = title;
  doc.body.appendChild(heading);
  const meta = doc.createElement("p");
  meta.textContent = `\u9605\u8BFB\u7248\u672C\uFF1A${version}`;
  doc.body.appendChild(meta);
  try {
    const source = new URL(url);
    if (["http:", "https:"].includes(source.protocol)) {
      const link = doc.createElement("a");
      link.href = source.href;
      link.textContent = source.href;
      doc.body.appendChild(link);
    }
  } catch {
  }
  const body = doc.createElement("article");
  body.innerHTML = sanitizeHtml(html, { baseUrl: url });
  doc.body.appendChild(body);
  let timer;
  const dispose = () => {
    clearTimeout(timer);
    frame.remove();
  };
  win.addEventListener("afterprint", dispose, { once: true });
  timer = setTimeout(dispose, 12e4);
  win.focus();
  try {
    win.print();
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}

// src/client/refinements.css
var refinements_default = `
/* The article list remains available while a native Harness conversation is open. */
.qrs-workarea.has-companion > .qrs-layout {
  grid-template-columns: min(var(--qrs-list-width), 38%) 1px minmax(0, 1fr);
}
.qrs-workarea.has-companion > .qrs-layout > .qrs-sidebar { display: flex; }
.qrs-workarea.has-companion > .qrs-layout > .qrs-resize { display: block; }
.qrs-workarea.has-companion .qrs-article { padding-inline: clamp(18px, 3%, 36px); }
.qrs-root .qrs-channel { gap: 9px; }
.qrs-channel-mark { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--qrs-muted); border-radius: 7px; }
.qrs-channel-mark.curated { color: var(--qrs-fg); }
.qrs-channel-mark.all { color: var(--qrs-fg); }
.qrs-root .qrs-filters .qrs-settings-button { width: 30px; height: 30px; padding: 6px; margin-left: auto; border-radius: 7px; color: var(--qrs-muted); }
.qrs-root .qrs-filters .qrs-settings-button:hover { background: var(--qrs-hover); color: var(--qrs-fg); }
.qrs-root .qrs-filters .qrs-settings-button svg { width: 17px; height: 17px; }

/* Keep the reading measure stable while an article is fetched. */
.qrs-article-loading { animation: qrs-skeleton-enter .16s ease .14s both; }
.qrs-skeleton-toolbar { gap: 11px; }
.qrs-skeleton-toolbar .qrs-skeleton-pill { width: 94px; height: 26px; border-radius: 999px; margin-right: 6px; }
.qrs-skeleton-icon { width: 28px; height: 28px; border-radius: 7px; }
.qrs-article-skeleton { padding-top: 34px; }
.qrs-skeleton { background: color-mix(in srgb, var(--qrs-fg) 8%, var(--qrs-bg)); background-image: linear-gradient(100deg, transparent 18%, color-mix(in srgb, var(--qrs-bg) 65%, transparent) 50%, transparent 82%); background-size: 200% 100%; animation: qrs-skeleton-shimmer 1.7s ease-in-out infinite; }
.qrs-skeleton-meta { width: 132px; height: 15px; border-radius: 5px; margin-bottom: 28px; }
.qrs-skeleton-title { width: 82%; height: 29px; border-radius: 6px; margin-bottom: 14px; }
.qrs-skeleton-title.short { width: 56%; margin-bottom: 50px; }
.qrs-skeleton-paragraph { display: grid; gap: 19px; margin-bottom: 51px; }
.qrs-skeleton-paragraph .qrs-skeleton { height: 14px; border-radius: 5px; }
.qrs-skeleton-paragraph .qrs-skeleton:nth-child(2) { width: 93%; }
.qrs-skeleton-paragraph .qrs-skeleton:last-child { width: 67%; }
@keyframes qrs-skeleton-enter { from { opacity: 0; } to { opacity: 1; } }
@keyframes qrs-skeleton-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .qrs-article-loading { animation: none; } .qrs-skeleton { animation: none; background-image: none; } }
.qrs-article-load-error { display: grid; justify-items: start; gap: 9px; width: min(100% - 48px, 480px); margin: clamp(60px, 12vh, 140px) auto; color: var(--qrs-muted); }
.qrs-article-load-error h2 { margin: 7px 0 0; color: var(--qrs-fg); font-size: 19px; }
.qrs-article-load-error p { margin: 0 0 9px; font-size: 13px; }
.qrs-article-load-error button { min-height: 36px; padding: 0 13px; border: 1px solid color-mix(in srgb, var(--qrs-fg) 18%, var(--qrs-bg)); border-radius: 8px; background: transparent; color: var(--qrs-fg); font: inherit; font-size: 12px; cursor: pointer; }
.qrs-article-load-error button:hover { background: color-mix(in srgb, var(--qrs-fg) 5%, var(--qrs-bg)); }

/* Reading surfaces keep their paper/dark theme through hover and selection. */
.qrs-root button.qrs-entry:hover,
.qrs-root .qrs-filters button:hover,
.qrs-root .qrs-icon:hover { background: color-mix(in srgb, var(--qrs-fg) 5%, var(--qrs-bg)); color: var(--qrs-fg); }
.qrs-root button.qrs-entry.qrs-selected { background: color-mix(in srgb, var(--qrs-fg) 8%, var(--qrs-bg)); box-shadow: inset 2px 0 0 color-mix(in srgb, var(--qrs-fg) 58%, var(--qrs-bg)); }
.qrs-root .qrs-filters button[aria-pressed=true] { background: color-mix(in srgb, var(--qrs-fg) 8%, var(--qrs-bg)); }
.qrs-prose::selection, .qrs-prose *::selection, ::highlight(qrs-reading-selection) { background: color-mix(in srgb, var(--qrs-fg) 17%, var(--qrs-bg)); color: var(--qrs-fg); }

/* Searchable, anchored channel switcher. */
.qrs-channel-backdrop { align-items: initial; justify-content: initial; padding: 0; background: transparent; }
.qrs-channel-picker {
  position: absolute; width: min(480px, calc(100vw - 24px)); max-height: min(560px, calc(100vh - 24px));
  padding: 0; gap: 0; border: 1px solid color-mix(in srgb, var(--qrs-fg) 11%, var(--qrs-bg)); border-radius: 12px;
  background: var(--qrs-bg); color: var(--qrs-fg); box-shadow: 0 14px 42px rgba(0,0,0,.13), 0 1px 2px rgba(0,0,0,.04);
}
.qrs-channel-heading { display: flex; align-items: center; justify-content: space-between; padding: 16px 17px 8px; }
.qrs-channel-heading > div { display: flex; flex-direction: column; gap: 2px; }
.qrs-channel-heading strong { font-size: 15px; letter-spacing: -.015em; }
.qrs-channel-heading small { color: var(--qrs-muted); font-size: 11px; }
.qrs-channel-heading .qrs-icon { width: 28px; height: 28px; }
.qrs-channel-top { height: 46px; min-height: 46px; margin: 10px 16px 10px; padding: 0 14px; gap: 10px; border: 1px solid color-mix(in srgb, var(--qrs-fg) 13%, var(--qrs-bg)); border-radius: 9px; color: var(--qrs-muted); background: color-mix(in srgb, var(--qrs-fg) 2%, var(--qrs-bg)); }
.qrs-channel-top:focus-within { border-color: color-mix(in srgb, var(--qrs-fg) 33%, var(--qrs-bg)); box-shadow: none; }
.qrs-root .qrs-channel-top input[type=search] { flex: 1; width: 100%; height: 100%; padding: 0; min-width: 0; border: 0 !important; border-radius: 0; background: transparent !important; color: var(--qrs-fg); outline: 0 !important; box-shadow: none !important; appearance: none; font-size: 13px; }
.qrs-root .qrs-channel-top input[type=search]:focus { border: 0 !important; outline: 0 !important; box-shadow: none !important; }
.qrs-channel-options { padding: 2px 10px 8px; }
.qrs-channel-section { padding: 14px 11px 6px; color: var(--qrs-muted); font-size: 11px; letter-spacing: .02em; }
.qrs-channel-option-wrap { border-radius: 8px; }
.qrs-channel-option { min-height: 50px; padding: 9px 10px; gap: 9px; border-radius: 8px; }
.qrs-channel-option[aria-current=true] { background: color-mix(in srgb, var(--qrs-fg) 8%, var(--qrs-bg)); }
.qrs-channel-option:hover { background: color-mix(in srgb, var(--qrs-fg) 5%, var(--qrs-bg)); }
.qrs-channel-option[aria-current=true]:hover { background: color-mix(in srgb, var(--qrs-fg) 11%, var(--qrs-bg)); }
.qrs-channel-option:focus-visible { outline: 1px solid color-mix(in srgb, var(--qrs-fg) 40%, var(--qrs-bg)); outline-offset: -2px; }
.qrs-channel-option .qrs-channel-mark { background: transparent; }
.qrs-channel-name { font-size: 13px; font-weight: 520; }
.qrs-channel-subtitle { font-size: 11px; }
.qrs-channel-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 14px; border-top: 1px solid color-mix(in srgb, var(--qrs-fg) 9%, var(--qrs-bg)); background: color-mix(in srgb, var(--qrs-fg) 2%, var(--qrs-bg)); }
.qrs-channel-manage, .qrs-channel-close { height: 30px; margin: 0; border: 0; background: transparent; padding: 0 8px; font-size: 12px; border-radius: 7px; }
.qrs-channel-manage:hover, .qrs-channel-close:hover { background: color-mix(in srgb, var(--qrs-fg) 7%, var(--qrs-bg)); }
.qrs-channel-manage svg:last-child { transform: rotate(-90deg); margin-left: 4px; }

/* A wide drag target with a hairline instead of a heavy panel border. */
.qrs-workarea .qrs-companion-divider { position: relative; width: 8px; flex-basis: 8px; background: transparent; }
.qrs-workarea .qrs-companion-divider::after { content: ''; position: absolute; top: 0; bottom: 0; left: calc(50% - .5px); width: 1px; background: color-mix(in srgb, var(--qrs-fg) 12%, var(--qrs-bg)); pointer-events: none; }
.qrs-workarea .qrs-companion-divider:hover,
.qrs-workarea .qrs-companion-divider:focus-visible,
.qrs-workarea .qrs-companion-divider[data-dragging=true] { background: transparent; outline: none; }
.qrs-workarea .qrs-companion-divider:hover::after,
.qrs-workarea .qrs-companion-divider:focus-visible::after,
.qrs-workarea .qrs-companion-divider[data-dragging=true]::after { width: 2px; background: color-mix(in srgb, var(--qrs-fg) 34%, var(--qrs-bg)); }

/* Reading theme also colors the embedded Harness conversation. Host controls stay native. */
.qrs-companion { background: var(--qrs-bg); color: var(--qrs-fg); }
.qrs-root[data-reading-theme]:not([data-reading-theme=auto]) .qrs-companion {
  --dsw-alias-bg-base: var(--qrs-chat-bg);
  --dsw-alias-bg-layer-1: color-mix(in srgb, var(--qrs-chat-fg) 3%, var(--qrs-chat-bg));
  --dsw-alias-bg-layer-2: color-mix(in srgb, var(--qrs-chat-fg) 6%, var(--qrs-chat-bg));
  --dsw-alias-bg-overlay: color-mix(in srgb, var(--qrs-chat-fg) 8%, var(--qrs-chat-bg));
  --dsw-alias-label-primary: var(--qrs-chat-fg);
  --dsw-alias-label-secondary: color-mix(in srgb, var(--qrs-chat-fg) 67%, var(--qrs-chat-bg));
  --dsw-alias-border-l1: color-mix(in srgb, var(--qrs-chat-fg) 12%, var(--qrs-chat-bg));
  --dsw-alias-border-l2: color-mix(in srgb, var(--qrs-chat-fg) 20%, var(--qrs-chat-bg));
  --dsw-alias-brand-primary: var(--qrs-chat-fg);
}
.qrs-companion-header { min-height: 52px; padding: 9px 14px; border-bottom: 1px solid color-mix(in srgb, var(--qrs-fg) 10%, var(--qrs-bg)); }
.qrs-companion-header strong { color: var(--qrs-fg); font-size: 14px; }
.qrs-companion-context { padding: 11px 16px; border-bottom-color: color-mix(in srgb, var(--qrs-fg) 9%, var(--qrs-bg)); color: var(--qrs-muted); }
.qrs-companion-context strong { color: var(--qrs-fg); font-size: 12px; }
.qrs-companion-prompt-anchor { min-width: 0; width: 100%; flex: none; }
.qrs-companion-prompt-strip { display: flex; align-items: center; gap: 5px; min-width: 0; width: 100%; padding: 7px 14px 8px; white-space: nowrap; color: var(--qrs-fg); }
.qrs-companion-selection-chip { flex: none; max-width: 142px; overflow: hidden; text-overflow: ellipsis; padding: 5px 7px; border-radius: 6px; background: color-mix(in srgb, var(--qrs-fg) 5%, var(--qrs-bg)); color: var(--qrs-muted); font-size: 10px; line-height: 1.3; }
.qrs-companion-prompt-scroll { display: flex; align-items: center; gap: 5px; min-width: 0; flex: 1; overflow-x: auto; overflow-y: hidden; overscroll-behavior-inline: contain; scrollbar-width: none; }
.qrs-companion-prompt-scroll::-webkit-scrollbar { display: none; }
.qrs-native-chat .qrs-companion-prompt-strip button { appearance: none; display: inline-flex; align-items: center; justify-content: center; flex: none; min-height: 34px; padding: 0 11px; border: 0; border-radius: 8px; background: transparent; box-shadow: none; color: var(--qrs-muted); font: inherit; font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap; cursor: pointer; transition: background-color .14s ease, color .14s ease; }
.qrs-native-chat .qrs-companion-prompt-strip .qrs-companion-prompt-ghost { background: color-mix(in srgb, var(--qrs-fg) 5%, var(--qrs-bg)); color: var(--qrs-fg); }
.qrs-native-chat .qrs-companion-prompt-strip button:hover:not(:disabled) { background: color-mix(in srgb, var(--qrs-fg) 7%, var(--qrs-bg)); color: var(--qrs-fg); }
.qrs-native-chat .qrs-companion-prompt-strip button:active:not(:disabled) { background: color-mix(in srgb, var(--qrs-fg) 11%, var(--qrs-bg)); }
.qrs-native-chat .qrs-companion-prompt-strip button:focus-visible { outline: 1px solid color-mix(in srgb, var(--qrs-fg) 45%, var(--qrs-bg)); outline-offset: -1px; }
.qrs-native-chat .qrs-companion-prompt-strip button:disabled { opacity: .45; cursor: not-allowed; }
.qrs-native-chat .qrs-companion-prompt-strip .qrs-companion-add-prompt { width: 32px; padding: 0; }
.qrs-companion-error { margin: 20px 16px; padding: 18px; border: 1px solid var(--qrs-border); border-radius: 12px; background: var(--qrs-bg-2); color: var(--qrs-fg); }
.qrs-companion-error strong { display: block; font-size: 13px; font-weight: 600; }
.qrs-companion-error p { margin: 7px 0 14px; color: var(--qrs-muted); font-size: 12px; line-height: 1.6; }
.qrs-companion-error button { margin: 0; min-height: 32px; padding: 0 11px; border: 1px solid var(--qrs-border); border-radius: 7px; background: var(--qrs-bg); color: var(--qrs-fg); font: inherit; font-size: 12px; cursor: pointer; }
.qrs-companion-error button:hover { background: var(--qrs-hover); }
.qrs-companion-notice { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 16px 0; padding: 9px 11px; border-radius: 8px; background: var(--qrs-bg-2); color: var(--qrs-muted); font-size: 11px; line-height: 1.5; }
.qrs-companion-notice button { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border: 0; border-radius: 5px; background: transparent; color: inherit; cursor: pointer; }
.qrs-companion-notice button:hover { background: var(--qrs-hover); color: var(--qrs-fg); }
.qrs-native-chat { position: relative; }
.qrs-native-chat [data-conversation-scroll] :has(> [data-chat-flow]) { padding-inline: 16px; }
.qrs-companion-opening { position: absolute; inset: 0 0 172px; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 0; padding: 18px 24px 0; overflow: hidden; text-align: center; pointer-events: none; color: var(--qrs-fg); }
.qrs-companion-book { width: 112px; height: 88px; margin-bottom: 22px; color: color-mix(in srgb, var(--qrs-fg) 42%, var(--qrs-bg)); }
.qrs-companion-book svg { display: block; width: 100%; height: 100%; stroke: currentColor; stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; }
.qrs-companion-book-spark { color: color-mix(in srgb, #ad7e49 68%, var(--qrs-fg)); stroke: currentColor; }
.qrs-companion-opening-label { color: color-mix(in srgb, #ad7e49 54%, var(--qrs-muted)); font-size: 11px; font-weight: 600; letter-spacing: .12em; }
.qrs-companion-opening h2 { margin: 10px 0 0; color: var(--qrs-fg); font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', serif; font-size: clamp(20px, 2vw, 26px); font-weight: 600; line-height: 1.5; letter-spacing: .045em; }
.qrs-companion-opening p { margin: 14px 0 0; color: var(--qrs-muted); font-size: 12px; line-height: 1.9; letter-spacing: .015em; }
@media (max-height: 660px) { .qrs-companion-book { width: 80px; height: 63px; margin-bottom: 10px; } .qrs-companion-opening p { margin-top: 6px; } }
/* Harness centers a blank-session Hero. Embedded reading keeps its native composer at the same bottom position as an active conversation. */
.qrs-native-chat [data-content-phase="hero"] [data-conversation-scroll] { justify-content: flex-end; }
.qrs-native-chat [data-content-phase="hero"] [data-composer-seat] { position: sticky; bottom: 0; z-index: 7; background: var(--qrs-bg); }
.qrs-native-chat [data-content-phase="hero"] [class*="composerHero"] { padding-bottom: 0; }
.qrs-native-chat [data-content-phase="hero"] [class*="composerHero"] > :first-child,
.qrs-native-chat [data-content-phase="hero"] [class*="heroWorkspaceRow"] { display: none; }
.qrs-discover-actions { display: flex; align-items: center; flex: none; gap: 8px; }
.qrs-discover-read { min-height: 32px; padding: 0 11px; border: 0; border-radius: 7px; background: transparent; color: var(--qrs-fg); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.qrs-discover-read:hover { background: var(--qrs-hover); }
.qrs-discover-subscribed { color: var(--qrs-muted); font-size: 11px; white-space: nowrap; }

/* The subscription library uses the active reading palette, including focus and hover states. */
.qrs-root .qmrss-dialog.qrs-discover {
  --qrs-discover-tint: color-mix(in srgb, var(--qrs-fg) 3%, var(--qrs-bg));
  --qrs-discover-hover: color-mix(in srgb, var(--qrs-fg) 5%, var(--qrs-bg));
  background: var(--qrs-bg); color: var(--qrs-fg);
  border: 1px solid color-mix(in srgb, var(--qrs-fg) 12%, var(--qrs-bg));
  box-shadow: 0 18px 55px rgba(0,0,0,.16), 0 1px 2px rgba(0,0,0,.05);
}
.qrs-discover-head p, .qrs-discover-info > span, .qrs-discover-filter-line, .qrs-discover-foot { color: var(--qrs-muted); }
.qrs-root .qrs-discover-search { height: 44px; background: var(--qrs-discover-tint); border: 1px solid color-mix(in srgb, var(--qrs-fg) 12%, var(--qrs-bg)); color: var(--qrs-muted); transition: border-color .14s ease, background-color .14s ease; }
.qrs-root .qrs-discover-search:focus-within { border-color: color-mix(in srgb, var(--qrs-fg) 45%, var(--qrs-bg)); background: var(--qrs-bg); box-shadow: none; outline: none; }
.qrs-root .qmrss-dialog .qrs-discover-search input, .qrs-root .qmrss-dialog .qrs-discover-search input:focus-visible { min-width: 0; height: 100%; padding: 0; border: 0 !important; border-radius: 0; background: transparent !important; box-shadow: none !important; outline: none !important; color: var(--qrs-fg); }
.qrs-root .qmrss-dialog .qrs-discover-search input::placeholder { color: var(--qrs-muted); opacity: .8; }
.qrs-root .qrs-discover-categories button { min-height: 34px; color: var(--qrs-muted); }
.qrs-root .qrs-discover-categories button:hover { background: var(--qrs-discover-hover); color: var(--qrs-fg); }
.qrs-root .qrs-discover-categories button.active, .qrs-root .qrs-discover-categories button.active:hover { background: color-mix(in srgb, var(--qrs-fg) 8%, var(--qrs-bg)); color: var(--qrs-fg); }
.qrs-root .qmrss-dialog .qrs-discover-filter-line select { min-height: 32px; color: var(--qrs-fg); }
.qrs-root .qmrss-dialog .qrs-discover-filter-line select:hover:not(:disabled) { background: var(--qrs-discover-hover); }
.qrs-root .qrs-discover-row { border-bottom: 1px solid color-mix(in srgb, var(--qrs-fg) 9%, var(--qrs-bg)); transition: background-color .14s ease; }
.qrs-root .qrs-discover-row:hover, .qrs-root .qrs-discover-row:focus-within { background: var(--qrs-discover-tint); }
.qrs-root .qrs-discover-avatar { background: color-mix(in srgb, var(--qrs-fg) 6%, var(--qrs-bg)); color: var(--qrs-muted); }
.qrs-root .qrs-discover-add { min-height: 34px; border-color: color-mix(in srgb, var(--qrs-fg) 16%, var(--qrs-bg)); color: var(--qrs-fg); }
.qrs-root .qrs-discover-add:hover:not(:disabled), .qrs-root .qrs-discover-read:hover { background: var(--qrs-discover-hover); }
.qrs-root .qrs-discover-foot { border-top: 1px solid color-mix(in srgb, var(--qrs-fg) 10%, var(--qrs-bg)); background: var(--qrs-discover-tint); }
.qrs-root .qrs-discover-results { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--qrs-fg) 20%, transparent) transparent; }
.qrs-root .qrs-discover-results::-webkit-scrollbar { width: 6px; }
.qrs-root .qrs-discover-results::-webkit-scrollbar-thumb { border-radius: 99px; background: color-mix(in srgb, var(--qrs-fg) 20%, transparent); }
@media (prefers-reduced-motion: reduce) { .qrs-native-chat .qrs-companion-prompt-strip button, .qrs-root .qrs-discover-row, .qrs-root .qrs-discover-search { transition: none; } }
.qrs-native-chat :is(textarea,[contenteditable=true],[role=textbox]) { color: var(--qrs-fg); }
.qrs-native-chat button[aria-label="\u53D1\u9001\u6D88\u606F"] { background: var(--qrs-fg); color: var(--qrs-bg); }
.qrs-native-chat button[aria-label="\u53D1\u9001\u6D88\u606F"]:hover { background: color-mix(in srgb, var(--qrs-fg) 83%, var(--qrs-bg)); color: var(--qrs-bg); }

.qrs-root :is(.qrs-list, .qrs-reader, .qrs-channel-options, .qrs-settings-content, .qrs-native-chat, .qrs-native-chat *) { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--qrs-fg) 18%, transparent) transparent; }
.qrs-root :is(.qrs-list, .qrs-reader, .qrs-channel-options, .qrs-settings-content, .qrs-native-chat, .qrs-native-chat *)::-webkit-scrollbar { width: 6px; height: 6px; }
.qrs-root :is(.qrs-list, .qrs-reader, .qrs-channel-options, .qrs-settings-content, .qrs-native-chat, .qrs-native-chat *)::-webkit-scrollbar-thumb { border-radius: 99px; background: color-mix(in srgb, var(--qrs-fg) 18%, transparent); }
.qrs-root :is(.qrs-list, .qrs-reader, .qrs-channel-options, .qrs-settings-content, .qrs-native-chat, .qrs-native-chat *)::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--qrs-fg) 31%, transparent); }
.qrs-root :is(.qrs-list, .qrs-reader, .qrs-channel-options, .qrs-settings-content, .qrs-native-chat, .qrs-native-chat *)::-webkit-scrollbar-track { background: transparent; }

/* A quiet, host-themed settings workspace with a stable side navigation. */
.qrs-settings-backdrop { background: rgba(17,17,17,.38); }
.qrs-settings-page { width: min(980px, 100%); height: min(810px, 100%); border-radius: 16px; background: var(--dsw-alias-bg-base); box-shadow: 0 22px 70px rgba(0,0,0,.20); }
.qrs-settings-head { flex: none; padding: 20px 24px; border-bottom: 1px solid var(--qrs-border); }
.qrs-settings-head > div { display: flex; align-items: center; gap: 12px; }
.qrs-settings-head span { padding-right: 12px; border-right: 1px solid var(--qrs-border); font-size: 10px; font-weight: 700; letter-spacing: .18em; color: var(--qrs-muted); }
.qrs-settings-head strong { font-size: 17px; letter-spacing: -.025em; }
.qrs-settings-body { display: grid; grid-template-columns: 190px minmax(0,1fr); flex: 1; min-height: 0; }
.qrs-settings-tabs { display: flex; flex-direction: column; align-items: stretch; gap: 3px; padding: 23px 12px; border: 0; border-right: 1px solid var(--qrs-border); background: var(--dsw-alias-bg-layer-1); }
.qrs-settings-nav-caption { padding: 0 11px 10px; color: var(--qrs-muted); font-size: 11px; }
.qrs-settings-tabs button { display: flex; align-items: center; gap: 10px; padding: 10px 11px; font-size: 13px; text-align: left; border-radius: 8px; }
.qrs-settings-tabs button:hover { background: var(--qrs-hover); color: var(--qrs-fg); }
.qrs-settings-tabs button[aria-current=page] { background: var(--dsw-alias-bg-base); color: var(--qrs-fg); box-shadow: 0 0 0 1px var(--qrs-border); font-weight: 600; }
.qrs-settings-content { min-width: 0; padding: 30px clamp(22px, 4%, 42px) 40px; background: var(--dsw-alias-bg-base); }
.qrs-settings-content section { gap: 18px; }
.qrs-settings-intro { margin-bottom: 7px; }
.qrs-settings-intro h2 { margin: 0 0 4px; font-size: 24px; font-weight: 650; letter-spacing: -.035em; }
.qrs-settings-intro p { margin: 0; color: var(--qrs-muted); font-size: 13px; }
.qrs-settings-card { padding: 20px; border: 1px solid var(--qrs-border); border-radius: 12px; background: var(--dsw-alias-bg-base); }
.qrs-settings-card-head { margin-bottom: 18px; }
.qrs-settings-content .qrs-settings-card h3 { margin: 0; font-size: 14px; font-weight: 620; letter-spacing: -.01em; }
.qrs-settings-card-head p, .qrs-settings-hint { margin: 4px 0 0; color: var(--qrs-muted); font-size: 12px; line-height: 1.6; }
.qrs-settings-reading-card .qrs-reading-settings-fields { max-width: none; gap: 0; }
.qrs-settings-reading-card .qrs-reading-setting { display: grid; grid-template-columns: 110px minmax(0,1fr) 58px; align-items: center; gap: 10px; min-height: 56px; padding: 10px 0; border-bottom: 1px solid var(--qrs-border); font-size: 12px; }
.qrs-settings-reading-card .qrs-reading-setting > span:first-child { color: var(--qrs-muted); }
.qrs-settings-reading-card .qrs-reading-setting select { grid-column: 2 / 4; height: 34px; max-width: 300px; padding: 0 10px; border: 1px solid var(--qrs-border); border-radius: 7px; background: var(--qrs-bg); color: var(--qrs-fg); font: inherit; }
.qrs-settings-reading-card .qrs-reading-setting output { grid-column: 3; grid-row: 1; text-align: right; font-size: 11px; color: var(--qrs-muted); }
.qrs-settings-reading-card .qrs-reading-setting input[type=range] { grid-column: 2; grid-row: 1; accent-color: var(--qrs-fg); }
.qrs-settings-reading-card .qrs-reading-setting-check { border: 0; }
.qrs-settings-reading-card .qrs-reading-reset { margin-top: 13px; padding: 5px 0; border: 0; background: none; color: var(--qrs-muted); font-size: 12px; cursor: pointer; }
.qrs-settings-reading-card .qrs-reading-reset:hover { color: var(--qrs-fg); }
.qrs-segmented { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--qrs-border); border-radius: 8px; background: var(--qrs-bg-2); width: max-content; max-width: 100%; }
.qrs-segmented button, .qrs-settings-content .qrs-segmented button { min-width: 37px; height: 28px; padding: 0 10px; border: 0; border-radius: 5px; background: transparent; color: var(--qrs-muted); font: inherit; font-size: 11px; cursor: pointer; white-space: nowrap; }
.qrs-segmented button[aria-pressed=true], .qrs-settings-content .qrs-segmented button[aria-pressed=true] { background: var(--dsw-alias-bg-base); color: var(--qrs-fg); box-shadow: 0 1px 3px rgba(0,0,0,.08); font-weight: 600; }
.qrs-settings-reading-card .qrs-segmented { grid-column: 2 / 4; }
.qrs-settings-reading-card .qrs-theme-setting { display: block; padding: 18px 0; }
.qrs-settings-reading-card .qrs-theme-setting > span { display: block; margin-bottom: 12px; }
.qrs-theme-options { display: grid; grid-template-columns: repeat(7,minmax(0,1fr)); gap: 8px; }
.qrs-theme-options button { display: flex; flex-direction: column; align-items: stretch; gap: 6px; min-width: 0; padding: 5px; border: 1px solid var(--qrs-border); border-radius: 8px; background: transparent; color: var(--qrs-muted); font: inherit; font-size: 10px; text-align: center; cursor: pointer; }
.qrs-theme-options button[aria-pressed=true] { border-color: var(--qrs-fg); color: var(--qrs-fg); }
.qrs-theme-swatch { display: grid; place-items: center; height: 44px; border-radius: 5px; font-family: Georgia,serif; font-size: 15px; }
.qrs-theme-swatch-auto { background: var(--dsw-alias-bg-layer-2); color: var(--qrs-fg); }
.qrs-switch { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
.qrs-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.qrs-switch span { display: block; width: 34px; height: 20px; border-radius: 999px; background: var(--qrs-border-strong); transition: background .15s; }
.qrs-switch span::after { content: ''; display: block; width: 16px; height: 16px; margin: 2px; border-radius: 50%; background: white; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform .15s; }
.qrs-switch input:checked + span { background: var(--qrs-fg); }
.qrs-switch input:checked + span::after { transform: translateX(14px); }
.qrs-switch input:focus-visible + span { outline: 1px solid var(--qrs-accent); outline-offset: 2px; }
.qrs-settings-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.qrs-settings-toggle-row p { margin: 4px 0 0; color: var(--qrs-muted); font-size: 12px; }
.qrs-settings-url { display: grid; grid-template-columns: 90px minmax(0,1fr); align-items: center; gap: 10px; color: var(--qrs-muted); font-size: 12px; }
.qrs-settings-url input { height: 38px; min-width: 0; padding: 0 11px; border: 1px solid var(--qrs-border); border-radius: 7px; background: var(--qrs-bg); color: var(--qrs-fg); font: inherit; font-size: 12px; }
.qrs-settings-url input:focus { outline: 1px solid var(--qrs-accent); }
.qrs-settings-source-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.qrs-settings-source-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.qrs-settings-source-actions button { display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 9px; border: 1px solid var(--qrs-border); border-radius: 7px; background: transparent; color: var(--qrs-fg); font: inherit; font-size: 11px; cursor: pointer; }
.qrs-settings-source-actions button:hover { background: var(--qrs-hover); }
.qrs-settings-import { padding: 15px; margin-bottom: 14px; border: 1px solid var(--qrs-border); border-radius: 9px; background: var(--qrs-bg-2); }
.qrs-settings-content .qrs-opml-import { display: grid; gap: 9px; border: 0; padding: 0; }
.qrs-opml-import legend { padding: 0 0 8px; font-size: 12px; font-weight: 600; }
.qrs-opml-import input, .qrs-opml-import textarea { width: 100%; min-width: 0; padding: 8px 10px; border: 1px solid var(--qrs-border); border-radius: 7px; background: var(--qrs-bg); color: var(--qrs-fg); font: inherit; font-size: 12px; }
.qrs-opml-import input[type=file] { border-style: dashed; }
.qrs-opml-import .qmrss-btn { width: max-content; }
.qrs-opml-results { max-height: 200px; overflow: auto; }
.qrs-opml-results label { display: block; padding: 5px; font-size: 12px; }
.qrs-settings-about-brand { display: flex; gap: 14px; align-items: center; }
.qrs-settings-about-brand > span { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: var(--qrs-fg); color: var(--qrs-bg); font-size: 21px; font-family: Georgia,serif; }
.qrs-settings-about-brand p, .qrs-settings-about-card > p { margin: 4px 0 0; font-size: 12px; color: var(--qrs-muted); }
.qrs-settings-links { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }
.qrs-settings-links a { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 11px; border: 1px solid var(--qrs-border); border-radius: 8px; color: var(--qrs-fg); font-size: 12px; text-decoration: none; }
.qrs-settings-links a:hover { background: var(--qrs-hover); text-decoration: none; }
.qrs-settings-support { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin: 0; }
.qrs-settings-support > div { min-width: 0; }
.qrs-settings-support p { margin: 4px 0 15px; color: var(--qrs-muted); font-size: 12px; }
.qrs-settings-support img { width: 140px; height: 140px; border: 1px solid var(--qrs-border); border-radius: 8px; background: white; }
.qrs-settings-footer { flex: none; min-height: 62px; padding: 12px 23px; background: var(--dsw-alias-bg-base); }
.qrs-settings-footer button { min-width: 86px; height: 34px; background: var(--qrs-fg); color: var(--qrs-bg); font-size: 12px; }

/* Manage feeds as a searchable list, with actions only where they are useful. */
.qrs-subscriptions { display: block !important; }
.qrs-subscriptions-toolbar { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
.qrs-subscriptions-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; height: 42px; padding: 0 12px; border: 1px solid var(--qrs-border); border-radius: 8px; color: var(--qrs-muted); }
.qrs-subscriptions-search:focus-within { border-color: color-mix(in srgb, var(--qrs-fg) 34%, var(--qrs-border)); }
.qrs-subscriptions-search input { min-width: 0; flex: 1; height: 100%; border: 0; outline: 0; background: transparent; color: var(--qrs-fg); font: inherit; font-size: 12px; }
.qrs-root .qrs-settings-page .qrs-subscriptions-search input:focus-visible { outline: none; box-shadow: none; border: 0; }
.qrs-subscriptions-selection { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 4px; color: var(--qrs-muted); font-size: 11px; }
.qrs-subscriptions-selection button { border: 0; background: transparent; color: var(--qrs-muted); padding: 3px 0; font: inherit; cursor: pointer; }
.qrs-subscriptions-selection button:hover { color: var(--qrs-fg); }
.qrs-subscriptions-list { max-height: 310px; overflow-y: auto; }
.qrs-subscription-row { display: flex; align-items: center; gap: 10px; min-height: 64px; padding: 8px 2px; border-bottom: 1px solid var(--qrs-border); }
.qrs-subscription-row input[type=checkbox] { accent-color: var(--qrs-fg); }
.qrs-subscription-avatar { flex: 0 0 31px; width: 31px; height: 31px; display: grid; place-items: center; border-radius: 8px; background: var(--qrs-bg-2); font-size: 13px; font-weight: 600; }
.qrs-subscription-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.qrs-subscription-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; }
.qrs-subscription-copy > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--qrs-muted); font-size: 11px; }
.qrs-subscription-copy small { color: var(--dsw-alias-state-error-primary); font-size: 11px; }
.qrs-subscription-actions { display: flex; gap: 2px; }
.qrs-subscription-actions button, .qrs-subscription-editor > div:first-child button { display: grid; place-items: center; width: 29px; height: 29px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--qrs-muted); cursor: pointer; }
.qrs-subscription-actions button:hover, .qrs-subscription-editor > div:first-child button:hover { background: var(--qrs-hover); color: var(--qrs-fg); }
.qrs-subscriptions-empty { padding: 36px 8px; color: var(--qrs-muted); text-align: center; font-size: 12px; }
.qrs-subscriptions-batch { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px; margin: 8px 0; border: 1px solid var(--qrs-border); border-radius: 8px; background: var(--qrs-bg-2); }
.qrs-subscriptions-batch strong { margin-right: 4px; font-size: 11px; }
.qrs-subscriptions-batch label { display: flex; align-items: center; gap: 5px; min-width: 150px; flex: 1; padding: 0 7px; border: 1px solid var(--qrs-border); border-radius: 6px; background: var(--qrs-bg); }
.qrs-subscriptions-batch input { width: 100%; height: 28px; border: 0; outline: 0; background: transparent; color: var(--qrs-fg); font-size: 11px; }
.qrs-subscriptions-batch button, .qrs-subscriptions-confirm button, .qrs-subscription-editor-actions button { display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 8px; border: 1px solid var(--qrs-border); border-radius: 6px; background: var(--qrs-bg); color: var(--qrs-fg); font: inherit; font-size: 11px; cursor: pointer; }
.qrs-subscriptions-batch button.danger, .qrs-subscriptions-confirm button.danger { color: var(--dsw-alias-state-error-primary); }
.qrs-subscriptions-batch button.icon { width: 28px; justify-content: center; padding: 0; }
.qrs-subscriptions-confirm { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px; border: 1px solid var(--qrs-border); border-radius: 7px; font-size: 11px; }
.qrs-subscription-editor-backdrop { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 20px; background: rgba(0,0,0,.35); }
.qrs-subscription-editor { display: grid; gap: 16px; width: min(430px, 100%); max-height: min(600px,90vh); overflow: auto; padding: 22px; border: 1px solid var(--qrs-border); border-radius: 13px; background: var(--dsw-alias-bg-base); box-shadow: 0 18px 54px rgba(0,0,0,.17); color: var(--qrs-fg); }
.qrs-subscription-editor > div:first-child { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.qrs-subscription-editor label { display: grid; gap: 4px; color: var(--qrs-muted); font-size: 11px; }
.qrs-subscription-editor input, .qrs-subscription-editor textarea { width: 100%; min-height: 42px; padding: 10px 12px; border: 1px solid var(--qrs-border); border-radius: 8px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; }
.qrs-root .qrs-subscription-editor :is(input,textarea):focus-visible { outline: 0; box-shadow: none; border-color: var(--dsw-alias-label-secondary); }
.qrs-subscription-editor textarea { resize: vertical; line-height: 1.5; }
.qrs-subscription-editor p { margin: 0; color: var(--qrs-muted); font-size: 12px; line-height: 1.5; }
.qrs-subscription-editor-actions { display: flex; justify-content: flex-end; gap: 6px; }
.qrs-subscription-editor-actions button:last-child { background: var(--qrs-fg); color: var(--qrs-bg); }
.qrs-subscription-editor-actions button { min-height: 36px; padding: 0 13px; }
.qrs-group-manager { margin-top: 20px; }
.qrs-group-heading { display: flex; justify-content: space-between; padding: 0 2px 8px; font-size: 12px; }
.qrs-group-heading span, .qrs-group-row small { color: var(--qrs-muted); font-size: 11px; }
.qrs-group-row { display: flex; align-items: center; gap: 9px; min-height: 40px; border-top: 1px solid var(--qrs-border); color: var(--qrs-fg); font-size: 12px; }
.qrs-group-row span { flex: 1; }
.qrs-group-row button, .qrs-prompt-row button { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 7px; background: transparent; color: var(--qrs-muted); cursor: pointer; }
.qrs-group-row button:hover, .qrs-prompt-row button:hover { background: var(--qrs-hover); color: var(--qrs-fg); }
.qrs-prompt-add { display: inline-flex; align-items: center; gap: 5px; height: 36px; padding: 0 12px; border: 1px solid var(--qrs-border); border-radius: 8px; background: transparent; color: var(--qrs-fg); font: inherit; font-size: 12px; cursor: pointer; }
.qrs-prompt-add:hover { background: var(--qrs-hover); }
.qrs-prompt-row { display: flex; align-items: center; gap: 3px; min-height: 58px; border-top: 1px solid var(--qrs-border); }
.qrs-prompt-row > div { display: grid; gap: 4px; flex: 1; min-width: 0; }
.qrs-prompt-row strong { font-size: 12px; }
.qrs-prompt-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--qrs-muted); font-size: 11px; }

@container (max-width: 820px) {
  .qrs-workarea.has-companion { flex-direction: column; }
  .qrs-workarea.has-companion > .qrs-layout { flex: 1; min-height: 220px; grid-template-columns: min(var(--qrs-list-width), 38%) 1px minmax(0,1fr); }
  .qrs-workarea.has-companion .qrs-companion-divider { flex: 0 0 8px; width: 100%; cursor: row-resize; }
  .qrs-workarea.has-companion .qrs-companion-divider::after { top: calc(50% - .5px); bottom: auto; left: 0; right: 0; width: 100%; height: 1px; }
  .qrs-workarea.has-companion .qrs-companion-divider:hover::after,
  .qrs-workarea.has-companion .qrs-companion-divider:focus-visible::after,
  .qrs-workarea.has-companion .qrs-companion-divider[data-dragging=true]::after { width: 100%; height: 2px; }
  .qrs-workarea.has-companion .qrs-companion { width: 100%; flex: 0 0 var(--qrs-companion-width,44%); min-height: 170px; }
  .qrs-settings-page { width: min(900px,100%); }
}
@container (max-width: 700px) {
  .qrs-settings-body { grid-template-columns: 1fr; grid-template-rows: auto minmax(0,1fr); }
  .qrs-settings-tabs { flex-direction: row; gap: 4px; padding: 8px 12px; border-right: 0; border-bottom: 1px solid var(--qrs-border); overflow-x: auto; }
  .qrs-settings-nav-caption { display: none; }
  .qrs-settings-tabs button { white-space: nowrap; padding: 8px; }
  .qrs-settings-content { padding: 22px; }
  .qrs-theme-options { grid-template-columns: repeat(4,minmax(0,1fr)); }
}
@container (max-width: 460px) {
  .qrs-workarea.has-companion > .qrs-layout { grid-template-columns: minmax(0,1fr); }
  .qrs-workarea.has-companion > .qrs-layout > .qrs-sidebar, .qrs-workarea.has-companion > .qrs-layout > .qrs-resize { display: none; }
  .qrs-settings-page { border-radius: 0; height: 100%; }
  .qrs-settings-head { padding: 14px 16px; }
  .qrs-settings-content { padding: 18px 16px; }
  .qrs-settings-reading-card .qrs-reading-setting { grid-template-columns: 80px minmax(0,1fr) 48px; }
  .qrs-settings-source-head, .qrs-subscriptions-toolbar { flex-direction: column; align-items: stretch; }
  .qrs-settings-source-actions { justify-content: flex-start; }
  .qrs-settings-support { grid-template-columns: 1fr; }
}
`;

// src/client/ReaderPage.jsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var PANEL_CSS = `
.qrs-root{--qrs-bg:var(--dsw-alias-bg-base);--qrs-bg-2:var(--dsw-alias-bg-layer-1);--qrs-fg:var(--dsw-alias-label-primary);--qrs-muted:var(--dsw-alias-label-secondary);--qrs-faint:var(--dsw-alias-label-secondary);--qrs-border:var(--dsw-alias-border-l1);--qrs-border-strong:var(--dsw-alias-border-l2);--qrs-hover:var(--dsw-alias-bg-overlay);--qrs-accent:var(--dsw-alias-brand-primary);--qrs-font-size:19px;--qrs-line-height:1.9;--qrs-article-width:804px;--qrs-list-width:300px;display:flex;flex-direction:column;height:100%;min-width:0;padding:0;color:var(--qrs-fg);background:var(--qrs-bg);outline:none;container-type:inline-size}
.qrs-root{min-height:0;overflow:hidden}.qrs-root button,.qrs-root input,.qrs-root select,.qrs-root textarea{-webkit-app-region:no-drag}.qrs-root :focus-visible{outline:1px solid var(--qrs-accent);outline-offset:2px}.qrs-root *{box-sizing:border-box}
.qrs-workarea{display:flex;flex:1;min-height:0;min-width:0}.qrs-workarea>.qrs-layout{min-width:0}.qrs-workarea.has-companion>.qrs-layout{grid-template-columns:minmax(0,1fr)}.qrs-workarea.has-companion>.qrs-layout>.qrs-sidebar,.qrs-workarea.has-companion>.qrs-layout>.qrs-resize{display:none}.qrs-workarea.has-companion .qrs-reader{display:block}.qrs-companion-divider{flex:0 0 6px;cursor:col-resize;touch-action:none;background:var(--qrs-border);z-index:4}.qrs-companion-divider:hover,.qrs-companion-divider:focus-visible,.qrs-companion-divider[data-dragging=true]{background:var(--qrs-accent)}.qrs-companion{width:var(--qrs-companion-width,44%);flex:0 0 var(--qrs-companion-width,44%);min-width:0;max-width:none;display:flex;flex-direction:column;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}.qrs-companion-header{display:flex;align-items:center;gap:8px;padding:8px 12px;flex-shrink:0}.qrs-companion-header strong{flex:1}.qrs-companion-context{padding:8px 12px;border-bottom:1px solid var(--qrs-border);font-size:12px;flex-shrink:0}.qrs-companion-context strong,.qrs-companion-context small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qrs-companion-context blockquote{max-height:70px;overflow:auto;margin:6px 0;white-space:pre-wrap}.qrs-companion-loading,.qrs-companion-error{padding:16px;font-size:13px;color:var(--dsw-alias-label-secondary)}.qrs-companion-error{color:var(--dsw-alias-state-error-primary)}.qrs-companion-error button{margin-left:8px}.qrs-native-chat{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}.qrs-native-chat>[data-conversation-content]{flex:1;min-height:0}@container (max-width:700px){.qrs-workarea.has-companion{flex-direction:column}.qrs-workarea.has-companion>.qrs-layout{flex:1;min-height:180px}.qrs-companion-divider{flex-basis:6px;width:100%;cursor:row-resize}.qrs-companion{width:100%;flex:0 0 var(--qrs-companion-width,50%);min-width:0;max-width:none;min-height:180px}}

.qrs-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.qrs-layout{flex:1;min-height:0;display:grid;grid-template-columns:min(var(--qrs-list-width),calc(100cqw - 330px)) 1px minmax(0,1fr)}
.qrs-sidebar{min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--qrs-bg-2)}
.qrs-sidebar-toolbar{display:flex;align-items:center;gap:2px;height:44px;flex-shrink:0;padding:5px 8px 5px 12px}
.qrs-root .qrs-channel{min-width:0;flex:1;display:flex;align-items:center;justify-content:flex-start;gap:7px;padding:4px 0;height:32px;border:0;background:transparent;color:var(--qrs-fg);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.qrs-root .qrs-channel:hover{color:var(--qrs-accent)}
.qrs-channel-label{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.qrs-channel-label + svg{flex:0 0 auto;color:var(--qrs-muted)}
.qrs-filters{display:flex;gap:4px;align-items:center;padding:0 12px 8px}
.qrs-root .qrs-filters button{height:26px;padding:2px 10px;font:inherit;font-size:11px;color:var(--qrs-muted);background:transparent;border:0;border-radius:5px;cursor:pointer}
.qrs-root .qrs-filters button[aria-pressed=true]{background:var(--qrs-hover);color:var(--qrs-fg)}
.qrs-filters .qrs-settings-button{margin-left:auto;width:26px;height:26px;padding:4px;display:inline-flex;align-items:center;justify-content:center}
.qrs-search-box{padding:0 12px 10px}
.qrs-search-box input{width:100%;height:30px;font:inherit;font-size:12px;color:var(--qrs-fg);background:var(--qrs-bg);border:.5px solid var(--qrs-border-strong);border-radius:6px;padding:0 9px}
.qrs-search-box.is-hidden{display:none}
.qrs-status{padding:8px 12px;font-size:12px;color:var(--qrs-muted);line-height:1.6}
.qrs-status:empty{display:none}
.qrs-status.is-error{color:var(--dsw-alias-state-error-primary)}
.qrs-list{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}
.qrs-root button.qrs-entry{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:12px;align-items:start;width:100%;text-align:left;height:auto;white-space:normal;border:0;border-radius:0;background:transparent;color:var(--qrs-fg);padding:12px 16px 13px 22px;cursor:pointer;font:inherit}
.qrs-root button.qrs-entry:not(:has(.qrs-entry-thumb)){grid-template-columns:minmax(0,1fr)}
.qrs-root button.qrs-entry::after{content:'';position:absolute;bottom:0;left:22px;right:16px;height:1px;background:var(--qrs-border);opacity:.6}
.qrs-root button.qrs-entry:hover{background:var(--qrs-hover)}
.qrs-root button.qrs-entry.qrs-selected{background:var(--qrs-hover);box-shadow:inset 2px 0 0 var(--qrs-accent)}
.qrs-entry-copy{display:contents}
.qrs-entry-meta{grid-column:1 / -1;display:flex;align-items:center;gap:8px;min-width:0;color:var(--qrs-muted);font-size:12px;line-height:16px}
.qrs-source-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1;font-weight:500}
.qrs-date{order:1;margin-left:auto;color:var(--qrs-faint);font-variant-numeric:tabular-nums;white-space:nowrap}
.qrs-entry-title{grid-column:1;min-width:0;display:flex;align-items:baseline;gap:6px;margin-top:5px}
.qrs-unread-dot,.qrs-read-dot{flex-shrink:0;width:6px;height:6px;border-radius:50%;background:var(--qrs-accent);position:absolute;left:9px;margin-top:8px}
.qrs-read-dot{background:transparent}
.qrs-entry h3{margin:0;font-size:15px;font-weight:600;line-height:22px;color:var(--qrs-fg);overflow-wrap:anywhere;flex:1;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.qrs-entry.qrs-no-summary h3{-webkit-line-clamp:3}
.qrs-entry.qrs-read h3{font-weight:400;opacity:.78}
.qrs-entry.qrs-read .qrs-summary{color:var(--qrs-faint)}
.qrs-bookmarked{display:inline-flex;align-items:center;color:var(--qrs-muted)}
.qrs-bookmarked svg{width:12px;height:12px;fill:currentColor}
.qrs-summary{grid-column:1;min-width:0;margin:4px 0 0;color:var(--qrs-muted);font-size:13px;line-height:20px;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.qrs-entry-thumb{grid-column:2;grid-row:2 / span 2;margin-top:7px;width:64px;height:64px;overflow:hidden;border-radius:6px;background:var(--qrs-border)}
.qrs-entry-thumb img{width:100%;height:100%;display:block;object-fit:cover}
.qrs-empty{padding:30px 20px;text-align:center;color:var(--qrs-muted);line-height:1.8;font-size:13px}
.qrs-empty button{margin-top:10px}
.qrs-root .qrs-more{display:block;margin:16px auto 24px;padding:6px 14px;font:inherit;font-size:12px;color:var(--qrs-muted);background:transparent;border:.5px solid var(--qrs-border-strong);border-radius:6px;cursor:pointer}
.qrs-root .qrs-more:hover{background:var(--qrs-hover)}
.qrs-resize{position:relative;background:var(--qrs-border);z-index:4;cursor:col-resize;touch-action:none}
.qrs-resize::after{content:'';position:absolute;left:-4px;top:0;bottom:0;width:9px}
.qrs-resize:hover{background:var(--qrs-border-strong)}
.qrs-reader{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;position:relative;outline:none;background:var(--qrs-bg)}
.qrs-reader-toolbar{display:flex;align-items:center;gap:6px;height:44px;padding:5px 12px;position:sticky;top:0;background:var(--qrs-bg);z-index:3}
.qrs-version-switch{display:inline-flex;align-items:center;gap:3px;height:30px;padding:0 7px;border:1px solid var(--qrs-border);border-radius:999px;background:var(--qrs-bg-2);color:var(--qrs-muted);font-size:12px;white-space:nowrap}.qrs-version-switch span{font-size:11px}.qrs-root .qrs-mode-select{appearance:none;border:0;background:transparent;width:auto;max-width:110px;padding:3px 1px;height:26px;font:inherit;font-size:12px;color:var(--qrs-fg);cursor:pointer;outline:none}.qrs-version-switch:focus-within{outline:1px solid var(--qrs-accent);outline-offset:1px}
.qrs-root .qrs-mode-select:disabled{opacity:.6;cursor:default}
.qrs-reader-nav{display:flex;gap:0;margin-left:10px}
.qrs-actions{display:flex;align-items:center;gap:2px;margin-left:auto;position:relative}
.qrs-root .qrs-icon{display:inline-flex;flex-shrink:0;align-items:center;justify-content:center;width:32px;height:32px;padding:7px;border:0;border-radius:5px;background:transparent;color:var(--qrs-muted);cursor:pointer}
.qrs-root .qrs-icon:hover{color:var(--qrs-fg);background:var(--qrs-hover)}
.qrs-root .qrs-icon svg{width:17px;height:17px}
.qrs-root .qrs-icon.is-active svg{fill:currentColor}
.qrs-root .qrs-icon.is-loading svg{animation:qrs-spin 1.2s linear infinite}
@keyframes qrs-spin{to{transform:rotate(360deg)}}
.qrs-root.qrs-focus .qrs-layout{grid-template-columns:minmax(0,1fr)}
.qrs-root.qrs-focus .qrs-sidebar,.qrs-root.qrs-focus .qrs-resize{display:none}
.qrs-article{max-width:var(--qrs-article-width);margin:0 auto;padding:30px clamp(24px,5%,60px) 90px}
.qrs-article-head{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-bottom:14px;color:var(--qrs-muted);font-size:12px;line-height:1.6}
.qrs-article-head .qrs-mode-chip{padding:1px 7px;border:.5px solid var(--qrs-border-strong);border-radius:999px;font-size:11px}
.qrs-article h1{font-size:clamp(24px,2.5cqw,32px);line-height:1.5;letter-spacing:-.025em;margin:0 0 26px;overflow-wrap:anywhere;font-weight:600;text-wrap:balance;font-family:var(--qrs-font-family)}
.qrs-article h1 a{color:inherit;text-decoration:none}
.qrs-article h1 a:hover{text-decoration:underline;text-underline-offset:.15em}
.qrs-prose{font-family:var(--qrs-font-family);font-size:var(--qrs-font-size);line-height:var(--qrs-line-height);overflow-wrap:anywhere;-webkit-user-select:text;user-select:text}
.qrs-prose p{margin:1.1em 0}
.qrs-prose h2{margin:1.8em 0 .7em;font-size:1.3em;line-height:1.6}
.qrs-prose h3{margin:1.6em 0 .6em;font-size:1.12em}
.qrs-prose img{display:block;max-width:100%;height:auto;border-radius:6px;margin:1.2em 0}
.qrs-prose pre{overflow:auto;padding:16px;border-radius:6px;background:var(--qrs-bg-2);font-size:13px;line-height:1.6}
.qrs-prose pre,.qrs-prose code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.qrs-prose blockquote{margin:1.4em 0;padding:16px 20px;border:0;background:var(--qrs-bg-2);border-radius:6px}
.qrs-prose table{display:block;overflow:auto;border-collapse:collapse;max-width:100%}
.qrs-prose td,.qrs-prose th{border:1px solid var(--qrs-border);padding:8px}
.qrs-prose a{color:var(--qrs-accent);text-underline-offset:3px}
.qrs-root[data-images=false] .qrs-prose img{display:none}
.qrs-video-frame{display:block;width:100%;aspect-ratio:16/9;min-height:200px;margin:0 0 26px;border:0;border-radius:8px;background:#000}
.qrs-missing{margin-top:24px;padding:22px;border:1px dashed var(--qrs-border-strong);border-radius:10px;text-align:center;color:var(--qrs-muted);font-size:13px;line-height:1.8}
.qrs-welcome{width:min(100%,440px);margin:clamp(48px,14vh,160px) auto 48px;padding:0 28px;text-align:left}
.qrs-welcome-brand{font-size:10px;font-weight:600;letter-spacing:.2em;color:var(--qrs-faint);margin-bottom:28px}
.qrs-welcome h2{font-family:var(--qrs-font-family);font-size:clamp(25px,3vw,34px);font-weight:400;letter-spacing:.02em;line-height:1.5;margin:0 0 12px;color:var(--qrs-fg)}
.qrs-welcome-intro{font-size:13px;line-height:1.8;color:var(--qrs-muted);margin:0}
.qrs-welcome-keys{display:flex;flex-wrap:wrap;gap:18px;margin-top:44px;color:var(--qrs-faint);font-size:10px}
.qrs-welcome-keys > span{display:flex;align-items:center;gap:5px}
.qrs-welcome-keys kbd{font:inherit;font-size:10px}
.qrs-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);border-radius:10px;padding:8px 16px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.18);z-index:60}
.qrs-toast.is-error{color:var(--dsw-alias-state-error-primary)}
.qrs-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;z-index:50}
.qrs-menu{position:absolute;top:36px;right:0;min-width:210px;padding:5px;background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.22);z-index:20;display:flex;flex-direction:column}
.qrs-menu button{display:flex;align-items:center;gap:9px;padding:7px 10px;font:inherit;font-size:13px;text-align:left;color:var(--qrs-fg);background:transparent;border:0;border-radius:6px;cursor:pointer}
.qrs-menu button:hover{background:var(--qrs-hover)}
.qrs-menu hr{margin:5px 4px;border:0;border-top:.5px solid var(--qrs-border)}
.qrs-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:55}
.qrs-modal{width:min(480px,92vw);max-height:86vh;display:flex;flex-direction:column;gap:10px;padding:18px;background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l2);border-radius:14px;color:var(--dsw-alias-label-primary);overflow:auto}
.qrs-modal.is-wide{width:min(620px,94vw)}
.qrs-modal h2{margin:0;font-size:15px}
.qrs-modal input[type=text],.qrs-modal input[type=url],.qrs-modal input:not([type]),.qrs-modal select,.qrs-modal textarea{width:100%;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:7px 10px}
.qrs-modal-head{display:flex;align-items:center;justify-content:space-between}
.qrs-modal-body{display:flex;flex-direction:column;gap:10px}
.qrs-modal-actions{display:flex;justify-content:flex-end;gap:8px}
.qrs-modal-actions button,.qrs-modal-row button,.qrs-modal-body button{padding:6px 12px;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer}
.qrs-modal-row{display:flex;gap:8px;flex-wrap:wrap}
.qrs-modal-note{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.qrs-settings-backdrop{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.32)}
.qrs-settings-page{width:min(820px,100%);height:min(780px,100%);min-height:0;display:flex;flex-direction:column;border:1px solid var(--qrs-border);border-radius:14px;background:var(--dsw-alias-bg-overlay);color:var(--qrs-fg);box-shadow:0 18px 48px rgba(0,0,0,.2);overflow:hidden}
.qrs-settings-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px}.qrs-settings-head>div{display:flex;align-items:baseline;gap:9px}.qrs-settings-head strong{font-size:18px}.qrs-settings-head span{font-size:12px;color:var(--qrs-muted)}
.qrs-settings-tabs{display:flex;gap:4px;padding:0 16px 10px;border-bottom:1px solid var(--qrs-border)}.qrs-settings-tabs button{border:0;border-radius:7px;background:transparent;color:var(--qrs-muted);padding:7px 14px;font:inherit;cursor:pointer}.qrs-settings-tabs button[aria-current=page]{background:var(--qrs-bg-2);color:var(--qrs-fg);font-weight:600}
.qrs-settings-content{flex:1;min-height:0;overflow:auto;padding:18px 22px}.qrs-settings-content section{display:flex;flex-direction:column;gap:14px}.qrs-settings-content h3{font-size:14px;margin:8px 0 0}.qrs-settings-content p{line-height:1.6}.qrs-settings-content .qrs-reading-settings-fields{max-width:500px}.qrs-settings-content .qrs-reading-setting{grid-template-columns:110px minmax(0,1fr) 54px}.qrs-settings-content .qrs-reading-reset{max-width:500px;margin-top:0}.qrs-settings-content .qrs-field{max-width:560px}.qrs-settings-content .qrs-field input[type=url]{width:100%;padding:8px 10px;border:1px solid var(--qrs-border);border-radius:7px;background:var(--qrs-bg);color:var(--qrs-fg);font:inherit}.qrs-settings-ai{margin-top:8px}
.qrs-settings-content .qrs-modal-row button{border:1px solid var(--qrs-border);border-radius:7px;background:var(--qrs-bg-2);color:var(--qrs-fg);padding:6px 10px;font:inherit;cursor:pointer}.qrs-settings-content .qrs-modal-row{display:flex;gap:8px}
.qrs-settings-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:55px;padding:10px 20px;border-top:1px solid var(--qrs-border);font-size:12px;color:var(--qrs-muted)}.qrs-settings-footer button{border:0;border-radius:7px;background:var(--qrs-accent);color:white;padding:7px 14px;font:inherit;cursor:pointer}.qrs-settings-footer button:disabled{opacity:.5;cursor:default}
@container (max-width:560px){.qrs-settings-backdrop{padding:0}.qrs-settings-page{width:100%;height:100%;border-radius:0}.qrs-settings-content{padding:16px}.qrs-settings-content .qrs-reading-setting{grid-template-columns:80px minmax(0,1fr) 50px}}
.qrs-field{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.qrs-field-check{flex-direction:row;align-items:center;gap:8px}
.qrs-reading-settings{position:absolute;z-index:5;top:100%;right:12px;max-height:calc(100vh - 180px);overflow:auto;width:300px;max-width:calc(100vw - 32px);padding:14px;border:.5px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 10px 30px rgba(0,0,0,.22)}
.qrs-reading-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.qrs-reading-settings-head strong{font-size:14px}
.qrs-reading-settings-head button{padding:4px 10px;font:inherit;font-size:12px;background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;color:inherit;cursor:pointer}
.qrs-reading-settings-fields{display:grid;gap:12px}
.qrs-reading-setting{display:grid;grid-template-columns:72px minmax(0,1fr) 54px;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px}
.qrs-reading-setting select,.qrs-reading-setting input{grid-column:2/-1;min-width:0;font:inherit;font-size:12px;color:inherit;background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;padding:5px 8px}
.qrs-reading-setting select{width:100%;height:32px;appearance:auto}.qrs-reading-setting output{white-space:nowrap;grid-column:3;grid-row:1;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.qrs-reading-setting input[type=range]{grid-row:2;padding:0;border:0;background:transparent}
.qrs-reading-setting-check{grid-template-columns:84px auto}
.qrs-reading-setting-check input{grid-column:2;justify-self:start}
.qrs-reading-reset{width:100%;margin-top:14px;padding:6px;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;cursor:pointer}
.qrs-channel-backdrop{position:fixed;inset:0;z-index:58;background:rgba(0,0,0,.28);display:flex;align-items:flex-start;justify-content:center;padding-top:12vh}
.qrs-channel-picker{width:min(430px,92vw);max-height:520px;display:flex;flex-direction:column;padding:8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 14px 40px rgba(0,0,0,.28);overflow:hidden}
.qrs-channel-top{display:flex;gap:6px;align-items:center;margin-bottom:8px}
.qrs-channel-top input[type=search]{flex:1;height:36px;font:inherit;font-size:13px;color:inherit;background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 10px}
.qrs-channel-manage{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 10px;font:inherit;font-size:12px;color:inherit;background:transparent;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;white-space:nowrap}
.qrs-channel-options{overflow-y:auto;overscroll-behavior:contain;min-height:0}
.qrs-channel-section{padding:14px 10px 5px;color:var(--dsw-alias-label-secondary);font-size:11px}
.qrs-channel-option-wrap{display:flex;align-items:center;border-radius:6px}
.qrs-channel-option{display:flex;align-items:center;gap:9px;min-width:0;flex:1;padding:7px 10px;min-height:36px;text-align:left;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer}
.qrs-channel-option:hover{background:var(--dsw-alias-bg-layer-2)}
.qrs-channel-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.qrs-channel-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
.qrs-channel-subtitle{color:var(--dsw-alias-label-secondary);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qrs-channel-check{display:flex;flex-shrink:0;color:var(--dsw-alias-brand-primary)}
.qrs-channel-empty{padding:22px 12px;color:var(--dsw-alias-label-secondary);text-align:center;font-size:13px}
.qrs-channel-close{align-self:flex-end;margin-top:6px;padding:5px 12px;font:inherit;font-size:12px;color:inherit;background:transparent;border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;cursor:pointer}
.qmrss-btn{font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;text-decoration:none}
.qmrss-btn:hover{background:var(--dsw-alias-bg-overlay)}
.qmrss-btn:disabled{opacity:.5;cursor:default}
.qmrss-row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.qmrss-empty{padding:14px 6px;color:var(--dsw-alias-label-secondary);text-align:center;font-size:13px;line-height:1.7}
.qmrss-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:57}
.qmrss-dialog{background:var(--dsw-alias-bg-overlay);border:.5px solid var(--dsw-alias-border-l2);border-radius:14px;padding:18px;width:min(480px,92vw);max-height:86vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;color:var(--dsw-alias-label-primary)}
.qmrss-dialog h3{margin:0;font-size:15px}
.qmrss-dialog input,.qmrss-dialog select,.qmrss-dialog textarea{width:100%;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:7px 10px}
.qmrss-dialog fieldset{border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px;display:grid;gap:8px}
.qmrss-dialog.qrs-discover{width:min(720px,calc(100vw - 32px));height:min(740px,calc(100vh - 56px));max-height:none;padding:0;gap:0;overflow:hidden;border-radius:16px;box-shadow:0 18px 56px rgba(0,0,0,.18)}
.qrs-discover-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:23px 26px 16px;flex:none}
.qrs-discover-head h3{font-size:19px;line-height:1.4;font-weight:650}
.qrs-discover-head p{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px}
.qrs-discover-head .qrs-icon{margin:-4px -6px 0 0;flex:none}
.qrs-discover-filters{padding:0 26px 8px;flex:none}
.qrs-discover-search{display:flex;align-items:center;gap:9px;height:40px;padding:0 12px;background:var(--dsw-alias-bg-layer-2);border:1px solid transparent;border-radius:9px;color:var(--dsw-alias-label-secondary)}
.qrs-discover-search:focus-within{border-color:var(--dsw-alias-brand-primary)}
.qrs-discover-search svg{width:16px;height:16px;flex:none}
.qmrss-dialog .qrs-discover-search input{min-width:0;width:100%;height:100%;padding:0;border:0;background:transparent;outline:0;font-size:13px}
.qrs-discover-categories{display:flex;gap:6px;align-items:center;overflow-x:auto;padding:14px 0 10px}
.qrs-discover-categories button{white-space:nowrap;border:0;border-radius:7px;padding:6px 11px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer}
.qrs-discover-categories button:hover{background:var(--dsw-alias-bg-layer-2)}
.qrs-discover-categories button.active{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.qrs-discover-filter-line{height:30px;display:flex;justify-content:space-between;align-items:center;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-size:12px}
.qmrss-dialog .qrs-discover-filter-line select{width:auto;max-width:180px;padding:3px 24px 3px 8px;font-size:12px;border:0;background:transparent;cursor:pointer}
.qrs-discover-filter-line select:disabled{opacity:.45;cursor:default}
.qrs-discover-results{overflow-y:auto;min-height:0;flex:1;padding:0 26px}
.qrs-discover-row{display:flex;align-items:center;gap:12px;min-height:68px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.qrs-discover-avatar{display:grid;place-items:center;width:36px;height:36px;flex:none;border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:15px;font-weight:600}
.qrs-discover-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
.qrs-discover-info strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600}
.qrs-discover-info>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:11px}
.qrs-discover-dot{padding:0 2px}
.qrs-discover-add{display:inline-flex;align-items:center;justify-content:center;gap:4px;flex:none;min-width:72px;height:30px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
.qrs-discover-add:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.qrs-discover-add:disabled{opacity:.5;cursor:default}
.qrs-discover-add svg{width:13px;height:13px}
.qrs-discover-more{display:block;margin:14px auto 18px;padding:6px 14px;border:0;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12px;cursor:pointer}
.qrs-discover-empty{padding:72px 10px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px}
.qrs-discover-foot{flex:none;display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;border-top:.5px solid var(--dsw-alias-border-l1);padding:10px 26px 14px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.5}
.qrs-discover-foot a{color:inherit;text-decoration:underline;text-underline-offset:2px}
.qrs-discover-message{width:100%;padding:4px 0;color:var(--dsw-alias-label-primary);font-size:12px}
@media (max-width:600px){.qmrss-dialog.qrs-discover{height:calc(100vh - 30px)}.qrs-discover-head{padding:18px 18px 13px}.qrs-discover-filters{padding:0 18px 6px}.qrs-discover-results{padding:0 18px}.qrs-discover-foot{padding:10px 18px}.qrs-discover-avatar{width:32px;height:32px}.qrs-discover-row{gap:9px}}
.qmrss-article{font-size:15px;line-height:1.8}
.qmrss-article h1{font-size:20px;margin:.2em 0 .6em}
.qmrss-article p{margin:.7em 0}
.qmrss-article a{color:var(--dsw-alias-brand-primary)}
.qrs-root{position:relative}.qrs-root[data-titlebar=true]{padding-top:40px}.qrs-root[data-titlebar=true]::before{content:"";position:absolute;top:0;left:0;right:0;height:38px;-webkit-app-region:drag}.qrs-reading-settings{flex-shrink:0}.qrs-reading-setting select{color:var(--dsw-alias-label-primary);padding-right:22px}.qrs-reading-setting input[type=range]{width:100%;height:20px}.qrs-reader-toolbar{height:auto;min-height:44px;flex-wrap:wrap}.qrs-reader-nav{margin-left:0}.qrs-mode-select{flex-shrink:0}
@container (max-width:700px){.qrs-layout{grid-template-columns:min(240px,42cqw) 1px minmax(0,1fr)}.qrs-article{padding:20px 18px 70px}.qrs-actions{margin-left:0}.qrs-reading-settings{position:fixed;right:12px;top:70px}.qrs-entry-thumb{width:44px;height:44px}.qrs-root button.qrs-entry{padding:10px 10px 10px 18px}.qrs-reader-toolbar{gap:2px;padding:4px}.qrs-root .qrs-icon{width:28px;height:28px;padding:5px}}
@container (max-width:460px){.qrs-layout{grid-template-columns:minmax(0,1fr)}.qrs-reader{display:none}.qrs-root.qrs-focus .qrs-reader{display:block}.qrs-resize{display:none}}

`;
var VERSION_LABELS = { original: "\u539F\u6587", translation: "\u8BD1\u6587", rewrite: "\u4E54\u6728\u6539\u5199" };
var FALLBACK_READING = { ...READING_DEFAULTS };
var stylesReady = false;
function ensureStyles() {
  if (stylesReady) return;
  stylesReady = true;
  const style = document.createElement("style");
  style.dataset.plugin = "qiaomu-rss-dsh";
  style.textContent = PANEL_CSS + refinements_default;
  document.head.appendChild(style);
}
function ReaderIcon({ size = 18, active = false }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { style: { color: active ? "var(--dsw-alias-brand-primary)" : "inherit", display: "inline-flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "rss", size, strokeWidth: 1.8 }) });
}
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
function ReaderPage({ api, SessionProvider, renderSlot }) {
  const [channels, setChannels] = (0, import_react13.useState)([]);
  const [channel, setChannel] = (0, import_react13.useState)(() => localStorage.getItem("qrs.channel") || "qiaomu");
  const [filter, setFilter] = (0, import_react13.useState)("all");
  const [query, setQuery] = (0, import_react13.useState)("");
  const [searchOpen, setSearchOpen] = (0, import_react13.useState)(false);
  const [page, setPage] = (0, import_react13.useState)({ entries: [], hasMore: false, nextCursor: void 0 });
  const [loading, setLoading] = (0, import_react13.useState)(true);
  const [loadingMore, setLoadingMore] = (0, import_react13.useState)(false);
  const [pageError, setPageError] = (0, import_react13.useState)("");
  const [refreshing, setRefreshing] = (0, import_react13.useState)(false);
  const [selected, setSelected] = (0, import_react13.useState)(void 0);
  const [toast, setToast] = (0, import_react13.useState)(void 0);
  const [dialog, setDialog] = (0, import_react13.useState)(void 0);
  const [settingsEntry, setSettingsEntry] = (0, import_react13.useState)({ tab: "reading", addPrompt: false });
  const [pickerOpen, setPickerOpen] = (0, import_react13.useState)(false);
  const [pickerAnchor, setPickerAnchor] = (0, import_react13.useState)(null);
  (0, import_react13.useEffect)(() => {
    if (dialog) setPickerOpen(false);
  }, [dialog]);
  const openPicker = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(480, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 580));
    setPickerAnchor({ left, top });
    setPickerOpen(true);
  };
  const [appearanceOpen, setAppearanceOpen] = (0, import_react13.useState)(false);
  const [menuOpen, setMenuOpen] = (0, import_react13.useState)(false);
  const [focused, setFocused] = (0, import_react13.useState)(false);
  const [reading, setReading] = (0, import_react13.useState)(FALLBACK_READING);
  const [listWidth, setListWidth] = (0, import_react13.useState)(() => Number(localStorage.getItem("qrs.listWidth")) || 300);
  const [episode, setEpisode] = (0, import_react13.useState)(null);
  const [askContext, setAskContext] = (0, import_react13.useState)(null);
  const activeChannelRef = (0, import_react13.useRef)(channel);
  activeChannelRef.current = channel;
  const automaticRefresh = (0, import_react13.useRef)(/* @__PURE__ */ new Map());
  const [passage, setPassage] = (0, import_react13.useState)(null);
  const selectionSerial = (0, import_react13.useRef)(0);
  const proseRef = (0, import_react13.useRef)();
  const rootRef = (0, import_react13.useRef)();
  const workareaRef = (0, import_react13.useRef)();
  const companionDrag = (0, import_react13.useRef)(false);
  const [companionWidth, setCompanionWidth] = (0, import_react13.useState)(() => {
    const saved = Number(localStorage.getItem("qrs.companionWidth"));
    return Number.isFinite(saved) && saved >= 25 && saved <= 75 ? saved : 44;
  });
  const companionWidthRef = (0, import_react13.useRef)(companionWidth);
  (0, import_react13.useEffect)(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      const r = root.getBoundingClientRect();
      root.dataset.titlebar = String(window.location.protocol === "dsh-app:" && /Mac/.test(navigator.platform) && r.left < 110 && r.top < 45);
    };
    update();
    if (!globalThis.ResizeObserver) return;
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  (0, import_react13.useEffect)(() => {
    const record = selected?.article;
    if (record) localStorage.setItem("qrs.view." + channel, JSON.stringify({ key: record.key, active: selected.active }));
  }, [selected?.article?.key, selected?.active, channel]);
  (0, import_react13.useEffect)(() => {
    setPassage(null);
  }, [selected?.article?.key]);
  (0, import_react13.useEffect)(() => {
    const highlights = globalThis.CSS?.highlights;
    const HighlightType = globalThis.Highlight;
    if (!highlights || !HighlightType) return;
    const range = passage && proseRef.current ? quoteRange(proseRef.current, passage) : null;
    if (range) highlights.set("qrs-reading-selection", new HighlightType(range));
    else highlights.delete("qrs-reading-selection");
    return () => highlights.delete("qrs-reading-selection");
  }, [passage, selected?.article?.key, selected?.active]);
  const toastTimer = (0, import_react13.useRef)();
  const pageRequest = (0, import_react13.useRef)(0);
  const articleRequest = (0, import_react13.useRef)(0);
  const searchInput = (0, import_react13.useRef)();
  const notify = (message, isError = false) => {
    setToast({ message, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(void 0), isError ? 4200 : 2400);
  };
  const run = async (promise, { errorPrefix = "\u64CD\u4F5C\u5931\u8D25" } = {}) => {
    try {
      return await promise;
    } catch (error) {
      notify(`${errorPrefix}\uFF1A${error?.message ?? String(error)}`, true);
      return void 0;
    }
  };
  const applyReading = async (patch) => {
    const next = { ...reading, ...patch };
    setReading(next);
    await run(api.saveSettings(patch), { errorPrefix: "\u4FDD\u5B58\u9605\u8BFB\u8BBE\u7F6E\u5931\u8D25" });
  };
  (0, import_react13.useEffect)(() => {
    void api.getSettings().then((result) => setReading({ ...FALLBACK_READING, ...result.settings })).catch(() => {
    });
    const reload = () => {
      void api.getSettings().then((result) => setReading({ ...FALLBACK_READING, ...result.settings })).catch(() => {
      });
    };
    window.addEventListener("qrs-settings-changed", reload);
    return () => window.removeEventListener("qrs-settings-changed", reload);
  }, [api]);
  const loadChannels = async () => {
    const data = await run(api.listChannels(), { errorPrefix: "\u8BFB\u53D6\u9891\u9053\u5931\u8D25" });
    if (data) setChannels(data.channels);
    return data?.channels ?? [];
  };
  const loadPage = async (cursor, replace = true) => {
    const request = ++pageRequest.current;
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setPageError("");
    try {
      const data = await api.listEntries({ channel, filter, search: query || void 0, cursor });
      if (request !== pageRequest.current) return;
      if (!data || !Array.isArray(data.entries)) throw new Error("\u9605\u8BFB\u670D\u52A1\u8FD4\u56DE\u4E86\u65E0\u6548\u7684\u6587\u7AE0\u5217\u8868");
      setPage((previous) => replace ? data : {
        entries: [...previous.entries, ...data.entries.filter((entry) => !previous.entries.some((seen) => seen.key === entry.key))],
        hasMore: data.hasMore,
        nextCursor: data.nextCursor
      });
    } catch (error) {
      if (request === pageRequest.current) setPageError(error?.message ?? String(error));
    } finally {
      if (request === pageRequest.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };
  (0, import_react13.useEffect)(() => {
    let cancelled = false;
    void (async () => {
      ensureStyles();
      const loaded = await loadChannels();
      if (cancelled) return;
      if (!loaded.some((item) => item.total > 0)) {
        setRefreshing(true);
        await run(api.refresh(void 0), { errorPrefix: "\u9996\u6B21\u5237\u65B0\u5931\u8D25" });
        setRefreshing(false);
        await loadChannels();
        if (!cancelled) await loadPage(void 0, true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  (0, import_react13.useEffect)(() => {
    localStorage.setItem("qrs.channel", channel);
    setPage({ entries: [], hasMore: false, nextCursor: void 0 });
    void loadPage(void 0, true);
  }, [channel, filter, query]);
  (0, import_react13.useEffect)(() => {
    const entry = channels.find((item) => item.key === channel);
    if (!entry || entry.total > 0 && (channel === "all" || channel === "feeds:all")) return;
    const last = automaticRefresh.current.get(channel) ?? 0;
    if (Date.now() - last < (entry.total > 0 ? 15 * 6e4 : 6e4)) return;
    automaticRefresh.current.set(channel, Date.now());
    let cancelled = false;
    setRefreshing(true);
    void api.refresh(channel).then((outcome) => {
      if (cancelled || activeChannelRef.current !== channel) return;
      return Promise.all([loadChannels(), loadPage(void 0, true)]).then(() => {
        if (outcome?.error) setPageError(outcome.error);
      });
    }).catch((error) => {
      if (!cancelled && activeChannelRef.current === channel) setPageError(error?.message ?? String(error));
    }).finally(() => setRefreshing(false));
    return () => {
      cancelled = true;
    };
  }, [channel, channels]);
  const openArticle = async (key, restoreVersion) => {
    const request = ++articleRequest.current;
    setSelected({ loading: true, key });
    setPassage(null);
    if (document.querySelector(".qrs-root")?.clientWidth > 0 && document.querySelector(".qrs-root").clientWidth < 460) setFocused(true);
    const data = await run(api.getArticle(key), { errorPrefix: "\u8BFB\u53D6\u6B63\u6587\u5931\u8D25" });
    if (request !== articleRequest.current) return;
    if (!data) {
      setSelected({ error: true, key });
      return;
    }
    setSelected({ ...data, article: { ...data.article, read: true }, active: resolveReadingVersion(restoreVersion || reading.defaultVersion, data) });
    document.querySelector(".qrs-reader")?.scrollTo?.({ top: 0 });
    if (data.article?.read === false) {
      void api.setRead([key], true).catch((e) => notify(e.message, true));
      setPage((previous) => ({ ...previous, entries: previous.entries.map((entry) => entry.key === key ? { ...entry, read: true } : entry) }));
    }
  };
  (0, import_react13.useEffect)(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qrs.view." + channel) || "null");
      if (saved?.key) void openArticle(saved.key, saved.active);
    } catch {
    }
  }, []);
  const refresh = async (target) => {
    setRefreshing(true);
    const outcome = await run(api.refresh(target), { errorPrefix: "\u5237\u65B0\u5931\u8D25" });
    setRefreshing(false);
    if (outcome) {
      const bits = [];
      if (outcome.qiaomu !== void 0) bits.push(`\u4E54\u6728 ${outcome.qiaomu} \u7BC7`);
      if (outcome.feeds !== void 0) bits.push(`\u8BA2\u9605\u6E90 ${outcome.feeds} \u4E2A`);
      notify(bits.length > 0 ? `\u5DF2\u5237\u65B0\uFF1A${bits.join("\uFF0C")}` : "\u5DF2\u5237\u65B0");
    }
    await Promise.all([loadChannels(), loadPage(void 0, true)]);
  };
  const toggleFavorite = async (key, favorite) => {
    const result = await run(api.setFavorite(key, !favorite), { errorPrefix: "\u6536\u85CF\u5931\u8D25" });
    if (!result) return;
    setPage((previous) => ({ ...previous, entries: previous.entries.map((entry) => entry.key === key ? { ...entry, favorite: !favorite } : entry) }));
    if (selected?.article?.key === key) setSelected((current) => ({ ...current, article: { ...current.article, favorite: !favorite } }));
  };
  const setRead = async (key, read) => {
    const result = await run(api.setRead([key], read), { errorPrefix: "\u6807\u8BB0\u5931\u8D25" });
    if (!result) return;
    setPage((previous) => ({ ...previous, entries: previous.entries.map((entry) => entry.key === key ? { ...entry, read } : entry) }));
    if (selected?.article?.key === key) setSelected((current) => ({ ...current, article: { ...current.article, read } }));
  };
  const generate = async (kind) => {
    const key = selected?.article?.key;
    if (!key) return;
    setSelected((current) => ({ ...current, generating: kind }));
    const version = await run(api.generateVersion(key, kind), { errorPrefix: "\u751F\u6210\u5931\u8D25" });
    setSelected((current) => {
      if (current?.article?.key !== key) return current;
      return { ...current, generating: void 0, ...version ? {
        active: kind,
        versions: { ...current.versions, [kind]: { ...version, available: true } }
      } : {} };
    });
    if (version) notify(version.source === "qiaomu" ? "\u5DF2\u8F7D\u5165\u4E54\u6728\u53D1\u5E03\u7248\u672C" : "\u5DF2\u8F7D\u5165 Harness \u751F\u6210\u7248\u672C");
  };
  const navigate = (direction) => {
    const index = page.entries.findIndex((entry) => entry.key === selected?.article?.key);
    const target = page.entries[index < 0 ? 0 : index + direction];
    if (target) void openArticle(target.key);
  };
  const startDrag = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    let width = listWidth;
    const move = (moveEvent) => {
      width = Math.round(Math.min(Math.max(startX === 0 ? 300 : listWidth + moveEvent.clientX - startX, 220), 520));
      setListWidth(width);
    };
    const up = () => {
      localStorage.setItem("qrs.listWidth", String(width));
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  (0, import_react13.useEffect)(() => {
    const onKey = (event) => {
      if (dialog || pickerOpen || askContext || appearanceOpen || menuOpen || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === "j" || event.key === "k") {
        event.preventDefault();
        navigate(event.key === "j" ? 1 : -1);
      } else if (event.key === "[" || event.key === "f") {
        event.preventDefault();
        setFocused((current) => !current);
      } else if (event.key === "/") {
        event.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInput.current?.focus(), 0);
      } else if (event.key === "Escape") {
        setFocused(false);
        setSearchOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, pickerOpen, askContext, appearanceOpen, menuOpen, page.entries, selected?.article?.key]);
  const activeArticle = selected && !selected.loading ? selected : void 0;
  const versions = activeArticle?.versions;
  const active = activeArticle?.active ?? "original";
  const videoEmbed = youtubeEmbedUrl(activeArticle?.article?.videoUrl || "");
  const currentChannel = channels.find((item) => item.key === channel);
  const mixed = new Set(page.entries.map((entry) => entry.channelKey)).size > 1;
  const bodyHtml = (0, import_react13.useMemo)(() => {
    if (!activeArticle) return "";
    if (active === "original") return activeArticle.html ?? "";
    const markdown = versions?.[active]?.markdown;
    return markdown ? markdownToHtml(markdown) : "";
  }, [activeArticle, active, versions]);
  (0, import_react13.useEffect)(() => {
    if (askContext && activeArticle?.article) setAskContext((previous) => ({ ...previous, key: activeArticle.article.key, title: activeArticle.article.titleZh || activeArticle.article.title, version: active, selection: previous.key === activeArticle.article.key && previous.version === active ? previous.selection : "", quoteId: previous.key === activeArticle.article.key && previous.version === active ? previous.quoteId : void 0 }));
  }, [activeArticle?.article?.key, active]);
  const openCompanion = (quote = "") => {
    if (!activeArticle) return;
    setFocused(false);
    setAskContext({ key: activeArticle.article.key, title: activeArticle.article.titleZh || activeArticle.article.title, version: active, selection: quote, quoteId: quote ? ++selectionSerial.current : void 0 });
  };
  const selectChannel = (key) => {
    if (key === channel) return;
    articleRequest.current++;
    setAskContext(null);
    setFocused(false);
    setSelected(void 0);
    setPassage(null);
    setFilter("all");
    setQuery("");
    setChannel(key);
  };
  const captureSelection = () => {
    const found = selectedPassage(proseRef.current);
    if (found?.quote === passage?.quote) return;
    setPassage(found);
    if (found) openCompanion(found.quote);
  };
  const theme = reading.readingTheme && reading.readingTheme !== "auto" ? reading.readingTheme : null;
  const THEME_COLORS = { light: ["#ffffff", "#202124"], paper: ["#f5efdf", "#40382e"], sage: ["#e8eee3", "#29382c"], mist: ["#e7edf2", "#293741"], dark: ["#252525", "#dedede"], black: ["#090909", "#cccccc"] };
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
    "div",
    {
      ref: rootRef,
      className: `qrs-root${focused ? " qrs-focus" : ""}`,
      tabIndex: 0,
      "data-images": String(reading.showImages !== false),
      "data-reading-theme": theme ?? "auto",
      style: {
        "--qrs-list-width": `${listWidth}px`,
        "--qrs-font-size": `${reading.fontSize}px`,
        "--qrs-line-height": reading.lineHeight,
        "--qrs-article-width": `${reading.fontSize * reading.textWidth + 120}px`,
        "--qrs-font-family": fontStack(reading),
        ...theme ? { "--qrs-bg": THEME_COLORS[theme][0], "--qrs-bg-2": THEME_COLORS[theme][0], "--qrs-fg": THEME_COLORS[theme][1], "--qrs-chat-bg": THEME_COLORS[theme][0], "--qrs-chat-fg": THEME_COLORS[theme][1] } : {}
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { ref: workareaRef, style: { "--qrs-companion-width": `${companionWidth}%` }, className: `qrs-workarea${askContext ? " has-companion" : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-layout", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("aside", { className: "qrs-sidebar", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-sidebar-toolbar", children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", className: "qrs-channel", "aria-haspopup": "dialog", "aria-expanded": pickerOpen, onClick: openPicker, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ChannelMark, { channel: currentChannel ?? { key: "qiaomu", name: "\u4E54\u6728\u7CBE\u9009" }, size: 26 }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-channel-label", children: currentChannel?.name ?? "\u4E54\u6728\u7CBE\u9009" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "chevron-down", size: 13 })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-icon", title: "\u63A2\u7D22\u8BA2\u9605", "aria-label": "\u63A2\u7D22\u8BA2\u9605", onClick: () => setDialog("discover"), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "plus" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-icon", title: "\u641C\u7D22", "aria-label": "\u641C\u7D22", onClick: () => {
                  setSearchOpen((open) => !open);
                  setTimeout(() => searchInput.current?.focus(), 0);
                }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "search" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: `qrs-icon${refreshing ? " is-loading" : ""}`, title: "\u5237\u65B0", "aria-label": "\u5237\u65B0", onClick: () => void refresh(channel), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "refresh-cw" }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-filters", role: "group", children: [
                [["all", "\u5168\u90E8"], ["unread", "\u672A\u8BFB"], ["favorites", "\u6536\u85CF"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", "aria-pressed": filter === value, onClick: () => setFilter(value), children: label }, value)),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-settings-button", title: "\u63D2\u4EF6\u8BBE\u7F6E", "aria-label": "\u63D2\u4EF6\u8BBE\u7F6E", onClick: () => setDialog("settings"), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "settings", size: 17 }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `qrs-search-box${searchOpen ? "" : " is-hidden"}`, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                "input",
                {
                  ref: searchInput,
                  type: "search",
                  "aria-label": "\u641C\u7D22\u6587\u7AE0",
                  placeholder: "\u641C\u7D22\u5DF2\u52A0\u8F7D\u7684\u6587\u7AE0\u2026",
                  value: query,
                  onChange: (event) => setQuery(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === "Escape") {
                      event.stopPropagation();
                      setSearchOpen(false);
                      setQuery("");
                    }
                  }
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `qrs-status${pageError ? " is-error" : ""}`, role: "status", "aria-live": "polite", children: pageError ? pageError : "" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-list", children: [
                pageError && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-empty", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", onClick: () => void loadPage(void 0, true), children: "\u91CD\u8BD5" }) }),
                !pageError && loading && page.entries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-empty", children: "\u6B63\u5728\u52A0\u8F7D\u2026" }),
                !pageError && !loading && page.entries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-empty", children: filter === "favorites" ? "\u8FD8\u6CA1\u6709\u6536\u85CF\u7684\u6587\u7AE0" : filter === "unread" ? "\u6CA1\u6709\u672A\u8BFB\u6587\u7AE0" : refreshing ? "\u6B63\u5728\u83B7\u53D6\u8FD9\u4E2A\u9891\u9053\u7684\u6587\u7AE0\u2026" : "\u8FD9\u4E2A\u9891\u9053\u6682\u65E0\u6587\u7AE0\uFF0C\u7A0D\u540E\u4F1A\u81EA\u52A8\u5C1D\u8BD5\u66F4\u65B0\u3002" }),
                page.entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `qrs-entry${selected?.article?.key === entry.key ? " qrs-selected" : ""}${entry.read ? " qrs-read" : ""}${entry.summary ? "" : " qrs-no-summary"}`,
                    "aria-pressed": selected?.article?.key === entry.key,
                    onClick: () => void openArticle(entry.key),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "qrs-entry-copy", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "qrs-entry-meta", children: [
                          mixed && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-source-name", children: entry.channelName ?? "" }),
                          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-date", children: formatDate(entry.publishedAt) })
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "qrs-entry-title", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: entry.read ? "qrs-read-dot" : "qrs-unread-dot", "aria-hidden": "true" }),
                          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-visually-hidden", children: entry.read ? "\u5DF2\u8BFB" : "\u672A\u8BFB" }),
                          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { children: entry.titleZh ?? entry.title }),
                          entry.favorite && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-bookmarked", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "bookmark", size: 12 }) })
                        ] }),
                        entry.summary && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "qrs-summary", children: entry.summary })
                      ] }),
                      entry.image && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-entry-thumb", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("img", { src: entry.image, alt: "", loading: "lazy", referrerPolicy: "no-referrer" }) })
                    ]
                  },
                  entry.key
                )),
                page.hasMore && page.nextCursor && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-more", disabled: loadingMore, onClick: () => void loadPage(page.nextCursor, false), children: loadingMore ? "\u52A0\u8F7D\u4E2D\u2026" : "\u52A0\u8F7D\u66F4\u65E9\u6587\u7AE0" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
              "div",
              {
                className: "qrs-resize",
                role: "separator",
                "aria-orientation": "vertical",
                onPointerDown: startDrag,
                onDoubleClick: () => {
                  setListWidth(300);
                  localStorage.setItem("qrs.listWidth", "300");
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("section", { className: "qrs-reader", tabIndex: 0, children: selected?.loading ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-article-loading", role: "status", "aria-label": "\u6B63\u5728\u52A0\u8F7D\u6587\u7AE0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-reader-toolbar qrs-skeleton-toolbar", "aria-hidden": "true", children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-skeleton qrs-skeleton-icon" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-skeleton qrs-skeleton-pill" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-skeleton qrs-skeleton-icon" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-skeleton qrs-skeleton-icon" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-article qrs-article-skeleton", "aria-hidden": "true", children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton qrs-skeleton-meta" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton qrs-skeleton-title" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton qrs-skeleton-title short" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-skeleton-paragraph", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-skeleton-paragraph", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-skeleton-paragraph", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-skeleton" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-visually-hidden", children: "\u6B63\u5728\u52A0\u8F7D\u6587\u7AE0\u2026" })
            ] }) : selected?.error ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-article-load-error", role: "alert", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "file-check", size: 22 }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u6587\u7AE0\u6682\u65F6\u65E0\u6CD5\u6253\u5F00" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: "\u8BF7\u91CD\u8BD5\u8BFB\u53D6\u8FD9\u7BC7\u6587\u7AE0\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", onClick: () => void openArticle(selected.key), children: "\u91CD\u65B0\u52A0\u8F7D" })
            ] }) : !activeArticle ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-welcome", children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-welcome-brand", children: "QIAOMU RSS" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { children: "\u5728 Harness \u91CC\u8BFB\u4E54\u6728\u7CBE\u9009" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "qrs-welcome-intro", children: "\u5DE6\u4FA7\u662F\u9891\u9053\u4E0E\u6587\u7AE0\u5217\u8868\uFF1A\u5168\u90E8\u3001\u672A\u8BFB\u3001\u6536\u85CF\u53EF\u5207\u6362\uFF1B\u70B9\u51FB\u6807\u9898\u5F00\u59CB\u9605\u8BFB\uFF0C\u8BD1\u6587\u4E0E\u4E54\u6728\u6539\u5199\u968F\u6587\u7AE0\u63D0\u4F9B\uFF0C\u7F3A\u5931\u65F6\u7528 Harness \u9ED8\u8BA4\u6A21\u578B\u8865\u5168\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "qrs-welcome-keys", children: [["J / K", "\u4E0A\u4E00\u7BC7 / \u4E0B\u4E00\u7BC7"], ["[", "\u4E13\u6CE8\u9605\u8BFB"], ["/", "\u641C\u7D22\u6587\u7AE0"]].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("kbd", { children: key }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: label })
              ] }, key)) })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-reader-toolbar", children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "qrs-icon",
                    title: askContext ? "\u9009\u62E9\u9891\u9053" : focused ? "\u663E\u793A\u5217\u8868" : "\u4E13\u6CE8\u9605\u8BFB",
                    "aria-label": askContext ? "\u9009\u62E9\u9891\u9053" : focused ? "\u663E\u793A\u5217\u8868" : "\u4E13\u6CE8\u9605\u8BFB",
                    onClick: (event) => askContext ? openPicker(event) : setFocused((current) => !current),
                    children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: askContext ? "panel-left-open" : focused ? "panel-left-open" : "panel-left-close" })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("label", { className: "qrs-visually-hidden", htmlFor: "qrs-mode", children: "\u9605\u8BFB\u7248\u672C" }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-version-switch", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { "aria-hidden": "true", children: "\u7248\u672C" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("select", { id: "qrs-mode", className: "qrs-mode-select", value: active, onChange: (event) => {
                    setPassage(null);
                    setSelected((current) => ({ ...current, active: event.target.value }));
                  }, children: ["original", "translation", "rewrite"].map((kind) => {
                    const available = kind === "original" || versions?.[kind]?.available;
                    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("option", { value: kind, children: [
                      VERSION_LABELS[kind],
                      available ? "" : "\uFF08\u7F3A\u5931\uFF09"
                    ] }, kind);
                  }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "chevron-down", size: 12 })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-reader-nav", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-icon", title: "\u4E0A\u4E00\u7BC7", "aria-label": "\u4E0A\u4E00\u7BC7", onClick: () => navigate(-1), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "chevron-up" }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-icon", title: "\u4E0B\u4E00\u7BC7", "aria-label": "\u4E0B\u4E00\u7BC7", onClick: () => navigate(1), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "chevron-down" }) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-actions", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                    "button",
                    {
                      type: "button",
                      className: `qrs-icon${activeArticle.article.favorite ? " is-active" : ""}`,
                      title: activeArticle.article.favorite ? "\u53D6\u6D88\u6536\u85CF" : "\u6536\u85CF",
                      "aria-label": "\u6536\u85CF",
                      "aria-pressed": Boolean(activeArticle.article.favorite),
                      onClick: () => void toggleFavorite(activeArticle.article.key, activeArticle.article.favorite),
                      children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "bookmark" })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                    "button",
                    {
                      type: "button",
                      className: "qrs-icon",
                      title: activeArticle.article.read ? "\u6807\u8BB0\u672A\u8BFB" : "\u6807\u8BB0\u5DF2\u8BFB",
                      "aria-label": "\u6807\u8BB0\u5DF2\u8BFB\u72B6\u6001",
                      "aria-pressed": Boolean(activeArticle.article.read),
                      onClick: () => void setRead(activeArticle.article.key, !activeArticle.article.read),
                      children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: activeArticle.article.read ? "circle-check" : "circle" })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("button", { type: "button", className: "qrs-icon", title: "AI \u4F34\u8BFB", "aria-label": "AI \u4F34\u8BFB", onClick: () => openCompanion(passage?.quote ?? ""), children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "wand-sparkles" }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                    "button",
                    {
                      type: "button",
                      className: "qrs-icon",
                      title: "\u66F4\u591A\u64CD\u4F5C",
                      "aria-label": "\u66F4\u591A\u64CD\u4F5C",
                      "aria-expanded": menuOpen,
                      onClick: () => setMenuOpen((open) => !open),
                      children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "ellipsis" })
                    }
                  ),
                  menuOpen && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-menu", role: "menu", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: () => {
                      setMenuOpen(false);
                      setAppearanceOpen(true);
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "type", size: 15 }),
                      "\u9605\u8BFB\u8BBE\u7F6E"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: () => {
                      setMenuOpen(false);
                      openCompanion(passage?.quote ?? "");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "wand-sparkles", size: 15 }),
                      "\u95EE AI"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("hr", {}),
                    activeArticle.article.url && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: () => {
                      setMenuOpen(false);
                      window.open(activeArticle.article.url, "_blank", "noopener,noreferrer");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "globe", size: 15 }),
                      "\u6253\u5F00\u539F\u6587"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: () => {
                      setMenuOpen(false);
                      try {
                        printArticle({ title: activeArticle.article.title, url: activeArticle.article.url, version: VERSION_LABELS[active], html: bodyHtml });
                      } catch (error) {
                        notify(`\u6253\u5370\u5931\u8D25\uFF1A${error?.message ?? String(error)}`, true);
                      }
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "file-check", size: 15 }),
                      "\u6253\u5370 / \u5B58\u4E3A PDF"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: () => {
                      setMenuOpen(false);
                      void openArticle(activeArticle.article.key);
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "refresh-cw", size: 15 }),
                      "\u91CD\u65B0\u52A0\u8F7D\u6587\u7AE0"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: () => {
                      setMenuOpen(false);
                      setDialog("settings");
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "settings", size: 15 }),
                      "\u63D2\u4EF6\u8BBE\u7F6E"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { type: "button", onClick: (event) => {
                      setMenuOpen(false);
                      openPicker(event);
                    }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Icon2, { name: "rss", size: 15 }),
                      "\u9009\u62E9\u9891\u9053"
                    ] })
                  ] }),
                  appearanceOpen && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ReadingAppearance, { settings: reading, onChange: applyReading, onClose: () => setAppearanceOpen(false) })
                ] })
              ] }),
              videoEmbed && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                "iframe",
                {
                  className: "qrs-video-frame",
                  src: videoEmbed,
                  title: "YouTube \u89C6\u9891\u64AD\u653E\u5668",
                  loading: "lazy",
                  sandbox: "allow-scripts allow-same-origin allow-presentation",
                  allow: "encrypted-media; picture-in-picture; fullscreen",
                  allowFullScreen: true,
                  referrerPolicy: "strict-origin-when-cross-origin"
                },
                videoEmbed
              ),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("article", { className: "qrs-article", children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-article-head", children: [
                  activeArticle.article.channelName && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: activeArticle.article.channelName }),
                  activeArticle.article.publishedAt && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: new Date(activeArticle.article.publishedAt).toLocaleDateString("zh-CN") }),
                  activeArticle.article.author && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: activeArticle.article.author }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "qrs-mode-chip", children: VERSION_LABELS[active] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h1", { children: activeArticle.article.url ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("a", { href: activeArticle.article.url, target: "_blank", rel: "noopener noreferrer", children: activeArticle.article.titleZh ?? activeArticle.article.title }) : activeArticle.article.titleZh ?? activeArticle.article.title }),
                bodyHtml ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { ref: proseRef, className: "qrs-prose", onMouseUp: captureSelection, onKeyUp: captureSelection, dangerouslySetInnerHTML: { __html: sanitizeHtml(bodyHtml, { baseUrl: activeArticle.article.url }) } }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "qrs-missing", children: [
                  "\u8FD9\u4E2A\u7248\u672C\u8FD8\u6CA1\u6709\u5185\u5BB9\u3002",
                  active !== "original" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("br", {}),
                    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                      "button",
                      {
                        type: "button",
                        className: "qrs-more",
                        style: { display: "inline-block" },
                        disabled: selected?.generating === active,
                        onClick: () => void generate(active),
                        children: selected?.generating === active ? "\u751F\u6210\u4E2D\u2026" : "\u7528 Harness \u9ED8\u8BA4\u6A21\u578B\u751F\u6210"
                      }
                    )
                  ] })
                ] })
              ] })
            ] }) })
          ] }),
          askContext && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            "div",
            {
              className: "qrs-companion-divider",
              role: "separator",
              "aria-label": "\u8C03\u6574\u6587\u7AE0\u4E0E\u4F34\u8BFB\u5BBD\u5EA6",
              "aria-orientation": "vertical",
              "aria-valuemin": 25,
              "aria-valuemax": 75,
              "aria-valuenow": companionWidth,
              tabIndex: 0,
              onPointerDown: (event) => {
                event.preventDefault();
                companionDrag.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                event.currentTarget.dataset.dragging = "true";
              },
              onPointerMove: (event) => {
                if (!companionDrag.current) return;
                const area = workareaRef.current;
                const rect = area?.getBoundingClientRect();
                if (!rect) return;
                const vertical = getComputedStyle(area).flexDirection === "column";
                const total = vertical ? rect.height : rect.width;
                const span = vertical ? rect.bottom - event.clientY : rect.right - event.clientX;
                const minimum = Math.min(320, total * 0.3);
                const amount = Math.max(minimum, Math.min(span, total - minimum));
                companionWidthRef.current = Math.round(amount / total * 100);
                setCompanionWidth(companionWidthRef.current);
              },
              onPointerUp: (event) => {
                companionDrag.current = false;
                event.currentTarget.dataset.dragging = "false";
                localStorage.setItem("qrs.companionWidth", String(companionWidthRef.current));
              },
              onPointerCancel: (event) => {
                companionDrag.current = false;
                event.currentTarget.dataset.dragging = "false";
              },
              onKeyDown: (event) => {
                const step = event.shiftKey ? 10 : 2;
                if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                  event.preventDefault();
                  const next = Math.max(25, Math.min(75, companionWidth + (["ArrowLeft", "ArrowUp"].includes(event.key) ? step : -step)));
                  companionWidthRef.current = next;
                  setCompanionWidth(next);
                  localStorage.setItem("qrs.companionWidth", String(next));
                }
              },
              onDoubleClick: () => {
                companionWidthRef.current = 44;
                setCompanionWidth(44);
                localStorage.setItem("qrs.companionWidth", "44");
              }
            }
          ),
          askContext && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(AskArticle, { api, context: askContext, SessionProvider, renderSlot, onClose: () => setAskContext(null), onManagePrompts: () => {
            setSettingsEntry({ tab: "prompts", addPrompt: true });
            setDialog("settings");
          } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(MediaDock, { episode, onOpen: openArticle, onClose: () => setEpisode(null) }),
        pickerOpen && !dialog && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          ChannelPicker,
          {
            channels,
            current: channel,
            anchor: pickerAnchor,
            onClose: () => setPickerOpen(false),
            onSelect: selectChannel,
            onManage: () => {
              setPickerOpen(false);
              setDialog("settings");
            }
          }
        ),
        dialog === "discover" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Discover, { api, onClose: () => setDialog(void 0), onAdded: loadChannels, onRead: (key) => {
          setDialog(void 0);
          selectChannel(key);
        } }),
        dialog === "add" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(AddFeedDialog, { api, onClose: () => setDialog(void 0), onDone: async () => {
          await loadChannels();
          await loadPage(void 0, true);
        }, notify }),
        dialog === "settings" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SettingsPage, { api, initialTab: settingsEntry.tab, startAddingPrompt: settingsEntry.addPrompt, onClose: () => {
          setDialog(void 0);
          setSettingsEntry({ tab: "reading", addPrompt: false });
        }, notify }),
        toast && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `qrs-toast${toast.isError ? " is-error" : ""}`, children: toast.message })
      ]
    }
  );
}

// src/client/ReaderBoundary.jsx
var import_react14 = require("react");
var import_jsx_runtime13 = require("react/jsx-runtime");
var ReaderBoundary = class extends import_react14.Component {
  state = { error: null, attempt: 0 };
  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  render() {
    if (this.state.error) return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { role: "alert", style: { padding: 24, color: "var(--dsw-alias-label-primary)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { children: "\u4E54\u6728 RSS \u9875\u9762\u52A0\u8F7D\u5931\u8D25" }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { style: { whiteSpace: "pre-wrap" }, children: this.state.error }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { type: "button", onClick: () => this.setState((state) => ({ error: null, attempt: state.attempt + 1 })), children: "\u91CD\u65B0\u6253\u5F00\u9605\u8BFB\u5668" })
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ReaderPage, { ...this.props }, this.state.attempt);
  }
};
function ReaderPanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ReaderBoundary, { ...props });
}

// src/client/index.jsx
var PLUGIN_ID = "qiaomu-rss-dsh";
var PANEL_ID = "qiaomu-rss";
var codec = () => ({
  mode: "strict",
  typeSymbol: `${PLUGIN_ID}#json`,
  create: () => ({ parse: (value) => value, safeParse: (value) => ({ success: true, data: value }) })
});
function method(method2, params = true) {
  return {
    id: `${PLUGIN_ID}#rss/${method2}`,
    service: "rss",
    namespace: "rss",
    method: method2,
    invocation: { kind: "direct" },
    ...params ? { parameters: [{ name: "request", wire: "request", source: "json", codec: codec() }] } : { parameters: [] },
    result: { mode: "src-json" },
    cancellation: { parameter: "signal" }
  };
}
var TYPERT_REMOTE = {
  package: PLUGIN_ID,
  descriptors: [
    method("listChannels", false),
    method("listEntries"),
    method("searchArticles"),
    method("getArticle"),
    method("getVersionContent"),
    method("generateVersion"),
    method("refresh"),
    method("listSubscriptions", false),
    method("addSubscription"),
    method("removeSubscription"),
    method("updateSubscription"),
    method("opmlPreview"),
    method("opmlImport"),
    method("opmlExport", false),
    method("setRead"),
    method("setFavorite"),
    method("getSettings", false),
    method("saveSettings"),
    ...["prepareChat", "setReadingContext"].map((name) => method(name))
  ]
};
var inject = ["slots", "layout", "remote"];
async function apply(ctx) {
  try {
    await ctx.remote.$mount(TYPERT_REMOTE);
  } catch (error) {
    ctx.logger?.error?.("qiaomu-rss: failed to mount the rss Remote namespace: %o", error);
    throw error;
  }
  ctx.inject(["remote.rss"], (child) => registerReader(child));
}
function registerReader(ctx) {
  const call = async (name, ...args) => {
    const namespace = ctx.remote.rss;
    if (!namespace || typeof namespace[name] !== "function") {
      throw new Error("qiaomu-rss \u9605\u8BFB\u670D\u52A1\u672A\u5C31\u7EEA,\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    }
    const result = await namespace[name](...args);
    if (result.ok) return result.value;
    throw result.error;
  };
  const api = {
    ...nativeChatBridge(ctx),
    prepareChat: (params) => call("prepareChat", params),
    setReadingContext: (params) => call("setReadingContext", params),
    listChannels: () => call("listChannels"),
    listEntries: (params) => call("listEntries", params),
    getArticle: (key) => call("getArticle", { key }),
    generateVersion: (key, kind) => call("generateVersion", { key, kind }),
    refresh: (channel) => call("refresh", { channel }),
    addSubscription: (params) => call("addSubscription", params),
    removeSubscription: (id) => call("removeSubscription", { id }),
    listSubscriptions: () => call("listSubscriptions"),
    updateSubscription: (params) => call("updateSubscription", params),
    opmlPreview: (params) => call("opmlPreview", params),
    opmlImport: (xml, urls) => call("opmlImport", { xml, urls }),
    opmlExport: () => call("opmlExport"),
    setRead: (keys, read) => call("setRead", { keys, read }),
    setFavorite: (key, favorite) => call("setFavorite", { key, favorite }),
    getSettings: () => call("getSettings"),
    saveSettings: (patch) => call("saveSettings", { patch })
  };
  ctx.slots.inject("main", () => ctx.slots.register({
    name: "main",
    key: PANEL_ID,
    children: { "qiaomu-rss.chat": { kind: "single", scope: "session" } },
    inject: () => ({ api })
  }, ReaderPanel));
  ctx.slots.inject("qiaomu-rss.chat", () => ctx.slots.register({ name: "qiaomu-rss.chat" }, NativeConversation));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
    name: "sidebar.panellist",
    id: PANEL_ID,
    order: 15,
    label: "\u4E54\u6728 RSS"
  }, ReaderIcon));
}

		return module.exports;
	}
});


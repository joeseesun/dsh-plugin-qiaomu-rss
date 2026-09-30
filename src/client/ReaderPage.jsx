/**
 * 乔木 RSS reader panel. Layout, class names, and visual parameters mirror the
 * original Obsidian plugin (src/view.ts + styles.css): a compact channel
 * toolbar, inline filter pills, list rows with source/date, title, excerpt and
 * thumbnail, and a sticky reader toolbar with the reading-version select.
 * DSH theme tokens replace Obsidian's variables.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeHtml } from '../host/sanitize.js';
import { markdownToHtml } from '../host/markdown.js';
import { READING_DEFAULTS, fontStack } from '../reading-settings.js';
import { Icon } from './icons.jsx';
import { ChannelPicker, ChannelMark } from './ChannelPicker.jsx';
import { ReadingAppearance } from './ReadingAppearance.jsx';
import { AddFeedDialog } from './dialogs.jsx';
import { SettingsPage } from './SettingsPage.jsx';
import { SubscriptionManager } from './SubscriptionManager.jsx';
import { Discover } from './Discover.jsx';
import { MediaDock } from './MediaDock.jsx';
import { selectedPassage } from './selection.js';
import { AskArticle } from './AskArticle.jsx';
import { youtubeEmbedUrl } from '../video.js';
import { printArticle } from './print-article.js';

const PANEL_CSS = `
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
.qrs-settings-content .qrs-modal-row button,.qrs-settings-content button:not(.qrs-icon){border:1px solid var(--qrs-border);border-radius:7px;background:var(--qrs-bg-2);color:var(--qrs-fg);padding:6px 10px;font:inherit;cursor:pointer}.qrs-settings-content .qrs-modal-row{display:flex;gap:8px}.qrs-settings-links{display:flex;flex-wrap:wrap;gap:8px 18px}.qrs-settings-links a{color:var(--qrs-accent);text-decoration:none}.qrs-settings-links a:hover{text-decoration:underline}.qrs-settings-support{display:flex;gap:24px;flex-wrap:wrap;margin-top:12px}.qrs-settings-support>div{min-width:180px}.qrs-settings-support p{margin:4px 0 10px;font-size:12px;color:var(--qrs-muted)}.qrs-settings-support img{display:block;width:160px;height:160px;object-fit:contain;border-radius:8px;background:white}
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

const VERSION_LABELS = { original: '原文', translation: '译文', rewrite: '乔木改写' };
const FALLBACK_READING = { ...READING_DEFAULTS };

let stylesReady = false;
function ensureStyles() {
  if (stylesReady) return;
  stylesReady = true;
  const style = document.createElement('style');
  style.dataset.plugin = 'dsh-plugin-qiaomu-rss';
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

/** Sidebar entry icon; receives {size, active} from the host sidebar. */
export function ReaderIcon({ size = 18, active = false }) {
  return (
    <span style={{ color: active ? 'var(--dsw-alias-brand-primary)' : 'inherit', display: 'inline-flex', alignItems: 'center' }}>
      <Icon name="rss" size={size} strokeWidth={1.8} />
    </span>
  );
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function ReaderPage({ api, SessionProvider, renderSlot }) {
  const [channels, setChannels] = useState([]);
  const [channel, setChannel] = useState(() => localStorage.getItem('qrs.channel') || 'qiaomu');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState({ entries: [], hasMore: false, nextCursor: undefined });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(undefined);
  const [toast, setToast] = useState(undefined);
  const [dialog, setDialog] = useState(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { if (dialog) setPickerOpen(false); }, [dialog]);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reading, setReading] = useState(FALLBACK_READING);
  const [listWidth, setListWidth] = useState(() => Number(localStorage.getItem('qrs.listWidth')) || 300);
  const [episode, setEpisode] = useState(null);
  const [askContext, setAskContext] = useState(null);
  const [passage,setPassage]=useState(null);
  const selectionSerial=useRef(0);
  const proseRef=useRef();
  const rootRef=useRef();
  const workareaRef=useRef();
  const companionDrag=useRef(false);
  const [companionWidth,setCompanionWidth]=useState(()=>{const saved=Number(localStorage.getItem('qrs.companionWidth'));return Number.isFinite(saved)&&saved>=25&&saved<=75?saved:44;});
  const companionWidthRef=useRef(companionWidth);
  useEffect(()=>{const root=rootRef.current;if(!root)return;const update=()=>{const r=root.getBoundingClientRect();root.dataset.titlebar=String(window.location.protocol==='dsh-app:'&&/Mac/.test(navigator.platform)&&r.left<110&&r.top<45);};update();if(!globalThis.ResizeObserver)return;const observer=new ResizeObserver(update);observer.observe(root);return()=>observer.disconnect();},[]);
  useEffect(()=>{const record=selected?.article;if(record)localStorage.setItem('qrs.view.'+channel,JSON.stringify({key:record.key,active:selected.active}));},[selected?.article?.key,selected?.active,channel]);

  useEffect(()=>{setPassage(null);},[selected?.article?.key]);

  const toastTimer = useRef();
  const pageRequest = useRef(0);
  const articleRequest = useRef(0);
  const searchInput = useRef();

  const notify = (message, isError = false) => {
    setToast({ message, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(undefined), isError ? 4200 : 2400);
  };

  const run = async (promise, { errorPrefix = '操作失败' } = {}) => {
    try { return await promise; } catch (error) {
      notify(`${errorPrefix}：${error?.message ?? String(error)}`, true);
      return undefined;
    }
  };

  const applyReading = async (patch) => {
    const next = { ...reading, ...patch };
    setReading(next);
    await run(api.saveSettings(patch), { errorPrefix: '保存阅读设置失败' });
  };

  useEffect(() => {
    void api.getSettings()
      .then((result) => setReading({ ...FALLBACK_READING, ...result.settings }))
      .catch(() => {});
    const reload = () => { void api.getSettings().then((result) => setReading({ ...FALLBACK_READING, ...result.settings })).catch(() => {}); };
    window.addEventListener('qrs-settings-changed', reload);
    return () => window.removeEventListener('qrs-settings-changed', reload);
  }, [api]);

  const loadChannels = async () => {
    const data = await run(api.listChannels(), { errorPrefix: '读取频道失败' });
    if (data) setChannels(data.channels);
    return data?.channels ?? [];
  };

  const loadPage = async (cursor, replace = true) => {
    const request = ++pageRequest.current;
    if (replace) setLoading(true); else setLoadingMore(true);
    setPageError('');
    try {
      const data = await api.listEntries({ channel, filter, search: query || undefined, cursor });
      if (request !== pageRequest.current) return;
      if (!data || !Array.isArray(data.entries)) throw new Error('阅读服务返回了无效的文章列表');
      setPage((previous) => (replace ? data : {
        entries: [...previous.entries, ...data.entries.filter((entry) => !previous.entries.some((seen) => seen.key === entry.key))],
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
      }));
    } catch (error) {
      if (request === pageRequest.current) setPageError(error?.message ?? String(error));
    } finally {
      if (request === pageRequest.current) { setLoading(false); setLoadingMore(false); }
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      ensureStyles();
      const loaded = await loadChannels();
      if (cancelled) return;
      if (!loaded.some((item) => item.total > 0)) {
        setRefreshing(true);
        await run(api.refresh(undefined), { errorPrefix: '首次刷新失败' });
        setRefreshing(false);
        await loadChannels();
        if (!cancelled) await loadPage(undefined, true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('qrs.channel', channel);
    setPage({ entries: [], hasMore: false, nextCursor: undefined });
    void loadPage(undefined, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, filter, query]);

  const openArticle = async (key, restoreVersion) => {
    const request = ++articleRequest.current;
    setSelected({ loading: true });setPassage(null);if(document.querySelector('.qrs-root')?.clientWidth>0&&document.querySelector('.qrs-root').clientWidth<460)setFocused(true);
    const data = await run(api.getArticle(key), { errorPrefix: '读取正文失败' });
    if (request !== articleRequest.current) return;
    if (!data) { setSelected(undefined); return; }
    setSelected({ ...data, article:{...data.article,read:true}, active: restoreVersion || reading.defaultVersion });document.querySelector('.qrs-reader')?.scrollTo?.({top:0});
    if (data.article?.read === false) {
      void api.setRead([key], true).catch(e=>notify(e.message,true));
      setPage((previous) => ({ ...previous, entries: previous.entries.map((entry) => (entry.key === key ? { ...entry, read: true } : entry)) }));
    }
  };

  useEffect(()=>{
    try {const saved=JSON.parse(localStorage.getItem('qrs.view.'+channel)||'null');if(saved?.key)void openArticle(saved.key,saved.active);}catch{}
  },[]);

  const refresh = async (target) => {
    setRefreshing(true);
    const outcome = await run(api.refresh(target), { errorPrefix: '刷新失败' });
    setRefreshing(false);
    if (outcome) {
      const bits = [];
      if (outcome.qiaomu !== undefined) bits.push(`乔木 ${outcome.qiaomu} 篇`);
      if (outcome.feeds !== undefined) bits.push(`订阅源 ${outcome.feeds} 个`);
      notify(bits.length > 0 ? `已刷新：${bits.join('，')}` : '已刷新');
    }
    await Promise.all([loadChannels(), loadPage(undefined, true)]);
  };

  const toggleFavorite = async (key, favorite) => {
    const result=await run(api.setFavorite(key, !favorite), { errorPrefix: '收藏失败' });if(!result)return;
    setPage((previous) => ({ ...previous, entries: previous.entries.map((entry) => (entry.key === key ? { ...entry, favorite: !favorite } : entry)) }));
    if (selected?.article?.key === key) setSelected((current) => ({ ...current, article: { ...current.article, favorite: !favorite } }));
  };

  const setRead = async (key, read) => {
    const result=await run(api.setRead([key], read), { errorPrefix: '标记失败' });if(!result)return;
    setPage((previous) => ({ ...previous, entries: previous.entries.map((entry) => (entry.key === key ? { ...entry, read } : entry)) }));
    if (selected?.article?.key === key) setSelected((current) => ({ ...current, article: { ...current.article, read } }));
  };

  const generate = async (kind) => {
    const key = selected?.article?.key;
    if (!key) return;
    setSelected((current) => ({ ...current, generating: kind }));
    const version = await run(api.generateVersion(key, kind), { errorPrefix: '生成失败' });
    setSelected((current) => {
      if (current?.article?.key !== key) return current;
      return { ...current, generating: undefined, ...(version ? {
        active: kind, versions: { ...current.versions, [kind]: { ...version, available: true } },
      } : {}) };
    });
    if (version) notify(version.source === 'qiaomu' ? '已载入乔木发布版本' : '已载入 Harness 生成版本');
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
      width = Math.round(Math.min(Math.max(startX === 0 ? 300 : (listWidth + moveEvent.clientX - startX), 220), 520));
      setListWidth(width);
    };
    const up = () => {
      localStorage.setItem('qrs.listWidth', String(width));
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (dialog || pickerOpen || askContext || appearanceOpen || menuOpen || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'j' || event.key === 'k') { event.preventDefault(); navigate(event.key === 'j' ? 1 : -1); }
      else if (event.key === '[' || event.key === 'f') { event.preventDefault(); setFocused((current) => !current); }
      else if (event.key === '/') { event.preventDefault(); setSearchOpen(true); setTimeout(() => searchInput.current?.focus(), 0); }
      else if (event.key === 'Escape') { setFocused(false); setSearchOpen(false); setQuery(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, pickerOpen, askContext, appearanceOpen, menuOpen, page.entries, selected?.article?.key]);

  const activeArticle = selected && !selected.loading ? selected : undefined;
  const versions = activeArticle?.versions;
  const active = activeArticle?.active ?? 'original';
  const videoEmbed = youtubeEmbedUrl(activeArticle?.article?.videoUrl || '');
  const currentChannel = channels.find((item) => item.key === channel);
  const mixed = new Set(page.entries.map((entry) => entry.channelKey)).size > 1;
  const bodyHtml = useMemo(() => {
    if (!activeArticle) return '';
    if (active === 'original') return activeArticle.html ?? '';
    const markdown = versions?.[active]?.markdown;
    return markdown ? markdownToHtml(markdown) : '';
  }, [activeArticle, active, versions]);
  useEffect(()=>{if(askContext&&activeArticle?.article)setAskContext(previous=>({...previous,key:activeArticle.article.key,title:activeArticle.article.titleZh||activeArticle.article.title,version:active,selection:previous.key===activeArticle.article.key&&previous.version===active?previous.selection:'',quoteId:previous.key===activeArticle.article.key&&previous.version===active?previous.quoteId:undefined}));},[activeArticle?.article?.key,active]);
  const openCompanion=(quote='')=>{if(!activeArticle)return;setAskContext({key:activeArticle.article.key,title:activeArticle.article.titleZh||activeArticle.article.title,version:active,selection:quote,quoteId:quote?++selectionSerial.current:undefined});};
  const captureSelection=()=>{const found=selectedPassage(proseRef.current);if(found?.quote===passage?.quote)return;setPassage(found);if(found)openCompanion(found.quote);};
  const theme = reading.readingTheme && reading.readingTheme !== 'auto' ? reading.readingTheme : null;
  const THEME_COLORS = { light: ['#ffffff', '#202124'], paper: ['#f5efdf', '#40382e'], sage: ['#e8eee3', '#29382c'], mist: ['#e7edf2', '#293741'], dark: ['#252525', '#dedede'], black: ['#090909', '#cccccc'] };

  return (
    <div ref={rootRef} className={`qrs-root${focused ? ' qrs-focus' : ''}`} tabIndex={0} data-images={String(reading.showImages !== false)}
      style={{
        '--qrs-list-width': `${listWidth}px`,
        '--qrs-font-size': `${reading.fontSize}px`,
        '--qrs-line-height': reading.lineHeight,
        '--qrs-article-width': `${reading.fontSize * reading.textWidth + 120}px`,
        '--qrs-font-family': fontStack(reading),
        ...(theme ? { '--qrs-bg': THEME_COLORS[theme][0], '--qrs-bg-2': THEME_COLORS[theme][0], '--qrs-fg': THEME_COLORS[theme][1] } : {}),
      }}>
      <div ref={workareaRef} style={{'--qrs-companion-width':`${companionWidth}%`}} className={`qrs-workarea${askContext ? ' has-companion' : ''}`}><div className="qrs-layout">
        <aside className="qrs-sidebar">
          <div className="qrs-sidebar-toolbar">
            <button type="button" className="qrs-channel" aria-haspopup="dialog" onClick={() => setPickerOpen(true)}>
              <ChannelMark channel={{ ...(currentChannel ?? { name: '乔木精选' }), icon: currentChannel?.key === 'qiaomu' ? 'sparkles' : currentChannel?.kind === 'feed' ? 'rss' : 'tree-deciduous' }} />
              <span className="qrs-channel-label">{currentChannel?.name ?? '乔木精选'}</span>
              <Icon name="chevron-down" size={13} />
            </button>
            <button type="button" className="qrs-icon" title="探索订阅" aria-label="探索订阅" onClick={() => setDialog('discover')}><Icon name="plus" /></button>
            <button type="button" className="qrs-icon" title="搜索" aria-label="搜索" onClick={() => { setSearchOpen((open) => !open); setTimeout(() => searchInput.current?.focus(), 0); }}><Icon name="search" /></button>
            <button type="button" className={`qrs-icon${refreshing ? ' is-loading' : ''}`} title="刷新" aria-label="刷新" onClick={() => void refresh(channel)}><Icon name="refresh-cw" /></button>
          </div>
          <div className="qrs-filters" role="group">
            {[['all', '全部'], ['unread', '未读'], ['favorites', '收藏']].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            ))}
            <button type="button" className="qrs-settings-button" title="插件设置" aria-label="插件设置" onClick={() => setDialog('settings')}><Icon name="settings" size={15} /></button>
          </div>
          <div className={`qrs-search-box${searchOpen ? '' : ' is-hidden'}`}>
            <input ref={searchInput} type="search" aria-label="搜索文章" placeholder="搜索已加载的文章…" value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setSearchOpen(false); setQuery(''); } }} />
          </div>
          <div className={`qrs-status${pageError ? ' is-error' : ''}`} role="status" aria-live="polite">
            {pageError ? pageError : ''}
          </div>
          <div className="qrs-list">
            {pageError && <div className="qrs-empty"><button type="button" onClick={() => void loadPage(undefined, true)}>重试</button></div>}
            {!pageError && loading && page.entries.length === 0 && <div className="qrs-empty">正在加载…</div>}
            {!pageError && !loading && page.entries.length === 0 && (
              <div className="qrs-empty">{filter === 'favorites' ? '还没有收藏的文章' : filter === 'unread' ? '没有未读文章' : '暂无文章。点击「刷新」拉取最新内容，或用「+」探索订阅。'}</div>
            )}
            {page.entries.map((entry) => (
              <button key={entry.key} type="button" className={`qrs-entry${selected?.article?.key === entry.key ? ' qrs-selected' : ''}${entry.read ? ' qrs-read' : ''}${entry.summary ? '' : ' qrs-no-summary'}`}
                aria-pressed={selected?.article?.key === entry.key} onClick={() => void openArticle(entry.key)}>
                <span className="qrs-entry-copy">
                  <span className="qrs-entry-meta">
                    {mixed && <span className="qrs-source-name">{entry.channelName ?? ''}</span>}
                    <span className="qrs-date">{formatDate(entry.publishedAt)}</span>
                  </span>
                  <span className="qrs-entry-title">
                    <span className={entry.read ? 'qrs-read-dot' : 'qrs-unread-dot'} aria-hidden="true" />
                    <span className="qrs-visually-hidden">{entry.read ? '已读' : '未读'}</span>
                    <h3>{entry.titleZh ?? entry.title}</h3>
                    {entry.favorite && <span className="qrs-bookmarked"><Icon name="bookmark" size={12} /></span>}
                  </span>
                  {entry.summary && <p className="qrs-summary">{entry.summary}</p>}
                </span>
                {entry.image && <span className="qrs-entry-thumb"><img src={entry.image} alt="" loading="lazy" referrerPolicy="no-referrer" /></span>}
              </button>
            ))}
            {page.hasMore && page.nextCursor && (
              <button type="button" className="qrs-more" disabled={loadingMore} onClick={() => void loadPage(page.nextCursor, false)}>
                {loadingMore ? '加载中…' : '加载更早文章'}
              </button>
            )}
          </div>
        </aside>
        <div className="qrs-resize" role="separator" aria-orientation="vertical" onPointerDown={startDrag}
          onDoubleClick={() => { setListWidth(300); localStorage.setItem('qrs.listWidth', '300'); }} />
        <section className="qrs-reader" tabIndex={0}>
          {!activeArticle ? (
            <div className="qrs-welcome">
              <div className="qrs-welcome-brand">QIAOMU RSS</div>
              <h2>在 Harness 里读乔木精选</h2>
              <p className="qrs-welcome-intro">
                左侧是频道与文章列表：全部、未读、收藏可切换；点击标题开始阅读，译文与乔木改写随文章提供，缺失时用 Harness 默认模型补全。
              </p>
              <div className="qrs-welcome-keys">
                {[['J / K', '上一篇 / 下一篇'], ['[', '专注阅读'], ['/', '搜索文章']].map(([key, label]) => (
                  <span key={key}><kbd>{key}</kbd><span>{label}</span></span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="qrs-reader-toolbar">
                <button type="button" className="qrs-icon" title={askContext ? '选择频道' : focused ? '显示列表' : '专注阅读'} aria-label={askContext ? '选择频道' : focused ? '显示列表' : '专注阅读'}
                  onClick={() => askContext ? setPickerOpen(true) : setFocused((current) => !current)}><Icon name={askContext ? 'panel-left-open' : focused ? 'panel-left-open' : 'panel-left-close'} /></button>
                <label className="qrs-visually-hidden" htmlFor="qrs-mode">阅读版本</label>
                <div className="qrs-version-switch"><span aria-hidden="true">版本</span><select id="qrs-mode" className="qrs-mode-select" value={active} onChange={(event) => {setPassage(null);setSelected((current) => ({ ...current, active: event.target.value }));}}>
                  {['original', 'translation', 'rewrite'].map((kind) => {
                    const available = kind === 'original' || versions?.[kind]?.available;
                    return <option key={kind} value={kind}>{VERSION_LABELS[kind]}{available ? '' : '（缺失）'}</option>;
                  })}
                </select><Icon name="chevron-down" size={12} /></div>
                <div className="qrs-reader-nav">
                  <button type="button" className="qrs-icon" title="上一篇" aria-label="上一篇" onClick={() => navigate(-1)}><Icon name="chevron-up" /></button>
                  <button type="button" className="qrs-icon" title="下一篇" aria-label="下一篇" onClick={() => navigate(1)}><Icon name="chevron-down" /></button>
                </div>
                <div className="qrs-actions">
                  <button type="button" className={`qrs-icon${activeArticle.article.favorite ? ' is-active' : ''}`}
                    title={activeArticle.article.favorite ? '取消收藏' : '收藏'} aria-label="收藏" aria-pressed={Boolean(activeArticle.article.favorite)}
                    onClick={() => void toggleFavorite(activeArticle.article.key, activeArticle.article.favorite)}><Icon name="bookmark" /></button>
                  <button type="button" className="qrs-icon" title={activeArticle.article.read ? '标记未读' : '标记已读'} aria-label="标记已读状态"
                    aria-pressed={Boolean(activeArticle.article.read)} onClick={() => void setRead(activeArticle.article.key, !activeArticle.article.read)}>
                    <Icon name={activeArticle.article.read ? 'circle-check' : 'circle'} />
                  </button>
                  <button type="button" className="qrs-icon" title="AI 伴读" aria-label="AI 伴读" onClick={()=>openCompanion(passage?.quote??'')}><Icon name="wand-sparkles"/></button>
                  <button type="button" className="qrs-icon" title="更多操作" aria-label="更多操作" aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}><Icon name="ellipsis" /></button>
                  {menuOpen && (
                    <div className="qrs-menu" role="menu">
                      <button type="button" onClick={() => { setMenuOpen(false); setAppearanceOpen(true); }}><Icon name="type" size={15} />阅读设置</button>
                      <button type="button" onClick={() => { setMenuOpen(false); openCompanion(passage?.quote ?? ''); }}><Icon name="wand-sparkles" size={15} />问 AI</button>
                      <hr />
                      {activeArticle.article.url && <button type="button" onClick={() => { setMenuOpen(false); window.open(activeArticle.article.url, '_blank', 'noopener,noreferrer'); }}><Icon name="globe" size={15} />打开原文</button>}
                      <button type="button" onClick={() => { setMenuOpen(false); try { printArticle({ title: activeArticle.article.title, url: activeArticle.article.url, version: VERSION_LABELS[active], html: bodyHtml }); } catch (error) { notify(`打印失败：${error?.message ?? String(error)}`, true); } }}><Icon name="file-check" size={15} />打印 / 存为 PDF</button>
                      <button type="button" onClick={() => { setMenuOpen(false); void openArticle(activeArticle.article.key); }}><Icon name="refresh-cw" size={15} />重新加载文章</button>
                      <button type="button" onClick={() => { setMenuOpen(false); setDialog('settings'); }}><Icon name="settings" size={15} />插件设置</button>
                      <button type="button" onClick={() => { setMenuOpen(false); setPickerOpen(true); }}><Icon name="rss" size={15} />选择频道</button>
                    </div>
                  )}
                  {appearanceOpen && <ReadingAppearance settings={reading} onChange={applyReading} onClose={() => setAppearanceOpen(false)} />}
                </div>
              </div>
              {videoEmbed && <iframe key={videoEmbed} className="qrs-video-frame" src={videoEmbed} title="YouTube 视频播放器" loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-presentation" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
              <article className="qrs-article">
                <div className="qrs-article-head">
                  {activeArticle.article.channelName && <span>{activeArticle.article.channelName}</span>}
                  {activeArticle.article.publishedAt && <span>{new Date(activeArticle.article.publishedAt).toLocaleDateString('zh-CN')}</span>}
                  {activeArticle.article.author && <span>{activeArticle.article.author}</span>}
                  <span className="qrs-mode-chip">{VERSION_LABELS[active]}</span>
                </div>
                <h1>
                  {activeArticle.article.url
                    ? <a href={activeArticle.article.url} target="_blank" rel="noopener noreferrer">{activeArticle.article.titleZh ?? activeArticle.article.title}</a>
                    : (activeArticle.article.titleZh ?? activeArticle.article.title)}
                </h1>
                {bodyHtml
                  ? <div ref={proseRef} className="qrs-prose" onMouseUp={captureSelection} onKeyUp={captureSelection} dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml, { baseUrl: activeArticle.article.url }) }} />
                  : (
                    <div className="qrs-missing">
                      这个版本还没有内容。
                      {active !== 'original' && (
                        <>
                          <br />
                          <button type="button" className="qrs-more" style={{ display: 'inline-block' }}
                            disabled={selected?.generating === active} onClick={() => void generate(active)}>
                            {selected?.generating === active ? '生成中…' : '用 Harness 默认模型生成'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
              </article>
            </>
          )}
        </section>
      </div>
      {askContext && <div className="qrs-companion-divider" role="separator" aria-label="调整文章与伴读宽度" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={companionWidth} tabIndex={0}
        onPointerDown={event=>{event.preventDefault();companionDrag.current=true;event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.dataset.dragging='true';}}
        onPointerMove={event=>{if(!companionDrag.current)return;const rect=workareaRef.current?.getBoundingClientRect();if(!rect)return;const vertical=rect.width<=700;const total=vertical?rect.height:rect.width;const span=vertical?rect.bottom-event.clientY:rect.right-event.clientX;const minimum=Math.min(320,total*.3);const amount=Math.max(minimum,Math.min(span,total-minimum));companionWidthRef.current=Math.round(amount/total*100);setCompanionWidth(companionWidthRef.current);}}
        onPointerUp={event=>{companionDrag.current=false;event.currentTarget.dataset.dragging='false';localStorage.setItem('qrs.companionWidth',String(companionWidthRef.current));}}
        onPointerCancel={event=>{companionDrag.current=false;event.currentTarget.dataset.dragging='false';}}
        onKeyDown={event=>{const step=event.shiftKey?10:2;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const next=Math.max(25,Math.min(75,companionWidth+(['ArrowLeft','ArrowUp'].includes(event.key)?step:-step)));companionWidthRef.current=next;setCompanionWidth(next);localStorage.setItem('qrs.companionWidth',String(next));}}}
        onDoubleClick={()=>{companionWidthRef.current=44;setCompanionWidth(44);localStorage.setItem('qrs.companionWidth','44');}} />}
      {askContext && <AskArticle api={api} context={askContext} SessionProvider={SessionProvider} renderSlot={renderSlot} onClose={() => setAskContext(null)} />}
      </div>
      {selected?.loading && <div className="qrs-toast">正在加载正文…</div>}
      <MediaDock episode={episode} onOpen={openArticle} onClose={() => setEpisode(null)} />
      {pickerOpen && !dialog && (
        <ChannelPicker channels={channels} current={channel} onClose={() => setPickerOpen(false)}
          onSelect={(key) => {if(key!==channel){articleRequest.current++;setAskContext(null);setFocused(false);setSelected(undefined);setPassage(null);setFilter('all');setQuery('');setChannel(key);}}} onManage={() => { setPickerOpen(false); setDialog('settings'); }} />
      )}
      {dialog === 'discover' && <Discover api={api} onClose={() => setDialog(undefined)} onAdded={loadChannels} />}
      {dialog === 'add' && <AddFeedDialog api={api} onClose={() => setDialog(undefined)} onDone={async () => { await loadChannels(); await loadPage(undefined, true); }} notify={notify} />}
      {dialog === 'settings' && <SettingsPage api={api} onClose={() => setDialog(undefined)} notify={notify} />}
      {toast && <div className={`qrs-toast${toast.isError ? ' is-error' : ''}`}>{toast.message}</div>}
    </div>
  );
}

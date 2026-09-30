# 乔木 RSS · DeepSeek Harness 插件

**中文** · [English](#english)

在 DeepSeek Harness 里订阅和阅读 RSS，并用宿主原生 AI 对话伴读当前文章。

Read RSS inside DeepSeek Harness and discuss the current article in its native AI conversation.

本仓库是持续开发的源码仓库；目前以本地 Desktop profile 验证，尚未发布 npm 包。`npm run build` 和 `npm test` 已在 Node.js 24 上通过。

## 能做什么

| 功能 | 使用方式 |
| --- | --- |
| 乔木精选与个人订阅 | 浏览聚合流、添加 RSS/Atom 源、导入或导出 OPML |
| 阅读文章 | 切换原文、译文和乔木改写；支持未读、收藏、搜索与媒体内容 |
| AI 伴读 | 点击文章工具栏的 AI 图标，右侧直接打开 Harness 原生对话；自动使用默认工作区，并带入当前文章、版本及所选段落 |
| Agent 工具 | 提供频道、文章、搜索、订阅、刷新和阅读版本相关的八个 `rss_*` 工具 |

文章与伴读之间的分割线可拖动，也可用方向键微调、双击复位。插件不提供 Obsidian 式笔记、划线保存或日记写入。

## 开发

需要 Node.js 22 或更高版本，以及已安装的 DeepSeek Harness。克隆后执行：

```bash
git clone https://github.com/joeseesun/dsh-plugin-qiaomu-rss.git
cd dsh-plugin-qiaomu-rss
npm ci
npm run build
npm test
```

`src/` 是源码；`lib/` 是随 Git 仓库提交的宿主与客户端构建产物，供 DSH bundle 加载。修改源码后请重新构建，并一并提交更新后的 `lib/`。包名 `dsh-plugin-qiaomu-rss` 必须与 `cordis.patch.yml` 中的 `name` 保持一致。

本地 Desktop profile 已验证读取、伴读和可调分割线。当前仓库仍设有 `private: true`，表示**不向 npm 发布**；公开 GitHub 仓库与 npm 发布是两件事。后续若发布安装包，应先在全新 profile 中验证安装、启动及更新路径。

## 数据与来源

- 订阅与阅读状态保存在 Harness home 的 `storages/qiaomu-rss/data.json`，不在本仓库。升级时不会清空旧数据。
- 乔木精选读取 [乔木 AI RSS](https://github.com/joeseesun/qiaomu-ai-rss) 的公开接口；个人订阅由插件抓取。
- 内置独立博客源清单来自 [chinese-independent-blogs](https://github.com/timqian/chinese-independent-blogs)，其 MIT 声明保留在 [`vendor/chinese-independent-blogs/LICENSE`](vendor/chinese-independent-blogs/LICENSE)。
- AI 伴读使用 DeepSeek Harness 当前可用的模型与原生会话；模型服务的配置与费用由 Harness 管理。

问题与改进建议请通过 [GitHub Issues](https://github.com/joeseesun/dsh-plugin-qiaomu-rss/issues) 提交。本项目采用 [GPL-3.0-only](LICENSE) 许可。

---

<a id="english"></a>

## English

Qiaomu RSS brings curated and personal RSS/Atom feeds into DeepSeek Harness. Read the original, translated, or rewritten article; manage unread items and favorites; import/export OPML; and open a native Harness AI conversation beside the article with its reading context attached. The companion opens directly in the default workspace. The article/chat divider is resizable.

This is the public development repository, not a published npm package. To build and run the repository tests, use Node.js 22+ and run `npm ci`, `npm run build`, and `npm test`. The generated `lib/` files are committed because the DSH bundle loads them. A clean-profile installation path has not yet been verified for a public release.

Reading data lives in the user's Harness home under `storages/qiaomu-rss/data.json`, outside this repository. The curated feed uses the public [Qiaomu AI RSS](https://github.com/joeseesun/qiaomu-ai-rss) API. AI conversations use the host's configured model and account. Obsidian note, highlight-saving, and daily-note features are intentionally absent. Source is licensed under [GPL-3.0-only](LICENSE); the bundled blog list retains its separate MIT notice.

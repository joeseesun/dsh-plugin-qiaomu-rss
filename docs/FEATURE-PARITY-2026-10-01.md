# 原版 RSS 新功能与 DSH 跟进评估

核验日期：2026-10-01，Asia/Shanghai。此文档为功能审查与迁移建议，未实现新功能。

## 当前基线

- 原版：`joeseesun/qiaomu-ai-rss`，公开 Release `0.25.2`，当天 22:02:36 发布；PR #57 已合并，远端 main 为 `ac2c792`。
- DSH：`joeseesun/qiaomu-rss-dsh`，main `14f9c56`，公开 Release `v0.6.0`。
- 已核对远端、发布说明、客户端与服务端源码。线上匿名 GET `/api/lab/collection-jobs` 返回 403 / `invalid_invitation`，确认路由响应与鉴权拒绝；未验证有效邀请码、管理员登录或真实提交。

## 功能差异与优先级

| 功能 | 当前 DSH 状态 | 建议 |
| --- | --- | --- |
| 实验室链接收录、服务器生成改写 | 无；已有 Podscribe 仅获取现成播客转写 | 优先迁移普通用户完整流程 |
| 邀请码验证、独立客户端身份 | 无 | 与提交功能一起迁移，保存在 Host，避免把密钥暴露到通用设置返回值或 Agent 工具 |
| 我的申请、状态、重启恢复、完成通知、失败重试 | 无 | 与提交一起交付，沿用文章列表视觉和阅读入口 |
| 收录任务中文标题、保留原标题 | 普通精选支持 titleZh；无任务标题同步 | 与收录一起迁移；读取文章时不能覆盖列表已取得的中文标题 |
| 正文右键复制点中的链接 | 订阅管理已有复制源地址；正文没有专用右键菜单 | 小范围补齐，仅针对实际点中的链接 |
| 管理员查看全部用户申请、365 天会话 | 无 | 第二阶段；仍由服务器角色鉴权，不把管理员能力开放给 Agent |
| 八语言完整 UI | 大部分中文；选段引用局部中英 | 独立后续工作；新功能文案先集中管理 |
| 七种阅读配色、持久播放器、选文伴读 | 已有对应实现 | 无需重复移植；必要时做宿主验收 |
| 今日日记日期、Obsidian 状态栏、笔记目录、Home 协议 | 宿主专属 | 不直接移植；Harness Home 集成需另核对契约 |
| DOMPurify 更新 | DSH 使用自有 HTML 白名单 sanitizer | 不照搬依赖升级；新内容仍经过现有清洗 |

## 首轮迁移范围

1. 设置中增加默认关闭的实验室入口，输入邀请码并显式验证保存。明确链接会提交到配置的服务器，生成的改写公开收录。
2. 正文链接菜单增加复制链接与申请收录；提供粘贴链接的提交入口，以便处理阅读器外的文章。
3. Host 共用 operation 完成验证、提交、分页查询与读取结果；复用现有 origin 和文章/改写获取接口。
4. 持久保存客户端身份、请求 UUID、URL、服务 origin、任务状态和通知标记。网络中断后复用请求 UUID，避免重复提交。仅在启用且存在未完成任务时查询；优先查宿主调度能力，避免永久固定轮询。
5. 我的订阅增加申请列表，显示 queued/running/complete/failed，完成后打开现有阅读器与 AI 伴读；失败提供明确重试入口。
6. 默认不增加管理员入口或 Agent 提交工具。管理员界面后续单独验收；外部提交涉及公开收录，Agent 如需开放需另明确用户交互与授权流程。

服务端 `processLink` 调用 `submitLink`、标题本地化与 `rewriteEntry`，交付的是网页收录和 AI 改写。产品名称可沿用原版，但说明中必须与 Podscribe 播客原文转写区分，不能承诺任意音视频逐字稿。

## 实现后的验收要求

- 旧订阅、收藏、阅读状态保持；任务和客户端身份可跨重启恢复。
- 无效邀请码、超时、限流、重复提交、查询 404、失败重试与成功打开结果。
- 同邀请码不同实例只能查询各自任务；凭证不进入通用设置输出、日志或模型上下文。
- 服务 origin 切换时不能误用旧任务的凭证；中文任务标题打开文章及重启后仍保持。
- 在实际 Harness 中验证链接目标、粘贴提交、任务列表、完成通知、原文/改写切换与伴读；不能用构建或模拟测试替代实机证明。

## 来源

- [原版 0.25.2 Release](https://github.com/joeseesun/qiaomu-ai-rss/releases/tag/0.25.2)
- [原版 PR #57](https://github.com/joeseesun/qiaomu-ai-rss/pull/57)
- [客户端接口与身份协议](https://github.com/joeseesun/qiaomu-ai-rss/blob/0.25.2/src/collection.ts)
- [服务端鉴权与任务状态机](https://github.com/joeseesun/qiaomu-ai-rss/blob/0.25.2/server/lab-collection.js)
- [实际处理适配器](https://github.com/joeseesun/qiaomu-ai-rss/blob/0.25.2/server/mount-lab-collection.js.txt)
- [DSH v0.6.0](https://github.com/joeseesun/qiaomu-rss-dsh/releases/tag/v0.6.0)

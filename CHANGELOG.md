# Changelog

所有重要变更都会记录在此文件中。

## 2026-02-07

### ✨ New Feature

- **友情链接** — 支持用户提交友链申请，管理员审核通过后展示
  - 用户提交友链后自动邮件通知管理员
  - 管理员审批/拒绝后邮件通知用户
  - 公开展示页面 `/friend-links`
  - 管理后台批量审核、编辑、删除

## 2026-02-06

### ⚠️ Breaking Change

- **邮件发送从 Workflow 迁移到 Queue**
  - 移除了 `SEND_EMAIL_WORKFLOW` binding
  - 新增 `QUEUE` binding，使用 Cloudflare Queues
  - 迁移步骤：
    1. 在 Cloudflare Dashboard → Queues 中创建 `blog-queue`
    2. 参考 `wrangler.example.jsonc` 更新你的 `wrangler.jsonc` 配置 `queues`
    3. 从 `wrangler.jsonc` 的 `workflows` 数组中移除 `send-email-workflow`

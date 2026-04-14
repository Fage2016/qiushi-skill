# OpenClaw 使用说明

截至 **2026-04-14**，OpenClaw 官方文档已经支持把 Claude / Cursor / Codex bundles 映射为原生 OpenClaw 插件，并支持直接从 GitHub 仓库发现 marketplace。因此 `qiushi-skill` 在 OpenClaw 上优先走“复用现有 Claude bundle”这条标准路径，不重复造一套 OpenClaw 专属元数据。

## 快速开始

1. 运行 `openclaw plugins marketplace list HughYau/qiushi-skill`，确认仓库被识别。
2. 安装插件：`openclaw plugins install qiushi-skill --marketplace HughYau/qiushi-skill`
3. 如果插件不是默认启用，执行：`openclaw plugins enable qiushi-skill`
4. 视你的 OpenClaw 版本行为决定是否执行 `openclaw gateway restart`
5. 新开一个会话，检查 `arming-thought` 是否作为入口方法论被加载

## 为什么这里不单独做 OpenClaw 元数据

- 仓库已经有 `.claude-plugin/plugin.json`
- `v1.3.0` 新增 `.claude-plugin/marketplace.json`
- OpenClaw 现有 bundle 兼容层已经能消费这套结构

在上游兼容层失效之前，继续复用现有 bundle 的维护成本最低，也最符合标准安装链路。

## 验证

- `openclaw plugins list` 能看到 `qiushi-skill`
- 用一个简单 case 触发方法论 skill
- 仓库级自检可运行 `npx qiushi-skill validate`

更多细节见 [`.openclaw/INSTALL.md`](../.openclaw/INSTALL.md)。

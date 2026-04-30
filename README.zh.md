[English](README.md) · **简体中文**

---

# claude-config-manager

一个 Claude Code 插件，给你一套 Web Dashboard + CLI 来管理整套 Claude Code 配置：插件、MCP 服务器、skill、命令、设置、配置档案、会话、使用指标。

## 安装

```bash
# 1. 添加市场
claude plugin marketplace add https://github.com/wangcansunking/can-claude-plugins

# 2. 安装插件
claude plugin install claude-config-manager@can-claude-plugins

# 3. 在任意 Claude Code 会话里打开 dashboard
/ccm-dashboard
```

Dashboard 会在 <http://localhost:3399> 启动，并自动在浏览器里打开。

![Dashboard 总览](docs/migration/screenshots/01-dashboard-overview.png)

## 为什么

Claude Code 的可配置表面很大 — `settings.json`、MCP 配置、插件市场、skill、命令、hook、环境变量、会话。手改 JSON 能 work，但一旦要在多个项目之间切换、或者要复用一套配置，就很难规模化。`claude-config-manager` 提供：

- 一处查看和编辑所有 Claude Code 配置文件
- 可导出、导入、激活的配置档案快照（想像成 Claude 的 `nvm use`）
- 浏览插件、MCP 服务器、skill 的市场视图
- 实时会话活动，一键恢复
- 从本地 Claude Code 历史中提取的使用指标

## 功能

### 总览和使用指标

首页展示已安装插件、MCP 服务器、最近会话、token 消耗图、环境健康 — 一眼尽览。

![MCP 使用图表](docs/migration/screenshots/01b-dashboard-mcp-usage.png)

### 个性化推荐

针对当前配置运行 `/ccm-recommendations`，推荐你还没装的插件、MCP 服务器、skill。

![推荐](docs/migration/screenshots/02-recommended.png)

### 插件管理

查看已安装的插件、浏览市场、进入插件详情查看它的命令、skill、MCP 服务器。

![已安装插件](docs/migration/screenshots/03-config-plugins-installed.png)
![插件详情面板](docs/migration/screenshots/03b-plugin-detail-panel.png)
![插件市场](docs/migration/screenshots/03c-plugins-marketplace.png)

### MCP 服务器管理

添加、移除、查看 MCP 服务器。MCP 市场让你一键安装常用服务。

![已安装 MCP](docs/migration/screenshots/04-config-mcp-installed.png)
![MCP 市场](docs/migration/screenshots/04c-mcp-store.png)

### Skill、命令与设置

在全屏阅读器中编辑 skill markdown、管理 slash command、无需打开编辑器调整 `settings.json`（model、hooks、env var）。

![Skill 标签页](docs/migration/screenshots/05-config-skills.png)
![设置标签页](docs/migration/screenshots/07-config-settings.png)

### 配置档案（导出 / 导入 / 激活）

把完整配置 — 插件、MCP 服务器、skill、命令、hook、设置 — 快照到一个命名的配置档案里。切档案就切整套配置；导出成 `.json` 可分享给同事。

![配置档案](docs/migration/screenshots/08-profiles.png)
![导出 / 导入](docs/migration/screenshots/08b-profiles-export-import.png)

### 会话活动

跨所有项目浏览历史与正在运行的 Claude Code 会话。点击任意会话查看历史；一键复制 `claude --resume <id>` 恢复。

![活动](docs/migration/screenshots/09-activity.png)
![会话详情](docs/migration/screenshots/09b-activity-session-detail.png)

### 暗色 / 亮色主题

![暗色](docs/migration/screenshots/10-dark-mode.png)
![亮色](docs/migration/screenshots/10b-light-mode.png)

## TUI（交互式终端界面）

不带参数运行 `claude-config` 即可启动终端内的交互界面：

```bash
claude-config
```

TUI 复刻了 dashboard 的「浏览 + 高频操作」——启停 plugin / MCP / skill、切换 profile、复制 session resume id、复制 recommended install command——无需浏览器或 HTTP server。

### 界面布局

```
┌─ ccm 1.1.4 · en · dashboard ○  (stopped) ──────────────────────────────┐
│                                                                         │
│  ┌─────────────┐  ┌───────────────────────────────────────────────────┐ │
│  │  Overview   │  │                                                   │ │
│  │  Config     │  │             （当前页面内容）                      │ │
│  │▶ Sessions   │  │                                                   │ │
│  │  Recommend  │  │                                                   │ │
│  │  Settings   │  │                                                   │ │
│  │  Profiles   │  │                                                   │ │
│  └─────────────┘  └───────────────────────────────────────────────────┘ │
│                                                                         │
│ ↑↓/jk:nav  Enter:enter  Esc:back  Tab:switch focus  /:filter  ?:help   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 页面说明

> 以下截图展示英文 UI；中文 UI 与之布局完全相同，仅标签翻译为中文。

#### Overview（总览）

```
 Active profile:
 work

 Plugins: 29
 MCPs: 13
 Skills: 86
 Commands: 0

 Recent sessions
 · /Users/me/repos/foo
 · /Users/me/repos/bar
 · /Users/me/repos/baz

 Dashboard: ○ stopped
```

展示当前激活档案、已安装数量（插件 / MCP / skill / 命令）、最近会话、dashboard 运行状态。

#### Config — Plugins（插件）

```
Plugins (6 installed)
▶ [✓] vercel@claude-plugins-official           0.40.0
  [✓] remember@claude-plugins-official         0.6.0
  [✓] superpowers@claude-plugins-official      5.0.7
  [✓] feature-dev@claude-plugins-official      1.0.0
  [✓] serena@claude-plugins-official           0.9.1
  [ ] experiment-plugin                        0.1.0

space:toggle  enter:toggle  /:filter  ?:help
```

在光标行按 `space`（或 `Enter`）可切换 `~/.claude/settings.json` 中的 `enabledPlugins`。

#### Config — MCP servers（MCP 服务器）

```
MCP servers (4)
▶ [✓] serena                         uvx serena
  [✓] context7                       npx context7
  [✓] chrome-devtools                npx chrome-devtools
  [ ] playwright                     npx playwright

space:toggle  enter:toggle  /:filter
```

切换 `~/.claude/settings.json` 中的 `enabledMcpServers` 映射。

#### Sessions（会话）

```
 Sessions (3)

 ▶  ● feature work                     ┌──────────────────────────────────────────────────────────┐
   a3f9c2bd  /Users/me/repos/foo · 2h  │ Name:       feature work                                 │
   ○ bug fix                           │ Project:    /Users/me/repos/foo                          │
   b8e4f1a2  /Users/me/repos/bar · 1d  │ Session ID: a3f9c2bd-1111-2222-3333-444455556666         │
   ○ experiment                        │ Started:    2h ago (2026-04-30 14:03)                    │
   c1d9e3b4  /Users/me/repos/baz · 5d  │ Status:     ● live (pid 12345)                           │
                                       │                                                          │
                                       │ Recent inputs                                            │
                                       │ ─────────────                                            │
                                       │                                                          │
                                       │ 1. how do I add jwt auth to express                      │
                                       │ 2. fix the failing integration test                      │
                                       │ 3. refactor the user module                              │
                                       └──────────────────────────────────────────────────────────┘

 y:copy resume id  /:filter  ?:help
```

按 `y` 可将 resume ID 复制到剪切板。右侧详情面板展示该会话最近的用户输入，方便你确认是否选对了会话。

#### Recommended（推荐）

```
 Recommended (4)

 ▶ [MCP/Top] @modelcontextprotocol/server-postgres Postgres MCP server
   [MCP/Trending] kubernetes-mcp-server        Kubernetes MCP server
   [PLUGIN/Top] devtools-cli                 Suite of devtools
   [SKILL/Top] database-design              Schema design helper

 c/y:copy install cmd  /:filter
```

数据来自 `/ccm-recommendations` skill 填充的缓存。按 `c` 或 `y` 复制安装命令。

#### Settings（设置）

```
 TUI preferences

 ▶ language       en   (Enter to toggle en ↔ zh)
   theme         auto (terminal palette)
   quit-confirm  off
```

TUI 偏好设置。语言切换（en ↔ zh）在下一次渲染时立即生效。

### 键位表

| 按键 | 操作 |
|------|------|
| `1`–`6` | 跳转侧栏到第 N 项 |
| `↑`/`↓` 或 `j`/`k` | 在当前焦点列表中上下导航 |
| `g` / `G` 或 `Home` / `End` | 跳到列表顶部 / 底部 |
| `h`/`l` 或 `←`/`→` | 切换 Configuration 页的内部标签 |
| `Tab` / `Shift+Tab` | 在侧栏与主面板之间切换焦点 |
| `Enter` | 激活 / 进入 / 将焦点从侧栏移到主面板 |
| `Esc` | 返回；主面板状态下将焦点还给侧栏 |
| `space` | 切换（在启用 / 禁用行上） |
| `/` | 过滤当前列表 |
| `r` | 强制刷新 |
| `?` | 帮助覆层 |
| `q` / `Ctrl+C` | 退出 |

### 从 Claude Code 自动启动

如果你通过插件市场安装了 `/ccm` slash 命令，在 Claude Code 对话里运行 `/ccm` 时，会尝试在新终端窗口中自动启动 TUI：

- macOS — 打开新的 Terminal.app 窗口
- Linux — 依次尝试 gnome-terminal / konsole / alacritty / wezterm / kitty / xterm
- Windows — 依次尝试 Windows Terminal（`wt`）→ PowerShell → cmd.exe

若未找到合适的终端，skill 会回退到提示你手动运行 `claude-config`，或在 http://localhost:3399 启动 Web Dashboard——由你选择。

如果你想要更适合 demo / 富展示的体验（图表、截图），仍然推荐启动 dashboard：`claude-config start` 会在 http://localhost:3399 起服务。

## Slash 命令

| 命令 | 作用 |
|------|------|
| `/ccm` | 快捷入口 — 状态、配置档案、打开 dashboard |
| `/ccm-dashboard` | 启动 dashboard 并在浏览器打开 |
| `/ccm-export` | 把当前配置导出成档案 JSON |
| `/ccm-import` | 导入档案 JSON 并激活 |
| `/ccm-profile` | 列出、创建、切换、删除配置档案 |

## Skill

| Skill | 作用 |
|-------|------|
| `ccm-dashboard` | 启动并打开 dashboard |
| `ccm-recommendations` | 基于当前配置刷新"推荐"页的个性化建议 |

## MCP 工具

只暴露 **2 个工具** — 刻意极简，避免抢占 model 的工具选择面：

| 工具 | 作用 |
|------|------|
| `ccm_dashboard_status` | 只读：dashboard 是否运行、端口、PID |
| `ccm_open_dashboard`   | 返回 dashboard URL + 启动提示 |

其他所有功能（配置档案、插件、MCP、skill、命令、设置）全部通过 **`claude-config` CLI** 流转 — CLI 是操作层的唯一真实来源。`/ccm-*` slash 命令通过 Bash 调用 CLI。

## CLI

```bash
node packages/cli/dist/index.js --help    # 或作为插件：node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js
```

提供的命令面：

```
claude-config start [--port <port>] [--no-open]
claude-config list [--plugins | --mcps | --skills | --commands] [--json]
claude-config profile list [--json]
claude-config profile create <name>
claude-config profile activate <name>
claude-config profile delete <name>
claude-config export <profile> [--output <file>] [--format json|yaml]
claude-config import <file> [--replace] [--activate] [--dry-run]
claude-config gist push <profile> [--description <d>] [--public] [--dry-run]
claude-config gist pull <id-or-url> [--activate] [--replace]
claude-config mcp-server                  # 以 stdio 形式运行 MCP server
```

## 仓库结构

```
claude-config-manager/
  .claude-plugin/plugin.json         插件元数据
  .mcp.json                          MCP server 接线
  mcp-entry.mjs                      MCP server 入口
  commands/                          Slash command（Skill.md）
  skills/                            Skill（Skill.md）
  hooks/                             Claude Code hook 脚本
  packages/
    types/                           共享 TypeScript 类型
    core/                            业务逻辑（档案、扫描器、管理器）
    mcp/                             MCP server（2 个工具 — dashboard 状态 + 打开）
    dashboard/                       Express + Vite Dashboard（UI + API）
    cli/                             `claude-config` CLI
  docs/                              规格文档和截图
```

## 开发

从源码开始：

```bash
git clone https://github.com/wangcansunking/claude-config-manager
cd claude-config-manager
npm install
npm run dev                 # 跨所有 package 的 turbo dev
```

其他脚本：

```bash
npm run build
npm run test                # Vitest 单元测试
npm run test:e2e            # Playwright E2E
npm run type-check
npm run lint
npm start                   # 启动构建好的 dashboard（:3399）
```

Dashboard 的开发 server 跑在 `:3399`，由 `turbo dev` 负责。

## Changelog

见 [CHANGELOG.md](CHANGELOG.md)。

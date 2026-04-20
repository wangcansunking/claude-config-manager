**English** · [简体中文](README.zh.md)

---

# claude-config-manager

A Claude Code plugin that gives you a web dashboard + CLI to manage your whole Claude Code setup: plugins, MCP servers, skills, commands, settings, profiles, sessions, and usage metrics.

## Install

```bash
# 1. Add the marketplace
claude plugin marketplace add https://github.com/wangcansunking/can-claude-plugins

# 2. Install the plugin
claude plugin install claude-config-manager@can-claude-plugins

# 3. In any Claude Code session, open the dashboard
/ccm-dashboard
```

The dashboard launches on <http://localhost:3399> and opens in your browser.

![Dashboard overview](docs/migration/screenshots/01-dashboard-overview.png)

## Why

Claude Code ships a lot of surface area — `settings.json`, MCP configs, plugin marketplaces, skills, commands, hooks, environment variables, sessions. Editing JSON files by hand works, but doesn't scale once you juggle multiple projects or want to switch configurations. `claude-config-manager` gives you:

- One place to view and edit every Claude Code configuration file
- Profile snapshots you can export, import, and activate (think `nvm use` for Claude)
- A marketplace browser for plugins, MCP servers, and skills
- Live session activity with resume-on-one-click
- Usage metrics pulled from your local Claude Code history

## Features

### Overview & Usage Metrics

Homepage shows your installed plugins, MCP servers, recent sessions, token-burn chart, and environment health at a glance.

![MCP usage chart](docs/migration/screenshots/01b-dashboard-mcp-usage.png)

### Personalized Recommendations

Runs `/ccm-recommendations` against your current setup to suggest plugins, MCP servers, and skills you haven't installed yet.

![Recommended](docs/migration/screenshots/02-recommended.png)

### Plugin Management

View installed plugins, browse marketplaces, drill into a plugin to see its commands, skills, and MCP servers.

![Installed plugins](docs/migration/screenshots/03-config-plugins-installed.png)
![Plugin detail panel](docs/migration/screenshots/03b-plugin-detail-panel.png)
![Plugin marketplace](docs/migration/screenshots/03c-plugins-marketplace.png)

### MCP Server Management

Add, remove, and inspect MCP servers. The MCP Store lets you install popular servers with one click.

![Installed MCP servers](docs/migration/screenshots/04-config-mcp-installed.png)
![MCP store](docs/migration/screenshots/04c-mcp-store.png)

### Skills, Commands, and Settings

Edit skill markdown in a full-screen viewer, manage slash commands, and tweak `settings.json` fields (model, hooks, env vars) without opening a text editor.

![Skills tab](docs/migration/screenshots/05-config-skills.png)
![Settings tab](docs/migration/screenshots/07-config-settings.png)

### Profiles (Export / Import / Activate)

Snapshot your full configuration — plugins, MCP servers, skills, commands, hooks, settings — into a named profile. Switch profiles to swap your whole setup, or export a `.json` and share it with a teammate.

![Profiles](docs/migration/screenshots/08-profiles.png)
![Export / import](docs/migration/screenshots/08b-profiles-export-import.png)

### Session Activity

Browse past and live Claude Code sessions across all your projects. Click any session to inspect history; copy `claude --resume <id>` to resume in one click.

![Activity](docs/migration/screenshots/09-activity.png)
![Session detail](docs/migration/screenshots/09b-activity-session-detail.png)

### Dark / Light Theme

![Dark mode](docs/migration/screenshots/10-dark-mode.png)
![Light mode](docs/migration/screenshots/10b-light-mode.png)

## Slash Commands

| Command | Description |
|---------|-------------|
| `/ccm` | Quick access — status, profiles, open dashboard |
| `/ccm-dashboard` | Start the dashboard and open it in the browser |
| `/ccm-export` | Export the current configuration to a profile JSON |
| `/ccm-import` | Import a profile JSON and activate it |
| `/ccm-profile` | List, create, switch, or delete profiles |

## Skills

| Skill | What it does |
|-------|-------------|
| `ccm-dashboard` | Starts and opens the dashboard |
| `ccm-recommendations` | Refreshes the Recommended page with personalized suggestions based on your setup |

## MCP Tools

Only **2 tools** exposed — intentionally minimal so the model's tool-selection surface stays small:

| Tool | Purpose |
|------|---------|
| `ccm_dashboard_status` | Read-only: is the dashboard up, on what port, under what PID |
| `ccm_open_dashboard`   | Return the dashboard URL + start hint |

Everything else (profiles, plugins, MCP servers, skills, commands, settings) flows through the **`claude-config` CLI** — the single source of truth for operations. The `/ccm-*` slash commands shell into the CLI via Bash.

## CLI

```bash
node packages/cli/dist/index.js --help    # or via plugin: node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js
```

Surface:

```
claude-config start [--port <port>] [--no-open]
claude-config list [--plugins | --mcps | --skills | --commands] [--json]
claude-config profile list [--json]
claude-config profile create <name>
claude-config profile activate <name>
claude-config profile delete <name>
claude-config export <profile> [--output <file>] [--format json|yaml]
claude-config import <file> [--replace] [--activate] [--dry-run]
claude-config mcp-server                  # runs the MCP stdio server
```

## Repository Layout

```
claude-config-manager/
  .claude-plugin/plugin.json         Plugin metadata
  .mcp.json                          MCP server wiring
  mcp-entry.mjs                      MCP server entrypoint
  commands/                          Slash commands (Skill.md files)
  skills/                            Skills (Skill.md files)
  hooks/                             Claude Code hook scripts
  packages/
    types/                           Shared TypeScript types
    core/                            Business logic (profiles, scanners, managers)
    mcp/                             MCP server (2 tools — dashboard status + open)
    dashboard/                       Express + Vite dashboard (UI + API)
    cli/                             `claude-config` CLI
  docs/                              Spec docs and screenshots
```

## Development

Clone and run from source:

```bash
git clone https://github.com/wangcansunking/claude-config-manager
cd claude-config-manager
npm install
npm run dev                 # turbo dev across all packages
```

Other scripts:

```bash
npm run build
npm run test                # vitest unit tests
npm run test:e2e            # Playwright E2E
npm run type-check
npm run lint
npm start                   # serve built dashboard on :3399
```

Dashboard dev server runs on `:3399` via `turbo dev`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

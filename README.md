# claude-config-manager

A Claude Code plugin that gives you a web dashboard + CLI to manage your whole Claude Code setup: plugins, MCP servers, skills, commands, settings, profiles, sessions, and usage metrics.

![Dashboard overview](docs/migration/screenshots/01-dashboard-overview.png)

## Why

Claude Code ships a lot of surface area — `settings.json`, MCP configs, plugin marketplaces, skills, commands, hooks, environment variables, sessions. Editing JSON files by hand works, but doesn't scale once you juggle multiple projects or want to switch configurations. `claude-config-manager` gives you:

- One place to view and edit every Claude Code configuration file
- Profile snapshots you can export, import, and activate (think `nvm use` for Claude)
- A marketplace browser for plugins, MCP servers, and skills
- Live session activity with resume-on-one-click
- Usage metrics pulled from your local Claude Code history

## Installation

### Via marketplace (recommended)

```bash
claude plugins marketplace add https://github.com/wangcansunking/can-claude-plugins
claude plugins install claude-config-manager@can-claude-plugins
```

Then in any Claude Code session, run `/ccm-dashboard` — it starts the server on `http://localhost:3399` and opens it in your browser.

### From source (for development)

```bash
git clone https://github.com/wangcansunking/claude-config-manager
cd claude-config-manager
npm install
npm run build
npm start                    # dashboard on :3399
```

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

22 tools exposed by the local MCP server — reachable by Claude Code as `mcp__claude-config-manager__<tool>`:

- **Profiles** — `ccm_list_profiles`, `ccm_create_profile`, `ccm_activate_profile`, `ccm_export_profile`, `ccm_import_profile`, `ccm_update_profile`, `ccm_delete_profile`
- **Read** — `ccm_list_plugins`, `ccm_list_mcp_servers`, `ccm_list_skills`, `ccm_list_commands`, `ccm_get_config`, `ccm_get_component_detail`
- **Dashboard** — `ccm_open_dashboard`, `ccm_dashboard_status`
- **Mutations** — `ccm_install_plugin`, `ccm_update_plugin`, `ccm_remove_plugin`, `ccm_toggle_plugin`, `ccm_add_mcp_server`, `ccm_remove_mcp_server`, `ccm_update_config`

## CLI

The plugin ships a `claude-config` CLI (bin in `packages/cli`) for scripted usage:

```bash
npx claude-config --help
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
    mcp/                             MCP server (22 tools)
    dashboard/                       Express + Vite dashboard (UI + API)
    cli/                             `claude-config` CLI
  docs/                              Spec docs and screenshots
```

## Development

```bash
npm install
npm run dev                 # turbo dev across all packages
npm run test                # vitest unit tests
npm run test:e2e            # Playwright E2E
npm run type-check
npm run lint
```

Dashboard dev server runs on `:3399` via `turbo dev`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

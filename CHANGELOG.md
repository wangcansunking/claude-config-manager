# Changelog

All notable changes to claude-config-manager are documented here.

## [1.0.7] — 2026-04-17

### Fixed
- **`.mcp.json` schema**: Wrapped the MCP server entry in a `mcpServers` key. Previously used flat format `{ "claude-config-manager": {...} }` which caused `/doctor` to fail with "Does not adhere to MCP server configuration schema". Now properly structured as `{ "mcpServers": { "claude-config-manager": {...} } }`.

## [1.0.6] — 2026-04-17

### Fixed
- **Sidebar version** — was hardcoded as `1.0.0-draft`. Now fetches from new `/api/info` endpoint and reflects the actual plugin version.

### Added
- **`GET /api/info`** — returns plugin name and version from `.claude-plugin/plugin.json`.

## [1.0.5] — 2026-04-17

### Fixed
- **Adding a marketplace now actually clones the repo** — previously only wrote to `known_marketplaces.json`, so no plugins showed up in the Marketplace tab. Now uses `simple-git` to `git clone --depth 1` the repo to `~/.claude/plugins/marketplaces/<name>/`.
- **Removing a marketplace** now deletes the cloned directory (best effort).

### Added
- **`POST /api/marketplaces/:name/refresh`** — `git pull` to update a marketplace's plugin list.
- **`MarketplaceManager.refreshMarketplace()`** — programmatic refresh support.

## [1.0.4] — 2026-04-17

### Changed
- **Info dialogs**: Replaced browser `alert()` popups with themed `InfoDialog` component. Displays command in a proper code block with Copy button, consistent with dashboard design.

### Added
- New shared `InfoDialog` component for CLI-hint actions.

## [1.0.3] — 2026-04-17

### Fixed
- **Skill/Command viewer**: Frontmatter was being displayed as markdown content. Now the YAML frontmatter block (`--- ... ---`) is stripped before rendering.
- **Frontmatter parser**: Now supports CRLF line endings (Windows files) and multi-line values (YAML continuation lines). Previously multi-line descriptions were only parsed as the first line.

## [1.0.2] — 2026-04-17

### Fixed
- **Plugins "Check Updates" button**: Converted no-op button to CLI-hint — copies `/plugin marketplace update <name>` to clipboard with instructions.
- **Marketplace Install button**: Previously silent no-op. Now copies `/plugin install <name>@<marketplace>` to clipboard with "Copied!" feedback.
- **MCP Servers "Add Server" button**: Previously had no handler. Now switches to the MCP Store tab where installation happens.

### Changed
- Added optional `title` prop to shared Button component for native tooltips on CLI-hint actions.

## [1.0.1] — 2026-04-17

### Fixed
- **MCP detail panel**: Removed broken "Edit Config" and "Restart" buttons that had no onClick handlers. Only the working "Remove" button remains for user-managed MCP servers. System MCPs (from plugins) show no actions since they're managed via plugin install/remove.

## [1.0.0] — 2026-04-17

Initial release of claude-config-manager — a Claude Code plugin that provides a dashboard, CLI, and MCP tools for managing plugins, MCP servers, skills, commands, profiles, and sessions.

### Dashboard
- **Overview page** — stat cards (plugins, MCPs, skills, profiles, sessions), usage metrics (top skills/tools bar charts), recent sessions, environment health, MCP server usage
- **Recommended page** — AI-generated recommendations grouped by 🏆 Top and 🔥 Trending
  - 60 recommendations (20 MCP + 20 Plugin + 20 Skill, each split 10 Top / 10 Trending)
  - Fetches live data from skills.sh, npm registry, official MCP registry, and Claude Code marketplaces
  - Excludes already-installed items automatically
  - Filter by type and category; "Find More" search at the bottom
  - Refresh button regenerates recommendations
- **Configuration pages** with sub-tabs:
  - **Plugins** — Installed / Marketplace / Manage Marketplaces tabs; per-marketplace grouping; detail panel
  - **MCP Servers** — User / System sections; MCP Store tab with Top 20 defaults + search
  - **Skills** — User / System sections; Skill Store tab with Top defaults + search; fullscreen markdown viewer with edit mode for user skills
  - **Commands** — fullscreen markdown viewer with edit mode for user commands
  - **Settings** — model selector, env vars editor, hooks editor
- **Profiles page** — simplified to Activate / Export / Delete actions per profile; Export / Import sub-tab with merge / replace strategies
- **Save to Profile** — button on Configuration sub-tabs snapshots live config into a named profile
- **Activity page** — all Claude Code sessions across projects; Recent (last 10) / All tabs; session detail panel with instruction history
- **Theme switcher** — System / Dark / Light modes via CSS variables
- **Real-time sync** — SSE + SWR; config changes in terminal immediately reflected in dashboard

### MCP Server (9 tools)
- `ccm_list_profiles`, `ccm_create_profile`, `ccm_activate_profile`, `ccm_update_profile`, `ccm_export_profile`, `ccm_import_profile`, `ccm_delete_profile`
- `ccm_open_dashboard`, `ccm_dashboard_status`

### Skills (2)
- `ccm-dashboard` — launch dashboard
- `ccm-recommendations` — generate 60 AI-powered personalized recommendations based on user's installed items

### Commands (5)
- `/ccm` — quick access (status, dashboard, profile operations)
- `/ccm-dashboard` — start dashboard with pre-built server (no install needed)
- `/ccm-profile` — list, create, activate, delete profiles
- `/ccm-export` — export profile to JSON file
- `/ccm-import` — import profile from JSON file

### Architecture
- **Turborepo monorepo** with 5 packages: `@ccm/types`, `@ccm/core`, `@ccm/mcp`, `@ccm/cli`, `@ccm/dashboard`
- **Express + Vite** dashboard (migrated from Next.js)
  - Build: ~3.5s (was 30s+)
  - Dist size: 2MB (was 76MB)
  - Startup: <1s (was 2-3s)
  - No npm install needed at runtime
- **Server-side caching** for plugins, MCP servers, skills, sessions (5-10s TTL)
- **157+ unit tests** across all packages

### Installation
- **Claude Code plugin** — `claude --plugin-dir <path>` for local or `/plugin install claude-config-manager@canwa-claude-plugins` from marketplace
- **npm package** — `npm install -g claude-config-manager` then `claude-config start`

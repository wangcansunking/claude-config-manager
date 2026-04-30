# Changelog

All notable changes to claude-config-manager are documented here.

## [1.2.0] — 2026-04-30

### Added
- **In-CLI Ink TUI.** `claude-config` (no args) now launches a full-terminal UI mirroring the dashboard's browse + high-frequency actions: toggle plugin/MCP/skill enable, switch profile, copy session resume id, copy recommended install command. No browser or HTTP server required. Dashboard remains supported via `claude-config start` for demos and rich detail views. v2 will add heavy mutations (create/import/export profile, settings field edit, install/uninstall) and a `:` command palette.
- **i18n shared between TUI and dashboard.** Locales relocated from `@ccm/dashboard/client/i18n` into `@ccm/core/i18n`; the dashboard re-exports.
- **`McpManager.toggle()` and `SkillScanner.toggle()` in `@ccm/core`.** New methods mirror `PluginManager.toggle`'s pattern (write `enabledMcpServers` / `enabledSkills` map to `~/.claude/settings.json`). Adds `enabled?: boolean` field to `SkillDefinition`.
- **`stdin.setRawMode(true) + resume()` on TUI mount.** Required for input to flow in PTY contexts (caught by Task 24 E2E).

### Changed
- Dashboard build pulls locales from `@ccm/core/i18n` subpath export instead of local files.

## [1.1.4] — 2026-04-28

### Fixed
- **Dashboard startup paths still launched the old Next.js server.** The dashboard was migrated to Vite + Express (bundled into `packages/dashboard/dist/server.mjs`), but three startup entry points still spawned `npx next start -p 3399` and broke at runtime: the root `package.json` `start` script, the `auto-start-dashboard.mjs` SessionStart hook, and the `claude-config start` CLI command (in both `src/commands/start.ts` and the committed `dist/commands/start.js`). All three now spawn `node packages/dashboard/dist/server.mjs` directly with `PORT` passed via env. The `--dev` flag on the CLI now delegates to `npm run dev` (Vite + tsx watch) inside the dashboard workspace. Skill files (`skills/ccm-dashboard/Skill.md`, `commands/ccm-dashboard/Skill.md`) were already pointing at the new server and stay unchanged.

## [1.1.3] — 2026-04-20

### Fixed
- **Auto-bump companion PR body rendered malformed.** The cross-repo bump script used `JSON.stringify` + shell-interpolated `--body`, which (a) let bash command-substitute any backticks in the text and (b) never translated `\n`. The marketplace PR opened by the first live run (`claude-config-manager` 1.1.1 → 1.1.2) showed literal `\n` and an empty slot where `.claude-plugin/marketplace.json` should have been. Script now writes the body to a tempfile and passes it via `--body-file` with `execFileSync` (no shell, no escaping surprises).

([#11](https://github.com/wangcansunking/claude-config-manager/pull/11))

## [1.1.2] — 2026-04-20

### Added
- **`theme-color` meta tag on dashboard.** `<meta name="theme-color" content="#D97757">` added to `index.html`, matching the terracotta favicon from 1.1.1. Mobile browsers (iOS Safari, Chrome Android) use this to tint the address bar / status bar area so the dashboard reads as a branded app rather than a raw page.

([#10](https://github.com/wangcansunking/claude-config-manager/pull/10))

## [1.1.1] — 2026-04-20

### Added
- **Dashboard favicon.** Browser tab now shows a terracotta-orange "C + gear" app icon instead of the default blank. Five assets shipped under `packages/dashboard/public/` (`favicon.ico` multi-res 16/32/48, plus standalone 32 / 192 / 512 PNG and the 691×691 trimmed source). `index.html` references them via `<link rel="icon">` and `apple-touch-icon`. Icon generated with Azure `gpt-image-1.5`, post-processed (whitespace trim + resize) with Pillow.

## [1.1.0] — 2026-04-20

### Changed
- **MCP server slimmed from 9 → 2 tools.** `ccm_dashboard_status` and `ccm_open_dashboard` stay; every profile / plugin / MCP / skill / settings operation moved behind the `claude-config` CLI, which the `/ccm-*` slash commands shell into via Bash. Rationale: keep the model's tool-selection surface small (fewer tool descriptions = fewer tokens = better tool pick quality) while still exposing the full operational surface to users via CLI and to agents via slash commands.
- **Slash commands (`/ccm`, `/ccm-dashboard`, `/ccm-export`, `/ccm-import`, `/ccm-profile`)** rewritten to invoke `claude-config` in Bash instead of calling MCP tools. CLI remains the single source of truth for state-changing operations.

### Fixed
- **Dashboard error surface hardened.** Per-route `res.status(500)` catch blocks replaced with a typed `errorHandler` middleware that maps domain errors to the right HTTP code: `NotFoundError`→404, `ValidationError`→400, `ConflictError`→409, `FileNotFoundError`→404, `PluginInstallError`→502. Response carries `{ error, code? }` where `code` is the `CcmError.code` for easier client-side branching.
- **Dashboard now binds to `127.0.0.1` by default** instead of `0.0.0.0`. Overridable via `HOST` env var. Closes a LAN-exposure gap when the laptop joins a shared network.
- **`express-rate-limit` on `/api/*`** at 120 req/min per IP (overridable via `CCM_RATE_LIMIT_MAX`). Protects against runaway clients without throttling the legitimate bursty dashboard page-load pattern.
- **`@ccm/mcp` server version now reads from `package.json` at startup** instead of the hardcoded `"1.0.0-draft"` string. Eliminates the drift between advertised version and package version on every release.
- **`profile-manager` path traversal hardening.** `restoreUserAssets` switched from a blacklist regex (`[\\/.]` → `_`) to a whitelist (`[^a-zA-Z0-9_-]` → `_`) and refuses names that start with `.`, defusing `..` / hidden-path attacks even on exotic filenames.
- **`profile-manager` cleanup.** `unlink` hoisted to the top-level `fs/promises` import; previously imported dynamically twice inside `delete()`.
- **Dashboard routes use manager singletons.** Every `new ProfileManager(home)` / `new PluginManager(home)` etc. across the 10 route files is now created once at module scope instead of per request.
- **`@ccm/mcp` bundle no longer crashes at runtime.** `esbuild`'s ESM `--format=esm` output for `simple-git` (transitive CJS dep) produced a dynamic-require call that Node's ESM loader rejected. Added the same `createRequire` banner the dashboard bundle already uses.

### Removed
- **MCP tool groups `profile-tools`, `query-tools`, `mutation-tools`** — the source files, dist output, and their tests. Everything they did is now reachable via `claude-config <...>`.
- **Stale `C:\Users\canwa\...` Windows paths** in `.claude/settings.local.json` (now gitignored) and `docs/migration/USE-CASES.md`.

### Docs
- README restructured to lead with the marketplace install block at the top (before the hero screenshot) and now documents the 2-tool / CLI-first architecture.
- Workspace-level `CLAUDE.md` added at `personal-claude-code-workspace/CLAUDE.md` codifying the release rule: bump plugin version + README + CHANGELOG, then bump marketplace version + README.

## [1.0.8] — 2026-04-18

### Fixed
- **Skill Store was empty and search returned no results**: The server spawned the `skills` CLI from `process.cwd()/../../node_modules/skills/bin/cli.mjs`, which (a) resolved to the wrong place when the dashboard was started from a different cwd (e.g. via the plugin entrypoint from `${CLAUDE_PLUGIN_ROOT}`) and (b) failed entirely in git-installed plugin copies because `node_modules/` is gitignored and never shipped. Also, `skills find popular` only returns ~2 skills, and the regex skipped entries without an `owner/repo` slash. Switched both `/api/skills/top` + `/api/skills/search` and the `/api/recommendations` skill helpers to call `https://skills.sh/api/search?q=<q>` directly via `fetch()` — no CLI dependency, no cwd assumptions, and the Top 20 is now assembled by merging results from several broad queries (`agent`, `code`, `react`, `python`, `typescript`) sorted by install count.
- **Session slide panel had near-transparent background in light theme**: `SessionSlidePanel` used `var(--card-bg)` (2% alpha) as its panel background, so the page behind bled through and the panel read as unstyled/white. Switched to solid `var(--bg-secondary)` (matches the sibling `DetailPanel` pattern), removed the duplicate header background, and promoted inner metadata/history cards to `var(--bg-tertiary)` with a border so they separate cleanly from the panel body.
- **Profile export/import — skills were silently dropped**: `importProfile()` did not extract the `skills` field from imported data, so any skills bundled in an export were lost on import. Now extracted in both `ProfileExport` and `Profile` format branches.
- **Profile activate did not reapply mcpServers / hooks / enabledPlugins**: `activate()` wrote only `profile.settings` to `settings.json`, ignoring the top-level `mcpServers`, `hooks`, and `plugins[].enabled` fields. This meant an imported profile with populated top-level fields but an empty nested `settings` would not take effect. Now merges all three into the written settings.
- **Merge import strategy dropped hooks and user assets**: Previously only `settings` and `mcpServers` were deep-merged. Now `hooks`, `commands`, and `skills` also merge — assets merge by name with incoming entries overriding existing ones.

### Added
- **Plugin detail panel now shows what the plugin provides** — opening a plugin reveals three new sections: **Commands** (each `/name` + description from `commands/*/Skill.md` or flat `commands/*.md`), **Skills** (name + description from `skills/*/Skill.md`), and **MCP Servers** (each declared `.mcp.json` entry with its `type`, launch command or URL, and a Copy button so you can paste it into your own terminal to inspect the server's tools and prompts). Handles both the wrapped (`{mcpServers: {...}}`) and legacy flat (`{name: {...}}`) `.mcp.json` schemas plus HTTP-transport servers.
- **Click any command or skill in the plugin detail panel to preview its full markdown** — opens a fullscreen read-only viewer (same markdown rendering as the Skills tab, but no Edit button since plugin files are managed by the plugin install). Uses a React portal to escape the DetailPanel's `transform` stacking context so the preview actually covers the viewport.
- **`GET /api/plugins/:name/contents`** — returns `{ commands, skills, mcpServers }` by scanning the plugin's installPath. Commands/skills are parsed from YAML frontmatter.
- **Session name + resume support** — Claude Code now supports `/rename` on sessions. The dashboard reads the `name` field from `~/.claude/sessions/<pid>.json` and renders it in the Activity list, the session slide panel header, and the Overview "Recent Sessions" card. A "Resume" copy button on each row and in the panel header copies `claude --resume <sessionId>` to the clipboard for one-click resumption.
- **Full-content skill and command snapshots**: `create()` now reads each `~/.claude/skills/<name>/Skill.md` and `~/.claude/commands/<name>/Skill.md` and embeds the content into the profile. `activate()` writes these files back out, so switching profiles restores user-authored skills/commands, not just plugin references.
- `UserAssetSchema` in `@ccm/types` — `{ name: string, content: string }` — used for both `skills` and `commands` arrays in `Profile` and `ProfileExport`.
- 6 new round-trip tests in `profile-manager.test.ts` covering skill capture, export, import, activate restoration, settings merge, and merge-strategy asset de-duplication (31 tests total, all passing).

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
- **Claude Code plugin** — `claude --plugin-dir <path>` for local or `/plugin install claude-config-manager@can-claude-plugins` from marketplace
- **npm package** — `npm install -g claude-config-manager` then `claude-config start`

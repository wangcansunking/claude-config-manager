# Claude Config Manager - Complete Use Cases & Migration Spec

> Generated: 2026-04-16
> Dashboard URL: http://localhost:3399
> App Title: "Claude Config Manager" (version 1.0.0-draft)
> Tech Stack: Next.js 14 (App Router), React, Tailwind CSS, SWR, chokidar (SSE)

---

## Table of Contents

1. [Dashboard (/)](#1-dashboard-)
2. [Recommended (/recommended)](#2-recommended-recommended)
3. [Configuration - Plugins (/config/plugins)](#3-configuration---plugins-configplugins)
4. [Configuration - MCP Servers (/config/mcp)](#4-configuration---mcp-servers-configmcp)
5. [Configuration - Skills (/config/skills)](#5-configuration---skills-configskills)
6. [Configuration - Commands (/config/commands)](#6-configuration---commands-configcommands)
7. [Configuration - Settings (/config/settings)](#7-configuration---settings-configsettings)
8. [Profiles (/profiles)](#8-profiles-profiles)
9. [Activity (/activity)](#9-activity-activity)
10. [Theme Switching](#10-theme-switching)
11. [Navigation](#11-navigation)
12. [Shared Components](#12-shared-components)
13. [API Endpoints](#13-api-endpoints)
14. [Real-time Features](#14-real-time-features)
15. [URL Redirects](#15-url-redirects)

---

## 1. Dashboard (/)

### UC-01: Dashboard Overview
**Page:** `/`
**Screenshot:** `screenshots/01-dashboard-overview.png`
**Description:** Main landing page showing a high-level overview of the Claude Code environment.
**Data source:** `/api/stats`, `/api/metrics`, `/api/sessions`

#### Components Visible

1. **Header:** "Overview" (h1)
2. **5 Stat Cards** (horizontal row):
   - PLUGINS: `14`
   - MCP SERVERS: `7`
   - SKILLS: `30`
   - PROFILES: `1`
   - SESSIONS: `2`
3. **Top Skills** bar chart (h3):
   - Each row: skill name (truncated with tooltip), horizontal purple bar (proportional to max), count number, relative date
   - Shows top 5 skills: superpowers:brainstorming (15), superpowers:writing-plans (8), superpowers:executing-plans (5), init (4), superpowers:subagent-dri... (3)
   - Bar color: `var(--accent)` (purple/indigo)
4. **Top Tools** bar chart (h3):
   - Same layout as Top Skills
   - Shows top 8 tools: Read (537), Bash (365), Edit (201), Write (181), TaskUpdate (139), Glob (76), TaskCreate (73), SendMessage (54)
5. **Recent Sessions** card (h3):
   - Header with "View all" button (navigates to /activity)
   - Shows up to 5 most recent sessions
   - Each row: green/gray dot (alive status), cwd path (bold), relative time, last message
   - Rows are clickable (cursor: pointer)
6. **Environment Health** card (h3):
   - Model: `opus[1m]` + green checkmark
   - Plugins: `14 active` (green tag)
   - MCP Servers: `7 configured` (green tag)
   - Hooks: `1 hook`
   - Env Vars: `1 set` (green tag)
   - Each row has an SVG icon on the left
7. **MCP Server Usage** collapsible section (h2):
   - Click chevron to expand/collapse
   - When expanded, shows MCP server rows
   - Each row: server name, "X calls" tag, "Y tools" tag, expand chevron

**Interactions:**
- Click stat card -> no action (static display)
- Click "View all" on Recent Sessions -> navigates to `/activity`
- Click session row -> navigates to `/activity` (with session context)
- Click MCP Server Usage header -> toggles expand/collapse
- Click MCP server row chevron -> expands to show individual tool breakdown

**Edge cases:**
- Stats loading: numbers show as-is from API (no loading skeleton observed)
- Empty metrics: Top Skills/Tools cards would be empty lists
- No sessions: Recent Sessions shows empty area

---

### UC-02: Dashboard Dark Mode
**Page:** `/`
**Screenshot:** `screenshots/10-dark-mode.png`
**Description:** Dashboard in dark theme - all cards use dark backgrounds, text is light, bars remain purple.

---

### UC-03: Dashboard Light Mode
**Page:** `/`
**Screenshot:** `screenshots/10b-light-mode.png`
**Description:** Dashboard in light theme - white/light gray backgrounds, dark text.

---

## 2. Recommended (/recommended)

### UC-04: Recommendations Page
**Page:** `/recommended`
**Screenshot:** `screenshots/02-recommended.png`
**Description:** AI-powered recommendations for plugins, MCP servers, and skills based on current setup.
**Data source:** `/api/recommendations` (GET for cached, POST to regenerate)

#### Components Visible

1. **Header:** "Recommended" (h1) + subtitle "AI-powered recommendations based on your setup"
2. **Refresh button** (top-right, primary variant) - calls POST /api/recommendations to regenerate
3. **Generated timestamp:** "Generated 4/16/2026, 4:36:20 PM (static fallback)"
4. **Filter chips** (horizontal row):
   - Type filters: All (active by default), Plugins, MCP Servers, Skills
   - Category filters: development, productivity, database, ai, devops, testing, documentation, design
   - Active chip has filled background, inactive is outlined
5. **Recommendation cards** (2-column grid):
   - Each card contains:
     - Icon: lightning bolt for skills, plug for MCP, puzzle for plugins
     - Name (monospace, underlined)
     - Popularity tag: "Trending", "Popular", "Rising", "New"
     - Category tag: e.g., "development", "design"
     - Description paragraph
     - Reason paragraph (italic)
     - Action buttons: "Copy Install" (primary), "View" (link to external URL)
     - Type label: "skill", "mcp", or "plugin" (bottom-right)
6. **Find More section** (bottom):
   - "Find More" heading (h2)
   - Description text
   - Search input: "Search skills and MCP servers..."

**Interactions:**
- Click "Refresh" -> POST /api/recommendations, replaces card list
- Click filter chip -> filters visible cards by type/category
- Click "Copy Install" -> copies install command to clipboard
- Click "View" -> opens external URL in new tab
- Type in "Find More" search -> triggers search against skills.sh and MCP registries
- Click "All" chip -> removes all filters

**Edge cases:**
- No cache: shows "No recommendations yet" with "Generate" button
- Static fallback: shows "(static fallback)" in timestamp when using built-in recommendations
- Model-generated: shows model name in timestamp when AI-generated

**API Response Structure (`/api/recommendations` GET):**
```json
{
  "recommendations": [
    {
      "name": "vercel-labs/agent-skills@vercel-react-best-practices",
      "type": "skill",
      "description": "React best practices from Vercel",
      "reason": "Most popular skill with 320K+ installs",
      "popularity": "Trending",
      "installCommand": "npx skills add ...",
      "url": "https://skills.sh/...",
      "category": "development"
    }
  ],
  "generatedAt": "2026-04-16T08:36:20.867Z",
  "model": "static"
}
```

---

## 3. Configuration - Plugins (/config/plugins)

### UC-05: Installed Plugins Tab
**Page:** `/config/plugins`
**Screenshot:** `screenshots/03-config-plugins-installed.png`
**Description:** Lists all installed plugins grouped by marketplace.
**Data source:** `/api/plugins`

#### Components Visible

1. **Config sub-tabs** (top bar): Plugins (active), MCP Servers, Skills, Commands, Settings
2. **Page heading:** "Plugins" (h1)
3. **Sub-tabs:** Installed (active), Marketplace, Manage Marketplaces
4. **Search box:** "Search installed plugins..."
5. **Collapsible marketplace group:** "claude-plugins-official" with count badge (14)
   - Click header to expand/collapse
   - Each plugin item row contains:
     - Avatar circle with first letter (purple background)
     - Plugin name: `name@marketplace` (e.g., "frontend-design@claude-plugins-official")
     - Version tag: "vunknown" or "v1.0.0" (gray)
     - Marketplace tag: "claude-plugins-official" (blue)
     - Status tag: "Enabled" (green)
     - Chevron arrow (right side)

**Interactions:**
- Click plugin row -> opens DetailPanel (slide from right)
- Type in search -> filters plugins by name
- Click marketplace group header -> collapses/expands that group

---

### UC-06: Plugin Detail Panel
**Page:** `/config/plugins` (with panel open)
**Screenshot:** `screenshots/03b-plugin-detail-panel.png`
**Description:** Slide-in panel showing plugin details and actions.

#### Components Visible (DetailPanel)

1. **Header:**
   - Avatar circle with first letter
   - Plugin name (bold)
   - Marketplace subtitle
   - Tags: version, marketplace, status
2. **Close button** (X icon, top-right)
3. **METADATA section:**
   - Marketplace: `claude-plugins-official`
   - Installed: `2/5/2026`
   - Last Updated: `4/8/2026`
   - Install Path: full filesystem path
4. **STATUS section:**
   - "Enabled" tag (green)
5. **Footer actions:**
   - "Check Updates" button (secondary)
   - "Disable" button (secondary)
   - "Remove" button (danger/red)

**Interactions:**
- Click "Check Updates" -> checks for plugin updates
- Click "Disable" -> PATCH /api/plugins/[name] with `{enabled: false}`, toggles to "Enable"
- Click "Remove" -> shows ConfirmationDialog, then DELETE /api/plugins/[name]
- Click X or overlay -> closes panel

---

### UC-07: Plugin Marketplace Tab
**Page:** `/config/plugins` (Marketplace tab)
**Screenshot:** `screenshots/03c-plugins-marketplace.png`, `screenshots/03c2-plugins-marketplace-top.png`
**Description:** Browse available plugins from registered marketplaces.
**Data source:** `/api/marketplaces/[name]/plugins`

#### Components Visible

1. **Marketplace selector dropdown** (Select component): "claude-plugins-official" (default)
2. **Search box:** "Search available plugins..."
3. **Plugin count:** "140 plugins" (right side)
4. **Category groups** (collapsible sections):
   - AUTOMATION (1), DATABASE (9), etc.
   - Each plugin item:
     - Avatar circle
     - Name (bold)
     - "Available" tag (green)
     - Description text
     - Install command (monospace): `/plugin install name@marketplace`
     - Copy button (clipboard icon)
     - Chevron

**Interactions:**
- Change marketplace dropdown -> fetches new plugin list
- Type in search -> filters by name/description
- Click copy button -> copies install command
- Click plugin row -> could show more details (chevron)

---

### UC-08: Manage Marketplaces Tab
**Page:** `/config/plugins` (Manage Marketplaces tab)
**Screenshot:** `screenshots/03d-plugins-manage-marketplaces.png`
**Description:** Add/remove plugin marketplace registries.
**Data source:** `/api/marketplaces`

#### Components Visible

1. **Add Marketplace form:**
   - Name field: placeholder "e.g., my-plugins"
   - GitHub Repository field: placeholder "e.g., owner/repo-name"
   - "Add Marketplace" button (primary)
   - Note text: explains that adding registers it, but `/marketplace add` clones the repo
2. **REGISTERED MARKETPLACES section:**
   - Each marketplace item:
     - Avatar circle with first letter
     - Name (bold)
     - Tags: repo path (blue), source "github" (gray), "Updated: date"
     - "Remove" button (danger/red)

**Interactions:**
- Fill form + click "Add Marketplace" -> POST /api/marketplaces
- Click "Remove" -> DELETE /api/marketplaces/[name] (likely with confirmation)

**API Response Structure (`/api/marketplaces`):**
```json
[
  {
    "name": "claude-plugins-official",
    "source": { "source": "github", "repo": "anthropics/claude-plugins-official" },
    "installLocation": "C:\\Users\\canwa\\.claude\\plugins\\marketplaces\\claude-plugins-official",
    "lastUpdated": "2026-04-16T12:40:48.660Z"
  }
]
```

---

## 4. Configuration - MCP Servers (/config/mcp)

### UC-09: Installed MCP Servers Tab
**Page:** `/config/mcp`
**Screenshot:** `screenshots/04-config-mcp-installed.png`
**Description:** Lists installed MCP servers grouped by source (User/System).
**Data source:** `/api/mcp-servers`

#### Components Visible

1. **Header:** "MCP Servers" (h1) + "Add Server" button (primary, top-right)
2. **Sub-tabs:** Installed (active), MCP Store
3. **User section** (collapsible): "User" with count badge (4)
   - Each MCP item:
     - Green dot (status indicator)
     - Server name (bold)
     - Command description (gray, monospace): e.g., "workiq mcp", "mcp-server-azuredevops O365Exchange"
     - "Connected" tag (green) on right
     - Chevron arrow
4. **System section** (collapsible): "System" with count badge (3)
   - Same layout as User section
   - Shows: context7, playwright, figma

**Interactions:**
- Click "Add Server" -> opens add server dialog/form
- Click MCP server row -> opens DetailPanel
- Click section header -> collapses/expands User or System group

**API Response Structure (`/api/mcp-servers`):**
```json
[
  {
    "name": "workiq",
    "config": { "tools": ["*"], "args": ["mcp"], "command": "workiq" },
    "source": "user"
  },
  {
    "name": "figma",
    "config": { "type": "http", "url": "https://mcp.figma.com/mcp" },
    "source": "system"
  }
]
```

---

### UC-10: MCP Server Detail Panel
**Page:** `/config/mcp` (with panel open)
**Screenshot:** `screenshots/04b-mcp-detail-panel.png`
**Description:** Slide-in panel showing MCP server config and actions.

#### Components Visible (DetailPanel)

1. **Header:**
   - Green dot + server name (bold)
   - Subtitle: "MCP Server"
   - "Connected" tag (green)
2. **CONNECTION CONFIG section:**
   - Command: `mcp-server-azuredevops`
   - Args: `O365Exchange`
   - Scope: `Global`
3. **TOOLS PROVIDED section:**
   - "Tools available when connected" tag (when tools not listed inline)
4. **Footer actions:**
   - "Edit Config" button (secondary)
   - "Restart" button (secondary)
   - "Remove" button (danger/red)

**Interactions:**
- Click "Edit Config" -> opens edit form for the MCP server configuration
- Click "Restart" -> restarts the MCP server connection
- Click "Remove" -> DELETE /api/mcp-servers/[name] with confirmation

---

### UC-11: MCP Store Tab
**Page:** `/config/mcp` (MCP Store tab)
**Screenshot:** `screenshots/04c-mcp-store.png`
**Description:** Search and install MCP servers from public registries.
**Data source:** `/api/mcp-registry?q=`

#### Components Visible

1. **Search box:** "Search MCP servers..."
2. **Source filter chips:** All (active), Official Registry, npm, Smithery
3. **Empty state:**
   - "Search for MCP servers across npm, Official MCP Registry, and Smithery."
   - "Type a search term above to get started."

**Interactions:**
- Type in search + Enter/debounce -> calls `/api/mcp-registry?q=query`
- Click filter chip -> filters results by source
- Results show: name, description, source badge, version, install command
- Click "Install" on result -> opens install dialog

**API Response Structure (`/api/mcp-registry?q=github`):**
```json
{
  "results": [
    {
      "name": "copilot-figma-bridge",
      "description": "One-command setup for Figma MCP + GitHub Copilot",
      "source": "npm",
      "version": "1.3.3",
      "npmUrl": "https://www.npmjs.com/package/copilot-figma-bridge",
      "installCommand": "npx -y copilot-figma-bridge",
      "score": 108.66
    }
  ]
}
```

---

## 5. Configuration - Skills (/config/skills)

### UC-12: Installed Skills Tab
**Page:** `/config/skills`
**Screenshot:** `screenshots/05-config-skills.png`
**Description:** Lists all installed skills grouped by User/System, with System skills further grouped by plugin.
**Data source:** `/api/skills`

#### Components Visible

1. **Header:** "Skills" (h1)
2. **Sub-tabs:** Installed (active), Skill Store
3. **Search box:** "Search skills..."
4. **User section** (collapsible): "User" (6 skills)
   - Each skill row: monospace name, "skill" tag on right
   - User skills: ado-auto-work, ado-code-review, ado-create-pr, code-review-fix-loop, local-code-review, validate-build
5. **System section** (collapsible): "System" (24 skills)
   - Sub-grouped by plugin:
     - frontend-design (1): frontend-design skill
     - superpowers (14): brainstorming, dispatching-parallel-agents, executing-plans, etc.
     - figma (7): figma-code-connect, figma-create-design-system-rules, etc.
     - claude-md-management (1): claude-md-improver
     - playground (1): playground
   - Each sub-group is collapsible with plugin name + count badge
   - System skills show description text below the name

**Interactions:**
- Click user skill row -> opens fullscreen markdown viewer (editable)
- Click system skill row -> opens fullscreen markdown viewer (read-only)
- Type in search -> filters skills by name/description
- Click section/plugin group header -> collapse/expand

**API Response Structure (`/api/skills`):**
```json
[
  {
    "name": "ado-auto-work",
    "filePath": "C:\\Users\\canwa\\.claude\\skills\\ado-auto-work\\Skill.md",
    "pluginName": "user",
    "source": "user"
  },
  {
    "name": "brainstorming",
    "description": "You MUST use this before any creative work...",
    "filePath": "C:\\...\\superpowers\\5.0.7\\skills\\brainstorming\\Skill.md",
    "source": "system",
    "pluginName": "superpowers@claude-plugins-official"
  }
]
```

---

### UC-13: Skill Fullscreen Markdown Viewer
**Page:** `/config/skills` (with viewer open)
**Screenshot:** `screenshots/05b-skill-fullscreen-viewer.png`
**Description:** Full-screen overlay rendering skill markdown content with edit capability for user skills.
**Data source:** `/api/skills/content?path=`

#### Components Visible

1. **Top bar:**
   - Skill name (monospace): `ado-auto-work`
   - Tags: "User" (blue), "canwa" (gray)
   - File path (right side, monospace)
   - "Edit" button (right side, only for user skills)
   - Close button (X)
2. **Markdown content area:**
   - Full rendered markdown with headings, code blocks, lists
   - Scrollable

**Interactions:**
- Click "Edit" -> switches to textarea editor mode
- In edit mode: "Save" and "Cancel" buttons appear
- Click "Save" -> POST /api/skills/update with `{filePath, content}`
- Click "Cancel" -> reverts changes and returns to viewer
- Click X or press Escape -> closes fullscreen viewer
- System skills: Edit button not shown (read-only)

---

### UC-14: Skill Store Tab
**Page:** `/config/skills` (Skill Store tab)
**Description:** Search skills.sh for installable skills.
**Data source:** `/api/skills/search?q=`

#### Components Visible

1. **Search box:** "Search skills on skills.sh..."
2. **Empty state text:** Prompts user to search
3. **Results (after search):** Each result shows name, installs count, URL, install command

**Interactions:**
- Type query + debounce -> calls `/api/skills/search?q=query`
- Click install command -> copies to clipboard

---

## 6. Configuration - Commands (/config/commands)

### UC-15: Commands Page
**Page:** `/config/commands`
**Screenshot:** `screenshots/06-config-commands.png`
**Description:** Lists user-defined slash commands.
**Data source:** `/api/commands`

#### Components Visible

1. **Header:** "Commands" (h1)
2. **User section** (collapsible): "User" (1 command)
   - Each command row:
     - Command name in monospace with "/" prefix: `/mcp-npx-fix`
     - Description text: "Migrate MCP plugin configs from npx to globally installed packages"
     - Chevron arrow (right)

**Interactions:**
- Click command row -> opens fullscreen markdown viewer (same as skills)
- Fullscreen viewer shows "Edit" button for user commands
- Click "Edit" -> switches to edit mode (same as skill editing)

**API Response Structure (`/api/commands`):**
```json
[
  {
    "name": "mcp-npx-fix",
    "description": "Migrate MCP plugin configs from npx to globally installed packages",
    "filePath": "C:\\Users\\canwa\\.claude\\commands\\mcp-npx-fix\\Skill.md",
    "source": "user"
  }
]
```

**Edge cases:**
- No commands: shows empty "User" section
- System commands: would show in a "System" section (none currently)

---

## 7. Configuration - Settings (/config/settings)

### UC-16: Settings Page
**Page:** `/config/settings`
**Screenshot:** `screenshots/07-config-settings.png`
**Description:** Configure model, environment variables, and hooks.
**Data source:** `/api/settings`, `/api/settings/env`

#### Components Visible

1. **Header:** "Settings" (h1)
2. **Model Configuration** section:
   - "DEFAULT MODEL" label
   - Custom Select dropdown: `opus[1m]` (current model)
   - Text input: "Or type a custom model ID..." (value: `opus[1m]`)
   - "Save Model" button (primary)
3. **Environment Variables** section:
   - Existing vars listed as rows:
     - Key (monospace, purple): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
     - Value (masked): `--------`
     - "Show" button (toggle visibility)
     - Remove button (X icon, red)
   - Add new var form:
     - KEY input
     - value input
     - "Add" button (primary)
4. **Hooks** section:
   - Displays configured hooks by event type
   - Shows "PreToolUse" tag
   - Hook config displayed in code format

**Interactions:**
- Change model dropdown -> updates text input
- Type custom model ID -> overrides dropdown
- Click "Save Model" -> PATCH /api/settings with `{model: value}`
- Click "Show" on env var -> toggles value visibility
- Click X on env var -> DELETE /api/settings/env/[key]
- Fill KEY + value + click "Add" -> PUT /api/settings/env
- Hooks section is read-only (display only)

**API Response Structure (`/api/settings`):**
```json
{
  "model": "opus[1m]",
  "enabledPlugins": { "frontend-design@claude-plugins-official": true, ... },
  "autoUpdatesChannel": "latest",
  "skipDangerousModePermissionPrompt": true,
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" },
  "hooks": {
    "PreToolUse": [{
      "hooks": [{ "statusMessage": "...", "command": "...", "type": "command" }],
      "matcher": "mcp__metagraph__confirm_write"
    }]
  }
}
```

---

## 8. Profiles (/profiles)

### UC-17: Profiles Tab
**Page:** `/profiles`
**Screenshot:** `screenshots/08-profiles.png`
**Description:** Manage configuration profiles for switching between setups.
**Data source:** `/api/profiles`

#### Components Visible

1. **Header:** "Profiles" (h1) + "New Profile" button (primary, top-right)
2. **Sub-tabs:** Profiles (active), Export / Import
3. **Profile cards** (grid layout):
   - Each card:
     - Avatar circle with first letter
     - Profile name (h3): "default"
     - Created date: "Created 3/26/2026"
     - Count tags: "0 plugins", "0 MCPs"
     - Action buttons: "Activate" (primary), "Edit" (secondary), "Export" (secondary), "Delete" (danger)

**Interactions:**
- Click "New Profile" -> creates new profile (prompts for name)
- Click "Activate" -> POST /api/profiles/[name]/activate
- Click "Edit" -> opens inline editor for profile configuration
- Click "Export" -> downloads profile configuration
- Click "Delete" -> shows ConfirmationDialog, then DELETE /api/profiles/[name]

**API Response Structure (`/api/profiles`):**
```json
[
  {
    "name": "default",
    "createdAt": "2026-03-26T06:29:06.367Z",
    "updatedAt": "2026-03-26T06:29:06.367Z"
  }
]
```

---

### UC-18: Export / Import Tab
**Page:** `/profiles` (Export / Import tab)
**Screenshot:** `screenshots/08b-profiles-export-import.png`
**Description:** Export configuration to file or import from file.

#### Components Visible

1. **Export panel** (left):
   - PROFILE: Select dropdown "Select a profile..."
   - INCLUDE checkboxes:
     - [x] Plugins
     - [x] MCP Servers
     - [x] Commands
     - [x] Settings
     - [ ] Credentials (with "sensitive" red tag - unchecked by default)
   - FORMAT toggle: JSON (active) | YAML
   - "Export to File" button (primary, disabled until profile selected)
2. **Import panel** (right):
   - Drag & drop zone: "Drop JSON or YAML file here" + "or click to browse"
   - Upload icon
   - Action buttons:
     - "Merge (keep existing)" (secondary, disabled until file loaded)
     - "Replace All" (danger, disabled until file loaded)

**Interactions:**
- Select profile dropdown -> enables "Export to File"
- Toggle checkboxes -> selects what to include in export
- Toggle JSON/YAML -> changes export format
- Click "Export to File" -> POST /api/export, downloads file
- Drag file to drop zone -> loads file content
- Click drop zone -> opens file browser
- Click "Merge (keep existing)" -> POST /api/import with strategy "merge"
- Click "Replace All" -> POST /api/import with strategy "replace"

---

## 9. Activity (/activity)

### UC-19: Activity / Sessions Page
**Page:** `/activity`
**Screenshot:** `screenshots/09-activity.png`
**Description:** View all Claude Code sessions, grouped by project directory.
**Data source:** `/api/sessions`

#### Components Visible

1. **Header:** "Sessions" (h1) + subtitle "2 running, 40 total"
2. **Tab buttons:** Recent (10), All Sessions (active)
3. **Search box** (right): "Search sessions..."
4. **Running section** (collapsible): green dot + "Running" + count badge (2)
   - Each running session:
     - Green dot
     - Session ID (monospace, purple link)
     - PID badge: "PID 26544"
     - MCP indicator (.mcp.json badge with plug icon if project has .mcp.json)
     - Working directory (bold)
     - Relative time + last message (with chat bubble icon)
     - Chevron arrow
5. **Project groups** (collapsible, below running):
   - Folder icon + project path + session count badge
   - Groups: C:\repos\ccm-test (5), C:\repos\claude-go (1), C:\repos\album-go (2), etc.

**Interactions:**
- Click "Recent (10)" -> shows only 10 most recent sessions
- Click "All Sessions" -> shows all sessions grouped by project
- Type in search -> filters sessions by cwd, message, or session ID
- Click running session row -> opens detail panel
- Click project group header -> expands to show sessions in that project

---

### UC-20: Session Detail Panel
**Page:** `/activity` (with panel open)
**Screenshot:** `screenshots/09b-activity-session-detail.png`
**Description:** Slide-in panel showing session metadata and instruction history.
**Data source:** `/api/sessions/history?file=`

#### Components Visible (DetailPanel)

1. **Header:**
   - Green dot + "PID 26544" (bold)
   - "Running" tag (green)
   - Close button (X)
2. **METADATA section:**
   - Session ID: `dce9993c-4a46-401b-a3b2-49e065ea9319`
   - PID: `26544`
   - Working Directory: `C:\repos\ccm-test`
   - Started: `4/16/2026, 8:33:33 PM (12m ago)`
   - Project Config: `None detected`
3. **INSTRUCTION HISTORY section:**
   - Filter input: "Filter instructions..."
   - Count: "3 of 3 messages"
   - Message bubbles:
     - Each bubble: role tag ("user"), timestamp (right)
     - Message content (can include command XML, markdown, etc.)
   - Scrollable

**Interactions:**
- Type in filter -> filters instruction history by content
- Scroll within instruction history area
- Click X or overlay -> closes panel

**API Response Structure (`/api/sessions/history?file=...&limit=3`):**
```json
[
  {
    "role": "user",
    "text": "terminate the dashboard process",
    "timestamp": "2026-04-16T12:34:11.929Z"
  }
]
```

---

## 10. Theme Switching

### UC-21: Theme Toggle
**Page:** All pages (sidebar bottom)
**Screenshot:** `screenshots/10-dark-mode.png`, `screenshots/10b-light-mode.png`
**Description:** Three-mode theme switcher in the sidebar footer.

#### Components Visible

1. Three buttons in a row: "Auto" (monitor icon), "Dark" (moon icon), "Light" (sun icon)
2. Active button has filled/highlighted background

**Theme Modes:**
- **Auto**: Uses system preference (prefers-color-scheme media query)
- **Dark**: Dark backgrounds (#0f0f14, #1a1a24), light text, purple accents
- **Light**: White/gray backgrounds (#f8f9fa, #ffffff), dark text, purple accents

**CSS Variables affected by theme (defined in globals.css):**
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--card-bg`, `--card-border`
- `--accent`, `--accent-light`, `--accent-hover`
- `--border`, `--border-strong`
- `--overlay-bg`

**Interactions:**
- Click "Auto" -> uses OS dark/light preference
- Click "Dark" -> forces dark theme
- Click "Light" -> forces light theme
- Theme preference stored in localStorage via ThemeContext

---

## 11. Navigation

### UC-22: Sidebar Navigation
**Page:** All pages
**Description:** Fixed left sidebar with app branding and navigation links.

#### Components Visible

1. **App branding:**
   - Purple circle with "C" initial
   - "Claude Config" title
   - "1.0.0-draft" version
2. **Navigation links** (5 items):
   - Dashboard (chart icon) -> `/`
   - Recommended (sparkle icon) -> `/recommended`
   - Configuration (gear icon) -> `/config`
   - Profiles (user icon) -> `/profiles`
   - Activity (monitor icon) -> `/activity`
3. **Theme switcher** (bottom)

**Active state:** Selected link has purple background + bold white text
**Hover state:** Link background lightens on hover

### UC-23: Configuration Sub-tabs
**Page:** `/config/*`
**Description:** Horizontal tab bar at top of all config pages.

**Tabs:**
- Plugins -> `/config/plugins`
- MCP Servers -> `/config/mcp`
- Skills -> `/config/skills`
- Commands -> `/config/commands`
- Settings -> `/config/settings`

**Active tab:** Has filled purple background
**Default:** `/config` redirects to `/config/plugins` (via config/page.tsx)

---

## 12. Shared Components

### SC-01: Header
**File:** `src/components/layout/header.tsx`
**Props:** title, subtitle, action buttons
**Description:** Page header with h1 title, optional subtitle, and action button area (right-aligned).

### SC-02: SearchBox
**File:** `src/components/shared/search-box.tsx`
**Props:** `value`, `onChange`, `placeholder`
**Description:** Input with search icon (magnifying glass SVG) on the left. Controlled component.
**Styling:** Uses `var(--bg-tertiary)` background, `var(--text-primary)` text.

### SC-03: StatCard
**File:** `src/components/shared/stat-card.tsx`
**Props:** `title` (string), `value` (number|string), `subtitle?`, `color?`
**Description:** Rounded card with uppercase title, large value, optional subtitle.
**Styling:** `var(--card-bg)` background, `var(--card-border)` border.

### SC-04: Tag
**File:** `src/components/shared/tag.tsx`
**Props:** `label` (string), `variant?` (green|blue|orange|purple|red|yellow|pink|gray)
**Description:** Inline pill tag with colored background and text. Default variant is "gray".
**Variants used:**
- green: Enabled, Connected, active counts
- blue: marketplace name, accent tags
- orange/gray: version numbers, counts
- red: danger/sensitive indicators
- purple: accent links

### SC-05: Button
**File:** `src/components/shared/button.tsx`
**Props:** `variant` (primary|secondary|danger|ghost), `size` (sm|md), `onClick`, `disabled`
**Variants:**
- `primary`: Purple background, white text (btn-primary class)
- `secondary`: Outlined, neutral (btn-secondary class)
- `danger`: Red background, white text (btn-danger class)
- `ghost`: Transparent, text-only (btn-ghost class)

### SC-06: StatusBadge
**File:** `src/components/shared/status-badge.tsx`
**Props:** `status` (connected|disconnected|pending), `label?`
**Description:** Colored dot + text label. Green for connected, gray for disconnected, secondary for pending.

### SC-07: DetailPanel
**File:** `src/components/layout/detail-panel.tsx`
**Props:** `open`, `onClose`, `title`, `subtitle?`, `icon?`, `tags?`, `children`, `actions?`
**Description:** Fixed-position slide-in panel from the right. Width: 440px. Has dimmed overlay behind it.
**Sections:** Header (with icon, title, subtitle, tags, close button), scrollable body, footer actions.
**Animation:** translateX(100%) to translateX(0) with 0.25s ease-in-out.

### SC-08: CollapsibleSection
**Description:** Used throughout for User/System groups, marketplace groups, MCP Server Usage.
**Pattern:** Button with title, count badge, and chevron (rotates on expand). Content below toggles visibility.

### SC-09: Select (Custom Dropdown)
**File:** `src/components/shared/select.tsx`
**Props:** `value`, `onChange`, `options`, `placeholder?`, `disabled?`
**Description:** Custom dropdown that renders an absolutely-positioned options list. Not a native `<select>`.
**Behavior:** Click to open, click option to select, click outside to close.

### SC-10: ConfirmationDialog
**File:** `src/components/shared/confirmation-dialog.tsx`
**Props:** `open`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel?`, `variant?` (danger|primary)
**Description:** Modal dialog with title, message, Cancel (ghost) button, Confirm (danger/primary) button.
**Overlay:** Full-screen dimmed background, click overlay to close.

### SC-11: MarkdownViewer
**File:** `src/components/shared/markdown-viewer.tsx`
**Description:** Lazy-loaded fullscreen markdown renderer. Used for skills and commands content.
**Features:**
- Full-screen overlay with top bar (name, tags, file path, Edit button, Close)
- Rendered markdown (headings, code blocks, lists, bold, etc.)
- Edit mode: switches to textarea, shows Save/Cancel buttons
- User content is editable, system content is read-only

### SC-12: RealtimeSync
**File:** `src/components/layout/realtime-sync.tsx`
**Description:** Invisible component that connects to SSE endpoint and triggers SWR cache invalidation.

---

## 13. API Endpoints

### Data Read APIs

| Endpoint | Method | Response Type | Description |
|----------|--------|---------------|-------------|
| `/api/stats` | GET | `{plugins, mcpServers, skills, profiles, sessions}` | Dashboard stat counts |
| `/api/plugins` | GET | `Plugin[]` | All installed plugins |
| `/api/mcp-servers` | GET | `McpServer[]` | All configured MCP servers |
| `/api/skills` | GET | `Skill[]` | All installed skills (user + system) |
| `/api/skills/content?path=` | GET | `{content: string}` | Markdown content of a skill file |
| `/api/skills/search?q=` | GET | `SkillStoreResult[]` | Search skills.sh registry |
| `/api/commands` | GET | `Command[]` | All user commands |
| `/api/settings` | GET | Full settings object | Model, plugins, env, hooks |
| `/api/settings/env` | GET | `{key: value}` map | Environment variables only |
| `/api/profiles` | GET | `Profile[]` | All saved profiles |
| `/api/profiles/[name]` | GET | `Profile` | Single profile details |
| `/api/sessions` | GET | `Session[]` | All sessions with metadata |
| `/api/sessions/history?file=&limit=` | GET | `Message[]` | Instruction history for a session |
| `/api/metrics` | GET | Full metrics object | Tool/skill usage stats |
| `/api/recommendations` | GET | `{recommendations, generatedAt, model}` | Cached recommendations |
| `/api/mcp-registry?q=` | GET | `{results, smitheryAvailable}` | Search npm/registry/smithery |
| `/api/marketplaces` | GET | `Marketplace[]` | Registered plugin marketplaces |
| `/api/marketplaces/[name]/plugins` | GET | `AvailablePlugin[]` | Plugins in a marketplace |
| `/api/events` | GET (SSE) | Server-Sent Events stream | Real-time file change notifications |

### Data Write APIs

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/plugins` | POST | `{name}` | Install a plugin |
| `/api/plugins/[name]` | PATCH | `{enabled}` | Toggle plugin enabled/disabled |
| `/api/plugins/[name]` | DELETE | - | Remove a plugin |
| `/api/mcp-servers` | POST | `{name, config}` | Add MCP server |
| `/api/mcp-servers/[name]` | DELETE | - | Remove MCP server |
| `/api/settings` | PATCH | partial settings | Update settings (e.g., model) |
| `/api/settings/env` | PUT | `{key, value}` | Set environment variable |
| `/api/settings/env/[key]` | DELETE | - | Remove environment variable |
| `/api/skills/update` | POST | `{filePath, content}` | Save skill file content |
| `/api/profiles` | POST | `{name}` | Create new profile |
| `/api/profiles/[name]` | PATCH | partial profile | Update profile |
| `/api/profiles/[name]` | DELETE | - | Delete profile |
| `/api/profiles/[name]/activate` | POST | - | Activate a profile |
| `/api/export` | POST | `{name}` | Export profile to JSON |
| `/api/import` | POST | `{data, strategy}` | Import profile from JSON/YAML |
| `/api/recommendations` | POST | - | Regenerate recommendations |
| `/api/mcp-registry/install` | POST | `{name, command, args, env}` | Install MCP from registry |
| `/api/marketplaces` | POST | `{name, repo}` | Register new marketplace |
| `/api/marketplaces/[name]` | DELETE | - | Remove marketplace |

### Detailed Response Schemas

**`/api/stats`:**
```json
{"plugins": 14, "mcpServers": 7, "skills": 30, "profiles": 1, "sessions": 2}
```

**`/api/plugins` (per item):**
```json
{
  "name": "superpowers@claude-plugins-official",
  "version": "5.0.7",
  "marketplace": "claude-plugins-official",
  "enabled": true,
  "installPath": "C:\\Users\\canwa\\.claude\\plugins\\cache\\claude-plugins-official\\superpowers\\5.0.7",
  "installedAt": "2026-02-05T07:25:01.658Z",
  "lastUpdated": "2026-04-08T05:50:15.469Z"
}
```

**`/api/mcp-servers` (per item):**
```json
{
  "name": "azure-devops",
  "config": {"env": {}, "args": ["O365Exchange"], "command": "mcp-server-azuredevops"},
  "source": "user"
}
```

**`/api/skills` (per item):**
```json
{
  "name": "brainstorming",
  "description": "You MUST use this before any creative work...",
  "filePath": "C:\\...\\superpowers\\5.0.7\\skills\\brainstorming\\Skill.md",
  "source": "system",
  "pluginName": "superpowers@claude-plugins-official"
}
```

**`/api/sessions` (per item):**
```json
{
  "pid": 26544,
  "sessionId": "dce9993c-4a46-401b-a3b2-49e065ea9319",
  "cwd": "C:\\repos\\ccm-test",
  "startedAt": 1776342813965,
  "alive": true,
  "lastMessage": "/claude-config-manager:ccm-dashboard",
  "projectDir": "C:\\repos\\ccm-test",
  "projectConfig": {"hasMcpJson": false, "hasClaudeMd": false, "hasProjectSettings": false},
  "historyFile": "C:\\Users\\canwa\\.claude\\projects\\C--repos-ccm-test\\dce9993c-4a46-401b-a3b2-49e065ea9319.jsonl"
}
```

**`/api/metrics` (full):**
```json
{
  "skills": [{"name": "...", "usageCount": 15, "lastUsedAt": 1774319500780, "category": "skill"}],
  "builtinTools": [{"name": "Read", "usageCount": 537, "lastUsedAt": 1772118087799, "category": "builtin-tool"}],
  "mcpTools": [{"name": "browser_click", "usageCount": 46, "lastUsedAt": 1772097510148, "category": "mcp-tool", "mcpServer": "plugin_playwright_playwright"}],
  "totalToolCalls": 1846,
  "totalSkillCalls": 41,
  "topTools": [...],
  "topSkills": [...],
  "mcpServerBreakdown": [{"server": "plugin_playwright_playwright", "toolCount": 9, "totalCalls": 82}]
}
```

**`/api/settings`:**
```json
{
  "model": "opus[1m]",
  "enabledPlugins": {"frontend-design@claude-plugins-official": true, ...},
  "autoUpdatesChannel": "latest",
  "skipDangerousModePermissionPrompt": true,
  "env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"},
  "hooks": {"PreToolUse": [{"hooks": [...], "matcher": "mcp__metagraph__confirm_write"}]}
}
```

**`/api/settings/env`:**
```json
{"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}
```

**`/api/recommendations`:**
```json
{
  "recommendations": [
    {
      "name": "vercel-labs/agent-skills@vercel-react-best-practices",
      "type": "skill",
      "description": "React best practices from Vercel",
      "reason": "Most popular skill with 320K+ installs",
      "popularity": "Trending",
      "installCommand": "npx skills add vercel-labs/agent-skills@vercel-react-best-practices",
      "url": "https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices",
      "category": "development"
    }
  ],
  "generatedAt": "2026-04-16T08:36:20.867Z",
  "model": "static"
}
```

**`/api/mcp-registry?q=query`:**
```json
{
  "results": [
    {
      "name": "copilot-figma-bridge",
      "description": "One-command setup for Figma MCP + GitHub Copilot",
      "source": "npm",
      "version": "1.3.3",
      "npmUrl": "https://www.npmjs.com/package/copilot-figma-bridge",
      "repositoryUrl": "...",
      "installCommand": "npx -y copilot-figma-bridge",
      "score": 108.66
    }
  ]
}
```

**`/api/marketplaces`:**
```json
[
  {
    "name": "claude-plugins-official",
    "source": {"source": "github", "repo": "anthropics/claude-plugins-official"},
    "installLocation": "C:\\Users\\canwa\\.claude\\plugins\\marketplaces\\claude-plugins-official",
    "lastUpdated": "2026-04-16T12:40:48.660Z"
  }
]
```

**`/api/marketplaces/[name]/plugins` (per item):**
```json
{
  "name": "stagehand",
  "description": "Browser automation skill for Claude Code",
  "version": "latest",
  "installed": false,
  "enabled": false,
  "marketplace": "claude-plugins-official",
  "category": "automation",
  "homepage": "https://..."
}
```

---

## 14. Real-time Features

### UC-24: Server-Sent Events (SSE)
**Endpoint:** `/api/events`
**File:** `src/app/api/events/route.ts`

**Implementation:**
- Uses `chokidar` to watch filesystem for changes
- Watches paths:
  - `~/.claude/settings.json`
  - `~/.claude/plugins/installed_plugins.json`
  - `~/.claude/.mcp.json`
  - `~/.claude/sessions/*.json`
  - `~/.claude/plugins/profiles/*.json`
- Sends SSE messages on file changes
- Heartbeat every 30 seconds

**Event format:**
```json
{"type": "change", "category": "settings", "event": "change", "timestamp": 1776343425094}
{"type": "heartbeat"}
```

**Categories:**
- `settings` - settings.json changed
- `plugins` - installed_plugins.json changed
- `mcps` - .mcp.json changed
- `sessions` - session files changed
- `profiles` - profile files changed
- `unknown` - other file changes

### UC-25: SWR Caching & Revalidation
**File:** `src/lib/use-data.ts`

**Configuration:**
```typescript
const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 5000, // don't refetch within 5s
};
```

**SWR Hooks (all use same config):**
- `useStats()` - key: `'stats'`
- `usePlugins()` - key: `'plugins'`
- `useMcpServers()` - key: `'mcp-servers'`
- `useSkills()` - key: `'skills'`
- `useCommands()` - key: `'commands'`
- `useProfiles()` - key: `'profiles'`
- `useSettings()` - key: `'settings'`
- `useSessions()` - key: `'sessions'`
- `useSessionHistory(file)` - key: `['session-history', file]` (conditional)
- `useMetrics()` - key: `'metrics'`
- `useMarketplaces()` - key: `'marketplaces'`
- `useAvailablePlugins(marketplace)` - key: `['available-plugins', marketplace]` (conditional)
- `useRecommendations()` - key: `'recommendations'`

### UC-26: SSE -> SWR Revalidation Mapping
**File:** `src/lib/use-realtime.ts`

| SSE Category | SWR Keys Invalidated |
|---|---|
| `settings` | `settings`, `stats` |
| `plugins` | `plugins`, `stats`, `skills` |
| `mcps` | `mcp-servers`, `stats` |
| `sessions` | `sessions` |
| `profiles` | `profiles`, `stats` |
| default | All keys (`mutate(() => true)`) |

---

## 15. URL Redirects

Old (legacy) URLs are redirected to new config-grouped URLs via Next.js `redirect()` (server-side 307):

| Old URL | New URL | Redirect File |
|---------|---------|---------------|
| `/plugins` | `/config/plugins` | `src/app/plugins/page.tsx` |
| `/mcp-servers` | `/config/mcp` | `src/app/mcp-servers/page.tsx` |
| `/skills` | `/config/skills` | `src/app/skills/page.tsx` |
| `/commands` | `/config/commands` | `src/app/commands/page.tsx` |
| `/settings` | `/config/settings` | `src/app/settings/page.tsx` |
| `/sessions` | `/activity` | `src/app/sessions/page.tsx` |
| `/export-import` | `/profiles` | `src/app/export-import/page.tsx` |
| `/metrics` | `/` | `src/app/metrics/page.tsx` |
| `/config` | `/config/plugins` | `src/app/config/page.tsx` |

---

## Screenshot Index

| File | Description |
|------|-------------|
| `01-dashboard-overview.png` | Full dashboard page (light/auto mode) |
| `01b-dashboard-mcp-usage.png` | Dashboard scrolled to MCP Server Usage |
| `02-recommended.png` | Recommendations page (full page) |
| `03-config-plugins-installed.png` | Plugins - Installed tab |
| `03b-plugin-detail-panel.png` | Plugin detail panel (superpowers) |
| `03c-plugins-marketplace.png` | Plugins - Marketplace tab (full page) |
| `03c2-plugins-marketplace-top.png` | Plugins - Marketplace tab (viewport) |
| `03d-plugins-manage-marketplaces.png` | Plugins - Manage Marketplaces tab |
| `04-config-mcp-installed.png` | MCP Servers - Installed tab |
| `04b-mcp-detail-panel.png` | MCP Server detail panel |
| `04c-mcp-store.png` | MCP Store tab (empty state) |
| `05-config-skills.png` | Skills - Installed tab (full page) |
| `05b-skill-fullscreen-viewer.png` | Skill fullscreen markdown viewer |
| `06-config-commands.png` | Commands page |
| `07-config-settings.png` | Settings page |
| `08-profiles.png` | Profiles tab |
| `08b-profiles-export-import.png` | Export / Import tab |
| `09-activity.png` | Activity / Sessions page |
| `09b-activity-session-detail.png` | Session detail panel |
| `10-dark-mode.png` | Dashboard in dark mode |
| `10b-light-mode.png` | Dashboard in light mode |

---

## Source File Reference

### Pages
| Path | Route |
|------|-------|
| `packages/dashboard/src/app/page.tsx` | `/` (Dashboard) |
| `packages/dashboard/src/app/recommended/page.tsx` | `/recommended` |
| `packages/dashboard/src/app/config/layout.tsx` | `/config/*` (layout) |
| `packages/dashboard/src/app/config/page.tsx` | `/config` (redirect to plugins) |
| `packages/dashboard/src/app/config/plugins/page.tsx` | `/config/plugins` |
| `packages/dashboard/src/app/config/mcp/page.tsx` | `/config/mcp` |
| `packages/dashboard/src/app/config/skills/page.tsx` | `/config/skills` |
| `packages/dashboard/src/app/config/commands/page.tsx` | `/config/commands` |
| `packages/dashboard/src/app/config/settings/page.tsx` | `/config/settings` |
| `packages/dashboard/src/app/profiles/page.tsx` | `/profiles` |
| `packages/dashboard/src/app/activity/page.tsx` | `/activity` |

### API Routes
| Path | Endpoint |
|------|----------|
| `src/app/api/stats/route.ts` | `/api/stats` |
| `src/app/api/plugins/route.ts` | `/api/plugins` |
| `src/app/api/plugins/[name]/route.ts` | `/api/plugins/[name]` |
| `src/app/api/mcp-servers/route.ts` | `/api/mcp-servers` |
| `src/app/api/mcp-servers/[name]/route.ts` | `/api/mcp-servers/[name]` |
| `src/app/api/skills/route.ts` | `/api/skills` |
| `src/app/api/skills/content/route.ts` | `/api/skills/content` |
| `src/app/api/skills/search/route.ts` | `/api/skills/search` |
| `src/app/api/skills/update/route.ts` | `/api/skills/update` |
| `src/app/api/commands/route.ts` | `/api/commands` |
| `src/app/api/settings/route.ts` | `/api/settings` |
| `src/app/api/settings/env/route.ts` | `/api/settings/env` |
| `src/app/api/settings/env/[key]/route.ts` | `/api/settings/env/[key]` |
| `src/app/api/profiles/route.ts` | `/api/profiles` |
| `src/app/api/profiles/[name]/route.ts` | `/api/profiles/[name]` |
| `src/app/api/profiles/[name]/activate/route.ts` | `/api/profiles/[name]/activate` |
| `src/app/api/export/route.ts` | `/api/export` |
| `src/app/api/import/route.ts` | `/api/import` |
| `src/app/api/sessions/route.ts` | `/api/sessions` |
| `src/app/api/sessions/history/route.ts` | `/api/sessions/history` |
| `src/app/api/metrics/route.ts` | `/api/metrics` |
| `src/app/api/recommendations/route.ts` | `/api/recommendations` |
| `src/app/api/mcp-registry/route.ts` | `/api/mcp-registry` |
| `src/app/api/mcp-registry/install/route.ts` | `/api/mcp-registry/install` |
| `src/app/api/marketplaces/route.ts` | `/api/marketplaces` |
| `src/app/api/marketplaces/[name]/route.ts` | `/api/marketplaces/[name]` |
| `src/app/api/marketplaces/[name]/plugins/route.ts` | `/api/marketplaces/[name]/plugins` |
| `src/app/api/events/route.ts` | `/api/events` (SSE) |

### Components
| Path | Component |
|------|-----------|
| `src/components/layout/sidebar.tsx` | Sidebar navigation |
| `src/components/layout/header.tsx` | Page header |
| `src/components/layout/detail-panel.tsx` | Slide-in detail panel |
| `src/components/layout/realtime-sync.tsx` | SSE connection manager |
| `src/components/shared/button.tsx` | Button (primary/secondary/danger/ghost) |
| `src/components/shared/tag.tsx` | Tag pill (8 color variants) |
| `src/components/shared/stat-card.tsx` | Dashboard stat card |
| `src/components/shared/status-badge.tsx` | Status dot + label |
| `src/components/shared/search-box.tsx` | Search input with icon |
| `src/components/shared/select.tsx` | Custom dropdown select |
| `src/components/shared/confirmation-dialog.tsx` | Modal confirmation dialog |
| `src/components/shared/markdown-viewer.tsx` | Fullscreen markdown viewer/editor |
| `src/components/overview/usage-chart.tsx` | Bar chart for Top Skills/Tools |
| `src/components/overview/recent-sessions.tsx` | Recent sessions list |
| `src/components/overview/environment-health.tsx` | Environment health card |
| `src/components/plugin-list/plugin-item.tsx` | Plugin list item |
| `src/components/mcp-list/mcp-item.tsx` | MCP server list item |
| `src/components/profile-grid/profile-card.tsx` | Profile card |
| `src/components/settings/model-selector.tsx` | Model selector |
| `src/components/settings/env-vars-editor.tsx` | Environment variables editor |
| `src/components/settings/hooks-editor.tsx` | Hooks display |
| `src/components/export-import/export-panel.tsx` | Export panel |
| `src/components/export-import/import-panel.tsx` | Import panel |

### Core Libraries
| Path | Purpose |
|------|---------|
| `src/lib/api-client.ts` | All API fetch functions |
| `src/lib/use-data.ts` | SWR hooks for data fetching |
| `src/lib/use-realtime.ts` | SSE connection + SWR cache invalidation |
| `src/lib/theme-context.tsx` | Theme state management (auto/dark/light) |
| `src/lib/launcher.ts` | Dashboard launcher utility |

### Core Package (Backend)
| Path | Purpose |
|------|---------|
| `packages/core/src/managers/config-manager.ts` | Settings/config file management |
| `packages/core/src/managers/plugin-manager.ts` | Plugin install/remove/toggle |
| `packages/core/src/managers/mcp-manager.ts` | MCP server config management |
| `packages/core/src/managers/skill-scanner.ts` | Skill discovery/scanning |
| `packages/core/src/managers/profile-manager.ts` | Profile CRUD |
| `packages/core/src/managers/session-manager.ts` | Session discovery/history |
| `packages/core/src/managers/metrics-manager.ts` | Usage metrics aggregation |
| `packages/core/src/managers/marketplace-manager.ts` | Marketplace registry management |
| `packages/core/src/managers/recommendation-manager.ts` | AI recommendation engine |
| `packages/core/src/utils/path-resolver.ts` | Claude home directory resolution |
| `packages/core/src/utils/file-ops.ts` | File read/write utilities |
| `packages/core/src/utils/cache.ts` | Caching utilities |

---
name: config-dashboard
description: Start and open the Claude Config Manager dashboard — a web UI for managing plugins, MCPs, skills, profiles, and sessions
---

# Config Dashboard

Start the Claude Config Manager dashboard web UI.

## Steps

1. Check if dashboard is already running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3399 2>/dev/null
```

2. If NOT running (non-200), start it:

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && npx next dev -p 3399 --dir packages/dashboard &
sleep 10
```

3. Open in browser:

```bash
start "" "http://localhost:3399"
```

4. Tell the user: "Dashboard is running at http://localhost:3399"

## What the dashboard provides

- **Overview** — stats, usage metrics, recent sessions, environment health
- **Recommended** — AI-powered plugin/MCP/skill recommendations
- **Configuration** — manage plugins, MCP servers, skills, commands, settings
- **Profiles** — create/switch/export/import configuration profiles
- **Activity** — view all Claude Code sessions and history
- **Theme** — system/dark/light mode

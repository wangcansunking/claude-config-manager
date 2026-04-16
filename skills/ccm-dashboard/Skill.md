---
name: ccm-dashboard
description: Start and open the Claude Config Manager dashboard — a web UI for managing plugins, MCPs, skills, profiles, and sessions
---

# Config Dashboard

Start the Claude Config Manager dashboard web UI.

## Steps

1. Check if dashboard is already running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3399 2>/dev/null
```

2. If 200, open and STOP:
```bash
start "" "http://localhost:3399"
```

3. If NOT running, start the pre-built server:
```bash
node "${CLAUDE_PLUGIN_ROOT}/packages/dashboard/dist/server.mjs" &
sleep 3 && start "" "http://localhost:3399"
```

4. Tell user: "Dashboard running at http://localhost:3399"

## Features

- **Overview** — stats, usage metrics, recent sessions, environment health
- **Recommended** — plugin/MCP/skill recommendations with search
- **Configuration** — manage plugins, MCP servers, skills, commands, settings
- **Profiles** — create/switch/export/import configuration profiles
- **Activity** — view all Claude Code sessions and history
- **Theme** — system/dark/light mode

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

2. If 200, it's running. Open and STOP:
```bash
start "" "http://localhost:3399"
```

3. If NOT running, check deps and build:

```bash
ls "${CLAUDE_PLUGIN_ROOT}/packages/dashboard/node_modules/.package-lock.json" 2>/dev/null && echo "DEPS_OK" || echo "DEPS_MISSING"
ls "${CLAUDE_PLUGIN_ROOT}/packages/dashboard/.next/BUILD_ID" 2>/dev/null && echo "BUILD_OK" || echo "BUILD_MISSING"
```

4. If DEPS_MISSING: `cd "${CLAUDE_PLUGIN_ROOT}" && npm install`

5. If BUILD_MISSING: tell user "Building dashboard (first time only, ~30s)..." then:
```bash
cd "${CLAUDE_PLUGIN_ROOT}/packages/dashboard" && npx next build
```

6. Start production server and open:
```bash
cd "${CLAUDE_PLUGIN_ROOT}/packages/dashboard" && npx next start -p 3399 &
sleep 5 && start "" "http://localhost:3399"
```

7. Tell user: "Dashboard running at http://localhost:3399"

## Features

- **Overview** — stats, usage metrics, recent sessions, environment health
- **Recommended** — plugin/MCP/skill recommendations with search
- **Configuration** — manage plugins, MCP servers, skills, commands, settings
- **Profiles** — create/switch/export/import configuration profiles
- **Activity** — view all Claude Code sessions and history
- **Theme** — system/dark/light mode

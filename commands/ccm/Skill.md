---
name: ccm
description: Claude Config Manager — quick status, dashboard, and profile dispatcher
---

Claude Config Manager quick access. Dispatch to the right sub-skill or run a `claude-config` CLI command based on what the user asks.

> Looking for an interactive view? Run `claude-config` in your terminal — `/ccm` continues to work as a conversational dispatcher inside Claude Code.

```bash
CCM="node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js"
```

## Actions

### "status" or no arguments

Show a compact state summary:

1. Check dashboard via the `ccm_dashboard_status` MCP tool.
2. List profiles: `$CCM profile list --json`.
3. Summarize both (running? how many profiles? which is active?).

### "dashboard" or "open"

Delegate to `/ccm-dashboard`.

### "profile" or "profiles"

Delegate to `/ccm-profile`. Forward any sub-action (`list`, `create <name>`, `activate <name>`, `delete <name>`).

### "export"

Delegate to `/ccm-export`.

### "import <file>"

Delegate to `/ccm-import`.

### "recommend" or "recommendations"

Tell the user the dashboard's Recommended page is the richer view: `http://localhost:3399/recommended`. If the dashboard isn't up, invoke `/ccm-dashboard` first.

### Unknown input

Show the available sub-commands above and ask which one the user wants.

## Design note

Everything except dashboard-lifecycle flows through `claude-config` (the CLI in `packages/cli/dist/index.js`). The MCP server only exposes `ccm_dashboard_status` and `ccm_open_dashboard`. This keeps the model's tool-selection surface tiny while leaving the full operational surface reachable via CLI + slash commands.

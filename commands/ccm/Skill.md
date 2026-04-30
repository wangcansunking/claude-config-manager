---
name: ccm
description: Claude Config Manager — quick status, dashboard, and profile dispatcher
---

Claude Config Manager quick access. Dispatch to the right sub-skill or run a `claude-config` CLI command based on what the user asks.

```bash
CCM="node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js"
```

## Actions

### "tui", "open the TUI", "launch the interactive UI", or no arguments

**Default path — try to launch the TUI in a fresh terminal window.**

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/launch-tui.sh"
```

(The script lives at `scripts/launch-tui.sh` in the plugin root and picks the right terminal emulator for the OS: Terminal.app on macOS, gnome-terminal/konsole/alacritty/wezterm/kitty/xterm on Linux, Windows Terminal/PowerShell/cmd on Windows.)

**On exit 0** (success): tell the user "TUI launched in a new terminal window. Press `?` for the keymap, `q` to quit. This Claude Code session continues here."

**On non-zero exit** (no suitable terminal / launch failed): the script prints a reason on stderr. Capture it and present the two fallbacks:

> Auto-launch failed: `<reason>`. Two fallbacks:
> 1. Open a terminal yourself and run `claude-config` (full TUI experience)
> 2. Start the web dashboard at http://localhost:3399 instead (`/ccm-dashboard` will handle that automatically)
>
> Which do you want?

If they pick (2), delegate to `/ccm-dashboard`.
If they pick (1), confirm and stop — the user takes it from there.

### "status"

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

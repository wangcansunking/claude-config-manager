---
name: ccm-profile
description: Manage Claude Code configuration profiles — list, create, activate, export, import, delete
---

Manage Claude Code configuration profiles via the `claude-config` CLI. The CLI is the single source of truth — the MCP server deliberately does not expose profile tools to keep the agent's tool surface minimal.

Throughout, use this path to the CLI bin:

```bash
CCM="node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js"
```

## Actions

Based on what the user asks:

- **List profiles** — `$CCM profile list --json` (parse JSON); or `$CCM profile list` for a human table.
- **Create a profile** — `$CCM profile create "<name>"`. Snapshots the current configuration.
- **Activate a profile** — `$CCM profile activate "<name>"`. Ask for confirmation if the current config has unsaved drift (use `$CCM profile list --json` to check `activeName`).
- **Delete a profile** — `$CCM profile delete "<name>"`. Always confirm with the user first.
- **Export a profile** — see `/ccm-export`.
- **Import a profile** — see `/ccm-import`.

## If the user didn't specify an action

Run `$CCM profile list` and show the output. Then ask what they'd like to do next.

## Why the CLI and not an MCP tool?

The dashboard UI (`/ccm-dashboard`) is the interactive way to manage profiles. The CLI is the scriptable way. The MCP server stays lean so the model's system prompt isn't bloated with tool descriptions for every possible operation.

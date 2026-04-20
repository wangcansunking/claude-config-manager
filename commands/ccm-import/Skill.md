---
name: ccm-import
description: Import a Claude Code configuration profile from a JSON file
---

Import a Claude Code configuration profile from an exported JSON file. All operations go through the `claude-config` CLI.

```bash
CCM="node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js"
```

## Steps

1. Ask the user for the file path. Default to `~/claude-config-export.json` if they don't say.

2. Import. The CLI merges by default (keep existing entries, layer incoming on top). Pass `--replace` if the user wants the incoming profile to fully overwrite. Pass `--activate` to switch to the profile right after import. Use `--dry-run` first if the user wants a preview:

```bash
$CCM import <file>                     # merge, do not activate
$CCM import <file> --replace           # full overwrite
$CCM import <file> --activate          # merge then activate
$CCM import <file> --replace --activate
$CCM import <file> --dry-run           # preview only, no writes
```

3. If the user didn't pass `--activate` and wants to activate now:

```bash
$CCM profile activate "<imported-name>"
```

4. Summarize what was imported (name, plugin/MCP/skill counts from the CLI output) and whether it's now active.

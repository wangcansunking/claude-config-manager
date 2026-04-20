---
name: ccm-export
description: Export your Claude Code configuration profile to a portable JSON file
---

Export a Claude Code configuration profile to a portable JSON file for backup or transfer to another machine. All operations go through the `claude-config` CLI.

```bash
CCM="node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js"
```

## Steps

1. List profiles so the user can pick one:

```bash
$CCM profile list
```

2. Ask which profile to export. If the user doesn't specify and there's only one profile, pick it. If there are none, create one first via `/ccm-profile`.

3. Export to a file (the CLI writes the JSON directly):

```bash
$CCM export "<profile-name>" --output ~/claude-config-export.json
```

If the user prefers a different path, honor it. If they want stdout (e.g. to pipe into `gh gist create`), omit `--output`:

```bash
$CCM export "<profile-name>"
```

4. Tell the user: `"Exported <profile-name> → <path>. Copy this file to another machine and run /ccm-import."`

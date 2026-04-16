---
name: import-config
description: Import a Claude Code configuration profile from a JSON file
---

Import a Claude Code configuration from an exported JSON file.

## Steps

1. Ask the user for the file path (default: ~/claude-config-export.json)
2. Read the file:

```bash
cat ~/claude-config-export.json
```

3. Call `ccm_import_profile` with:
   - `data`: the file contents
   - `strategy`: ask the user — "merge" (keep existing + add new) or "replace" (overwrite everything)

4. Call `ccm_activate_profile` if the user wants to activate the imported profile

5. Tell the user what was imported and whether it's now active.

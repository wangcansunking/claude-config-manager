---
name: export-config
description: Export your Claude Code configuration profile to a portable JSON file
---

Export the user's Claude Code configuration to a portable file for backup or transfer to another machine.

## Steps

1. Call `ccm_list_profiles` to show available profiles
2. Ask the user which profile to export (or use "default" if they don't specify)
3. Call `ccm_export_profile` with the profile name
4. Save the output to a file:

```bash
# Save to the user's home directory by default
cat > ~/claude-config-export.json << 'EOF'
<exported JSON here>
EOF
```

5. Tell the user: "Exported to ~/claude-config-export.json. Copy this file to another machine and use /import-config to restore."

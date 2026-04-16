---
name: ccm
description: Claude Config Manager — manage profiles, check dashboard status, and quick configuration tasks
---

Claude Config Manager quick access. Based on what the user asks, take the appropriate action:

## Actions

### "status" or no arguments
Call `ccm_dashboard_status` to check if dashboard is running, then call `ccm_list_profiles` to show profiles. Summarize the current state.

### "dashboard" or "open"
Check if dashboard is running (`ccm_dashboard_status`). If not, start it:
```bash
cd "${CLAUDE_PLUGIN_ROOT}" && npx next dev -p 3399 --dir packages/dashboard &
sleep 10 && start "" "http://localhost:3399"
```

### "profile" or "profiles"
Call `ccm_list_profiles` and show results. Ask what the user wants to do.

### "export"
Call `ccm_list_profiles`, ask which to export, then call `ccm_export_profile` and save to file.

### "import <file>"
Read the file, call `ccm_import_profile`.

### "create <name>"
Call `ccm_create_profile` with the name.

### "activate <name>"
Call `ccm_activate_profile` with the name.

### "recommend" or "recommendations"
Tell the user to open http://localhost:3399/recommended or use the /generate-recommendations command.

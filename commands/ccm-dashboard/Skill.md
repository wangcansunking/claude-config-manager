---
name: ccm-dashboard
description: Start the Claude Config Manager dashboard and open it in the browser
---

Start the Claude Config Manager dashboard server and open it in the browser.

## Steps

1. Check if the dashboard is already running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3399 2>/dev/null
```

2. If it returns 200, it's already running. Open it and STOP:
```bash
start "" "http://localhost:3399"
```

3. If NOT running, start the pre-built server (no install needed):
```bash
node "${CLAUDE_PLUGIN_ROOT}/packages/dashboard/dist/server.mjs" &
sleep 3 && start "" "http://localhost:3399"
```

4. Tell the user: "Dashboard running at http://localhost:3399"

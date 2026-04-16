---
name: dashboard
description: Start the Claude Config Manager dashboard and open it in the browser
---

Start the Claude Config Manager dashboard server and open it in the browser.

## Steps

1. First check if the dashboard is already running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3399 2>/dev/null
```

2. If it returns 200, the dashboard is already running. Tell the user:
   "Dashboard is already running at http://localhost:3399"
   Then open it:
```bash
start "" "http://localhost:3399"
```

3. If it's not running, start it:
```bash
cd "${CLAUDE_PLUGIN_ROOT}" && npx next dev -p 3399 --dir packages/dashboard &
```
Wait 10 seconds then open:
```bash
sleep 10 && start "" "http://localhost:3399"
```

4. Tell the user: "Dashboard started at http://localhost:3399"

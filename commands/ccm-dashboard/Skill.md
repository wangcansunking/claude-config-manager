---
name: ccm-dashboard
description: Start the Claude Config Manager dashboard and open it in the browser
---

Start the Claude Config Manager dashboard server and open it in the browser.

## Steps

1. First check if the dashboard is already running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3399 2>/dev/null
```

2. If it returns 200, the dashboard is already running. Tell the user: "Dashboard is already running at http://localhost:3399" and open it:
```bash
start "" "http://localhost:3399"
```
Then STOP here.

3. If NOT running, check if dependencies are installed and production build exists:

```bash
# Check if node_modules exists
ls "${CLAUDE_PLUGIN_ROOT}/packages/dashboard/node_modules/.package-lock.json" 2>/dev/null && echo "DEPS_OK" || echo "DEPS_MISSING"
# Check if production build exists
ls "${CLAUDE_PLUGIN_ROOT}/packages/dashboard/.next/BUILD_ID" 2>/dev/null && echo "BUILD_OK" || echo "BUILD_MISSING"
```

4. If DEPS_MISSING, install dependencies:
```bash
cd "${CLAUDE_PLUGIN_ROOT}" && npm install
```

5. If BUILD_MISSING, run production build (this takes ~30 seconds but makes the dashboard fast):
```bash
cd "${CLAUDE_PLUGIN_ROOT}/packages/dashboard" && npx next build
```
Tell the user: "Building dashboard for production (first time only, ~30s)..."

6. Start production server:
```bash
cd "${CLAUDE_PLUGIN_ROOT}/packages/dashboard" && npx next start -p 3399 &
```

7. Wait for server to be ready, then open:
```bash
sleep 5 && start "" "http://localhost:3399"
```

8. Tell the user: "Dashboard started at http://localhost:3399 (production mode — fast page navigation)"

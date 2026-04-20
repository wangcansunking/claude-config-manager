---
name: ccm-dashboard
description: Start the Claude Config Manager dashboard and open it in the browser
---

Start the Claude Config Manager dashboard server and open it in the browser.

## Steps

1. Check MCP status first — cheap read via the `ccm_dashboard_status` tool (returns `{ running, pid?, port? }`). If running, go to step 3.

2. If not running, start it via the CLI in the background (the CLI opens the browser itself unless `--no-open` is passed):

```bash
CCM="node ${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js"
$CCM start --no-open &
disown $! 2>/dev/null || true
```

Then wait up to 5s for the port to accept connections:

```bash
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3399/api/info && break
  sleep 1
done
```

3. Open the URL in the browser. Cross-platform — pick what works on the host:

```bash
# macOS
open http://localhost:3399
# Linux
xdg-open http://localhost:3399
# Windows (Git Bash / WSL)
start "" "http://localhost:3399"
```

4. Tell the user: "Dashboard running at http://localhost:3399".

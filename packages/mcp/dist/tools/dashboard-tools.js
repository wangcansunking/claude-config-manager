import { join } from 'path';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
const DASHBOARD_PORT = 3399;
const LOCK_FILE = join(homedir(), '.claude', 'ccm-dashboard.pid');
async function getDashboardStatus() {
    try {
        const content = await readFile(LOCK_FILE, 'utf-8');
        const data = JSON.parse(content);
        // Check if process is alive
        try {
            process.kill(data.pid, 0);
            return { running: true, pid: data.pid, port: data.port };
        }
        catch {
            return { running: false };
        }
    }
    catch {
        return { running: false };
    }
}
export async function handleOpenDashboard() {
    const status = await getDashboardStatus();
    const port = status.port ?? DASHBOARD_PORT;
    const url = `http://localhost:${port}`;
    if (status.running) {
        return {
            content: [{ type: 'text', text: `Dashboard is running at ${url} (PID ${status.pid})` }],
        };
    }
    return {
        content: [{ type: 'text', text: `Dashboard is not running. Start it with: claude-config start\nOr it will auto-start on next session if installed as a plugin.\nExpected URL: ${url}` }],
    };
}
export async function handleDashboardStatus() {
    const status = await getDashboardStatus();
    return {
        content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
    };
}
export function registerDashboardTools(server) {
    server.tool('ccm_open_dashboard', 'Get the URL to open the Claude Config Manager dashboard', async () => handleOpenDashboard());
    server.tool('ccm_dashboard_status', 'Check whether the dashboard server is running and get its port', async () => handleDashboardStatus());
}
//# sourceMappingURL=dashboard-tools.js.map
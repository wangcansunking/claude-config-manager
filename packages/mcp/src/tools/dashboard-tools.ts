import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const DASHBOARD_PORT = 3399;
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`;

export async function handleOpenDashboard() {
  return {
    content: [
      {
        type: 'text' as const,
        text: `The Claude Config Manager dashboard is available at ${DASHBOARD_URL}\n\nOpen this URL in your browser to access the dashboard interface.`,
      },
    ],
  };
}

export async function handleDashboardStatus() {
  const status = { running: false, port: DASHBOARD_PORT };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(status, null, 2) }],
  };
}

export function registerDashboardTools(server: McpServer): void {
  server.tool(
    'ccm_open_dashboard',
    'Get the URL to open the Claude Config Manager dashboard',
    async () => handleOpenDashboard(),
  );

  server.tool(
    'ccm_dashboard_status',
    'Check whether the dashboard server is running and get its port',
    async () => handleDashboardStatus(),
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ProfileManager, getClaudeHome } from '@ccm/core';
import { registerProfileTools } from './tools/profile-tools.js';
import { registerDashboardTools } from './tools/dashboard-tools.js';

export function createServer(): McpServer {
  const claudeHome = getClaudeHome();
  const profileManager = new ProfileManager(claudeHome);

  const server = new McpServer({
    name: 'ccm',
    version: '1.0.0-draft',
  });

  registerProfileTools(server, { profileManager });
  registerDashboardTools(server);

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

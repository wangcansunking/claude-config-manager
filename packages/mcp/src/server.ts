import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  PluginManager,
  McpManager,
  SkillScanner,
  ProfileManager,
  ConfigManager,
  getClaudeHome,
} from '@ccm/core';
import { registerQueryTools } from './tools/query-tools.js';
import { registerMutationTools } from './tools/mutation-tools.js';
import { registerProfileTools } from './tools/profile-tools.js';
import { registerDashboardTools } from './tools/dashboard-tools.js';

export function createServer(): McpServer {
  const claudeHome = getClaudeHome();

  const pluginManager = new PluginManager(claudeHome);
  const mcpManager = new McpManager(claudeHome);
  const skillScanner = new SkillScanner(claudeHome);
  const profileManager = new ProfileManager(claudeHome);
  const configManager = new ConfigManager(claudeHome);

  const server = new McpServer({
    name: 'ccm',
    version: '1.0.0-draft',
  });

  const queryManagers = { pluginManager, mcpManager, skillScanner, configManager };
  const mutationManagers = { pluginManager, mcpManager, configManager };
  const profileManagers = { profileManager };

  registerQueryTools(server, queryManagers);
  registerMutationTools(server, mutationManagers);
  registerProfileTools(server, profileManagers);
  registerDashboardTools(server);

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

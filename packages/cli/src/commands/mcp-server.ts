import { Command } from 'commander';

export function makeMcpServerCommand(): Command {
  const cmd = new Command('mcp-server');
  cmd
    .description('Start MCP server in stdio mode')
    .action(() => {
      console.log('MCP server mode not yet connected');
    });
  return cmd;
}

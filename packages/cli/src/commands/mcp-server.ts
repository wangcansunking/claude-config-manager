import { Command } from 'commander';
import { spawn } from 'child_process';
import { resolveMcpServer } from '../lib/assets.js';

export function makeMcpServerCommand(): Command {
  const cmd = new Command('mcp-server');
  cmd.description('Run as MCP server (stdio mode)').action(() => {
    const serverPath = resolveMcpServer(import.meta.url);
    if (!serverPath) {
      console.error('Could not locate the MCP server bundle. Try reinstalling the package.');
      process.exit(1);
      return;
    }
    const child = spawn(process.execPath, [serverPath], {
      stdio: 'inherit',
    });
    child.on('close', (code) => process.exit(code ?? 0));
  });
  return cmd;
}

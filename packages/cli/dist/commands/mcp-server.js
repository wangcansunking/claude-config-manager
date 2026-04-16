import { Command } from 'commander';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
export function makeMcpServerCommand() {
    const cmd = new Command('mcp-server');
    cmd
        .description('Run as MCP server (stdio mode)')
        .action(() => {
        const __dirname = resolve(fileURLToPath(import.meta.url), '..');
        const serverPath = resolve(__dirname, '..', '..', 'mcp', 'dist', 'bin.js');
        const child = spawn('node', [serverPath], {
            stdio: 'inherit',
            shell: true,
        });
        child.on('close', (code) => process.exit(code ?? 0));
    });
    return cmd;
}
//# sourceMappingURL=mcp-server.js.map
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerDashboardTools } from './tools/dashboard-tools.js';
function readPackageVersion() {
    try {
        const here = dirname(fileURLToPath(import.meta.url));
        // server.ts ships to dist/, so walk up to the package root.
        const pkgPath = join(here, '..', 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return pkg.version ?? '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
/**
 * Create the CCM MCP server.
 *
 * By design, this server exposes only the two dashboard-lifecycle tools:
 *
 *   - `ccm_dashboard_status` — "is it running, and on what port?"
 *   - `ccm_open_dashboard`   — return URL (+ start hint) so chat can link to the UI
 *
 * All read/write operations (profiles, plugins, MCP servers, skills, commands,
 * settings) live behind the `claude-config` CLI and the `/ccm-*` slash
 * commands. Skills shell out to the CLI instead of calling MCP tools — this
 * keeps the model's tool-selection surface tiny (and the token footprint of
 * tool descriptions minimal) while preserving the full operational surface for
 * users who invoke a slash command or run the CLI directly.
 */
export function createServer() {
    const server = new McpServer({
        name: 'ccm',
        version: readPackageVersion(),
    });
    registerDashboardTools(server);
    return server;
}
export async function startServer() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map
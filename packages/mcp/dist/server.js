import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ProfileManager, getClaudeHome } from '@ccm/core';
import { registerProfileTools } from './tools/profile-tools.js';
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
export function createServer() {
    const claudeHome = getClaudeHome();
    const profileManager = new ProfileManager(claudeHome);
    const server = new McpServer({
        name: 'ccm',
        version: readPackageVersion(),
    });
    registerProfileTools(server, { profileManager });
    registerDashboardTools(server);
    return server;
}
export async function startServer() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map
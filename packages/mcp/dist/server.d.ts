import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
export declare function createServer(): McpServer;
export declare function startServer(): Promise<void>;
//# sourceMappingURL=server.d.ts.map
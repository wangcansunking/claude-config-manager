/**
 * Resolve a shipped asset (dashboard server, mcp server) against the directory
 * of the calling module. We probe several candidate locations so the same code
 * works in two layouts:
 *
 *   - standalone npm bundle: everything is flattened next to `cli.mjs`
 *     (e.g. `dashboard/server.mjs`, `mcp/server.mjs`)
 *   - dev monorepo: assets live in sibling workspace `dist` folders
 *
 * Returns the first candidate that exists on disk, or `null` if none match.
 */
export declare function resolveAsset(metaUrl: string, candidates: string[]): string | null;
export declare function resolveDashboardServer(metaUrl: string): string | null;
export declare function resolveMcpServer(metaUrl: string): string | null;
//# sourceMappingURL=assets.d.ts.map
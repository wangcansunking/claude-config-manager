import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
export function resolveAsset(metaUrl: string, candidates: string[]): string | null {
  const dir = dirname(fileURLToPath(metaUrl));
  for (const candidate of candidates) {
    const full = resolve(dir, candidate);
    if (existsSync(full)) return full;
  }
  return null;
}

export function resolveDashboardServer(metaUrl: string): string | null {
  return resolveAsset(metaUrl, [
    'dashboard/dist/server.mjs', // standalone bundle layout
    '../../../dashboard/dist/server.mjs', // dev monorepo layout
  ]);
}

export function resolveMcpServer(metaUrl: string): string | null {
  return resolveAsset(metaUrl, [
    'mcp/server.mjs', // standalone bundle layout
    '../../../../dist/mcp-server.mjs', // dev: bundled mcp at repo root
    '../../../mcp/dist/bin.js', // dev: workspace mcp build
  ]);
}

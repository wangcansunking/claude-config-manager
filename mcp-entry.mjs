import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);
await import('./dist/mcp-server.mjs');

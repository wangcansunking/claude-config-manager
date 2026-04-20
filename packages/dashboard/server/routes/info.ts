import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// GET /api/info — dashboard version + build info
router.get('/', async (_req, res, next) => {
  try {
    // Read version from plugin.json (relative to server bundle location)
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Try multiple candidate paths (dev vs production bundle)
    const candidates = [
      join(__dirname, '..', '..', '..', '..', '.claude-plugin', 'plugin.json'),
      join(__dirname, '..', '..', '..', '.claude-plugin', 'plugin.json'),
      join(__dirname, '..', '..', '.claude-plugin', 'plugin.json'),
      join(__dirname, '..', '.claude-plugin', 'plugin.json'),
    ];

    let version = 'unknown';
    let name = 'claude-config-manager';
    for (const path of candidates) {
      try {
        const content = await readFile(path, 'utf-8');
        const pkg = JSON.parse(content);
        version = pkg.version ?? version;
        name = pkg.name ?? name;
        break;
      } catch {
        // try next
      }
    }

    res.json({ name, version });
  } catch (err) {
    next(err);
  }
});

export { router as infoRouter };

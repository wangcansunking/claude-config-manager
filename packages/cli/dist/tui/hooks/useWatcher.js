import { useEffect } from 'react';
import { homedir } from 'os';
import { join } from 'path';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
export function sectionFromPath(p) {
    if (p.includes('/.claude/settings'))
        return 'settings';
    if (p.endsWith('/.mcp.json') || p.endsWith('/.claude.json'))
        return 'mcpServers';
    if (p.endsWith('/installed_plugins.json'))
        return 'plugins';
    if (p.includes('/.claude/skills/'))
        return 'skills';
    if (p.includes('/.claude/profiles/'))
        return 'profiles';
    return null;
}
export function watchPaths() {
    const home = homedir();
    return [
        join(home, '.claude/settings.json'),
        join(home, '.claude/settings.local.json'),
        join(home, '.claude/.mcp.json'),
        join(home, '.claude.json'),
        join(home, '.claude/plugins/installed_plugins.json'),
        join(home, '.claude/skills'),
        join(home, '.claude/profiles'),
        join(process.cwd(), '.claude'),
    ];
}
export function useWatcher(store) {
    useEffect(() => {
        let watcher = null;
        try {
            watcher = chokidar.watch(watchPaths(), {
                ignoreInitial: true,
                awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 30 },
            });
            const handler = debounce((p) => {
                const section = sectionFromPath(p);
                if (!section)
                    return;
                void store.getState().refresh(section);
            }, 150);
            watcher.on('all', (_event, p) => handler(p));
        }
        catch {
            // chokidar failed to start (rare: ENOSPC on Linux). Degrade silently;
            // user can still hit `r` to manually refresh.
        }
        return () => {
            watcher?.close().catch(() => { });
        };
    }, [store]);
}
//# sourceMappingURL=useWatcher.js.map
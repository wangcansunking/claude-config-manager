import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sectionFromPath } from '../../tui/hooks/useWatcher.js';

describe('sectionFromPath', () => {
  it.each([
    ['/h/.claude/settings.json',                       'settings'],
    ['/h/.claude/settings.local.json',                 'settings'],
    ['/h/.claude/.mcp.json',                           'mcpServers'],
    ['/h/.claude.json',                                'mcpServers'],
    ['/h/.claude/plugins/installed_plugins.json',      'plugins'],
    ['/h/.claude/skills/foo/SKILL.md',                 'skills'],
    ['/h/.claude/profiles/work.json',                  'profiles'],
    ['/h/proj/.claude/settings.json',                  'settings'],
    ['/h/no/such/file.txt',                            null],
  ])('%s → %s', (path, expected) => {
    expect(sectionFromPath(path)).toBe(expected);
  });
});

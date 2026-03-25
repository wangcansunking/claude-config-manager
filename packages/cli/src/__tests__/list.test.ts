import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { runList } from '../commands/list.js';

async function createTempClaudeHome(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'ccm-list-test-'));
  await mkdir(join(dir, 'plugins'), { recursive: true });
  await mkdir(join(dir, 'commands'), { recursive: true });
  return dir;
}

describe('list command', () => {
  let claudeHome: string;

  beforeEach(async () => {
    claudeHome = await createTempClaudeHome();
  });

  afterEach(async () => {
    await rm(claudeHome, { recursive: true, force: true });
  });

  it('returns empty lists when no config exists', async () => {
    const result = await runList({}, claudeHome);
    expect(result.plugins).toEqual([]);
    expect(result.mcps).toEqual([]);
    expect(result.skills).toEqual([]);
    expect(result.commands).toEqual([]);
  });

  it('returns only plugins when --plugins flag is set', async () => {
    const result = await runList({ plugins: true }, claudeHome);
    expect(result.plugins).toBeDefined();
    expect(result.mcps).toBeUndefined();
    expect(result.skills).toBeUndefined();
    expect(result.commands).toBeUndefined();
  });

  it('returns only mcps when --mcps flag is set', async () => {
    const result = await runList({ mcps: true }, claudeHome);
    expect(result.plugins).toBeUndefined();
    expect(result.mcps).toBeDefined();
    expect(result.skills).toBeUndefined();
    expect(result.commands).toBeUndefined();
  });

  it('returns only skills when --skills flag is set', async () => {
    const result = await runList({ skills: true }, claudeHome);
    expect(result.plugins).toBeUndefined();
    expect(result.mcps).toBeUndefined();
    expect(result.skills).toBeDefined();
    expect(result.commands).toBeUndefined();
  });

  it('returns only commands when --commands flag is set', async () => {
    const result = await runList({ commands: true }, claudeHome);
    expect(result.plugins).toBeUndefined();
    expect(result.mcps).toBeUndefined();
    expect(result.skills).toBeUndefined();
    expect(result.commands).toBeDefined();
  });

  it('lists plugins from installed_plugins.json', async () => {
    const pluginsJson = {
      version: 2,
      plugins: {
        'test-plugin@marketplace': [
          {
            installPath: '/some/path',
            version: '1.2.3',
            installedAt: '2024-01-01T00:00:00Z',
            lastUpdated: '2024-01-01T00:00:00Z',
          },
        ],
      },
    };
    await writeFile(
      join(claudeHome, 'plugins', 'installed_plugins.json'),
      JSON.stringify(pluginsJson),
      'utf-8',
    );

    const result = await runList({ plugins: true }, claudeHome);
    expect(result.plugins).toHaveLength(1);
    expect(result.plugins?.[0]?.name).toBe('test-plugin@marketplace');
    expect(result.plugins?.[0]?.version).toBe('1.2.3');
  });

  it('lists MCP servers from settings.json', async () => {
    const settings = {
      mcpServers: {
        'my-server': {
          command: 'npx',
          args: ['-y', 'my-mcp-server'],
        },
      },
    };
    await writeFile(
      join(claudeHome, 'settings.json'),
      JSON.stringify(settings),
      'utf-8',
    );

    const result = await runList({ mcps: true }, claudeHome);
    expect(result.mcps).toHaveLength(1);
    expect(result.mcps?.[0]?.name).toBe('my-server');
    expect(result.mcps?.[0]?.config.command).toBe('npx');
  });

  it('lists commands from commands directory', async () => {
    const commandContent = `---
name: my-command
description: A test command
---

This is a test command.
`;
    await writeFile(
      join(claudeHome, 'commands', 'my-command.md'),
      commandContent,
      'utf-8',
    );

    const result = await runList({ commands: true }, claudeHome);
    expect(result.commands).toHaveLength(1);
    expect(result.commands?.[0]?.name).toBe('my-command');
    expect(result.commands?.[0]?.description).toBe('A test command');
  });

  it('JSON output contains expected structure', async () => {
    const result = await runList({}, claudeHome);
    // Verify result is JSON-serializable with expected keys
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toHaveProperty('plugins');
    expect(parsed).toHaveProperty('mcps');
    expect(parsed).toHaveProperty('skills');
    expect(parsed).toHaveProperty('commands');
  });
});

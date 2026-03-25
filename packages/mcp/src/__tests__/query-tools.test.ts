import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleListPlugins,
  handleListMcpServers,
  handleListSkills,
  handleListCommands,
  handleGetConfig,
  handleGetComponentDetail,
} from '../tools/query-tools.js';
import type { QueryToolManagers } from '../tools/query-tools.js';

function makeManagers(overrides: Partial<QueryToolManagers> = {}): QueryToolManagers {
  return {
    pluginManager: {
      list: vi.fn().mockResolvedValue([]),
      getDetail: vi.fn().mockResolvedValue(null),
      toggle: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      isInstalled: vi.fn().mockResolvedValue(false),
    } as unknown as QueryToolManagers['pluginManager'],
    mcpManager: {
      list: vi.fn().mockResolvedValue([]),
      getDetail: vi.fn().mockResolvedValue(null),
      add: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as QueryToolManagers['mcpManager'],
    skillScanner: {
      scan: vi.fn().mockResolvedValue([]),
      scanCommands: vi.fn().mockResolvedValue([]),
      scanPlugin: vi.fn().mockResolvedValue([]),
      getSkillContent: vi.fn().mockResolvedValue(''),
    } as unknown as QueryToolManagers['skillScanner'],
    configManager: {
      getSettings: vi.fn().mockResolvedValue({}),
      updateSettings: vi.fn().mockResolvedValue(undefined),
      getModel: vi.fn().mockResolvedValue(undefined),
      setModel: vi.fn().mockResolvedValue(undefined),
      getEnvVars: vi.fn().mockResolvedValue({}),
      setEnvVar: vi.fn().mockResolvedValue(undefined),
      removeEnvVar: vi.fn().mockResolvedValue(undefined),
      getHooks: vi.fn().mockResolvedValue({}),
    } as unknown as QueryToolManagers['configManager'],
    ...overrides,
  };
}

describe('handleListPlugins', () => {
  it('calls pluginManager.list() and returns JSON result', async () => {
    const mockPlugins = [
      { name: 'my-plugin', version: '1.0.0', marketplace: '', enabled: true },
    ];
    const managers = makeManagers({
      pluginManager: {
        list: vi.fn().mockResolvedValue(mockPlugins),
        getDetail: vi.fn(),
        toggle: vi.fn(),
        remove: vi.fn(),
        isInstalled: vi.fn(),
      } as unknown as QueryToolManagers['pluginManager'],
    });

    const result = await handleListPlugins(managers);

    expect(managers.pluginManager.list).toHaveBeenCalledOnce();
    expect(result.content).toHaveLength(1);
    expect(result.content[0]!.type).toBe('text');
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockPlugins);
  });
});

describe('handleListMcpServers', () => {
  it('calls mcpManager.list() and returns JSON result', async () => {
    const mockServers = [
      { name: 'my-server', config: { command: 'npx', args: ['my-server'] } },
    ];
    const managers = makeManagers({
      mcpManager: {
        list: vi.fn().mockResolvedValue(mockServers),
        getDetail: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
      } as unknown as QueryToolManagers['mcpManager'],
    });

    const result = await handleListMcpServers(managers);

    expect(managers.mcpManager.list).toHaveBeenCalledOnce();
    expect(result.content).toHaveLength(1);
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockServers);
  });
});

describe('handleListSkills', () => {
  it('calls skillScanner.scan() and returns JSON result', async () => {
    const mockSkills = [{ name: 'my-skill', description: 'A skill', filePath: '/path', content: '...' }];
    const managers = makeManagers({
      skillScanner: {
        scan: vi.fn().mockResolvedValue(mockSkills),
        scanCommands: vi.fn(),
        scanPlugin: vi.fn(),
        getSkillContent: vi.fn(),
      } as unknown as QueryToolManagers['skillScanner'],
    });

    const result = await handleListSkills(managers);

    expect(managers.skillScanner.scan).toHaveBeenCalledOnce();
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockSkills);
  });
});

describe('handleListCommands', () => {
  it('calls skillScanner.scanCommands() and returns JSON result', async () => {
    const mockCommands = [{ name: 'my-cmd', description: 'A command', filePath: '/path', content: '...' }];
    const managers = makeManagers({
      skillScanner: {
        scan: vi.fn(),
        scanCommands: vi.fn().mockResolvedValue(mockCommands),
        scanPlugin: vi.fn(),
        getSkillContent: vi.fn(),
      } as unknown as QueryToolManagers['skillScanner'],
    });

    const result = await handleListCommands(managers);

    expect(managers.skillScanner.scanCommands).toHaveBeenCalledOnce();
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockCommands);
  });
});

describe('handleGetConfig', () => {
  let managers: QueryToolManagers;

  beforeEach(() => {
    managers = makeManagers({
      configManager: {
        getSettings: vi.fn().mockResolvedValue({ model: 'claude-3', env: { KEY: 'val' } }),
        updateSettings: vi.fn(),
        getModel: vi.fn(),
        setModel: vi.fn(),
        getEnvVars: vi.fn(),
        setEnvVar: vi.fn(),
        removeEnvVar: vi.fn(),
        getHooks: vi.fn(),
      } as unknown as QueryToolManagers['configManager'],
    });
  });

  it('returns all settings when no section provided', async () => {
    const result = await handleGetConfig(managers, {});

    expect(managers.configManager.getSettings).toHaveBeenCalledOnce();
    const parsed = JSON.parse(result.content[0]!.text) as Record<string, unknown>;
    expect(parsed['model']).toBe('claude-3');
    expect(parsed['env']).toEqual({ KEY: 'val' });
  });

  it('returns only requested section when section is provided', async () => {
    const result = await handleGetConfig(managers, { section: 'model' });

    const parsed = JSON.parse(result.content[0]!.text) as Record<string, unknown>;
    expect(parsed).toEqual({ model: 'claude-3' });
  });
});

describe('handleGetComponentDetail', () => {
  it('calls pluginManager.getDetail() for plugin type', async () => {
    const mockDetail = { name: 'my-plugin', version: '1.0.0' };
    const managers = makeManagers({
      pluginManager: {
        list: vi.fn(),
        getDetail: vi.fn().mockResolvedValue(mockDetail),
        toggle: vi.fn(),
        remove: vi.fn(),
        isInstalled: vi.fn(),
      } as unknown as QueryToolManagers['pluginManager'],
    });

    const result = await handleGetComponentDetail(managers, { type: 'plugin', name: 'my-plugin' });

    expect(managers.pluginManager.getDetail).toHaveBeenCalledWith('my-plugin');
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockDetail);
  });

  it('calls mcpManager.getDetail() for mcp type', async () => {
    const mockDetail = { name: 'my-server', config: { command: 'node' } };
    const managers = makeManagers({
      mcpManager: {
        list: vi.fn(),
        getDetail: vi.fn().mockResolvedValue(mockDetail),
        add: vi.fn(),
        remove: vi.fn(),
      } as unknown as QueryToolManagers['mcpManager'],
    });

    const result = await handleGetComponentDetail(managers, { type: 'mcp', name: 'my-server' });

    expect(managers.mcpManager.getDetail).toHaveBeenCalledWith('my-server');
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockDetail);
  });

  it('finds skill by name from scan() for skill type', async () => {
    const mockSkills = [
      { name: 'skill-a', description: 'A', filePath: '/a', content: '' },
      { name: 'skill-b', description: 'B', filePath: '/b', content: '' },
    ];
    const managers = makeManagers({
      skillScanner: {
        scan: vi.fn().mockResolvedValue(mockSkills),
        scanCommands: vi.fn(),
        scanPlugin: vi.fn(),
        getSkillContent: vi.fn(),
      } as unknown as QueryToolManagers['skillScanner'],
    });

    const result = await handleGetComponentDetail(managers, { type: 'skill', name: 'skill-b' });

    expect(managers.skillScanner.scan).toHaveBeenCalledOnce();
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockSkills[1]);
  });

  it('returns null when skill not found', async () => {
    const managers = makeManagers({
      skillScanner: {
        scan: vi.fn().mockResolvedValue([]),
        scanCommands: vi.fn(),
        scanPlugin: vi.fn(),
        getSkillContent: vi.fn(),
      } as unknown as QueryToolManagers['skillScanner'],
    });

    const result = await handleGetComponentDetail(managers, { type: 'skill', name: 'missing' });

    expect(JSON.parse(result.content[0]!.text)).toBeNull();
  });
});

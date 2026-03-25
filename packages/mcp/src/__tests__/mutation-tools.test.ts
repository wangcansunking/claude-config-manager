import { describe, it, expect, vi } from 'vitest';
import {
  handleInstallPlugin,
  handleUpdatePlugin,
  handleRemovePlugin,
  handleTogglePlugin,
  handleAddMcpServer,
  handleRemoveMcpServer,
  handleUpdateConfig,
} from '../tools/mutation-tools.js';
import type { MutationToolManagers } from '../tools/mutation-tools.js';

function makeManagers(overrides: Partial<MutationToolManagers> = {}): MutationToolManagers {
  return {
    pluginManager: {
      list: vi.fn().mockResolvedValue([]),
      getDetail: vi.fn().mockResolvedValue(null),
      toggle: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      isInstalled: vi.fn().mockResolvedValue(false),
    } as unknown as MutationToolManagers['pluginManager'],
    mcpManager: {
      list: vi.fn().mockResolvedValue([]),
      getDetail: vi.fn().mockResolvedValue(null),
      add: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as MutationToolManagers['mcpManager'],
    configManager: {
      getSettings: vi.fn().mockResolvedValue({}),
      updateSettings: vi.fn().mockResolvedValue(undefined),
      getModel: vi.fn().mockResolvedValue(undefined),
      setModel: vi.fn().mockResolvedValue(undefined),
      getEnvVars: vi.fn().mockResolvedValue({}),
      setEnvVar: vi.fn().mockResolvedValue(undefined),
      removeEnvVar: vi.fn().mockResolvedValue(undefined),
      getHooks: vi.fn().mockResolvedValue({}),
    } as unknown as MutationToolManagers['configManager'],
    ...overrides,
  };
}

describe('handleInstallPlugin', () => {
  it('returns stub message without calling any manager method', async () => {
    const managers = makeManagers();
    const result = await handleInstallPlugin(managers, { name: 'my-plugin' });

    expect(result.content[0]!.type).toBe('text');
    expect(result.content[0]!.text).toContain('my-plugin');
    expect(result.content[0]!.text).toContain('not fully implemented');
  });

  it('includes marketplace in stub message when provided', async () => {
    const managers = makeManagers();
    const result = await handleInstallPlugin(managers, {
      name: 'my-plugin',
      marketplace: 'official',
    });

    expect(result.content[0]!.text).toContain('official');
  });
});

describe('handleUpdatePlugin', () => {
  it('returns stub message', async () => {
    const managers = makeManagers();
    const result = await handleUpdatePlugin(managers, { name: 'my-plugin' });

    expect(result.content[0]!.type).toBe('text');
    expect(result.content[0]!.text).toContain('my-plugin');
    expect(result.content[0]!.text).toContain('not fully implemented');
  });
});

describe('handleRemovePlugin', () => {
  it('calls pluginManager.remove() and returns success message', async () => {
    const managers = makeManagers({
      pluginManager: {
        list: vi.fn(),
        getDetail: vi.fn(),
        toggle: vi.fn(),
        remove: vi.fn().mockResolvedValue(undefined),
        isInstalled: vi.fn(),
      } as unknown as MutationToolManagers['pluginManager'],
    });

    const result = await handleRemovePlugin(managers, { name: 'my-plugin' });

    expect(managers.pluginManager.remove).toHaveBeenCalledWith('my-plugin');
    expect(result.content[0]!.text).toContain('my-plugin');
    expect(result.content[0]!.text).toContain('removed');
  });
});

describe('handleTogglePlugin', () => {
  it('calls pluginManager.toggle() with enabled=true', async () => {
    const managers = makeManagers({
      pluginManager: {
        list: vi.fn(),
        getDetail: vi.fn(),
        toggle: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
        isInstalled: vi.fn(),
      } as unknown as MutationToolManagers['pluginManager'],
    });

    const result = await handleTogglePlugin(managers, { name: 'my-plugin', enabled: true });

    expect(managers.pluginManager.toggle).toHaveBeenCalledWith('my-plugin', true);
    expect(result.content[0]!.text).toContain('enabled');
  });

  it('calls pluginManager.toggle() with enabled=false', async () => {
    const managers = makeManagers({
      pluginManager: {
        list: vi.fn(),
        getDetail: vi.fn(),
        toggle: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
        isInstalled: vi.fn(),
      } as unknown as MutationToolManagers['pluginManager'],
    });

    const result = await handleTogglePlugin(managers, { name: 'my-plugin', enabled: false });

    expect(managers.pluginManager.toggle).toHaveBeenCalledWith('my-plugin', false);
    expect(result.content[0]!.text).toContain('disabled');
  });
});

describe('handleAddMcpServer', () => {
  it('calls mcpManager.add() with correct config', async () => {
    const managers = makeManagers({
      mcpManager: {
        list: vi.fn(),
        getDetail: vi.fn(),
        add: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
      } as unknown as MutationToolManagers['mcpManager'],
    });

    const result = await handleAddMcpServer(managers, {
      name: 'my-server',
      command: 'npx',
      args: ['my-mcp-server'],
      env: { KEY: 'value' },
    });

    expect(managers.mcpManager.add).toHaveBeenCalledWith('my-server', {
      command: 'npx',
      args: ['my-mcp-server'],
      env: { KEY: 'value' },
    });
    expect(result.content[0]!.text).toContain('my-server');
    expect(result.content[0]!.text).toContain('added');
  });

  it('calls mcpManager.add() without optional args', async () => {
    const managers = makeManagers({
      mcpManager: {
        list: vi.fn(),
        getDetail: vi.fn(),
        add: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
      } as unknown as MutationToolManagers['mcpManager'],
    });

    await handleAddMcpServer(managers, { name: 'srv', command: 'node' });

    expect(managers.mcpManager.add).toHaveBeenCalledWith('srv', {
      command: 'node',
      args: undefined,
      env: undefined,
    });
  });
});

describe('handleRemoveMcpServer', () => {
  it('calls mcpManager.remove() and returns success message', async () => {
    const managers = makeManagers({
      mcpManager: {
        list: vi.fn(),
        getDetail: vi.fn(),
        add: vi.fn(),
        remove: vi.fn().mockResolvedValue(undefined),
      } as unknown as MutationToolManagers['mcpManager'],
    });

    const result = await handleRemoveMcpServer(managers, { name: 'my-server' });

    expect(managers.mcpManager.remove).toHaveBeenCalledWith('my-server');
    expect(result.content[0]!.text).toContain('my-server');
    expect(result.content[0]!.text).toContain('removed');
  });
});

describe('handleUpdateConfig', () => {
  it('calls configManager.updateSettings() with model patch', async () => {
    const managers = makeManagers({
      configManager: {
        getSettings: vi.fn(),
        updateSettings: vi.fn().mockResolvedValue(undefined),
        getModel: vi.fn(),
        setModel: vi.fn(),
        getEnvVars: vi.fn(),
        setEnvVar: vi.fn(),
        removeEnvVar: vi.fn(),
        getHooks: vi.fn(),
      } as unknown as MutationToolManagers['configManager'],
    });

    const result = await handleUpdateConfig(managers, { model: 'claude-3-opus' });

    expect(managers.configManager.updateSettings).toHaveBeenCalledWith({ model: 'claude-3-opus' });
    expect(result.content[0]!.text).toContain('updated');
  });

  it('calls configManager.updateSettings() with env and hooks patches', async () => {
    const managers = makeManagers({
      configManager: {
        getSettings: vi.fn(),
        updateSettings: vi.fn().mockResolvedValue(undefined),
        getModel: vi.fn(),
        setModel: vi.fn(),
        getEnvVars: vi.fn(),
        setEnvVar: vi.fn(),
        removeEnvVar: vi.fn(),
        getHooks: vi.fn(),
      } as unknown as MutationToolManagers['configManager'],
    });

    await handleUpdateConfig(managers, {
      env: { MY_VAR: 'val' },
      hooks: { PreToolUse: ['cmd'] },
    });

    expect(managers.configManager.updateSettings).toHaveBeenCalledWith({
      env: { MY_VAR: 'val' },
      hooks: { PreToolUse: ['cmd'] },
    });
  });

  it('only includes defined fields in the patch', async () => {
    const managers = makeManagers({
      configManager: {
        getSettings: vi.fn(),
        updateSettings: vi.fn().mockResolvedValue(undefined),
        getModel: vi.fn(),
        setModel: vi.fn(),
        getEnvVars: vi.fn(),
        setEnvVar: vi.fn(),
        removeEnvVar: vi.fn(),
        getHooks: vi.fn(),
      } as unknown as MutationToolManagers['configManager'],
    });

    await handleUpdateConfig(managers, {});

    expect(managers.configManager.updateSettings).toHaveBeenCalledWith({});
  });
});

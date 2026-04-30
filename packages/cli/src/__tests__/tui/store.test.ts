import { describe, it, expect, beforeEach, vi } from 'vitest';

const listPlugins = vi.fn().mockResolvedValue([{ name: 'a', enabled: true }]);
const listMcps    = vi.fn().mockResolvedValue([]);
const scanSkills  = vi.fn().mockResolvedValue([]);
const scanCmds    = vi.fn().mockResolvedValue([]);
const getSettings = vi.fn().mockResolvedValue({ model: 'opus', env: {} });
const listProfs   = vi.fn().mockResolvedValue([]);
const listAllSess = vi.fn().mockResolvedValue([]);
const getActive   = vi.fn().mockResolvedValue('default');

vi.mock('@ccm/core', () => ({
  PluginManager:   class { list = listPlugins; toggle = vi.fn(); },
  McpManager:      class { list = listMcps;    toggle = vi.fn(); },
  SkillScanner:    class { scan = scanSkills; scanCommands = scanCmds; },
  ConfigManager:   class { getSettings = getSettings; setModel = vi.fn(); },
  ProfileManager:  class { list = listProfs; activate = vi.fn(); getActive = getActive; },
  SessionManager:  class { listAllSessions = listAllSess; },
  getClaudeHome:   () => '/tmp/fake-home',
  locales:         { en: {}, zh: {} },
}));

import { createStore } from '../../tui/store.js';

describe('store.init', () => {
  beforeEach(() => {
    [listPlugins, listMcps, scanSkills, scanCmds, getSettings,
     listProfs, listAllSess, getActive].forEach(fn => fn.mockClear());
  });

  it('fans out to every manager in parallel', async () => {
    const store = createStore();
    await store.getState().init();
    expect(listPlugins).toHaveBeenCalledOnce();
    expect(listMcps).toHaveBeenCalledOnce();
    expect(scanSkills).toHaveBeenCalledOnce();
    expect(scanCmds).toHaveBeenCalledOnce();
    expect(getSettings).toHaveBeenCalledOnce();
    expect(listProfs).toHaveBeenCalledOnce();
    expect(listAllSess).toHaveBeenCalledOnce();
    expect(getActive).toHaveBeenCalledOnce();
  });

  it('populates store fields and clears loading', async () => {
    const store = createStore();
    await store.getState().init();
    const s = store.getState();
    expect(s.plugins).toHaveLength(1);
    expect(s.plugins[0].name).toBe('a');
    expect(s.settings.model).toBe('opus');
    expect(s.activeProfile).toBe('default');
    expect(s.loading).toEqual({});
  });

  it('captures per-section errors without blocking other sections', async () => {
    listPlugins.mockRejectedValueOnce(new Error('boom'));
    const store = createStore();
    await store.getState().init();
    const s = store.getState();
    expect(s.lastError?.section).toBe('plugins');
    expect(s.lastError?.err.message).toBe('boom');
    expect(s.profiles).toBeDefined();
  });
});

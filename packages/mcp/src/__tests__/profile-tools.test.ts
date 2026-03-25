import { describe, it, expect, vi } from 'vitest';
import {
  handleListProfiles,
  handleCreateProfile,
  handleActivateProfile,
  handleExportProfile,
  handleImportProfile,
  handleDeleteProfile,
} from '../tools/profile-tools.js';
import type { ProfileToolManagers } from '../tools/profile-tools.js';

function makeManagers(overrides: Partial<ProfileToolManagers> = {}): ProfileToolManagers {
  return {
    profileManager: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ name: 'test', createdAt: '', updatedAt: '', plugins: [], mcpServers: {}, settings: {}, hooks: {}, commands: [] }),
      activate: vi.fn().mockResolvedValue(undefined),
      exportProfile: vi.fn().mockResolvedValue('{}'),
      importProfile: vi.fn().mockResolvedValue({ name: 'test', createdAt: '', updatedAt: '', plugins: [], mcpServers: {}, settings: {}, hooks: {}, commands: [] }),
      delete: vi.fn().mockResolvedValue(undefined),
      getActive: vi.fn().mockResolvedValue(null),
    } as unknown as ProfileToolManagers['profileManager'],
    ...overrides,
  };
}

describe('handleListProfiles', () => {
  it('calls profileManager.list() and returns JSON result', async () => {
    const mockProfiles = [
      { name: 'dev', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    const managers = makeManagers({
      profileManager: {
        list: vi.fn().mockResolvedValue(mockProfiles),
        create: vi.fn(),
        activate: vi.fn(),
        exportProfile: vi.fn(),
        importProfile: vi.fn(),
        delete: vi.fn(),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const result = await handleListProfiles(managers);

    expect(managers.profileManager.list).toHaveBeenCalledOnce();
    expect(result.content[0]!.type).toBe('text');
    expect(JSON.parse(result.content[0]!.text)).toEqual(mockProfiles);
  });
});

describe('handleCreateProfile', () => {
  it('calls profileManager.create() and returns success message with profile data', async () => {
    const mockProfile = {
      name: 'my-profile',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      plugins: [],
      mcpServers: {},
      settings: {},
      hooks: {},
      commands: [],
    };
    const managers = makeManagers({
      profileManager: {
        list: vi.fn(),
        create: vi.fn().mockResolvedValue(mockProfile),
        activate: vi.fn(),
        exportProfile: vi.fn(),
        importProfile: vi.fn(),
        delete: vi.fn(),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const result = await handleCreateProfile(managers, { name: 'my-profile' });

    expect(managers.profileManager.create).toHaveBeenCalledWith('my-profile');
    expect(result.content[0]!.text).toContain('my-profile');
    expect(result.content[0]!.text).toContain('created');
  });
});

describe('handleActivateProfile', () => {
  it('calls profileManager.activate() and returns success message', async () => {
    const managers = makeManagers({
      profileManager: {
        list: vi.fn(),
        create: vi.fn(),
        activate: vi.fn().mockResolvedValue(undefined),
        exportProfile: vi.fn(),
        importProfile: vi.fn(),
        delete: vi.fn(),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const result = await handleActivateProfile(managers, { name: 'my-profile' });

    expect(managers.profileManager.activate).toHaveBeenCalledWith('my-profile');
    expect(result.content[0]!.text).toContain('my-profile');
    expect(result.content[0]!.text).toContain('activated');
  });
});

describe('handleExportProfile', () => {
  it('calls profileManager.exportProfile() and returns the exported JSON', async () => {
    const mockExport = JSON.stringify({ version: '1.0', name: 'my-profile' });
    const managers = makeManagers({
      profileManager: {
        list: vi.fn(),
        create: vi.fn(),
        activate: vi.fn(),
        exportProfile: vi.fn().mockResolvedValue(mockExport),
        importProfile: vi.fn(),
        delete: vi.fn(),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const result = await handleExportProfile(managers, { name: 'my-profile' });

    expect(managers.profileManager.exportProfile).toHaveBeenCalledWith('my-profile');
    expect(result.content[0]!.text).toBe(mockExport);
  });
});

describe('handleImportProfile', () => {
  it('calls profileManager.importProfile() with replace strategy by default', async () => {
    const mockProfile = { name: 'imported', createdAt: '', updatedAt: '', plugins: [], mcpServers: {}, settings: {}, hooks: {}, commands: [] };
    const managers = makeManagers({
      profileManager: {
        list: vi.fn(),
        create: vi.fn(),
        activate: vi.fn(),
        exportProfile: vi.fn(),
        importProfile: vi.fn().mockResolvedValue(mockProfile),
        delete: vi.fn(),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const data = JSON.stringify({ name: 'imported' });
    const result = await handleImportProfile(managers, { data });

    expect(managers.profileManager.importProfile).toHaveBeenCalledWith(data, 'replace');
    expect(result.content[0]!.text).toContain('imported');
    expect(result.content[0]!.text).toContain('imported successfully');
  });

  it('calls profileManager.importProfile() with merge strategy when specified', async () => {
    const mockProfile = { name: 'imported', createdAt: '', updatedAt: '', plugins: [], mcpServers: {}, settings: {}, hooks: {}, commands: [] };
    const managers = makeManagers({
      profileManager: {
        list: vi.fn(),
        create: vi.fn(),
        activate: vi.fn(),
        exportProfile: vi.fn(),
        importProfile: vi.fn().mockResolvedValue(mockProfile),
        delete: vi.fn(),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const data = JSON.stringify({ name: 'imported' });
    await handleImportProfile(managers, { data, strategy: 'merge' });

    expect(managers.profileManager.importProfile).toHaveBeenCalledWith(data, 'merge');
  });
});

describe('handleDeleteProfile', () => {
  it('calls profileManager.delete() and returns success message', async () => {
    const managers = makeManagers({
      profileManager: {
        list: vi.fn(),
        create: vi.fn(),
        activate: vi.fn(),
        exportProfile: vi.fn(),
        importProfile: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined),
        getActive: vi.fn(),
      } as unknown as ProfileToolManagers['profileManager'],
    });

    const result = await handleDeleteProfile(managers, { name: 'my-profile' });

    expect(managers.profileManager.delete).toHaveBeenCalledWith('my-profile');
    expect(result.content[0]!.text).toContain('my-profile');
    expect(result.content[0]!.text).toContain('deleted');
  });
});

import { join } from 'path';
import { readdir } from 'fs/promises';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops.js';
import { FileNotFoundError, NotFoundError, ValidationError } from '@ccm/types';
import type { Profile, ProfileExport } from '@ccm/types';

export interface ProfileSummary {
  name: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export class ProfileManager {
  private readonly profilesDir: string;
  private readonly settingsPath: string;
  private readonly pluginsJsonPath: string;
  private readonly activeProfilePath: string;

  constructor(claudeHome: string) {
    this.profilesDir = join(claudeHome, 'plugins', 'profiles');
    this.settingsPath = join(claudeHome, 'settings.json');
    this.pluginsJsonPath = join(claudeHome, 'plugins', 'installed_plugins.json');
    this.activeProfilePath = join(claudeHome, 'plugins', 'profiles', 'active.json');
  }

  private profilePath(name: string): string {
    return join(this.profilesDir, `${name}.json`);
  }

  private async readSettings(): Promise<Record<string, unknown>> {
    try {
      const data = await readJsonFile(this.settingsPath);
      return (data as Record<string, unknown>) ?? {};
    } catch (err) {
      if (err instanceof FileNotFoundError) return {};
      throw err;
    }
  }

  private async readInstalledPlugins(): Promise<{
    version: number;
    plugins: Record<string, unknown[]>;
  }> {
    try {
      const data = await readJsonFile(this.pluginsJsonPath);
      return data as { version: number; plugins: Record<string, unknown[]> };
    } catch (err) {
      if (err instanceof FileNotFoundError) return { version: 2, plugins: {} };
      throw err;
    }
  }

  async list(): Promise<ProfileSummary[]> {
    try {
      const entries = await readdir(this.profilesDir, { withFileTypes: true });
      const summaries: ProfileSummary[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.json')) continue;
        if (entry.name === 'active.json') continue;
        const name = entry.name.replace(/\.json$/, '');
        try {
          const data = (await readJsonFile(join(this.profilesDir, entry.name))) as Profile;
          summaries.push({
            name,
            createdAt: data.createdAt ?? new Date().toISOString(),
            updatedAt: data.updatedAt ?? new Date().toISOString(),
            description: data.description,
          });
        } catch {
          // Skip unreadable profiles
        }
      }
      return summaries;
    } catch {
      return [];
    }
  }

  async create(name: string): Promise<Profile> {
    const settings = await this.readSettings();
    const { plugins } = await this.readInstalledPlugins();

    // Build InstalledPlugin[] from plugins record
    const installedPluginsList: Profile['plugins'] = [];
    const enabledPlugins = (() => {
      const ep = settings['enabledPlugins'];
      if (ep !== null && typeof ep === 'object' && !Array.isArray(ep)) {
        return ep as Record<string, boolean>;
      }
      return {};
    })();

    for (const [fullName, installs] of Object.entries(plugins)) {
      const install = (installs as Array<Record<string, unknown>>)[0];
      if (!install) continue;
      const parts = fullName.split('@');
      installedPluginsList.push({
        name: fullName,
        version: (install['version'] as string) ?? '',
        marketplace: parts[1] ?? '',
        enabled: enabledPlugins[fullName] ?? false,
        installPath: (install['installPath'] as string) ?? '',
        installedAt: (install['installedAt'] as string) ?? '',
        lastUpdated: (install['lastUpdated'] as string) ?? '',
      });
    }

    const mcpServers = (() => {
      const ms = settings['mcpServers'];
      if (ms !== null && typeof ms === 'object' && !Array.isArray(ms)) {
        return ms as Record<string, { command: string; args?: string[]; env?: Record<string, string> }>;
      }
      return {};
    })();

    const hooks = (() => {
      const h = settings['hooks'];
      if (h !== null && typeof h === 'object' && !Array.isArray(h)) {
        return h as Record<string, unknown>;
      }
      return {};
    })();

    const now = new Date().toISOString();
    const profile: Profile = {
      name,
      createdAt: now,
      updatedAt: now,
      plugins: installedPluginsList,
      mcpServers,
      settings,
      hooks,
      commands: [],
    };

    await writeJsonFile(this.profilePath(name), profile);
    return profile;
  }

  async update(name: string, patch: Partial<Omit<Profile, 'name' | 'createdAt'>>): Promise<Profile> {
    const filePath = this.profilePath(name);
    if (!(await fileExists(filePath))) {
      throw new NotFoundError('Profile', name);
    }
    const existing = (await readJsonFile(filePath)) as Profile;
    const updated: Profile = {
      ...existing,
      ...patch,
      name: existing.name,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile(filePath, updated);
    return updated;
  }

  async activate(name: string): Promise<void> {
    const filePath = this.profilePath(name);
    if (!(await fileExists(filePath))) {
      throw new NotFoundError('Profile', name);
    }
    const data = await readJsonFile(filePath);
    const profile = data as Profile;

    // Apply settings from profile
    await writeJsonFile(this.settingsPath, profile.settings);

    // Update active.json
    await writeJsonFile(this.activeProfilePath, { name });
  }

  async delete(name: string): Promise<void> {
    const filePath = this.profilePath(name);
    if (!(await fileExists(filePath))) {
      throw new NotFoundError('Profile', name);
    }

    const { unlink } = await import('fs/promises');
    await unlink(filePath);

    // Clear active.json if this was the active profile
    const activeName = await this.getActive();
    if (activeName === name) {
      const { unlink: ul } = await import('fs/promises');
      try {
        await ul(this.activeProfilePath);
      } catch {
        // Ignore if active.json doesn't exist
      }
    }
  }

  async getActive(): Promise<string | null> {
    try {
      const data = await readJsonFile(this.activeProfilePath);
      const obj = data as Record<string, unknown>;
      return typeof obj['name'] === 'string' ? obj['name'] : null;
    } catch (err) {
      if (err instanceof FileNotFoundError) return null;
      throw err;
    }
  }

  async exportProfile(name: string): Promise<string> {
    const filePath = this.profilePath(name);
    if (!(await fileExists(filePath))) {
      throw new NotFoundError('Profile', name);
    }
    const data = (await readJsonFile(filePath)) as Profile;

    const enabledPlugins: Record<string, boolean> = {};
    for (const plugin of data.plugins) {
      enabledPlugins[plugin.name] = plugin.enabled;
    }

    const exported: ProfileExport = {
      version: '1.0',
      name: data.name,
      createdAt: data.createdAt,
      plugins: {
        installed: data.plugins,
        enabled: enabledPlugins,
      },
      mcpServers: data.mcpServers,
      settings: data.settings,
      hooks: data.hooks,
      commands: data.commands,
      description: data.description,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exported, null, 2);
  }

  async importProfile(
    data: string,
    strategy: 'merge' | 'replace' = 'replace',
  ): Promise<Profile> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new ValidationError('Invalid JSON in profile import data');
    }

    const obj = parsed as Record<string, unknown>;
    if (!obj['name'] || typeof obj['name'] !== 'string') {
      throw new ValidationError('Profile import data must have a name field');
    }

    const name = obj['name'] as string;
    const now = new Date().toISOString();

    // Extract from ProfileExport format or Profile format
    let profile: Profile;
    if (obj['version'] && obj['plugins'] && typeof obj['plugins'] === 'object' && !Array.isArray(obj['plugins'])) {
      // ProfileExport format
      const pluginsData = obj['plugins'] as { installed?: unknown[]; enabled?: Record<string, boolean> };
      const installed = (pluginsData.installed ?? []) as Profile['plugins'];
      profile = {
        name,
        createdAt: (obj['createdAt'] as string) ?? now,
        updatedAt: now,
        plugins: installed,
        mcpServers: (obj['mcpServers'] as Profile['mcpServers']) ?? {},
        settings: (obj['settings'] as Record<string, unknown>) ?? {},
        hooks: (obj['hooks'] as Record<string, unknown>) ?? {},
        commands: (obj['commands'] as unknown[]) ?? [],
        description: obj['description'] as string | undefined,
      };
    } else {
      // Profile format directly
      profile = {
        name,
        createdAt: (obj['createdAt'] as string) ?? now,
        updatedAt: now,
        plugins: (obj['plugins'] as Profile['plugins']) ?? [],
        mcpServers: (obj['mcpServers'] as Profile['mcpServers']) ?? {},
        settings: (obj['settings'] as Record<string, unknown>) ?? {},
        hooks: (obj['hooks'] as Record<string, unknown>) ?? {},
        commands: (obj['commands'] as unknown[]) ?? [],
        description: obj['description'] as string | undefined,
      };
    }

    if (strategy === 'merge') {
      const existing = await this.getProfileData(name);
      if (existing) {
        profile = {
          ...existing,
          ...profile,
          settings: { ...existing.settings, ...profile.settings },
          mcpServers: { ...existing.mcpServers, ...profile.mcpServers },
          updatedAt: now,
        };
      }
    }

    await writeJsonFile(this.profilePath(name), profile);
    return profile;
  }

  private async getProfileData(name: string): Promise<Profile | null> {
    const filePath = this.profilePath(name);
    if (!(await fileExists(filePath))) return null;
    try {
      return (await readJsonFile(filePath)) as Profile;
    } catch {
      return null;
    }
  }
}

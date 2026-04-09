import { join } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/file-ops.js';
import { FileNotFoundError } from '@ccm/types';

type SettingsRecord = Record<string, unknown>;

function deepMerge(target: SettingsRecord, patch: SettingsRecord): SettingsRecord {
  const result: SettingsRecord = { ...target };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const targetVal = target[key];
    if (
      patchVal !== null &&
      typeof patchVal === 'object' &&
      !Array.isArray(patchVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal as SettingsRecord, patchVal as SettingsRecord);
    } else {
      result[key] = patchVal;
    }
  }
  return result;
}

export class ConfigManager {
  private readonly settingsPath: string;

  constructor(claudeHome: string) {
    this.settingsPath = join(claudeHome, 'settings.json');
  }

  async getSettings(): Promise<SettingsRecord> {
    try {
      const data = await readJsonFile(this.settingsPath);
      return (data as SettingsRecord) ?? {};
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        return {};
      }
      throw err;
    }
  }

  async updateSettings(patch: SettingsRecord): Promise<void> {
    const current = await this.getSettings();
    const merged = deepMerge(current, patch);
    await writeJsonFile(this.settingsPath, merged);
  }

  async getModel(): Promise<string | undefined> {
    const settings = await this.getSettings();
    return typeof settings['model'] === 'string' ? settings['model'] : undefined;
  }

  async setModel(model: string): Promise<void> {
    await this.updateSettings({ model });
  }

  async getEnvVars(): Promise<Record<string, string>> {
    const settings = await this.getSettings();
    const env = settings['env'];
    if (env !== null && typeof env === 'object' && !Array.isArray(env)) {
      return env as Record<string, string>;
    }
    return {};
  }

  async setEnvVar(key: string, value: string): Promise<void> {
    const current = await this.getEnvVars();
    await this.updateSettings({ env: { ...current, [key]: value } });
  }

  async removeEnvVar(key: string): Promise<void> {
    const settings = await this.getSettings();
    const currentEnv = await this.getEnvVars();
    const { [key]: _removed, ...rest } = currentEnv;
    // Write the complete settings with the env replaced (not deep-merged)
    await writeJsonFile(this.settingsPath, { ...settings, env: rest });
  }

  async getHooks(): Promise<Record<string, unknown>> {
    const settings = await this.getSettings();
    const hooks = settings['hooks'];
    if (hooks !== null && typeof hooks === 'object' && !Array.isArray(hooks)) {
      return hooks as Record<string, unknown>;
    }
    return {};
  }
}

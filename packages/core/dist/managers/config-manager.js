import { join } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/file-ops.js';
import { FileNotFoundError } from '@ccm/types';
function deepMerge(target, patch) {
    const result = { ...target };
    for (const key of Object.keys(patch)) {
        const patchVal = patch[key];
        const targetVal = target[key];
        if (patchVal !== null &&
            typeof patchVal === 'object' &&
            !Array.isArray(patchVal) &&
            targetVal !== null &&
            typeof targetVal === 'object' &&
            !Array.isArray(targetVal)) {
            result[key] = deepMerge(targetVal, patchVal);
        }
        else {
            result[key] = patchVal;
        }
    }
    return result;
}
export class ConfigManager {
    settingsPath;
    constructor(claudeHome) {
        this.settingsPath = join(claudeHome, 'settings.json');
    }
    async getSettings() {
        try {
            const data = await readJsonFile(this.settingsPath);
            return data ?? {};
        }
        catch (err) {
            if (err instanceof FileNotFoundError) {
                return {};
            }
            throw err;
        }
    }
    async updateSettings(patch) {
        const current = await this.getSettings();
        const merged = deepMerge(current, patch);
        await writeJsonFile(this.settingsPath, merged);
    }
    async getModel() {
        const settings = await this.getSettings();
        return typeof settings['model'] === 'string' ? settings['model'] : undefined;
    }
    async setModel(model) {
        await this.updateSettings({ model });
    }
    async getEnvVars() {
        const settings = await this.getSettings();
        const env = settings['env'];
        if (env !== null && typeof env === 'object' && !Array.isArray(env)) {
            return env;
        }
        return {};
    }
    async setEnvVar(key, value) {
        const current = await this.getEnvVars();
        await this.updateSettings({ env: { ...current, [key]: value } });
    }
    async removeEnvVar(key) {
        const settings = await this.getSettings();
        const currentEnv = await this.getEnvVars();
        const { [key]: _removed, ...rest } = currentEnv;
        // Write the complete settings with the env replaced (not deep-merged)
        await writeJsonFile(this.settingsPath, { ...settings, env: rest });
    }
    async getHooks() {
        const settings = await this.getSettings();
        const hooks = settings['hooks'];
        if (hooks !== null && typeof hooks === 'object' && !Array.isArray(hooks)) {
            return hooks;
        }
        return {};
    }
}
//# sourceMappingURL=config-manager.js.map
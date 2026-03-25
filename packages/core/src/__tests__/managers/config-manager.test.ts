import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../managers/config-manager';

describe('ConfigManager', () => {
  let tempDir: string;
  let manager: ConfigManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'config-manager-test-'));
    manager = new ConfigManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('getSettings', () => {
    it('returns an empty object when settings.json does not exist', async () => {
      const settings = await manager.getSettings();
      expect(settings).toEqual({});
    });

    it('reads existing settings.json', async () => {
      const existing = { model: 'claude-opus-4', env: { FOO: 'bar' } };
      await writeFile(join(tempDir, 'settings.json'), JSON.stringify(existing));
      const settings = await manager.getSettings();
      expect(settings).toEqual(existing);
    });
  });

  describe('updateSettings', () => {
    it('creates settings.json with the patch when it does not exist', async () => {
      await manager.updateSettings({ model: 'claude-3-5-sonnet' });
      const settings = await manager.getSettings();
      expect(settings).toMatchObject({ model: 'claude-3-5-sonnet' });
    });

    it('deep merges a patch into existing settings', async () => {
      const initial = { model: 'claude-opus-4', env: { FOO: 'foo' } };
      await writeFile(join(tempDir, 'settings.json'), JSON.stringify(initial));
      await manager.updateSettings({ env: { BAR: 'bar' } });
      const settings = await manager.getSettings();
      expect(settings.model).toBe('claude-opus-4');
      expect((settings.env as Record<string, string>).FOO).toBe('foo');
      expect((settings.env as Record<string, string>).BAR).toBe('bar');
    });
  });

  describe('getModel / setModel', () => {
    it('returns undefined when no model is set', async () => {
      const model = await manager.getModel();
      expect(model).toBeUndefined();
    });

    it('sets and retrieves the model', async () => {
      await manager.setModel('claude-opus-4');
      const model = await manager.getModel();
      expect(model).toBe('claude-opus-4');
    });

    it('overwrites an existing model', async () => {
      await manager.setModel('old-model');
      await manager.setModel('new-model');
      expect(await manager.getModel()).toBe('new-model');
    });
  });

  describe('getEnvVars', () => {
    it('returns an empty object when no env vars are set', async () => {
      const env = await manager.getEnvVars();
      expect(env).toEqual({});
    });

    it('returns existing env vars', async () => {
      await writeFile(
        join(tempDir, 'settings.json'),
        JSON.stringify({ env: { API_KEY: 'secret', DEBUG: 'true' } }),
      );
      const env = await manager.getEnvVars();
      expect(env).toEqual({ API_KEY: 'secret', DEBUG: 'true' });
    });
  });

  describe('setEnvVar / removeEnvVar', () => {
    it('adds a new env var', async () => {
      await manager.setEnvVar('MY_VAR', 'my-value');
      const env = await manager.getEnvVars();
      expect(env['MY_VAR']).toBe('my-value');
    });

    it('updates an existing env var', async () => {
      await manager.setEnvVar('MY_VAR', 'old');
      await manager.setEnvVar('MY_VAR', 'new');
      const env = await manager.getEnvVars();
      expect(env['MY_VAR']).toBe('new');
    });

    it('removes an env var', async () => {
      await manager.setEnvVar('TO_REMOVE', 'value');
      await manager.removeEnvVar('TO_REMOVE');
      const env = await manager.getEnvVars();
      expect(env['TO_REMOVE']).toBeUndefined();
    });

    it('does not throw when removing a non-existent env var', async () => {
      await expect(manager.removeEnvVar('DOESNT_EXIST')).resolves.not.toThrow();
    });

    it('preserves other env vars when removing one', async () => {
      await manager.setEnvVar('KEEP', 'this');
      await manager.setEnvVar('REMOVE', 'this');
      await manager.removeEnvVar('REMOVE');
      const env = await manager.getEnvVars();
      expect(env['KEEP']).toBe('this');
      expect(env['REMOVE']).toBeUndefined();
    });
  });

  describe('getHooks', () => {
    it('returns an empty object when no hooks are set', async () => {
      const hooks = await manager.getHooks();
      expect(hooks).toEqual({});
    });

    it('returns hooks from settings', async () => {
      const hooksData = {
        PreToolUse: [{ command: 'echo', args: ['pre'] }],
        PostToolUse: [{ command: 'echo', args: ['post'] }],
      };
      await writeFile(
        join(tempDir, 'settings.json'),
        JSON.stringify({ hooks: hooksData }),
      );
      const hooks = await manager.getHooks();
      expect(hooks).toEqual(hooksData);
    });
  });
});

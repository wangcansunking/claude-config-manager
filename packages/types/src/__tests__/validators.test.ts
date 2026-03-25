import { describe, it, expect } from 'vitest';
import {
  isInstalledPlugin,
  isMcpServerConfig,
  isProfile,
  isProfileExport,
} from '../index';

describe('Type Guards', () => {
  describe('isInstalledPlugin', () => {
    it('returns true for valid plugin', () => {
      const plugin = {
        name: 'superpowers',
        version: '5.0.5',
        marketplace: 'claude-plugins-official',
        enabled: true,
        installPath: '/path/to/plugin',
        installedAt: '2026-01-01T00:00:00Z',
        lastUpdated: '2026-03-01T00:00:00Z',
      };
      expect(isInstalledPlugin(plugin)).toBe(true);
    });
    it('returns false for missing required fields', () => {
      expect(isInstalledPlugin({ name: 'test' })).toBe(false);
      expect(isInstalledPlugin(null)).toBe(false);
      expect(isInstalledPlugin(42)).toBe(false);
    });
  });

  describe('isMcpServerConfig', () => {
    it('returns true for valid config', () => {
      expect(isMcpServerConfig({ command: 'npx', args: ['-y', 'azure-devops-mcp'] })).toBe(true);
    });
    it('returns true with optional env', () => {
      expect(isMcpServerConfig({ command: 'node', args: ['server.js'], env: { API_KEY: 'test' } })).toBe(true);
    });
    it('returns false for invalid config', () => {
      expect(isMcpServerConfig({})).toBe(false);
      expect(isMcpServerConfig({ command: 123 })).toBe(false);
    });
  });

  describe('isProfile', () => {
    it('returns true for valid profile', () => {
      expect(isProfile({
        name: 'Work', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
        plugins: [], mcpServers: {}, settings: {}, commands: [], hooks: {},
      })).toBe(true);
    });
    it('returns false for missing name', () => {
      expect(isProfile({ plugins: [] })).toBe(false);
    });
  });

  describe('isProfileExport', () => {
    it('returns true for valid export', () => {
      expect(isProfileExport({
        version: '1.0', name: 'Work', createdAt: '2026-01-01T00:00:00Z',
        plugins: { installed: [], enabled: {} }, mcpServers: {}, settings: {}, hooks: {}, commands: [],
      })).toBe(true);
    });
    it('returns false for missing version', () => {
      expect(isProfileExport({ name: 'Work' })).toBe(false);
    });
  });
});

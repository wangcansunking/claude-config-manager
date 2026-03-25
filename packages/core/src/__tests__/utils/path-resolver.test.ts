import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';
import { getClaudeHome, claudePath } from '../../utils/path-resolver';

describe('path-resolver', () => {
  describe('getClaudeHome', () => {
    it('returns the path to ~/.claude', () => {
      const expected = join(homedir(), '.claude');
      expect(getClaudeHome()).toBe(expected);
    });
  });

  describe('claudePath', () => {
    it('returns the base claude home when no segments are provided', () => {
      expect(claudePath()).toBe(getClaudeHome());
    });

    it('joins a single segment to the claude home', () => {
      const expected = join(getClaudeHome(), 'settings.json');
      expect(claudePath('settings.json')).toBe(expected);
    });

    it('joins multiple segments to the claude home', () => {
      const expected = join(getClaudeHome(), 'plugins', 'my-plugin', 'config.json');
      expect(claudePath('plugins', 'my-plugin', 'config.json')).toBe(expected);
    });
  });
});

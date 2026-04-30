import { describe, it, expect } from 'vitest';
import { homedir } from 'os';
import { tildify } from '../../../tui/util/path.js';

describe('tildify', () => {
  it('replaces home prefix with ~', () => {
    expect(tildify(homedir() + '/repos/foo')).toBe('~/repos/foo');
  });
  it('returns ~ for exact home', () => {
    expect(tildify(homedir())).toBe('~');
  });
  it('leaves non-home paths unchanged', () => {
    expect(tildify('/etc/hosts')).toBe('/etc/hosts');
  });
  it('handles undefined / empty', () => {
    expect(tildify(undefined)).toBe('');
    expect(tildify('')).toBe('');
  });
  it('does not mistakenly tildify a sibling-named directory', () => {
    // /Users/can-clawX/foo should not become ~X/foo
    expect(tildify(homedir() + 'X/foo')).toBe(homedir() + 'X/foo');
  });
});

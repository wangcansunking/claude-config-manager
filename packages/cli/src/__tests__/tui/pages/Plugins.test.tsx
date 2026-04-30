import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Plugins } from '../../../tui/pages/config/Plugins.js';

const fakeStore: any = {
  getState: () => ({
    togglePlugin: vi.fn(),
  }),
};

const state: any = {
  plugins: [
    { name: 'vercel', version: '0.40.0', enabled: true,  source: 'official' },
    { name: 'remember', version: '0.6.0', enabled: false, source: 'official' },
  ],
  pendingActions: new Set(),
};

describe('<Plugins/>', () => {
  it('shows enabled marker and version', () => {
    const { lastFrame } = render(<Plugins state={state} store={fakeStore} />);
    expect(lastFrame()).toContain('vercel');
    expect(lastFrame()).toContain('0.40.0');
    expect(lastFrame()).toContain('[✓]');
    expect(lastFrame()).toContain('[ ]');
  });

  it('space calls togglePlugin', () => {
    const togglePlugin = vi.fn();
    const store = { getState: () => ({ togglePlugin }) };
    const { stdin } = render(<Plugins state={state} store={store as any} />);
    stdin.write(' ');
    expect(togglePlugin).toHaveBeenCalledWith('vercel');
  });
});

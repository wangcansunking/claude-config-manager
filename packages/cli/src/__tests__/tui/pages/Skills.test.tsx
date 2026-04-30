import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Skills } from '../../../tui/pages/config/Skills.js';

const state: any = {
  skills: [
    { name: 'remember', source: 'plugin', enabled: true },
    { name: 'my-skill', source: 'user', enabled: false },
  ],
  pendingActions: new Set(),
  focused: 'main',
};

describe('<Skills/>', () => {
  it('renders names and source', () => {
    const store = { getState: () => ({ toggleSkill: vi.fn() }) };
    const { lastFrame } = render(<Skills state={state} store={store as any} />);
    expect(lastFrame()).toContain('remember');
    expect(lastFrame()).toContain('my-skill');
    expect(lastFrame()).toContain('plugin');
    expect(lastFrame()).toContain('user');
  });

  it('space calls toggleSkill with name', () => {
    const toggleSkill = vi.fn();
    const store = { getState: () => ({ toggleSkill }) };
    const { stdin } = render(<Skills state={state} store={store as any} />);
    stdin.write(' ');
    expect(toggleSkill).toHaveBeenCalledWith('remember');
  });
});

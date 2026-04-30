import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { McpServers } from '../../../tui/pages/config/McpServers.js';

const state: any = {
  mcpServers: [
    { name: 'serena', enabled: true, config: { command: 'uvx serena' } },
    { name: 'context7', enabled: false, config: { command: 'npx context7' } },
  ],
  pendingActions: new Set(),
  focused: 'main',
};

describe('<McpServers/>', () => {
  it('renders server names and enable marker', () => {
    const store = { getState: () => ({ toggleMcp: vi.fn() }) };
    const { lastFrame } = render(<McpServers state={state} store={store as any} />);
    expect(lastFrame()).toContain('serena');
    expect(lastFrame()).toContain('context7');
    expect(lastFrame()).toContain('[✓]');
    expect(lastFrame()).toContain('[ ]');
  });

  it('space calls toggleMcp on selected', () => {
    const toggleMcp = vi.fn();
    const store = { getState: () => ({ toggleMcp }) };
    const { stdin } = render(<McpServers state={state} store={store as any} />);
    stdin.write(' ');
    expect(toggleMcp).toHaveBeenCalledWith('serena');
  });
});
